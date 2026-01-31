import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

export async function PATCH(
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
        const { record_id, status } = await request.json();

        if (!record_id || !status) {
            return NextResponse.json(
                { error: 'record_id and status are required' },
                { status: 400 }
            );
        }

        // Update the record
        const { data, error } = await supabase
            .from('attendance_records')
            .update({ status, marked_at: new Date().toISOString() })
            .eq('id', record_id)
            .eq('session_id', sessionId) // Security check
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ record: data });
    } catch (error) {
        console.error('Attendance update error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
