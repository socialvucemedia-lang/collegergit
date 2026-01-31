import { getAuthorizedUser } from '@/lib/api-auth';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const auth = await getAuthorizedUser();
        if (auth.error) return auth.error;

        if (!auth.isAdmin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { supabaseAdmin } = auth;

        // Use service role client to get accurate counts across all tables
        const [
            { count: usersCount },
            { count: deptsCount },
            { count: subjectsCount },
            { count: allocationsCount }
        ] = await Promise.all([
            supabaseAdmin.from('users').select('*', { count: 'exact', head: true }),
            supabaseAdmin.from('departments').select('*', { count: 'exact', head: true }),
            supabaseAdmin.from('subjects').select('*', { count: 'exact', head: true }),
            supabaseAdmin.from('teacher_subject_allocations').select('*', { count: 'exact', head: true })
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
        console.error('Admin stats error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
