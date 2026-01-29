
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
        // Logic:
        // 1. Try Strict Filter (Section + Batch + Semester + Department)
        // 2. If 0 results, Try Department + Semester (Ignore Section/Batch)
        // 3. If 0 results, Try Department Only (Ignore Semester)

        let students: any[] = [];
        let error: any = null;

        // --- STRATEGY 1: STRICT FILTER ---
        let query1 = supabase
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

        if (subject.department_id) query1 = query1.eq('department_id', subject.department_id);
        if (subject.semester) query1 = query1.eq('semester', subject.semester);
        if (session.section) query1 = query1.eq('section', session.section);
        if (session.batch) query1 = query1.eq('batch', session.batch);

        const { data: data1, error: error1 } = await query1;
        if (error1) error = error1;

        if (data1 && data1.length > 0) {
            students = data1;
        } else {
            console.log(`[Attendance] Strategy 1 (Strict) returned 0 students. Trying Strategy 2...`);

            // --- STRATEGY 2: RELAXED (Dept + Sem only) ---
            let query2 = supabase
                .from('students')
                .select(`
                    id,
                    roll_number,
                    section,
                    batch,
                    semester,
                    department_id,
                    users (full_name, email)
                `);

            if (subject.department_id) query2 = query2.eq('department_id', subject.department_id);
            // We still filter by semester if it exists, hoping to at least match that
            if (subject.semester) query2 = query2.eq('semester', subject.semester);

            const { data: data2, error: error2 } = await query2;
            if (error2) error = error2;

            if (data2 && data2.length > 0) {
                students = data2;
                console.log(`[Attendance] Strategy 2 (Dept+Sem) found ${students.length} students.`);
            } else {
                console.log(`[Attendance] Strategy 2 returned 0 students. Trying Strategy 3...`);

                // --- STRATEGY 3: WIDE OPEN (Dept only) ---
                // Only if department is known, otherwise this is too dangerous (shows whole college)
                if (subject.department_id) {
                    let query3 = supabase
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

                    const { data: data3, error: error3 } = await query3;
                    if (error3) error = error3;

                    if (data3 && data3.length > 0) {
                        students = data3;
                        console.log(`[Attendance] Strategy 3 (Dept Only) found ${students.length} students.`);
                    } else {
                        console.log(`[Attendance] All strategies failed. No students found.`);
                    }
                }
            }
        }

        const studentsError = error;

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
