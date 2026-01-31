-- Ensure RLS is enabled on class_advisors
ALTER TABLE public.class_advisors ENABLE ROW LEVEL SECURITY;

-- Allow Advisors to view their own record
DROP POLICY IF EXISTS "Advisors can view own record" ON public.class_advisors;
CREATE POLICY "Advisors can view own record" ON public.class_advisors
    FOR SELECT USING (user_id = auth.uid());

-- Allow Admins to manage all advisors
DROP POLICY IF EXISTS "Admin can manage advisors" ON public.class_advisors;
CREATE POLICY "Admin can manage advisors" ON public.class_advisors
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
