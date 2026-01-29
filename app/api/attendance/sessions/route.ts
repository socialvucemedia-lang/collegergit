import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const searchParams = request.nextUrl.searchParams;
    const teacherId = searchParams.get('teacher_id');
    const subjectId = searchParams.get('subject_id');
    const date = searchParams.get('date');
    const status = searchParams.get('status');

    let query = supabase
      .from('attendance_sessions')
      .select(`
        *,
        subject:subjects(*),
        teacher:teachers(*)
      `)
      .order('session_date', { ascending: false })
      .order('start_time', { ascending: false });

    if (teacherId) {
      query = query.eq('teacher_id', teacherId);
    }

    if (subjectId) {
      query = query.eq('subject_id', subjectId);
    }

    if (date) {
      query = query.eq('session_date', date);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ sessions: data || [] });
  } catch (error) {
    console.error('Sessions fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subject_id, teacher_id, session_date, start_time, end_time, room, status } = body;

    if (!subject_id || !session_date) {
      return NextResponse.json(
        { error: 'subject_id and session_date are required' },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from('attendance_sessions')
      .insert({
        subject_id,
        teacher_id: teacher_id || null,
        session_date,
        start_time: start_time || null,
        end_time: end_time || null,
        room: room || null,
        status: status || 'scheduled',
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
