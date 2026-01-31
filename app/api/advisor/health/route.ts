import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const supabase = await createServerClient();

        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            console.log("Advisor Health: No user found");
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }



        // Get advisor record with assigned class info
        const { data: advisor, error: advisorError } = await supabase
            .from('class_advisors')
            .select('id, department_id, section, semester')
            .eq('user_id', user.id)
            .single();

        console.log("Advisor Health: Advisor lookup", { advisor, advisorError });

        let students: any[] = [];

        if (advisorError || !advisor) {
            // Fallback: If not a class_advisor, check if user has teacher role and show all students
            const { data: teacher } = await supabase
                .from('teachers')
                .select('id, department_id')
                .eq('user_id', user.id)
                .single();

            console.log("Advisor Health: Teacher lookup", { teacher });

            if (!teacher) {
                console.log("Advisor Health: Neither advisor nor teacher found. Returning 403.");
                return NextResponse.json({ error: 'Not authorized as advisor' }, { status: 403 });
            }

            // Get all students in teacher's department
            let studentQuery = supabase.from('students').select('id');
            if (teacher.department_id) {
                studentQuery = studentQuery.eq('department_id', teacher.department_id);
            }
            const { data } = await studentQuery;
            students = data || [];
        } else {
            // Get students in this advisor's class
            console.log("Advisor Health: Advisor found", advisor);

            let studentQuery = supabase
                .from('students')
                .select('id, semester, section')
                .eq('semester', advisor.semester);

            if (advisor.section) {
                studentQuery = studentQuery.eq('section', advisor.section);
            }
            if (advisor.department_id) {
                studentQuery = studentQuery.eq('department_id', advisor.department_id);
            }
            const { data, error: stError } = await studentQuery;
            students = data || [];
            console.log(`Advisor Health: Found ${students.length} students for Sem ${advisor.semester} Sec ${advisor.section}`, { students, stError });
        }

        if (students.length === 0) {
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

    // 1. Bulk Fetch All Attendance for these students
    // We only need status to calculate percentage.
    const { data: allAttendance, error: attError } = await supabase
        .from('attendance_records')
        .select('student_id, status')
        .in('student_id', studentIds);

    if (attError) {
        console.error("Error fetching attendance:", attError);
        throw attError;
    }

    // 2. Process Stats in Memory
    const studentStats = new Map<string, { total: number; present: number }>();

    // Initialize
    studentIds.forEach(id => studentStats.set(id, { total: 0, present: 0 }));

    // Aggregate
    allAttendance?.forEach((record: any) => {
        const stats = studentStats.get(record.student_id);
        if (stats) {
            stats.total += 1;
            if (record.status === 'present' || record.status === 'late') {
                stats.present += 1;
            }
        }
    });

    let belowThreshold = 0;
    let totalPercentageSum = 0;
    let activeStudentCount = 0;

    studentStats.forEach((stats) => {
        if (stats.total > 0) {
            const pct = (stats.present / stats.total) * 100;
            totalPercentageSum += pct;
            activeStudentCount++;
            if (pct < 75) belowThreshold++;
        } else {
            // If specific requirement for 0 classes: usually 100% or ignore?
            // Let's ignore from average but count as 0% for threshold?
            // Actually usually 0/0 is N/A. Let's assume they are not below threshold if no classes held.
        }
    });

    const avgAttendance = activeStudentCount > 0
        ? Math.round(totalPercentageSum / activeStudentCount)
        : 0;

    // 3. Calculate Present Today (Bulk)
    // Get sessions for today
    const { data: todaySessions } = await supabase
        .from('attendance_sessions')
        .select('id')
        .eq('date', today);

    let presentToday = 0;
    if (todaySessions && todaySessions.length > 0) {
        const sessionIds = todaySessions.map((s: any) => s.id);

        // Fetch only 'present'/'late' records for today's sessions and our students
        const { data: todayPresents, error: todayError } = await supabase
            .from('attendance_records')
            .select('student_id')
            .in('session_id', sessionIds)
            .in('student_id', studentIds)
            .or('status.eq.present,status.eq.late');

        if (!todayError && todayPresents) {
            // Unique students present today
            const uniquePresent = new Set(todayPresents.map((p: any) => p.student_id));
            presentToday = uniquePresent.size;
        }
    }

    return NextResponse.json({
        total_students: studentIds.length,
        avg_attendance: avgAttendance,
        below_threshold: belowThreshold,
        present_today: presentToday
    });
}
