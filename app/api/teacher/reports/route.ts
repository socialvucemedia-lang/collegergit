import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const supabase = await createServerClient();

        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get teacher record
        const { data: teacher, error: teacherError } = await supabase
            .from('teachers')
            .select('id')
            .eq('user_id', user.id)
            .single();

        if (teacherError || !teacher) {
            return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
        }

        // Get subjects assigned to this teacher
        const { data: assignments, error: assignmentError } = await supabase
            .from('subject_teachers')
            .select(`
                subject_id,
                subjects (
                    id,
                    code,
                    name,
                    semester,
                    department_id,
                    departments (
                        name,
                        code
                    )
                )
            `)
            .eq('teacher_id', teacher.id);

        if (assignmentError) {
            return NextResponse.json({ error: assignmentError.message }, { status: 500 });
        }

        const subjectStats: any[] = [];

        for (const assignment of assignments || []) {
            const subject = assignment.subjects as any;
            if (!subject) continue;

            // Get all sessions for this subject taught by this teacher
            const { data: sessions } = await supabase
                .from('attendance_sessions')
                .select('id')
                .eq('subject_id', subject.id)
                .eq('teacher_id', teacher.id);

            if (!sessions || sessions.length === 0) {
                subjectStats.push({
                    subject_id: subject.id,
                    subject_code: subject.code,
                    subject_name: subject.name,
                    semester: subject.semester,
                    department: subject.departments?.name || null,
                    total_sessions: 0,
                    avg_attendance: null,
                    students_below_threshold: 0,
                    total_students: 0
                });
                continue;
            }

            const sessionIds = sessions.map(s => s.id);

            // Get all attendance records for these sessions
            const { data: attendanceRecords } = await supabase
                .from('attendance')
                .select('student_id, status')
                .in('session_id', sessionIds);

            if (!attendanceRecords || attendanceRecords.length === 0) {
                subjectStats.push({
                    subject_id: subject.id,
                    subject_code: subject.code,
                    subject_name: subject.name,
                    semester: subject.semester,
                    department: subject.departments?.name || null,
                    total_sessions: sessions.length,
                    avg_attendance: null,
                    students_below_threshold: 0,
                    total_students: 0
                });
                continue;
            }

            // Calculate per-student attendance
            const studentAttendance: Record<string, { total: number; present: number }> = {};
            for (const record of attendanceRecords) {
                if (!studentAttendance[record.student_id]) {
                    studentAttendance[record.student_id] = { total: 0, present: 0 };
                }
                studentAttendance[record.student_id].total++;
                if (record.status === 'present' || record.status === 'late') {
                    studentAttendance[record.student_id].present++;
                }
            }

            const totalStudents = Object.keys(studentAttendance).length;
            let sumPercentages = 0;
            let belowThreshold = 0;

            for (const studentId in studentAttendance) {
                const { total, present } = studentAttendance[studentId];
                const pct = total > 0 ? (present / total) * 100 : 0;
                sumPercentages += pct;
                if (pct < 75) belowThreshold++;
            }

            const avgAttendance = totalStudents > 0 ? Math.round(sumPercentages / totalStudents) : null;

            subjectStats.push({
                subject_id: subject.id,
                subject_code: subject.code,
                subject_name: subject.name,
                semester: subject.semester,
                department: subject.departments?.name || null,
                total_sessions: sessions.length,
                avg_attendance: avgAttendance,
                students_below_threshold: belowThreshold,
                total_students: totalStudents
            });
        }

        return NextResponse.json({ subjects: subjectStats });
    } catch (error) {
        console.error('Teacher reports error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
