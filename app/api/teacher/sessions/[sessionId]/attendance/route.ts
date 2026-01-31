
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ sessionId: string }> }
) {
    try {
        const { sessionId } = await params;
        const supabase = await createServerClient();

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

        // OPTIMIZATION: Parallelize independent queries
        // 1. Session details and 2. Teacher lookup can run in parallel
        const [sessionResult, teacherResult] = await Promise.all([
            supabase
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
                .single(),
            supabase
                .from('teachers')
                .select('id')
                .eq('user_id', user.id)
                .single()
        ]);

        const { data: session, error: sessionError } = sessionResult;
        const { data: teacher } = teacherResult;

        if (sessionError || !session) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        // Access control check (optional)
        if (session.teacher_id !== teacher?.id) {
            // Optional: Allow if shared, but for now allow through
        }

        const subject = session.subjects;
        if (!subject) {
            return NextResponse.json({ error: 'Subject data missing' }, { status: 500 });
        }

        // Build student query with filters
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

        if (subject.department_id) studentQuery = studentQuery.eq('department_id', subject.department_id);
        if (subject.semester) studentQuery = studentQuery.eq('semester', subject.semester);
        if (session.section) studentQuery = studentQuery.eq('section', session.section);
        if (session.batch) studentQuery = studentQuery.eq('batch', session.batch);

        // OPTIMIZATION: Run student fetch, existing records, and total lectures count in parallel
        const [studentsResult, recordsResult, totalLecturesResult] = await Promise.all([
            studentQuery,
            supabase
                .from('attendance_records')
                .select('*')
                .eq('session_id', sessionId),
            supabase
                .from('attendance_sessions')
                .select('id', { count: 'exact', head: true })
                .eq('subject_id', subject.id)
                .eq('status', 'completed')
        ]);

        let students = studentsResult.data || [];
        const studentsError = studentsResult.error;

        // Fallback strategies if no students found
        if (students.length === 0 && !studentsError) {
            // Strategy 2: Dept + Sem only
            let query2 = supabase
                .from('students')
                .select(`id, roll_number, section, batch, semester, department_id, users (full_name, email)`);

            if (subject.department_id) query2 = query2.eq('department_id', subject.department_id);
            if (subject.semester) query2 = query2.eq('semester', subject.semester);

            const { data: data2 } = await query2;

            if (data2 && data2.length > 0) {
                students = data2;
            } else if (subject.department_id) {
                // Strategy 3: Dept only
                const { data: data3 } = await supabase
                    .from('students')
                    .select(`id, roll_number, section, batch, semester, department_id, users (full_name, email)`)
                    .eq('department_id', subject.department_id);

                if (data3 && data3.length > 0) {
                    students = data3;
                }
            }
        }

        if (studentsError) {
            console.error('Error fetching students:', studentsError);
            return NextResponse.json({ error: studentsError.message }, { status: 500 });
        }

        const records = recordsResult.data;
        if (recordsResult.error) {
            return NextResponse.json({ error: recordsResult.error.message }, { status: 500 });
        }

        const totalLectures = totalLecturesResult.count || 0;

        // Get presence data for students (this depends on students array, so must be after)
        const studentIds = students.map((s: any) => s.id);

        const { data: presenceData } = studentIds.length > 0 ? await supabase
            .from('attendance_records')
            .select(`
                student_id,
                attendance_sessions!inner (
                    subject_id
                )
            `)
            .eq('status', 'present')
            .eq('attendance_sessions.subject_id', subject.id)
            .in('student_id', studentIds) : { data: [] };

        // Count presents per student
        const presentMap = new Map<string, number>();
        presenceData?.forEach((record: any) => {
            const sid = record.student_id;
            presentMap.set(sid, (presentMap.get(sid) || 0) + 1);
        });

        // Merge data
        const studentList = students.map((student: any) => {
            const record = records?.find((r: any) => r.student_id === student.id);
            const userInfo = Array.isArray(student.users) ? student.users[0] : student.users;

            const presents = presentMap.get(student.id) || 0;
            const percentage = totalLectures > 0 ? Math.round((presents / totalLectures) * 100) : 0;

            return {
                student_id: student.id,
                roll_number: student.roll_number,
                name: userInfo?.full_name || 'Unknown',
                email: userInfo?.email,
                status: record?.status || null,
                record_id: record?.id,
                attendance_percentage: percentage,
                total_lectures: totalLectures,
                present_lectures: presents
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
        const supabase = await createServerClient();
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
