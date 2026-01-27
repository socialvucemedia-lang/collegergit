import { supabase } from './supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { User, UserRole } from '@/types/database';

export interface AuthUser extends User {
  auth: SupabaseUser;
}

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

/**
 * Sign out current user
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Get current session
 */
export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

/**
 * Get current user with profile
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const { data: { user: authUser } } = await supabase.auth.getUser();
  
  if (!authUser) return null;

  const { data: userProfile, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single();

  if (error || !userProfile) return null;

  return {
    ...userProfile,
    auth: authUser,
  } as AuthUser;
}

/**
 * Register a new user
 */
export async function signUp(
  email: string,
  password: string,
  fullName: string,
  role: UserRole,
  metadata?: {
    rollNumber?: string;
    employeeId?: string;
    departmentId?: string;
  }
) {
  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role,
      },
    },
  });

  if (authError) throw authError;
  if (!authData.user) throw new Error('User creation failed');

  // Create user profile
  const { error: profileError } = await supabase
    .from('users')
    .insert({
      id: authData.user.id,
      email,
      full_name: fullName,
      role,
    });

  if (profileError) {
    // Note: Admin user cleanup would need to be done server-side
    // For now, just throw the error
    throw profileError;
  }

  // Create role-specific records
  if (role === 'student' && metadata?.rollNumber) {
    await supabase
      .from('students')
      .insert({
        user_id: authData.user.id,
        roll_number: metadata.rollNumber,
        department_id: metadata.departmentId || null,
      })
      .catch(console.error);
  }

  if (role === 'teacher' && metadata?.employeeId) {
    await supabase
      .from('teachers')
      .insert({
        user_id: authData.user.id,
        employee_id: metadata.employeeId,
        department_id: metadata.departmentId || null,
      })
      .catch(console.error);
  }

  return authData;
}

/**
 * Verify user role
 */
export async function verifyRole(requiredRole: UserRole): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.role === requiredRole;
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return !!session;
}
