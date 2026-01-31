import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerClient();
        const { from_semester, to_semester, retain_ids } = await request.json();

        if (!from_semester || !to_semester) {
            return NextResponse.json(
                { error: 'from_semester and to_semester are required' },
                { status: 400 }
            );
        }

        // Get all students in the source semester
        const { data: students, error: fetchError } = await supabase
            .from('students')
            .select('id')
            .eq('semester', from_semester);

        if (fetchError) {
            return NextResponse.json({ error: fetchError.message }, { status: 500 });
        }

        // Filter out retained (failed) students
        const retainSet = new Set(retain_ids || []);
        const promoteIds = students
            ?.filter((s) => !retainSet.has(s.id))
            .map((s) => s.id) || [];

        if (promoteIds.length === 0) {
            return NextResponse.json({
                promoted: 0,
                retained: retainSet.size,
                message: 'No students to promote',
            });
        }

        // Update semester for promoted students
        const { error: updateError } = await supabase
            .from('students')
            .update({ semester: to_semester })
            .in('id', promoteIds);

        if (updateError) {
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            promoted: promoteIds.length,
            retained: retainSet.size,
        });
    } catch (error) {
        console.error('Promotion error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
