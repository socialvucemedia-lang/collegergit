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
            .from('teacher_subject_allocations')
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
            console.error('Assignments error:', assignmentError);
            return NextResponse.json({ error: assignmentError.message }, { status: 500 });
        }

        // Map assignments to unique subjects
        const uniqueSubjects = new Map();

        assignments?.forEach((assignment: any) => {
            const subject = assignment.subjects;
            if (subject && !uniqueSubjects.has(subject.id)) {
                uniqueSubjects.set(subject.id, {
                    subject_id: subject.id,
                    subject_code: subject.code,
                    subject_name: subject.name,
                    semester: subject.semester,
                    department: subject.departments?.name || null
                });
            }
        });

        return NextResponse.json({ subjects: Array.from(uniqueSubjects.values()) });
    } catch (error: any) {
        console.error('Teacher reports error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
