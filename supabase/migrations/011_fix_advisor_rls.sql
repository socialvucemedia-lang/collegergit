-- Fix RLS: Allow Advisors to view all students
DROP POLICY IF EXISTS "Advisors can view all students" ON public.students;
CREATE POLICY "Advisors can view all students" ON public.students
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.class_advisors
            WHERE user_id = auth.uid()
        )
    );

-- Fix RLS: Allow Advisors to view student names (in users table)
DROP POLICY IF EXISTS "Advisors can view student profiles" ON public.users;
CREATE POLICY "Advisors can view student profiles" ON public.users
    FOR SELECT USING (
        role = 'student'
        AND (
            EXISTS (
                SELECT 1 FROM public.class_advisors
                WHERE user_id = auth.uid()
            )
        )
    );

-- Fix RLS: Allow Advisors to view attendance records
DROP POLICY IF EXISTS "Advisors can view all attendance" ON public.attendance_records;
CREATE POLICY "Advisors can view all attendance" ON public.attendance_records
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.class_advisors
            WHERE user_id = auth.uid()
        )
    );

-- Fix RLS: Allow Advisors to view attendance sessions
DROP POLICY IF EXISTS "Advisors can view all sessions" ON public.attendance_sessions;
CREATE POLICY "Advisors can view all sessions" ON public.attendance_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.class_advisors
            WHERE user_id = auth.uid()
        )
    );
