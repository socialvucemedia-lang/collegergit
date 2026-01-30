
import { NextRequest, NextResponse } from 'next/server';
import { getAuthorizedUser } from '@/lib/api-auth';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ sessionId: string }> }
) {
    try {
        const { sessionId } = await params;
        const auth = await getAuthorizedUser();
        if (auth.error) return auth.error;

        const { supabase, profile, user } = auth;

        if (profile.role !== 'teacher' && profile.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden: Teacher access required' }, { status: 403 });
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

        // 5. Calculate Attendance Percentage for this Subject
        // A. Get total completed sessions for this subject
        const { count: totalLectures } = await supabase
            .from('attendance_sessions')
            .select('id', { count: 'exact', head: true })
            .eq('subject_id', subject.id)
            .eq('status', 'completed');

        // B. Get present count for each student in this subject
        // We can't easily do a group by with the JS client without rpc, so we'll fetch all relevant records
        // Optimization: Filter by students we actually found
        const studentIds = students?.map((s: any) => s.id) || [];

        const { data: presenceData } = await supabase
            .from('attendance_records')
            .select(`
                student_id,
                attendance_sessions!inner (
                    subject_id
                )
            `)
            .eq('status', 'present')
            .eq('attendance_sessions.subject_id', subject.id)
            .in('student_id', studentIds);

        // Count presents per student
        const presentMap = new Map<string, number>();
        presenceData?.forEach((record: any) => {
            const sid = record.student_id;
            presentMap.set(sid, (presentMap.get(sid) || 0) + 1);
        });

        // 6. Merge data
        const studentList = students?.map((student: any) => {
            const record = records?.find((r: any) => r.student_id === student.id);
            const userInfo = Array.isArray(student.users) ? student.users[0] : student.users;

            const presents = presentMap.get(student.id) || 0;
            const total = totalLectures || 0;
            // Avoid division by zero, default to 100% if no classes yet (or 0%? usually 100 or 0. Let's say 0 to be safe/neutral)
            // Actually if total is 0, percentage is N/A. But let's verify.
            // If this is the FIRST session, total might be 0 (since this one isn't completed yet).
            // Let's assume this session counts if it were completed? No, usually historical.
            // Let's use historical percentage.
            const percentage = total > 0 ? Math.round((presents / total) * 100) : 0;

            return {
                student_id: student.id,
                roll_number: student.roll_number,
                name: userInfo?.full_name || 'Unknown',
                email: userInfo?.email,
                status: record?.status || null, // null means not marked yet
                record_id: record?.id, // Crucial for edit capability
                attendance_percentage: percentage,
                total_lectures: total,
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
        const auth = await getAuthorizedUser();
        if (auth.error) return auth.error;

        const { supabase, profile } = auth;

        if (profile.role !== 'teacher' && profile.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden: Teacher access required' }, { status: 403 });
        }

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
