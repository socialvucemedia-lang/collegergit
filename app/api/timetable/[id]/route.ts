import { NextRequest, NextResponse } from 'next/server';
import { getAuthorizedUser } from '@/lib/api-auth';

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const auth = await getAuthorizedUser();
        if (auth.error) return auth.error;

        if (!auth.isAdmin && !auth.isAdvisor) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { supabaseAdmin } = auth;
        const { error } = await supabaseAdmin
            .from('timetable_slots')
            .delete()
            .eq('id', id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Timetable slot delete error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const auth = await getAuthorizedUser();
        if (auth.error) return auth.error;

        if (!auth.isAdmin && !auth.isAdvisor) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { supabaseAdmin } = auth;
        const body = await request.json();
        const { day_of_week, start_time, end_time, room } = body;

        const updateData: any = {};
        if (day_of_week !== undefined) updateData.day_of_week = day_of_week;
        if (start_time !== undefined) updateData.start_time = start_time;
        if (end_time !== undefined) updateData.end_time = end_time;
        if (room !== undefined) updateData.room = room;

        const { data, error } = await supabaseAdmin
            .from('timetable_slots')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ slot: data });
    } catch (error) {
        console.error('Timetable slot update error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
