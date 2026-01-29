import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const subjectId = searchParams.get('subject_id');
        const studentId = searchParams.get('student_id');

        if (!subjectId || !studentId) {
            return NextResponse.json(
                { error: 'subject_id and student_id are required' },
                { status: 400 }
            );
        }

        // Get all sessions for this subject
        const { data: sessions, error: sessionsError } = await supabase
            .from('attendance_sessions')
            .select('id, session_date, start_time, subjects (code, name)')
            .eq('subject_id', subjectId)
            .order('session_date', { ascending: false });

        if (sessionsError) {
            return NextResponse.json({ error: sessionsError.message }, { status: 500 });
        }

        // Get attendance records for this student in these sessions
        const sessionIds = sessions?.map(s => s.id) || [];
        const { data: records, error: recordsError } = await supabase
            .from('attendance_records')
            .select('session_id, status, marked_at')
            .eq('student_id', studentId)
            .in('session_id', sessionIds);

        if (recordsError) {
            return NextResponse.json({ error: recordsError.message }, { status: 500 });
        }

        // Merge data
        const history = sessions?.map((session: any) => {
            const record = records?.find(r => r.session_id === session.id);
            return {
                session_id: session.id,
                date: session.session_date,
                time: session.start_time,
                subject_code: session.subjects?.code,
                subject_name: session.subjects?.name,
                status: record?.status || null,
                marked_at: record?.marked_at || null,
            };
        }) || [];

        return NextResponse.json({ history });
    } catch (error) {
        console.error('History fetch error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
