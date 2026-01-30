import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import type { UserRole } from '@/types/database';

export async function POST(request: NextRequest) {
  try {
    const { email, password, full_name, role, roll_number, employee_id, department_id, section, batch } = await request.json();

    if (!email || !password || !full_name || !role) {
      return NextResponse.json(
        { error: 'Email, password, full_name, and role are required' },
        { status: 400 }
      );
    }

    const supabase = supabaseAdmin;

    // Create user in Supabase Auth using Admin API
    // The trigger 'on_auth_user_created' will automatically create the public.users profile
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, role }
    });

    if (authError) {
      console.error("Supabase createUser error:", authError);
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'User creation failed' },
        { status: 500 }
      );
    }

    // Profile is created by trigger, so we can proceed to create specific role entries
    // We add a small delay or check to ensure profile exists if we had strict FK constraints,
    // but standard Postgres triggers are synchronous within the transaction so it should be there.


    // Create role-specific records
    if (role === 'student' && roll_number) {
      const { error: studentError } = await supabase
        .from('students')
        .insert({
          user_id: authData.user.id,
          roll_number,
          department_id: department_id || null,
          section: section || null,
          batch: batch || null,
        });

      if (studentError) {
        console.error('Student creation error:', studentError);
      }
    }

    if (role === 'teacher' && employee_id) {
      const { error: teacherError } = await supabase
        .from('teachers')
        .insert({
          user_id: authData.user.id,
          employee_id,
          department_id: department_id || null,
        });

      if (teacherError) {
        console.error('Teacher creation error:', teacherError);
      }
    }

    return NextResponse.json({
      message: 'User created successfully',
      user: {
        id: authData.user.id,
        email,
        full_name,
        role,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
