import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createServerClient();
        const searchParams = request.nextUrl.searchParams;
        const student_id = searchParams.get('student_id');

        let query = supabase
            .from('intervention_notes')
            .select(`
        *,
        students (
          roll_number,
          users (
            full_name
          )
        )
      `)
            .order('created_at', { ascending: false });

        if (student_id) {
            query = query.eq('student_id', student_id);
        }

        const { data, error } = await query.limit(50);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ notes: data || [] });
    } catch (error) {
        console.error('Notes fetch error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { student_id, note, action_taken } = body;

        if (!student_id || !note) {
            return NextResponse.json(
                { error: 'student_id and note are required' },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from('intervention_notes')
            .insert({
                student_id,
                advisor_id: user.id,
                note,
                action_taken: action_taken || null,
            })
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ note: data });
    } catch (error) {
        console.error('Note creation error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
