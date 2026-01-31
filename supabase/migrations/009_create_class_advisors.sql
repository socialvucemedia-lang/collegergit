-- Create class_advisors table
CREATE TABLE IF NOT EXISTS public.class_advisors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    section TEXT,
    semester INTEGER,
    academic_year TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- RLS
ALTER TABLE public.class_advisors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Advisors can view own record" ON public.class_advisors
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admin can manage advisors" ON public.class_advisors
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Trigger for updated_at
CREATE TRIGGER update_class_advisors_updated_at BEFORE UPDATE ON public.class_advisors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- SEED YOUR USER (Run this if you want to become an advisor for testing)
-- User ID from logs: 9d043447-7f11-4bc4-961a-e58ff4cc54c2
-- Assuming Department ID exists? We might need to fetch one.
-- For now, we will just set department_id to NULL or handle logic to find one.

INSERT INTO public.users (id, email, role, full_name)
VALUES (
  '9d043447-7f11-4bc4-961a-e58ff4cc54c2', 
  'advisor@example.com', 
  'advisor', 
  'Test Advisor'
) ON CONFLICT (id) DO UPDATE SET role = 'advisor';

INSERT INTO public.class_advisors (user_id, section, semester, academic_year)
VALUES (
  '9d043447-7f11-4bc4-961a-e58ff4cc54c2',
  'B',
  2,
  '2025-26'
) ON CONFLICT (user_id) DO UPDATE SET 
    section = 'B',
    semester = 2;
