import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const supabase = await createServerClient();

        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get student record
        const { data: student, error: studentError } = await supabase
            .from('students')
            .select('id, semester, section, batch, department_id')
            .eq('user_id', user.id)
            .single();

        if (studentError || !student) {
            // DEBUG: Check with admin client if RLS is the issue
            const { data: adminStudent } = await supabaseAdmin
                .from('students')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (adminStudent) {
                console.error(`DEBUG: Student record found for user ${user.id} via ADMIN but NOT via USER. This is an RLS issue.`);
            } else {
                console.warn(`DEBUG: Student record truly MISSING for user ${user.id} even via ADMIN.`);
            }

            return NextResponse.json({ error: 'Student not found' }, { status: 404 });
        }

        // Get today's day of week (0=Sunday, 1=Monday, ... 6=Saturday)
        const today = new Date();
        const dayOfWeek = today.getDay();

        // Fetch today's timetable slots for the student's section and semester
        // Note: We filter by department_id through subjects relation since timetable_slots doesn't have department_id
        let selectQuery = student.department_id
            ? `
                id,
                start_time,
                end_time,
                room,
                batch,
                subjects!inner (
                    id,
                    code,
                    name,
                    department_id
                ),
                teachers (
                    id,
                    users (
                        full_name
                    )
                )
            `
            : `
                id,
                start_time,
                end_time,
                room,
                batch,
                subjects (
                    id,
                    code,
                    name
                ),
                teachers (
                    id,
                    users (
                        full_name
                    )
                )
            `;

        let query = supabase
            .from('timetable_slots')
            .select(selectQuery)
            .eq('day_of_week', dayOfWeek)
            .eq('semester', student.semester)
            .order('start_time', { ascending: true });

        if (student.section) {
            query = query.eq('section', student.section);
        }

        if (student.department_id) {
            query = query.eq('subjects.department_id', student.department_id);
        }

        const { data: slots, error: slotError } = await query;

        if (slotError) {
            return NextResponse.json({ error: slotError.message }, { status: 500 });
        }

        // Filter by batch if applicable
        // Cast to any[] to handle dynamic select query typing
        let filteredSlots: any[] = slots || [];
        if (student.batch) {
            filteredSlots = filteredSlots.filter(slot => !slot.batch || slot.batch === student.batch);
        }

        // For each slot, check attendance status
        const timeline: any[] = [];
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

        for (const slot of filteredSlots) {
            const subject = slot.subjects as any;
            const teacher = slot.teachers as any;

            if (!subject || !subject.id) {
                console.warn(`Slot ${slot.id} has no subject linked.`);
                timeline.push({
                    id: slot.id,
                    start_time: slot.start_time,
                    end_time: slot.end_time,
                    room: slot.room,
                    subject_code: 'ERR',
                    subject_name: 'Unknown Subject',
                    teacher_name: teacher?.users?.full_name || null,
                    status: 'upcoming',
                    attendance_status: 'pending'
                });
                continue;
            }

            try {
                // Check if there's an attendance session for this slot today
                const { data: session, error: sessionError } = await supabase
                    .from('attendance_sessions')
                    .select('id')
                    .eq('subject_id', subject.id)
                    .eq('session_date', today.toISOString().split('T')[0])
                    .single();

                // Allow "Row not found" error (code PGRST116)
                if (sessionError && sessionError.code !== 'PGRST116') {
                    console.error('Session lookup error:', sessionError);
                }

                let attendanceStatus: 'present' | 'absent' | 'late' | 'pending' = 'pending';

                if (session) {
                    const { data: attendance } = await supabase
                        .from('attendance_records')
                        .select('status')
                        .eq('session_id', session.id)
                        .eq('student_id', student.id)
                        .single();

                    if (attendance) {
                        attendanceStatus = attendance.status as any;
                    }
                }

                // Determine if slot is current, upcoming, or past
                let status: 'current' | 'upcoming' | 'completed' = 'upcoming';
                if (currentTime >= slot.start_time && currentTime < slot.end_time) {
                    status = 'current';
                } else if (currentTime >= slot.end_time) {
                    status = 'completed';
                }

                timeline.push({
                    id: slot.id,
                    start_time: slot.start_time,
                    end_time: slot.end_time,
                    room: slot.room,
                    subject_code: subject?.code || 'N/A',
                    subject_name: subject?.name || 'Unknown Subject',
                    teacher_name: teacher?.users?.full_name || null,
                    status,
                    attendance_status: attendanceStatus
                });
            } catch (err) {
                console.error(`Error processing slot ${slot.id}:`, err);
            }
        }

        return NextResponse.json({
            date: today.toISOString().split('T')[0],
            day_name: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek],
            timeline
        });
    } catch (error) {
        console.error('Student timeline error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
