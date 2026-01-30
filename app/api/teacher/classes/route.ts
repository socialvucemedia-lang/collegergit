import { NextResponse } from 'next/server';
import { getAuthorizedUser } from '@/lib/api-auth';

export async function GET() {
    try {
        const auth = await getAuthorizedUser();
        if (auth.error) return auth.error;

        const { supabase, profile, user } = auth;

        if (profile.role !== 'teacher' && profile.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden: Teacher access required' }, { status: 403 });
        }

        // Get teacher record
        const { data: teacher } = await supabase
            .from('teachers')
            .select('id')
            .eq('user_id', user.id)
            .single();

        if (!teacher) {
            return NextResponse.json({ error: 'Teacher record not found. Please contact an administrator.' }, { status: 404 });
        }

        const todayDate = new Date();
        const todayStr = todayDate.toISOString().split('T')[0];
        const dayOfWeek = todayDate.getDay(); // 0 = Sunday, 1 = Monday...

        // 1. Fetch Allocations (Generic)
        const { data: allocations, error: allocError } = await supabase
            .from('teacher_subject_allocations')
            .select(`
                id,
                section,
                batch,
                subjects (
                    id,
                    code,
                    name
                )
            `)
            .eq('teacher_id', teacher.id);

        if (allocError) {
            console.error("Allocation Error:", allocError);
            return NextResponse.json({ error: allocError.message }, { status: 500 });
        }

        // 2. Fetch Timetable Slots for Today (Template)
        const { data: timetableSlots, error: timetableError } = await supabase
            .from('timetable_slots')
            .select(`
                id,
                start_time,
                end_time,
                room,
                section,
                batch,
                subject_id,
                subjects (
                    id,
                    code,
                    name
                )
            `)
            .eq('teacher_id', teacher.id)
            .eq('day_of_week', dayOfWeek)
            .order('start_time', { ascending: true });

        if (timetableError) {
            console.error("Timetable Error:", timetableError);
            // We continue even if timetable fails, just return empty slots
        }

        // 3. Fetch Actual Sessions for Today (Real Records)
        const { data: realSessions, error: sessionError } = await supabase
            .from('attendance_sessions')
            .select(`
                *,
                subjects (
                    id,
                    code,
                    name
                )
            `)
            .eq('teacher_id', teacher.id)
            .eq('session_date', todayStr);

        if (sessionError) {
            console.error("Session Error:", sessionError);
        }

        // 4. Merge Logic: Create a Unified Schedule
        // We start with Timetable Slots as the "Base Schedule".
        // If a Real Session matches (roughly same time/subject), it takes precedence.
        // Real Sessions that don't match any slot (ad-hoc) are also added.

        const schedule: any[] = [];
        const processedSessionIds = new Set();

        // Process Timetable Slots
        if (timetableSlots) {
            timetableSlots.forEach(slot => {
                // Try to find a matching real session
                // Match criteria: Same Subject AND (Same Start Time OR within 15 mins window)
                const matchingSession = realSessions?.find(s =>
                    s.subject_id === slot.subject_id &&
                    // Simple time match for now. Ideally use proper time comparison.
                    // Assuming slot.start_time is "HH:MM:SS"
                    s.start_time.substring(0, 5) === slot.start_time.substring(0, 5)
                );

                if (matchingSession) {
                    schedule.push({
                        type: 'real',
                        data: matchingSession,
                        division: slot.section // Timetable has reliable section info
                    });
                    processedSessionIds.add(matchingSession.id);
                } else {
                    // Virtual Session (Projected)
                    schedule.push({
                        type: 'virtual',
                        data: {
                            id: `virtual-${slot.id}`,
                            subject_id: slot.subject_id,
                            start_time: slot.start_time,
                            end_time: slot.end_time,
                            room: slot.room,
                            status: 'scheduled',
                            subjects: slot.subjects,
                            // Extra meta for creation
                            section: slot.section,
                            batch: slot.batch
                        },
                        division: slot.section
                    });
                }
            });
        }

        // Add remaining ad-hoc sessions (those that didn't match a timetable slot)
        if (realSessions) {
            realSessions.forEach(session => {
                if (!processedSessionIds.has(session.id)) {
                    // Try to guess division from allocations if possible, or leave blank
                    const relatedAlloc = allocations?.find(a => (a.subjects as any).id === session.subject_id);
                    schedule.push({
                        type: 'real',
                        data: session,
                        division: relatedAlloc?.section || 'N/A'
                    });
                }
            });
        }

        // Sort by start time
        schedule.sort((a, b) => a.data.start_time.localeCompare(b.data.start_time));

        return NextResponse.json({
            schedule,
            allocations: allocations || []
        });
    } catch (error) {
        console.error('Teacher classes fetch error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
