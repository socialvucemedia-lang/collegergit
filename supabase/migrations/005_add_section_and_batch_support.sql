-- Migration 005: Add support for granular allocation (Batch)
-- This fixes the 500 error in Faculty Allocation creation

-- 1. Add batch column to teacher_subject_allocations
ALTER TABLE public.teacher_subject_allocations 
ADD COLUMN IF NOT EXISTS batch TEXT;

-- 2. Update unique constraint on teacher_subject_allocations
-- First drop existing unique constraint
ALTER TABLE public.teacher_subject_allocations 
DROP CONSTRAINT IF EXISTS teacher_subject_allocations_teacher_id_subject_id_secti_key;

-- Then add new one including batch
-- We use COALESCE because batch can be NULL for "Entire Section"
ALTER TABLE public.teacher_subject_allocations 
ADD CONSTRAINT teacher_subject_allocations_unique_entry 
UNIQUE (teacher_id, subject_id, section, academic_year, batch);

-- 3. Add section and batch to attendance_sessions
ALTER TABLE public.attendance_sessions 
ADD COLUMN IF NOT EXISTS section TEXT,
ADD COLUMN IF NOT EXISTS batch TEXT;

-- 4. Add batch to timetable_slots
ALTER TABLE public.timetable_slots 
ADD COLUMN IF NOT EXISTS batch TEXT;

-- 5. Add section and batch to students for targeted attendance
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS section TEXT,
ADD COLUMN IF NOT EXISTS batch TEXT;
