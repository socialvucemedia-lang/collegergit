-- Migration 019: Cleanup Duplicate Policies
-- Fixes lingering "Multiple Permissive Policies" warnings by dropping rogue/duplicate policies
-- and unifying UPDATE policies for users.

-- 1. USERS: Drop rogue/duplicate policies
DROP POLICY IF EXISTS "users_owner_select" ON public.users;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users; -- Conflicts with "Unified read access"

-- 2. STUDENTS: Drop rogue policies
DROP POLICY IF EXISTS "students_owner_select" ON public.students;

-- 3. TIMETABLE: Drop rogue policies
DROP POLICY IF EXISTS "timetable_no_public_select" ON public.timetable_slots;

-- 4. USERS: Fix multiple UPDATE policies
-- Drop the separate policies created in 001/016 to replace with a Unified one
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admin can update users" ON public.users;

-- Create Unified UPDATE policy for users
CREATE POLICY "Unified update access for users" ON public.users
    FOR UPDATE
    TO authenticated
    USING (
        (id = (select auth.uid())) 
        OR 
        (public.is_admin())
    )
    WITH CHECK (
        (id = (select auth.uid())) 
        OR 
        (public.is_admin())
    );
