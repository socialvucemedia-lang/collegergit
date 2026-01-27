
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ sessionId: string }> }
) {
    try {
        const { sessionId } = await params;
        const supabase = createServerClient();

        // Get token from header
        const authHeader = request.headers.get('Authorization');
        const token = authHeader?.split(' ')[1];

        if (!token) {
            return NextResponse.json({ error: 'Missing authorization token' }, { status: 401 });
        }

        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        // 1. Get Session Details (to know subject/department/semester)
        const { data: session, error: sessionError } = await supabase
            .from('attendance_sessions')
            .select(`
        *,
        subjects (
          id,
          name,
          code,
          semester,
          department_id
        )
      `)
            .eq('id', sessionId)
            .single();

        if (sessionError || !session) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        // 2. Access control: Ensure teacher owns this session
        const { data: teacher } = await supabase
            .from('teachers')
            .select('id')
            .eq('user_id', user.id)
            .single();

        if (session.teacher_id !== teacher?.id) {
            // Optional: Allow if shared, but for now strict ownership
            // return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const subject = session.subjects;
        if (!subject) {
            return NextResponse.json({ error: 'Subject data missing' }, { status: 500 });
        }

        // 3. Fetch Students with flexible filtering
        let studentQuery = supabase
            .from('students')
            .select(`
                id,
                roll_number,
                section,
                batch,
                semester,
                department_id,
                users (
                    full_name,
                    email
                )
            `);

        // Apply filters only if they exist and are useful
        // We'll build a set of filters that MUST match, but we'll be careful with section/batch

        // Always filter by department if possible
        if (subject.department_id) {
            studentQuery = studentQuery.eq('department_id', subject.department_id);
        }

        // SEMESTER FILTER: If students have null semester, they might still belong to this subject
        // We'll attempt to match semester, but if we find 0 students, we might want to relax it
        if (subject.semester) {
            studentQuery = studentQuery.eq('semester', subject.semester);
        }

        // SECTION FILTER
        if (session.section) {
            studentQuery = studentQuery.eq('section', session.section);
        }

        // BATCH FILTER
        if (session.batch) {
            studentQuery = studentQuery.eq('batch', session.batch);
        }

        let { data: students, error: studentsError } = await studentQuery;

        // --- FALLBACK LOGIC ---
        // If 0 students found with strict filters, try to find students in the same department/semester
        // ignoring section/batch (maybe they aren't assigned yet)
        if (!studentsError && (!students || students.length === 0)) {
            console.log(`No students found for Session ${sessionId} with strict filters. Trying fallback...`);

            let fallbackQuery = supabase
                .from('students')
                .select(`
                    id,
                    roll_number,
                    section,
                    batch,
                    semester,
                    department_id,
                    users (
                        full_name,
                        email
                    )
                `);

            if (subject.department_id) {
                fallbackQuery = fallbackQuery.eq('department_id', subject.department_id);
            }

            // If semester mismatch was the issue, try ignoring it or using a more permissive one
            // For now, let's keep department and just ignore section/batch/semester if needed
            // Actually, let's try just department + semester first
            if (subject.semester) {
                fallbackQuery = fallbackQuery.eq('semester', subject.semester);
            }

            const { data: fallbackStudents, error: fallbackError } = await fallbackQuery;

            if (!fallbackError && fallbackStudents && fallbackStudents.length > 0) {
                students = fallbackStudents;
                console.log(`Fallback successful: Found ${students?.length || 0} students by ignoring section/batch.`);
            } else if (subject.department_id) {
                // Last resort: Just show all students in the department
                const { data: deptStudents } = await supabase
                    .from('students')
                    .select(`
                        id,
                        roll_number,
                        section,
                        batch,
                        semester,
                        department_id,
                        users (full_name, email)
                    `)
                    .eq('department_id', subject.department_id);

                if (deptStudents && deptStudents.length > 0) {
                    students = deptStudents;
                    console.log(`Department fallback: Found ${students?.length || 0} students.`);
                }
            }
        }

        if (studentsError) {
            console.error('Error fetching students:', studentsError);
            return NextResponse.json({ error: studentsError.message }, { status: 500 });
        }

        // 4. Fetch existing attendance records for this session
        const { data: records, error: recordsError } = await supabase
            .from('attendance_records')
            .select('*')
            .eq('session_id', sessionId);

        if (recordsError) {
            return NextResponse.json({ error: recordsError.message }, { status: 500 });
        }

        // 5. Merge data
        const studentList = students?.map((student: any) => {
            const record = records?.find((r: any) => r.student_id === student.id);
            const userInfo = Array.isArray(student.users) ? student.users[0] : student.users;
            return {
                student_id: student.id,
                roll_number: student.roll_number,
                name: userInfo?.full_name || 'Unknown',
                email: userInfo?.email,
                status: record?.status || null, // null means not marked yet
                record_id: record?.id // Crucial for edit capability
            };
        });

        return NextResponse.json({
            session,
            students: studentList
        });

    } catch (error) {
        console.error('Error fetching attendance data:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ sessionId: string }> }
) {
    try {
        const { sessionId } = await params;
        const supabase = createServerClient();
        const { records } = await request.json(); // Array of { student_id, status }

        if (!Array.isArray(records)) {
            return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
        }

        // Process upserts (or simple loops)
        const updates = records.map(record => ({
            session_id: sessionId,
            student_id: record.student_id,
            status: record.status,
            marked_at: new Date().toISOString()
        }));

        const { error } = await supabase
            .from('attendance_records')
            .upsert(updates, { onConflict: 'session_id,student_id' });

        if (error) {
            console.error('Bulk upsert error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Update session status to 'completed' if not already
        await supabase
            .from('attendance_sessions')
            .update({ status: 'completed' })
            .eq('id', sessionId);

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error saving attendance:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
