
import { NextRequest, NextResponse } from 'next/server';
import { getAuthorizedUser } from '@/lib/api-auth';

export async function GET() {
    try {
        const auth = await getAuthorizedUser();
        if (auth.error) return auth.error;

        const { supabase, profile, user } = auth;

        if (profile.role !== 'teacher' && profile.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden: Teacher access required' }, { status: 403 });
        }

        // Get teacher profile
        const { data: teacher, error: teacherError } = await supabase
            .from('teachers')
            .select('id')
            .eq('user_id', user.id)
            .single();

        if (teacherError || !teacher) {
            return NextResponse.json({ error: 'Teacher record not found. Please contact an administrator.' }, { status: 404 });
        }

        // Fetch sessions with section/batch info
        const { data: sessions, error: sessionsError } = await supabase
            .from('attendance_sessions')
            .select(`
                id,
                session_date,
                start_time,
                end_time,
                room,
                status,
                section,
                batch,
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
        const auth = await getAuthorizedUser();
        if (auth.error) return auth.error;

        const { supabase, profile, user } = auth;

        if (profile.role !== 'teacher' && profile.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden: Teacher access required' }, { status: 403 });
        }

        // Get teacher profile
        const { data: teacher, error: teacherError } = await supabase
            .from('teachers')
            .select('id')
            .eq('user_id', user.id)
            .single();

        if (teacherError || !teacher) {
            return NextResponse.json({ error: 'Teacher record not found. Please contact an administrator.' }, { status: 404 });
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
