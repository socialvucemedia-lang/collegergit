import { NextResponse } from 'next/server';
import { getAuthorizedUser } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const auth = await getAuthorizedUser();
        if (auth.error) return auth.error;

        const { user, profile, isAdmin, isAdvisor, supabaseAdmin } = auth;

        // Only Admin or Advisor/Teacher with appropriate profile should access this
        if (!isAdmin && !isAdvisor && profile.role !== 'teacher') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Get advisor record - Use supabaseAdmin to bypass RLS
        const { data: advisor } = await supabaseAdmin
            .from('class_advisors')
            .select('id, department_id, section, semester')
            .eq('user_id', user.id)
            .single();

        // Fallback to teacher if not an advisor
        let departmentId = advisor?.department_id;
        let section = advisor?.section;
        let semester = advisor?.semester;

        if (!advisor) {
            const { data: teacher } = await supabaseAdmin
                .from('teachers')
                .select('id, department_id')
                .eq('user_id', user.id)
                .single();

            if (teacher) {
                departmentId = teacher.department_id;
            }
        }

        // Get students - Use supabaseAdmin to bypass RLS forauthorized dashboard view
        let studentQuery = supabaseAdmin
            .from('students')
            .select(`
                id,
                roll_number,
                section,
                batch,
                semester,
                users!inner (
                    full_name,
                    email
                ),
                departments (
                    name,
                    code
                )
            `)
            .order('roll_number', { ascending: true });

        if (semester) {
            studentQuery = studentQuery.eq('semester', semester);
        }
        if (section) {
            studentQuery = studentQuery.eq('section', section);
        }
        if (departmentId) {
            studentQuery = studentQuery.eq('department_id', departmentId);
        }

        const { data: students, error: studentError } = await studentQuery;

        if (studentError) {
            return NextResponse.json({ error: studentError.message }, { status: 500 });
        }

        // Fetch attendance stats for these students
        const studentIds = students?.map(s => s.id) || [];

        let attendanceMap = new Map<string, { total: number, present: number }>();

        if (studentIds.length > 0) {
            const { data: attendanceData, error: attError } = await supabaseAdmin
                .from('attendance_records')
                .select('student_id, status')
                .in('student_id', studentIds);

            if (!attError && attendanceData) {
                attendanceData.forEach((record: any) => {
                    const current = attendanceMap.get(record.student_id) || { total: 0, present: 0 };
                    current.total += 1;
                    if (record.status === 'present' || record.status === 'late') {
                        current.present += 1;
                    }
                    attendanceMap.set(record.student_id, current);
                });
            }
        }

        const formattedStudents = (students || []).map(s => {
            const studentUser = Array.isArray(s.users) ? s.users[0] : s.users;
            const dept = Array.isArray(s.departments) ? s.departments[0] : s.departments;

            const stats = attendanceMap.get(s.id) || { total: 0, present: 0 };
            const percentage = stats.total > 0
                ? Math.round((stats.present / stats.total) * 100)
                : 0; // Default to 0 if no classes, or could be null

            return {
                id: s.id,
                rollNumber: s.roll_number,
                name: studentUser?.full_name || 'Unknown',
                email: studentUser?.email || '',
                section: s.section,
                batch: s.batch,
                semester: s.semester,
                department: dept?.name || null,
                attendance_percentage: percentage,
                total_classes: stats.total,
                attended_classes: stats.present
            };
        });

        return NextResponse.json({ students: formattedStudents });
    } catch (error) {
        console.error('Advisor students error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
