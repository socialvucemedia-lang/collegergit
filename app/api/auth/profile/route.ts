import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

// This endpoint fetches user profile using admin client (bypasses RLS)
// Used after login when RLS might block the browser client
export async function GET() {
    try {
        const supabase = await createServerClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Use admin client to bypass RLS
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('users')
            .select('id, email, role, full_name')
            .eq('id', user.id)
            .single();

        if (profileError || !profile) {
            return NextResponse.json({
                error: 'Profile not found',
                user_id: user.id,
                hint: `Run: INSERT INTO public.users (id, email, role, full_name) VALUES ('${user.id}', '${user.email}', 'advisor', 'Your Name');`
            }, { status: 404 });
        }

        return NextResponse.json({ profile });
    } catch (error) {
        console.error('Profile fetch error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
