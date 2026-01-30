-- Migration 006: Fix RLS policies
-- PURPOSE: Fix missing policies that were causing 404s/empty data for non-admin users
-- and allow proper join access to users table.

-- 1. USERS: Allow all authenticated users to read basic user info
-- This fixes the issue where teachers/advisors can't see student names when joining users table
CREATE POLICY "Authenticated users can view all profiles" ON public.users
    FOR SELECT
    TO authenticated
    USING (true);

-- 2. TEACHERS: Fix missing policies
-- Allow teachers to view their own record (critical for "Teachers can view all students" check)
CREATE POLICY "Teachers can view own data" ON public.teachers
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Allow all authenticated users to view teacher list (e.g. for students to see their teachers)
CREATE POLICY "Authenticated users can view teachers" ON public.teachers
    FOR SELECT
    TO authenticated
    USING (true);

-- Admin can manage teachers
CREATE POLICY "Admin can manage all teachers" ON public.teachers
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 3. DEPARTMENTS: Fix missing policies
-- Everyone should be able to see departments
CREATE POLICY "Authenticated users can view departments" ON public.departments
    FOR SELECT
    TO authenticated
    USING (true);

-- Admin manage departments
CREATE POLICY "Admin can manage departments" ON public.departments
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 4. SUBJECTS: Fix missing policies
-- Everyone should be able to see subjects
CREATE POLICY "Authenticated users can view subjects" ON public.subjects
    FOR SELECT
    TO authenticated
    USING (true);

-- Admin manage subjects
CREATE POLICY "Admin can manage subjects" ON public.subjects
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 5. TEACHER_SUBJECT_ALLOCATIONS: Fix missing policies
-- Everyone should be able to see allocations (timetable needs this)
CREATE POLICY "Authenticated users can view allocations" ON public.teacher_subject_allocations
    FOR SELECT
    TO authenticated
    USING (true);

-- Admin manage allocations
CREATE POLICY "Admin can manage allocations" ON public.teacher_subject_allocations
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 6. TIMETABLE_SLOTS: Fix missing policies
-- Everyone should be able to see timetable
CREATE POLICY "Authenticated users can view slots" ON public.timetable_slots
    FOR SELECT
    TO authenticated
    USING (true);

-- Admin/Teachers manage slots? (Usually Admin or specific role)
-- For now, Admin only for full management, teachers maybe for their own?
-- Sticking to Admin for management to be safe, unless teachers need to edit.
CREATE POLICY "Admin can manage slots" ON public.timetable_slots
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
