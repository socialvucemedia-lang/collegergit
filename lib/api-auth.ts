
import { createServerClient } from './supabase-server';
import { supabaseAdmin } from './supabase-admin';
import { NextResponse } from 'next/server';

export type UserRole = 'admin' | 'teacher' | 'advisor' | 'student';

export async function getAuthorizedUser() {
    const supabase = await createServerClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) {
        return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
    }

    // Fetch profile via admin client to ensure we get the role regardless of RLS
    const { data: profile, error: profileError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

    if (profileError || !profile) {
        return { error: NextResponse.json({ error: 'Profile not found' }, { status: 404 }) };
    }

    const role: UserRole = profile.role;

    return {
        user: authUser,
        profile,
        role,
        isAdmin: role === 'admin',
        isTeacher: role === 'teacher',
        isAdvisor: role === 'advisor',
        isStudent: role === 'student',
        supabase,
        supabaseAdmin
    };
}
