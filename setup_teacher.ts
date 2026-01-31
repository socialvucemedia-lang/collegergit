
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupTeacher() {
    const email = 'teacher@test.com';
    const password = 'password123';
    const fullName = 'Test Teacher';

    console.log(`Setting up teacher: ${email}`);

    // 1. Create or Get User (Auth)
    const { data: { user }, error: createError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName }
    });

    let userId = user?.id;

    if (createError) {
        if (createError.message.includes('already registered')) {
            console.log("User already exists, fetching ID...");
            // List users to find ID
            const { data: { users } } = await supabase.auth.admin.listUsers();
            const existing = users.find(u => u.email === email);
            if (!existing) {
                console.error("Could not find existing user ID");
                return;
            }
            userId = existing.id;

            // Limit rate of password updates (optional, but good practice in loops)
            console.log("Resetting password...");
            await supabase.auth.admin.updateUserById(userId, { password });
        } else {
            console.error("Create User Error:", createError);
            return;
        }
    }

    if (!userId) return;
    console.log(`Auth User ID: ${userId}`);

    // 2. Upsert into public.users with role 'teacher'
    const { error: upsertError } = await supabase
        .from('users')
        .upsert({
            id: userId,
            email: email,
            role: 'teacher',
            full_name: fullName
        });

    if (upsertError) {
        console.error("Users Table Upsert Error:", upsertError);
        return;
    }
    console.log("Updated public.users role to 'teacher'");

    // 3. Ensure entry in 'teachers' table
    const { data: teacherRec, error: teacherError } = await supabase
        .from('teachers')
        .select('id')
        .eq('user_id', userId)
        .single();

    if (!teacherRec) {
        const { error: insertTeacherError } = await supabase
            .from('teachers')
            .insert({
                user_id: userId,
                department_id: null // Set to null or a valid UUID if needed
            });

        if (insertTeacherError) console.error("Teacher Table Insert Error:", insertTeacherError);
        else console.log("Created record in 'teachers' table");
    } else {
        console.log("Teacher record already exists");
    }

    console.log("Done! Try logging in with:");
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
}

setupTeacher();
