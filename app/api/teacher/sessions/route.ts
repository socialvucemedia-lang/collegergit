
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
    try {
        const supabase = createServerClient();

        // Get token from header
        const authHeader = request.headers.get('Authorization');
        const token = authHeader?.split(' ')[1];

        if (!token) {
            return NextResponse.json({ error: 'Missing authorization token' }, { status: 401 });
        }

        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        // Get teacher profile
        const { data: teacher, error: teacherError } = await supabase
            .from('teachers')
            .select('id')
            .eq('user_id', user.id)
            .single();

        if (teacherError || !teacher) {
            return NextResponse.json({ error: 'Teacher profile not found' }, { status: 403 });
        }

        // Fetch sessions
        const { data: sessions, error: sessionsError } = await supabase
            .from('attendance_sessions')
            .select(`
        *,
        subjects (
          code,
          name
        )
      `)
            .eq('teacher_id', teacher.id)
            .order('session_date', { ascending: false })
            .order('created_at', { ascending: false });

        if (sessionsError) {
            return NextResponse.json({ error: sessionsError.message }, { status: 500 });
        }

        return NextResponse.json({ sessions });
    } catch (error) {
        console.error('Error fetching sessions:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = createServerClient();

        // Get token from header
        const authHeader = request.headers.get('Authorization');
        const token = authHeader?.split(' ')[1];

        if (!token) {
            return NextResponse.json({ error: 'Missing authorization token' }, { status: 401 });
        }

        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        // Get teacher profile
        const { data: teacher, error: teacherError } = await supabase
            .from('teachers')
            .select('id')
            .eq('user_id', user.id)
            .single();

        if (teacherError || !teacher) {
            return NextResponse.json({ error: 'Teacher profile not found' }, { status: 403 });
        }

        const body = await request.json();
        const { subject_id, session_date, start_time, end_time, room, status, section, batch } = body;

        const { data: session, error: createError } = await supabase
            .from('attendance_sessions')
            .insert({
                teacher_id: teacher.id,
                subject_id,
                session_date,
                start_time,
                end_time,
                room,
                section: section || null,
                batch: batch || null,
                status: status || 'scheduled'
            })
            .select()
            .single();

        if (createError) {
            return NextResponse.json({ error: createError.message }, { status: 500 });
        }

        return NextResponse.json({ session });
    } catch (error) {
        console.error('Error creating session:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
