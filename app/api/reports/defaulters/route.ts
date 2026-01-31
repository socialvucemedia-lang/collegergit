import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createServerClient();
        const searchParams = request.nextUrl.searchParams;
        const threshold = parseInt(searchParams.get('threshold') || '75');
        const semester = searchParams.get('semester');
        const department_id = searchParams.get('department_id');
        const section = searchParams.get('section');

        // Get all students matching filters
        let studentQuery = supabase
            .from('students')
            .select(`
                id,
                user_id,
                roll_number,
                section,
                batch,
                semester,
                department_id,
                users!inner (
                    full_name,
                    email
                ),
                departments (
                    name,
                    code
                )
            `);

        if (semester) {
            studentQuery = studentQuery.eq('semester', parseInt(semester));
        }
        if (department_id) {
            studentQuery = studentQuery.eq('department_id', department_id);
        }
        if (section) {
            studentQuery = studentQuery.eq('section', section);
        }

        const { data: students, error: studentError } = await studentQuery;

        if (studentError) {
            return NextResponse.json({ error: studentError.message }, { status: 500 });
        }

        if (!students || students.length === 0) {
            return NextResponse.json({
                total_students: 0,
                defaulters_count: 0,
                threshold,
                defaulters: []
            });
        }

        // Calculate attendance for each student
        const defaulters: any[] = [];

        for (const student of students) {
            // Get attendance records for this student
            const { data: attendanceData, error: attError } = await supabase
                .from('attendance_records')
                .select('status')
                .eq('student_id', student.id);

            const total = attendanceData?.length || 0;
            const present = attendanceData?.filter(a => a.status === 'present' || a.status === 'late').length || 0;
            const percentage = total > 0 ? Math.round((present / total) * 100) : null;

            if (percentage !== null && percentage < threshold) {
                const user = Array.isArray(student.users) ? student.users[0] : student.users;
                const dept = Array.isArray(student.departments) ? student.departments[0] : student.departments;

                defaulters.push({
                    id: student.id,
                    roll_number: student.roll_number,
                    name: user?.full_name || 'Unknown',
                    email: user?.email || '',
                    semester: student.semester,
                    section: student.section,
                    batch: student.batch,
                    department: dept?.name || null,
                    department_code: dept?.code || null,
                    total_classes: total,
                    attended: present,
                    percentage
                });
            }
        }

        // Sort by percentage ascending (worst first)
        defaulters.sort((a, b) => (a.percentage || 0) - (b.percentage || 0));

        return NextResponse.json({
            total_students: students.length,
            defaulters_count: defaulters.length,
            threshold,
            defaulters
        });
    } catch (error) {
        console.error('Defaulters fetch error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
