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

        // Get advisor record
        const { data: advisor } = await supabase
            .from('class_advisors')
            .select('id, department_id, section, semester')
            .eq('user_id', user.id)
            .single();

        // Fallback to teacher if not an advisor
        let departmentId = advisor?.department_id;
        let section = advisor?.section;
        let semester = advisor?.semester;

        if (!advisor) {
            const { data: teacher } = await supabase
                .from('teachers')
                .select('id, department_id')
                .eq('user_id', user.id)
                .single();

            if (teacher) {
                departmentId = teacher.department_id;
            }
        }

        // Get students
        let studentQuery = supabase
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

        const formattedStudents = (students || []).map(s => {
            const user = Array.isArray(s.users) ? s.users[0] : s.users;
            const dept = Array.isArray(s.departments) ? s.departments[0] : s.departments;

            return {
                id: s.id,
                rollNumber: s.roll_number,
                name: user?.full_name || 'Unknown',
                email: user?.email || '',
                section: s.section,
                batch: s.batch,
                semester: s.semester,
                department: dept?.name || null
            };
        });

        return NextResponse.json({ students: formattedStudents });
    } catch (error) {
        console.error('Advisor students error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
