-- Migration 016: Optimize RLS Performance and Fix InitPlan Warnings

-- Helper function to check if user is admin (optimized)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = (select auth.uid()) AND role = 'admin'
  );
END;
$$;

-- Helper function to check if user is teacher (optimized)
CREATE OR REPLACE FUNCTION public.is_teacher()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.teachers
    WHERE user_id = (select auth.uid())
  );
END;
$$;

-- Note: is_class_advisor() already exists from 013, but we should ensure it uses (select auth.uid()) if we touch it.
-- Leaving is_class_advisor as is for now as it was using auth.uid() inside function which is generally fine, 
-- but improving the caller policies.

-- ==============================================================================
-- 1. USERS TABLE
-- ==============================================================================
-- Existing policies to drop:
-- "Users can view own profile"
-- "Authenticated users can view all profiles" (from 006)
-- "Advisors can view student profiles" (from 011/013)
-- "Service role has full access" (manual/unknown source)
-- "Admin can manage all users"

DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.users;
DROP POLICY IF EXISTS "Advisors can view student profiles" ON public.users;
DROP POLICY IF EXISTS "Service role has full access" ON public.users;
DROP POLICY IF EXISTS "Admin can manage all users" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

-- Unified SELECT policy (Based on 006 allowing all authenticated to view all)
CREATE POLICY "Unified read access for users" ON public.users
    FOR SELECT
    TO authenticated
    USING (true); -- Per 006_fix_rls_policies.sql which opened access

-- UPDATE policy
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE
    TO authenticated
    USING ((select auth.uid()) = id);

-- ADMIN Manage (Insert/Update/Delete) - Split from ALL to avoid overlapping SELECT
CREATE POLICY "Admin can insert users" ON public.users FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admin can update users" ON public.users FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admin can delete users" ON public.users FOR DELETE TO authenticated USING (public.is_admin());

-- Service Role (re-creating to be safe)
CREATE POLICY "Service role has full access" ON public.users
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);


-- ==============================================================================
-- 2. STUDENTS TABLE
-- ==============================================================================
-- Existing to drop:
-- "Students can view own data"
-- "Teachers can view all students"
-- "Admin can manage all students"
-- "Advisors can view all students"

DROP POLICY IF EXISTS "Students can view own data" ON public.students;
DROP POLICY IF EXISTS "Teachers can view all students" ON public.students;
DROP POLICY IF EXISTS "Admin can manage all students" ON public.students;
DROP POLICY IF EXISTS "Advisors can view all students" ON public.students;

-- Unified SELECT
CREATE POLICY "Unified read access for students" ON public.students
    FOR SELECT
    TO authenticated
    USING (
        -- Student viewing own data
        (user_id = (select auth.uid()))
        OR
        -- Teacher viewing all
        (public.is_teacher())
        OR
        -- Advisor viewing all
        (public.is_class_advisor())
        OR
        -- Admin viewing all
        (public.is_admin())
    );

-- Admin Manage (Insert/Update/Delete)
CREATE POLICY "Admin can insert students" ON public.students FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admin can update students" ON public.students FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admin can delete students" ON public.students FOR DELETE TO authenticated USING (public.is_admin());


-- ==============================================================================
-- 3. TEACHERS TABLE
-- ==============================================================================
-- Existing to drop:
-- "Teachers can view own data"
-- "Authenticated users can view teachers"
-- "Admin can manage all teachers"

DROP POLICY IF EXISTS "Teachers can view own data" ON public.teachers;
DROP POLICY IF EXISTS "Authenticated users can view teachers" ON public.teachers;
DROP POLICY IF EXISTS "Admin can manage all teachers" ON public.teachers;

-- Unified SELECT (006 allows all authenticated to view teachers)
CREATE POLICY "Unified read access for teachers" ON public.teachers
    FOR SELECT
    TO authenticated
    USING (true);

-- Admin Manage
CREATE POLICY "Admin can insert teachers" ON public.teachers FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admin can update teachers" ON public.teachers FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admin can delete teachers" ON public.teachers FOR DELETE TO authenticated USING (public.is_admin());


-- ==============================================================================
-- 4. ATTENDANCE_SESSIONS
-- ==============================================================================
-- Existing:
-- "Teachers can manage own sessions"
-- "Advisors can view all sessions" (011/013)
-- "Authenticated users can view attendance sessions" (008)

DROP POLICY IF EXISTS "Teachers can manage own sessions" ON public.attendance_sessions;
DROP POLICY IF EXISTS "Advisors can view all sessions" ON public.attendance_sessions;
DROP POLICY IF EXISTS "Authenticated users can view attendance sessions" ON public.attendance_sessions;

-- Unified SELECT (008 allows all authenticated)
CREATE POLICY "Unified read access for attendance_sessions" ON public.attendance_sessions
    FOR SELECT
    TO authenticated
    USING (true);

-- Teacher Manage (Insert/Update/Delete)
-- Using optimized check
CREATE POLICY "Teachers can insert own sessions" ON public.attendance_sessions
    FOR INSERT TO authenticated
    WITH CHECK (
        teacher_id IN (
            SELECT id FROM public.teachers WHERE user_id = (select auth.uid())
        )
    );

CREATE POLICY "Teachers can update own sessions" ON public.attendance_sessions
    FOR UPDATE TO authenticated
    USING (
        teacher_id IN (
            SELECT id FROM public.teachers WHERE user_id = (select auth.uid())
        )
    );

CREATE POLICY "Teachers can delete own sessions" ON public.attendance_sessions
    FOR DELETE TO authenticated
    USING (
        teacher_id IN (
            SELECT id FROM public.teachers WHERE user_id = (select auth.uid())
        )
    );


-- ==============================================================================
-- 5. ATTENDANCE_RECORDS
-- ==============================================================================
-- Existing:
-- "Teachers can manage attendance records"
-- "Students can view own attendance"
-- "Advisors can view all attendance"

DROP POLICY IF EXISTS "Teachers can manage attendance records" ON public.attendance_records;
DROP POLICY IF EXISTS "Students can view own attendance" ON public.attendance_records;
DROP POLICY IF EXISTS "Advisors can view all attendance" ON public.attendance_records;

-- Unified SELECT
CREATE POLICY "Unified read access for attendance_records" ON public.attendance_records
    FOR SELECT
    TO authenticated
    USING (
        -- Student view own
        (student_id IN (SELECT id FROM public.students WHERE user_id = (select auth.uid())))
        OR
        -- Teacher view records for their sessions
        (session_id IN (
            SELECT id FROM public.attendance_sessions 
            WHERE teacher_id IN (SELECT id FROM public.teachers WHERE user_id = (select auth.uid()))
        ))
        OR
        -- Advisor view all
        (public.is_class_advisor())
        OR
        -- Admin (implicit if we add admin to unified, but currently admin uses service role or we can add is_admin here)
        (public.is_admin())
    );

-- Teacher Manage (Insert/Update/Delete)
CREATE POLICY "Teachers can insert attendance records" ON public.attendance_records
    FOR INSERT TO authenticated
    WITH CHECK (
        session_id IN (
            SELECT id FROM public.attendance_sessions 
            WHERE teacher_id IN (SELECT id FROM public.teachers WHERE user_id = (select auth.uid()))
        )
    );

CREATE POLICY "Teachers can update attendance records" ON public.attendance_records
    FOR UPDATE TO authenticated
    USING (
        session_id IN (
            SELECT id FROM public.attendance_sessions 
            WHERE teacher_id IN (SELECT id FROM public.teachers WHERE user_id = (select auth.uid()))
        )
    );
    
CREATE POLICY "Teachers can delete attendance records" ON public.attendance_records
    FOR DELETE TO authenticated
    USING (
        session_id IN (
            SELECT id FROM public.attendance_sessions 
            WHERE teacher_id IN (SELECT id FROM public.teachers WHERE user_id = (select auth.uid()))
        )
    );


-- ==============================================================================
-- 6. CLASS_ADVISORS
-- ==============================================================================
-- Existing:
-- "Advisors can view own record"
-- "Admin can manage advisors"

DROP POLICY IF EXISTS "Advisors can view own record" ON public.class_advisors;
DROP POLICY IF EXISTS "Admin can manage advisors" ON public.class_advisors;

-- Unified SELECT
CREATE POLICY "Unified read access for class_advisors" ON public.class_advisors
    FOR SELECT
    TO authenticated
    USING (
        -- Advisor view own
        (user_id = (select auth.uid()))
        OR
        -- Admin view all
        (public.is_admin())
    );

-- Admin Manage
CREATE POLICY "Admin can insert class_advisors" ON public.class_advisors FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admin can update class_advisors" ON public.class_advisors FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admin can delete class_advisors" ON public.class_advisors FOR DELETE TO authenticated USING (public.is_admin());


-- ==============================================================================
-- 7. OTHER ADMIN TABLES (Departments, Subjects, Allocations, Timetable)
-- ==============================================================================
-- Departments
DROP POLICY IF EXISTS "Admin can manage departments" ON public.departments;
-- "Authenticated users can view departments" is fine as is (006), just need to separate admin manage
CREATE POLICY "Admin can insert departments" ON public.departments FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admin can update departments" ON public.departments FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admin can delete departments" ON public.departments FOR DELETE TO authenticated USING (public.is_admin());

-- Subjects
DROP POLICY IF EXISTS "Admin can manage subjects" ON public.subjects;
CREATE POLICY "Admin can insert subjects" ON public.subjects FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admin can update subjects" ON public.subjects FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admin can delete subjects" ON public.subjects FOR DELETE TO authenticated USING (public.is_admin());

-- Allocations
DROP POLICY IF EXISTS "Admin can manage allocations" ON public.teacher_subject_allocations;
CREATE POLICY "Admin can insert allocations" ON public.teacher_subject_allocations FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admin can update allocations" ON public.teacher_subject_allocations FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admin can delete allocations" ON public.teacher_subject_allocations FOR DELETE TO authenticated USING (public.is_admin());

-- Timetable
DROP POLICY IF EXISTS "Admin can manage slots" ON public.timetable_slots;
CREATE POLICY "Admin can insert slots" ON public.timetable_slots FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admin can update slots" ON public.timetable_slots FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admin can delete slots" ON public.timetable_slots FOR DELETE TO authenticated USING (public.is_admin());

