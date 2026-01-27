import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
    try {
        const supabase = createServerClient();
        const searchParams = request.nextUrl.searchParams;
        const department_id = searchParams.get('department_id');

        // Get all students
        let studentsQuery = supabase
            .from('students')
            .select('id, semester, department_id');

        if (department_id) {
            studentsQuery = studentsQuery.eq('department_id', department_id);
        }

        const { data: students, error: studentsError } = await studentsQuery;

        if (studentsError) {
            return NextResponse.json({ error: studentsError.message }, { status: 500 });
        }

        // Get all attendance records
        const studentIds = students?.map(s => s.id) || [];
        const { data: records, error: recordsError } = await supabase
            .from('attendance_records')
            .select('student_id, status')
            .in('student_id', studentIds);

        if (recordsError) {
            return NextResponse.json({ error: recordsError.message }, { status: 500 });
        }

        // Calculate overall stats
        const totalRecords = records?.length || 0;
        const presentRecords = records?.filter(r => r.status === 'present' || r.status === 'late').length || 0;
        const overallPercentage = totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 0;

        // Calculate by semester
        const semesterStats: Record<number, { total: number; present: number }> = {};
        students?.forEach(student => {
            const sem = student.semester || 0;
            if (!semesterStats[sem]) {
                semesterStats[sem] = { total: 0, present: 0 };
            }
            const studentRecords = records?.filter(r => r.student_id === student.id) || [];
            semesterStats[sem].total += studentRecords.length;
            semesterStats[sem].present += studentRecords.filter(r => r.status === 'present' || r.status === 'late').length;
        });

        const byClasses = Object.entries(semesterStats).map(([sem, stats]) => ({
            semester: parseInt(sem),
            total_records: stats.total,
            present: stats.present,
            percentage: stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0,
        })).sort((a, b) => a.semester - b.semester);

        return NextResponse.json({
            total_students: students?.length || 0,
            total_records: totalRecords,
            overall_percentage: overallPercentage,
            by_semester: byClasses,
        });
    } catch (error) {
        console.error('Class health error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
