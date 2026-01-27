import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const searchParams = request.nextUrl.searchParams;
    const semester = searchParams.get('semester');
    const department_id = searchParams.get('department_id');

    let query = supabase
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
