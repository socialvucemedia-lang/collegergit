import { NextRequest, NextResponse } from 'next/server';
import { getAuthorizedUser } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const auth = await getAuthorizedUser();
        if (auth.error) return auth.error;

        const { isAdmin, isAdvisor, isTeacher, supabaseAdmin, supabase } = auth;

        // Use admin client for Admins, Advisors, and Teachers to see the full timetable
        // Standard client for students (respects RLS)
        const isStaff = isAdmin || isAdvisor || isTeacher;
        const client = isStaff ? supabaseAdmin : supabase;

        const searchParams = request.nextUrl.searchParams;
        const department_id = searchParams.get('department_id');
        const semester = searchParams.get('semester');
        const section = searchParams.get('section');
        const batch = searchParams.get('batch');

        // Optimized select query with specific fields
        let selectQuery = `
        id, subject_id, teacher_id, day_of_week, start_time, end_time, room, section, semester, batch,
        subjects${department_id ? '!inner' : ''} (
          id,
          code,
          name,
          department_id
        ),
        teachers (
          id,
          employee_id,
          users (
            full_name
          )
        )
      `;

        let query = client
            .from('timetable_slots')
            .select(selectQuery)
            .order('day_of_week', { ascending: true })
            .order('start_time', { ascending: true });

        if (department_id) {
            query = query.eq('subjects.department_id', department_id);
        }

        if (semester) {
            query = query.eq('semester', parseInt(semester));
        }

        if (section) {
            query = query.eq('section', section);
        }

        if (batch) {
            query = query.eq('batch', batch);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Database error:', error);
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
        const auth = await getAuthorizedUser();
        if (auth.error) return auth.error;

        // Only Admin or Advisor can create timetable slots
        if (!auth.isAdmin && !auth.isAdvisor) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { supabaseAdmin } = auth;
        const body = await request.json();
        const { subject_id, teacher_id, day_of_week, start_time, end_time, room, section, semester, batch } = body;

        if (!subject_id || day_of_week === undefined || day_of_week === null || !start_time || !end_time) {
            return NextResponse.json(
                { error: 'Subject, Day, Start Time, and End Time are required' },
                { status: 400 }
            );
        }

        // Optimized: Check for all conflicts in a single query
        const { data: existingSlots, error: conflictError } = await supabaseAdmin
            .from('timetable_slots')
            .select(`
                id, 
                teacher_id, 
                room, 
                section, 
                semester,
                subjects (code, name),
                teachers (users (full_name))
            `)
            .eq('day_of_week', day_of_week)
            .lte('start_time', end_time)
            .gte('end_time', start_time)
            .or(`teacher_id.eq.${teacher_id || 'null'},room.eq.${room || 'null'},and(section.eq.${section || 'null'},semester.eq.${semester || 'null'})`);

        if (conflictError) {
            console.error('Conflict check error:', conflictError);
            return NextResponse.json({ error: 'Conflict check failed' }, { status: 500 });
        }

        const conflicts: string[] = [];
        if (existingSlots && existingSlots.length > 0) {
            for (const slot of existingSlots as any[]) {
                if (teacher_id && slot.teacher_id === teacher_id) {
                    const name = slot.teachers?.users?.full_name || 'This teacher';
                    conflicts.push(`${name} is already teaching ${slot.subjects?.code} in Section ${slot.section} at this time`);
                } else if (room && slot.room === room) {
                    conflicts.push(`Room ${room} is already booked for ${slot.subjects?.code} (Section ${slot.section}) at this time`);
                } else if (section && slot.section === section && slot.semester == semester) {
                    conflicts.push(`This time slot already has ${slot.subjects?.code} scheduled for Section ${section}`);
                }
            }
        }

        if (conflicts.length > 0) {
            return NextResponse.json(
                { error: 'Scheduling Conflict', conflicts },
                { status: 409 }
            );
        }

        const { data, error } = await supabaseAdmin
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
                batch: batch || null,
            })
            .select(`
                id, subject_id, teacher_id, day_of_week, start_time, end_time, room, section, semester, batch,
                subjects (id, code, name),
                teachers (id, employee_id, users (full_name))
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
