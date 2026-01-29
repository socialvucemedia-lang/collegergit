import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
    try {
        const supabase = await createServerClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. Get user role from 'users' table
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('role, full_name')
            .eq('id', user.id)
            .single();

        if (userError || !userData) {
            return NextResponse.json({ error: 'User record not found' }, { status: 404 });
        }

        if (userData.role !== 'student') {
            return NextResponse.json({ error: 'User is not a student', role: userData.role }, { status: 400 });
        }

        // 2. Check if student record exists
        const { data: student, error: studentError } = await supabase
            .from('students')
            .select('id')
            .eq('user_id', user.id)
            .single();

        if (student && !studentError) {
            return NextResponse.json({ message: 'Student record already exists', id: student.id });
        }

        // 3. Create missing student record using Admin key (Service Role)
        // This handles cases where registration succeeded but student profiling failed
        const { data: newStudent, error: createError } = await supabaseAdmin
            .from('students')
            .insert({
                user_id: user.id,
                roll_number: `FIX-${user.id.slice(0, 4)}`, // Placeholder
                semester: 1, // Default
            })
            .select()
            .single();

        if (createError) {
            console.error('Auto-fix student creation failed:', createError);
            return NextResponse.json({ error: 'Failed to create student record', details: createError }, { status: 500 });
        }

        return NextResponse.json({
            message: 'Student record created successfully',
            student: newStudent
        });

    } catch (error) {
        console.error('Auto-fix error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
