
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listUsers() {
    console.log("Listing Users...");

    // Get all users from auth.users (requires service role)
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
        console.error("Auth List Error:", authError);
        return;
    }

    console.log(`Found ${users.length} auth users.`);

    // Get profiles
    const { data: profiles, error: profError } = await supabase
        .from('users')
        .select('id, email, role, full_name');

    if (profError) {
        console.error("Profile Error:", profError);
        return;
    }

    // Join them manually for display
    users.forEach(u => {
        const profile = profiles?.find(p => p.id === u.id);
        console.log(`User: ${u.email} | Role (DB): ${profile?.role} | ID: ${u.id}`);
    });
}

listUsers();
