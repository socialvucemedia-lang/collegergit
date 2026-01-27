import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ sessionId: string }> }
) {
    try {
        const { sessionId } = await params;
        const supabase = createServerClient();

        // Get session details
        const { data: session, error: sessionError } = await supabase
            .from('attendance_sessions')
            .select(`
        id,
        session_date,
        subjects (
          code,
          name
        )
      `)
            .eq('id', sessionId)
            .single();

        if (sessionError || !session) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        // Get attendance records with student info
        const { data: records, error: recordsError } = await supabase
            .from('attendance_records')
            .select(`
        status,
        marked_at,
        students (
          roll_number,
          users (
            full_name,
            email
          )
        )
      `)
            .eq('session_id', sessionId);

        if (recordsError) {
            return NextResponse.json({ error: recordsError.message }, { status: 500 });
        }

        // Build CSV
        const subject = session.subjects as any;
        const headers = ['Roll Number', 'Name', 'Email', 'Status', 'Marked At'];
        const rows = records?.map((record: any) => {
            const student = record.students;
            const users = Array.isArray(student?.users) ? student.users[0] : student?.users;
            return [
                student?.roll_number || '',
                users?.full_name || '',
                users?.email || '',
                record.status,
                new Date(record.marked_at).toLocaleString(),
            ].join(',');
        }) || [];

        const csvContent = [headers.join(','), ...rows].join('\n');

        return new NextResponse(csvContent, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="attendance_${subject?.code || 'session'}_${session.session_date}.csv"`,
            },
        });
    } catch (error) {
        console.error('CSV export error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
