import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createServerClient();
        const searchParams = request.nextUrl.searchParams;
        const semester = searchParams.get('semester');
        const department_id = searchParams.get('department_id');
        const section = searchParams.get('section');

        if (!semester) {
            return new NextResponse('Semester is required', { status: 400 });
        }

        // Get subjects for this semester
        let subjectQuery = supabase
            .from('subjects')
            .select('id, code, name')
            .eq('semester', parseInt(semester));

        if (department_id) {
            subjectQuery = subjectQuery.eq('department_id', department_id);
        }

        const { data: subjects } = await subjectQuery;

        // Get students for this semester/section
        let studentQuery = supabase
            .from('students')
            .select(`
                id,
                roll_number,
                section,
                batch,
                users!inner (
                    full_name
                )
            `)
            .eq('semester', parseInt(semester));

        if (department_id) {
            studentQuery = studentQuery.eq('department_id', department_id);
        }
        if (section) {
            studentQuery = studentQuery.eq('section', section);
        }

        studentQuery = studentQuery.order('roll_number', { ascending: true });

        const { data: students } = await studentQuery;

        if (!students || students.length === 0 || !subjects || subjects.length === 0) {
            return new NextResponse('No data found', { status: 404 });
        }

        // Build CSV headers
        const headers = ['Roll Number', 'Name', 'Section', 'Batch', ...subjects.map(s => s.code), 'Overall %'];
        const csvRows = [headers.join(',')];

        for (const student of students) {
            const user = Array.isArray(student.users) ? student.users[0] : student.users;
            const rowData: string[] = [
                student.roll_number,
                `"${user?.full_name || 'Unknown'}"`,
                student.section || '',
                student.batch || ''
            ];

            let totalClasses = 0;
            let totalPresent = 0;

            for (const subject of subjects) {
                const { data: sessions } = await supabase
                    .from('attendance_sessions')
                    .select('id')
                    .eq('subject_id', subject.id);

                if (!sessions || sessions.length === 0) {
                    rowData.push('-');
                    continue;
                }

                const sessionIds = sessions.map(s => s.id);

                const { data: attendanceRecords } = await supabase
                    .from('attendance')
                    .select('status')
                    .eq('student_id', student.id)
                    .in('session_id', sessionIds);

                const total = attendanceRecords?.length || 0;
                const present = attendanceRecords?.filter(a => a.status === 'present' || a.status === 'late').length || 0;
                const percentage = total > 0 ? Math.round((present / total) * 100) : null;

                rowData.push(percentage !== null ? `${percentage}%` : '-');
                totalClasses += total;
                totalPresent += present;
            }

            const overallPercentage = totalClasses > 0 ? Math.round((totalPresent / totalClasses) * 100) : null;
            rowData.push(overallPercentage !== null ? `${overallPercentage}%` : '-');

            csvRows.push(rowData.join(','));
        }

        const csv = csvRows.join('\n');

        return new NextResponse(csv, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="compiled_attendance_sem${semester}_${new Date().toISOString().split('T')[0]}.csv"`
            }
        });
    } catch (error) {
        console.error('Compiled attendance export error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
