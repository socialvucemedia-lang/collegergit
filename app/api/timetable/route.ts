import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const supabase = createServerClient();
        const searchParams = request.nextUrl.searchParams;
        const department_id = searchParams.get('department_id');
        const semester = searchParams.get('semester');
        const section = searchParams.get('section');

        let query = supabase
            .from('timetable_slots')
            .select(`
        *,
        subjects (
          id,
          code,
          name
        ),
        teachers (
          id,
          employee_id,
          users (
            full_name
          )
        )
      `)
            .order('day_of_week', { ascending: true })
            .order('start_time', { ascending: true });

        if (department_id) {
            query = query.eq('department_id', department_id);
        }

        if (semester) {
            query = query.eq('semester', parseInt(semester));
        }

        if (section) {
            query = query.eq('section', section);
        }

        const { data, error } = await query;

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ slots: data || [] });
    } catch (error) {
        console.error('Timetable fetch error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = createServerClient();
        const body = await request.json();
        const { subject_id, teacher_id, day_of_week, start_time, end_time, room, section, semester, department_id } = body;

        if (!subject_id || day_of_week === undefined || day_of_week === null || !start_time || !end_time) {
            return NextResponse.json(
                { error: 'Subject, Day, Start Time, and End Time are required' },
                { status: 400 }
            );
        }

        // Check for conflicts
        const conflicts: string[] = [];

        // 1. Check for teacher conflict (same teacher at same time on same day)
        if (teacher_id) {
            const { data: teacherConflicts } = await supabase
                .from('timetable_slots')
                .select(`
                    id,
                    section,
                    subjects (code, name),
                    teachers (
                        users (full_name)
                    )
                `)
                .eq('teacher_id', teacher_id)
                .eq('day_of_week', day_of_week)
                .lte('start_time', end_time)
                .gte('end_time', start_time);

            if (teacherConflicts && teacherConflicts.length > 0) {
                const conflict = teacherConflicts[0] as any;
                const teacherName = conflict.teachers?.users?.full_name || 'This teacher';
                conflicts.push(`${teacherName} is already teaching ${conflict.subjects?.code || 'another class'} in Section ${conflict.section} at this time`);
            }
        }

        // 2. Check for room conflict (same room at same time on same day)
        if (room && room.trim()) {
            const { data: roomConflicts } = await supabase
                .from('timetable_slots')
                .select(`
                    id,
                    section,
                    subjects (code, name)
                `)
                .eq('room', room)
                .eq('day_of_week', day_of_week)
                .lte('start_time', end_time)
                .gte('end_time', start_time);

            if (roomConflicts && roomConflicts.length > 0) {
                const conflict = roomConflicts[0] as any;
                conflicts.push(`Room ${room} is already booked for ${conflict.subjects?.code || 'another class'} (Section ${conflict.section}) at this time`);
            }
        }

        // 3. Check for section slot conflict (same section, same time)
        if (section) {
            const { data: slotConflicts } = await supabase
                .from('timetable_slots')
                .select(`id, subjects (code)`)
                .eq('section', section)
                .eq('semester', semester)
                .eq('day_of_week', day_of_week)
                .lte('start_time', end_time)
                .gte('end_time', start_time);

            if (slotConflicts && slotConflicts.length > 0) {
                const conflict = slotConflicts[0] as any;
                conflicts.push(`This time slot already has ${conflict.subjects?.code || 'a class'} scheduled for Section ${section}`);
            }
        }

        // Return error if any conflicts found
        if (conflicts.length > 0) {
            return NextResponse.json(
                { error: 'Scheduling Conflict', conflicts },
                { status: 409 }
            );
        }

        const { data, error } = await supabase
            .from('timetable_slots')
            .insert({
                subject_id,
                teacher_id: teacher_id || null,
                day_of_week,
                start_time,
                end_time,
                room: room || null,
                section: section || null,
                semester: semester || null,
            })
            .select(`
        *,
        subjects (
          id,
          code,
          name
        ),
        teachers (
          id,
          employee_id,
          users (
            full_name
          )
        )
      `)
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ slot: data });
    } catch (error) {
        console.error('Timetable slot creation error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
