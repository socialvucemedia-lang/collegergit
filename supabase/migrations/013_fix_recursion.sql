-- Create a secure function to check advisor status
-- SECURITY DEFINER means this runs with the permissions of the creator (admin), bypassing RLS on class_advisors
CREATE OR REPLACE FUNCTION public.is_class_advisor()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.class_advisors
    WHERE user_id = auth.uid()
  );
END;
$$;

-- Update Users Policy to use the function (Breaking the loop)
DROP POLICY IF EXISTS "Advisors can view student profiles" ON public.users;
CREATE POLICY "Advisors can view student profiles" ON public.users
    FOR SELECT USING (
        role = 'student'
        AND public.is_class_advisor()
    );
    
-- Update Students Policy for consistency/performance
DROP POLICY IF EXISTS "Advisors can view all students" ON public.students;
CREATE POLICY "Advisors can view all students" ON public.students
    FOR SELECT USING (
        public.is_class_advisor()
    );

-- Update Attendance Records Policy
DROP POLICY IF EXISTS "Advisors can view all attendance" ON public.attendance_records;
CREATE POLICY "Advisors can view all attendance" ON public.attendance_records
    FOR SELECT USING (
        public.is_class_advisor()
    );

-- Update Attendance Sessions Policy
DROP POLICY IF EXISTS "Advisors can view all sessions" ON public.attendance_sessions;
CREATE POLICY "Advisors can view all sessions" ON public.attendance_sessions
    FOR SELECT USING (
        public.is_class_advisor()
    );
