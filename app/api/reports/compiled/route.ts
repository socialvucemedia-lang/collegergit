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
            return NextResponse.json({ error: 'Semester is required' }, { status: 400 });
        }

        // Get subjects for this semester
        let subjectQuery = supabase
            .from('subjects')
            .select('id, code, name')
            .eq('semester', parseInt(semester));

        if (department_id) {
            subjectQuery = subjectQuery.eq('department_id', department_id);
        }

        const { data: subjects, error: subjectError } = await subjectQuery;

        if (subjectError) {
            return NextResponse.json({ error: subjectError.message }, { status: 500 });
        }

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

        const { data: students, error: studentError } = await studentQuery;

        if (studentError) {
            return NextResponse.json({ error: studentError.message }, { status: 500 });
        }

        if (!students || students.length === 0 || !subjects || subjects.length === 0) {
            return NextResponse.json({
                students: [],
                subjects: [],
                matrix: []
            });
        }

        // Build attendance matrix
        const matrix: any[] = [];

        for (const student of students) {
            const user = Array.isArray(student.users) ? student.users[0] : student.users;
            const row: any = {
                student_id: student.id,
                roll_number: student.roll_number,
                name: user?.full_name || 'Unknown',
                section: student.section,
                batch: student.batch,
                subject_attendance: {}
            };

            let totalClasses = 0;
            let totalPresent = 0;

            for (const subject of subjects) {
                // Get attendance sessions for this subject
                const { data: sessions } = await supabase
                    .from('attendance_sessions')
                    .select('id')
                    .eq('subject_id', subject.id);

                if (!sessions || sessions.length === 0) {
                    row.subject_attendance[subject.id] = { total: 0, present: 0, percentage: null };
                    continue;
                }

                const sessionIds = sessions.map(s => s.id);

                // Get student's attendance for these sessions
                const { data: attendanceRecords } = await supabase
                    .from('attendance')
                    .select('status')
                    .eq('student_id', student.id)
                    .in('session_id', sessionIds);

                const total = attendanceRecords?.length || 0;
                const present = attendanceRecords?.filter(a => a.status === 'present' || a.status === 'late').length || 0;
                const percentage = total > 0 ? Math.round((present / total) * 100) : null;

                row.subject_attendance[subject.id] = { total, present, percentage };
                totalClasses += total;
                totalPresent += present;
            }

            row.overall = {
                total: totalClasses,
                present: totalPresent,
                percentage: totalClasses > 0 ? Math.round((totalPresent / totalClasses) * 100) : null
            };

            matrix.push(row);
        }

        return NextResponse.json({
            students: students.length,
            subjects: subjects.map(s => ({ id: s.id, code: s.code, name: s.name })),
            matrix
        });
    } catch (error) {
        console.error('Compiled attendance fetch error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
