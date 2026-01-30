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

        // Get advisor record with assigned class info
        const { data: advisor, error: advisorError } = await supabase
            .from('class_advisors')
            .select('id, department_id, section, semester')
            .eq('user_id', user.id)
            .single();

        if (advisorError || !advisor) {
            // Fallback: If not a class_advisor, check if user has teacher role and show all students
            const { data: teacher } = await supabase
                .from('teachers')
                .select('id, department_id')
                .eq('user_id', user.id)
                .single();

            if (!teacher) {
                return NextResponse.json({ error: 'Not authorized as advisor' }, { status: 403 });
            }

            // Get all students in teacher's department
            let studentQuery = supabase.from('students').select('id');
            if (teacher.department_id) {
                studentQuery = studentQuery.eq('department_id', teacher.department_id);
            }

            const { data: students } = await studentQuery;

            if (!students || students.length === 0) {
                return NextResponse.json({
                    total_students: 0,
                    avg_attendance: null,
                    below_threshold: 0,
                    present_today: 0
                });
            }

            return await calculateHealthStats(supabase, students.map(s => s.id));
        }

        // Get students in this advisor's class
        let studentQuery = supabase
            .from('students')
            .select('id')
            .eq('semester', advisor.semester);

        if (advisor.section) {
            studentQuery = studentQuery.eq('section', advisor.section);
        }
        if (advisor.department_id) {
            studentQuery = studentQuery.eq('department_id', advisor.department_id);
        }

        const { data: students, error: studentError } = await studentQuery;

        if (studentError) {
            return NextResponse.json({ error: studentError.message }, { status: 500 });
        }

        if (!students || students.length === 0) {
            return NextResponse.json({
                total_students: 0,
                avg_attendance: null,
                below_threshold: 0,
                present_today: 0
            });
        }

        return await calculateHealthStats(supabase, students.map(s => s.id));
    } catch (error) {
        console.error('Advisor health error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

async function calculateHealthStats(supabase: any, studentIds: string[]) {
    const today = new Date().toISOString().split('T')[0];

    // Calculate average attendance
    let totalPercentage = 0;
    let belowThreshold = 0;
    let validStudents = 0;

    for (const studentId of studentIds) {
        const { data: attendanceRecords } = await supabase
            .from('attendance_records')
            .select('status')
            .eq('student_id', studentId);

        if (!attendanceRecords || attendanceRecords.length === 0) continue;

        const total = attendanceRecords.length;
        const present = attendanceRecords.filter((a: any) => a.status === 'present' || a.status === 'late').length;
        const percentage = total > 0 ? (present / total) * 100 : 0;

        totalPercentage += percentage;
        validStudents++;

        if (percentage < 75) {
            belowThreshold++;
        }
    }

    // Get today's attendance
    const { data: todaySessions } = await supabase
        .from('attendance_sessions')
        .select('id')
        .eq('date', today);

    let presentToday = 0;
    if (todaySessions && todaySessions.length > 0) {
        const sessionIds = todaySessions.map((s: any) => s.id);
        const { data: todayAttendance } = await supabase
            .from('attendance_records')
            .select('student_id, status')
            .in('session_id', sessionIds)
            .in('student_id', studentIds);

        if (todayAttendance) {
            const presentStudents = new Set(
                todayAttendance
                    .filter((a: any) => a.status === 'present' || a.status === 'late')
                    .map((a: any) => a.student_id)
            );
            presentToday = presentStudents.size;
        }
    }

    const avgAttendance = validStudents > 0 ? Math.round(totalPercentage / validStudents) : null;

    return NextResponse.json({
        total_students: studentIds.length,
        avg_attendance: avgAttendance,
        below_threshold: belowThreshold,
        present_today: presentToday
    });
}
