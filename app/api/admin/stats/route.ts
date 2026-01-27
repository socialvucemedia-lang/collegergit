import { createServerClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const supabase = createServerClient();

        const [
            { count: usersCount },
            { count: deptsCount },
            { count: subjectsCount },
            { count: allocationsCount }
        ] = await Promise.all([
            supabase.from('users').select('*', { count: 'exact', head: true }),
            supabase.from('departments').select('*', { count: 'exact', head: true }),
            supabase.from('subjects').select('*', { count: 'exact', head: true }),
            supabase.from('teacher_subject_allocations').select('*', { count: 'exact', head: true })
        ]);

        return NextResponse.json({
            stats: {
                users: usersCount || 0,
                departments: deptsCount || 0,
                subjects: subjectsCount || 0,
                allocations: allocationsCount || 0
            }
        });
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
