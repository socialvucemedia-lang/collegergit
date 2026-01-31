import { NextRequest, NextResponse } from 'next/server';
import { getAuthorizedUser } from '@/lib/api-auth';

// Force dynamic to ensure we don't cache stale data
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const auth = await getAuthorizedUser();
        if (auth.error) return auth.error;

        if (!auth.isAdmin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { supabaseAdmin } = auth;

        const { data: advisors, error } = await supabaseAdmin
            .from('class_advisors')
            .select(`
                id,
                user_id,
                department_id,
                section,
                semester,
                academic_year,
                users (
                    full_name,
                    email
                )
            `)
            .order('created_at', { ascending: false });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const formatted = advisors?.map((a: any) => ({
            id: a.id,
            user_id: a.user_id,
            section: a.section,
            semester: a.semester,
            academic_year: a.academic_year,
            department_id: a.department_id,
            full_name: a.users?.full_name,
            email: a.users?.email
        })) || [];

        return NextResponse.json({ advisors: formatted });
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const auth = await getAuthorizedUser();
        if (auth.error) return auth.error;

        if (!auth.isAdmin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { supabaseAdmin } = auth;
        const body = await request.json();
        const { user_id, semester, section, academic_year } = body;

        // Ensure user has 'advisor' role (optional but good practice)
        // Update user role to advisor if not already
        await supabaseAdmin.from('users').update({ role: 'advisor' }).eq('id', user_id);

        const { data, error } = await supabaseAdmin
            .from('class_advisors')
            .upsert({
                user_id,
                semester,
                section,
                academic_year
            }, { onConflict: 'user_id' })
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ advisor: data });
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const auth = await getAuthorizedUser();
        if (auth.error) return auth.error;

        if (!auth.isAdmin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

        const { error } = await auth.supabaseAdmin
            .from('class_advisors')
            .delete()
            .eq('id', id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
