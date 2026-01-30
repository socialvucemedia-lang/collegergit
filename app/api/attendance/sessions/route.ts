import { NextRequest, NextResponse } from 'next/server';
import { getAuthorizedUser } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthorizedUser();
    if (auth.error) return auth.error;

    const { isAdmin, isAdvisor, isTeacher, supabaseAdmin, supabase } = auth;
    const isStaff = isAdmin || isAdvisor || isTeacher;
    const client = isStaff ? supabaseAdmin : supabase;

    const searchParams = request.nextUrl.searchParams;
    const department_id = searchParams.get('department_id');
    const teacher_id = searchParams.get('teacher_id');
    const semester = searchParams.get('semester');
    const section = searchParams.get('section');
    const date = searchParams.get('date');

    let query = client
      .from('attendance_sessions')
      .select(`
        *,
        subject:subjects (id, code, name),
        teacher:teachers (
          id,
          employee_id,
          user:users (full_name)
        )
      `)
      .order('date', { ascending: false })
      .order('start_time', { ascending: false });

    if (department_id) query = query.eq('subjects.department_id', department_id);
    if (teacher_id) query = query.eq('teacher_id', teacher_id);
    if (semester) query = query.eq('semester', parseInt(semester));
    if (section) query = query.eq('section', section);
    if (date) query = query.eq('date', date);

    const { data, error } = await query;

    if (error) {
      console.error('Attendance sessions fetch error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ sessions: data || [] });
  } catch (error) {
    console.error('Attendance sessions API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthorizedUser();
    if (auth.error) return auth.error;

    // Only Admin or Teacher can create sessions
    if (!auth.isAdmin && !auth.isTeacher) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { supabaseAdmin } = auth;
    const body = await request.json();
    const { subject_id, teacher_id, date, start_time, end_time, room, status, semester, section, batch } = body;

    if (!subject_id || !date) {
      return NextResponse.json(
        { error: 'subject_id and date are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('attendance_sessions')
      .insert({
        subject_id,
        teacher_id: teacher_id || auth.user.id, // Fallback to auth user if not provided (for teachers)
        date,
        start_time: start_time || null,
        end_time: end_time || null,
        room: room || null,
        status: status || 'scheduled',
        semester,
        section,
        batch
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ session: data }, { status: 201 });
  } catch (error) {
    console.error('Session creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
