import { createServerClient } from './supabase-server';
import { redirect } from 'next/navigation';
import type { UserRole } from '@/types/database';

/**
 * Verify authentication and role on the server side.
 * Redirects to /login if not authenticated.
 * Redirects to user's dashboard if role doesn't match.
 */
export async function verifyServerAuth(requiredRole?: UserRole) {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        redirect('/login');
    }

    // Fetch profile to get role
    const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('id, email, role, full_name')
        .eq('id', user.id)
        .single();

    if (profileError || !profile) {
        redirect('/login');
    }

    // Check role if required
    if (requiredRole && profile.role !== requiredRole) {
        redirect(`/${profile.role}`);
    }

    return { user, profile };
}

/**
 * Get current user on server without enforcing role.
 * Returns null if not authenticated (no redirect).
 */
export async function getServerUser() {
    const supabase = await createServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) return null;

    const { data: profile } = await supabase
        .from('users')
        .select('id, email, role, full_name')
        .eq('id', user.id)
        .single();

    return profile ? { user, profile } : null;
}
