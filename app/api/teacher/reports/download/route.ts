
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createServerClient();
        const searchParams = request.nextUrl.searchParams;
        const subject_id = searchParams.get('subject_id');

        if (!subject_id) {
            return new NextResponse('Subject ID is required', { status: 400 });
        }

        // 1. Get current Teacher
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { data: teacher } = await supabase
            .from('teachers')
            .select('id')
            .eq('user_id', user.id)
            .single();

        if (!teacher) {
            return new NextResponse('Teacher record not found', { status: 404 });
        }

        // 2. Verify Subject Assignment (Optional but recommended for security)
        // Checks if this teacher is assigned to this subject
        const { data: assignment, error: assignError } = await supabase
            .from('teacher_subject_allocations')
            .select('subject_id')
            .eq('teacher_id', teacher.id)
            .eq('subject_id', subject_id)
            .single();

        if (assignError || !assignment) {
            return new NextResponse('You are not assigned to this subject', { status: 403 });
        }

        // 3. Get Subject Details (Code, Name, Semester)
        const { data: subject } = await supabase
            .from('subjects')
            .select('code, name, semester, department_id')
            .eq('id', subject_id)
            .single();

        if (!subject) return new NextResponse('Subject not found', { status: 404 });

        // 4. Fetch Students Enrolled in this Subject's Semester/Department
        // Note: If subjects are specific to sections, filter by section too. 
        // For now, we fetch all students in the semester + department.
        let studentQuery = supabase
            .from('students')
            .select(`
                id,
                roll_number,
                users (
                    full_name
                )
            `)
            .eq('semester', subject.semester)
            .order('roll_number', { ascending: true });

        if (subject.department_id) {
            studentQuery = studentQuery.eq('department_id', subject.department_id);
        }

        const { data: students } = await studentQuery;

        if (!students || students.length === 0) {
            return new NextResponse('No students found for this subject', { status: 404 });
        }

        // 5. Fetch Attendance Sessions for this Subject
        const { data: sessions } = await supabase
            .from('attendance_sessions')
            .select('id')
            .eq('subject_id', subject_id);

        const sessionIds = sessions?.map(s => s.id) || [];
        const totalLectures = sessionIds.length;

        // 6. Fetch Attendance Records for these students & sessions
        // We use a Map for O(1) lookup
        const attendanceMap = new Map<string, number>(); // student_id -> present_count

        if (totalLectures > 0) {
            const { data: records } = await supabase
                .from('attendance_records')
                .select('student_id, status')
                .in('session_id', sessionIds)
                .in('student_id', students.map(s => s.id));

            records?.forEach((rec: any) => {
                if (rec.status === 'present' || rec.status === 'late') {
                    const current = attendanceMap.get(rec.student_id) || 0;
                    attendanceMap.set(rec.student_id, current + 1);
                }
            });
        }

        // 7. Generate CSV
        const headers = ['Roll No', 'Name', `${subject.code} (Att/Tot)`, `${subject.code} %`];
        const csvRows = [headers.join(',')];

        for (const student of students) {
            const attended = attendanceMap.get(student.id) || 0;
            const percentage = totalLectures > 0
                ? Math.round((attended / totalLectures) * 100)
                : 0;

            const fullName = (student as any).users?.full_name || 'Unknown';

            csvRows.push([
                student.roll_number || 'N/A',
                `"${fullName}"`,
                `"${attended}/${totalLectures}"`,
                `${percentage}%`
            ].join(','));
        }

        const csvContent = csvRows.join('\n');

        return new NextResponse(csvContent, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="${subject.code}_Report_${new Date().toISOString().split('T')[0]}.csv"`,
            },
        });

    } catch (error) {
        console.error('Download report error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
