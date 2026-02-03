import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceRoleKey) {
    if (process.env.NODE_ENV === 'production') {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY is required in production. Admin operations will not work without it.');
    }
    console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY is missing. Admin operations will fail due to RLS policies.');
}

// Admin client - bypasses RLS, only use server-side
export const supabaseAdmin = createClient(
    supabaseUrl,
    supabaseServiceRoleKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);
