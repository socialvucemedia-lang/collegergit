import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
    try {
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

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get teacher record
        const { data: teacher } = await supabase
            .from('teachers')
            .select('id')
            .eq('user_id', user.id)
            .single();

        if (!teacher) {
            return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 });
        }

        // Fetch allocations for this teacher
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
            return NextResponse.json({ error: allocError.message }, { status: 500 });
        }

        // Fetch today's sessions for these subjects
        const today = new Date().toISOString().split('T')[0];
        const { data: sessions, error: sessionError } = await supabase
            .from('attendance_sessions')
            .select('*')
            .eq('teacher_id', teacher.id)
            .eq('session_date', today);

        return NextResponse.json({
            allocations: allocations || [],
            sessions: sessions || []
        });
    } catch (error) {
        console.error('Teacher classes fetch error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
