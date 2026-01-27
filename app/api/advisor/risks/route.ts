import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
    try {
        const supabase = createServerClient();
        const searchParams = request.nextUrl.searchParams;
        const threshold = parseInt(searchParams.get('threshold') || '75');

        // Get all students with their attendance records
        const { data: students, error: studentsError } = await supabase
            .from('students')
            .select(`
        id,
        roll_number,
        semester,
        department_id,
        users (
          id,
          full_name,
          email
        ),
        departments (
          code,
          name
        )
      `);

        if (studentsError) {
            return NextResponse.json({ error: studentsError.message }, { status: 500 });
        }

        // Get all attendance records
        const { data: allRecords, error: recordsError } = await supabase
            .from('attendance_records')
            .select('student_id, status');

        if (recordsError) {
            return NextResponse.json({ error: recordsError.message }, { status: 500 });
        }

        // Calculate attendance for each student
        const studentStats = students?.map((student: any) => {
            const records = allRecords?.filter((r: any) => r.student_id === student.id) || [];
            const total = records.length;
            const present = records.filter((r: any) => r.status === 'present' || r.status === 'late').length;
            const percentage = total > 0 ? Math.round((present / total) * 100) : null; // null = no data

            return {
                id: student.id,
                roll_number: student.roll_number,
                name: Array.isArray(student.users) ? student.users[0]?.full_name : student.users?.full_name || 'Unknown',
                email: Array.isArray(student.users) ? student.users[0]?.email : student.users?.email,
                semester: student.semester,
                department: student.departments?.code || null,
                total_classes: total,
                attended: present,
                percentage,
                at_risk: percentage !== null && percentage < threshold,
            };
        }) || [];

        // Filter at-risk students
        const atRiskStudents = studentStats.filter((s) => s.at_risk);

        return NextResponse.json({
            threshold,
            total_students: studentStats.length,
            at_risk_count: atRiskStudents.length,
            students: atRiskStudents.sort((a, b) => (a.percentage || 0) - (b.percentage || 0)),
        });
    } catch (error) {
        console.error('Risk analysis error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
