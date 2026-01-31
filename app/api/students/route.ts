import { NextRequest, NextResponse } from 'next/server';
import { getAuthorizedUser } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthorizedUser();
    if (auth.error) return auth.error;

    const { isAdmin, isAdvisor, supabase, supabaseAdmin } = auth;
    const isAuthorized = isAdmin || isAdvisor;
    const client = isAuthorized ? supabaseAdmin : supabase;

    const searchParams = request.nextUrl.searchParams;
    const semester = searchParams.get('semester');
    const department_id = searchParams.get('department_id');
    const unassigned = searchParams.get('unassigned');

    let query = client
      .from('students')
      .select(`
        id,
        roll_number,
        semester,
        department_id,
        users (
          full_name,
          email
        ),
        departments (
          code,
          name
        )
      `)
      .order('roll_number', { ascending: true });

    if (unassigned === 'true') {
      query = query.is('department_id', null);
    }

    if (semester) {
      query = query.eq('semester', parseInt(semester));
    }

    if (department_id) {
      query = query.eq('department_id', department_id);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Format data
    const students = data?.map((s: any) => ({
      id: s.id,
      roll_number: s.roll_number,
      semester: s.semester,
      department_id: s.department_id,
      department: s.departments?.code || null,
      name: Array.isArray(s.users) ? s.users[0]?.full_name : s.users?.full_name || 'Unknown',
      email: Array.isArray(s.users) ? s.users[0]?.email : s.users?.email,
    })) || [];

    return NextResponse.json({ students });
  } catch (error) {
    console.error('Students fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await getAuthorizedUser();
    if (auth.error) return auth.error;

    const { isAdmin, supabaseAdmin } = auth;
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { student_ids, department_id } = body;

    if (!student_ids || !Array.isArray(student_ids) || student_ids.length === 0) {
      return NextResponse.json({ error: 'No students selected' }, { status: 400 });
    }

    if (!department_id) {
      return NextResponse.json({ error: 'Department ID is required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('students')
      .update({ department_id })
      .in('id', student_ids);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, count: student_ids.length });

  } catch (error) {
    console.error('Student update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
