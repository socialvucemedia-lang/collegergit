-- Migration 017: Optimize Indices for Foreign Keys
-- Fixes "Unindexed foreign keys" warnings by adding covering indices

-- 1. class_advisors (department_id)
CREATE INDEX IF NOT EXISTS idx_class_advisors_department_id ON public.class_advisors(department_id);

-- 2. students (department_id)
CREATE INDEX IF NOT EXISTS idx_students_department_id ON public.students(department_id);

-- 3. subjects (department_id)
CREATE INDEX IF NOT EXISTS idx_subjects_department_id ON public.subjects(department_id);

-- 4. teachers (department_id)
CREATE INDEX IF NOT EXISTS idx_teachers_department_id ON public.teachers(department_id);

-- 5. teacher_subject_allocations (subject_id)
CREATE INDEX IF NOT EXISTS idx_teacher_subject_allocations_subject_id ON public.teacher_subject_allocations(subject_id);
