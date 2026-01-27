-- Seed Test Users
-- IMPORTANT: This script creates user profiles only
-- You MUST create the auth users in Supabase Dashboard first, then replace the UUIDs below

-- To use this script:
-- 1. Go to Supabase Dashboard > Authentication > Users
-- 2. Create users with these emails (check "Auto Confirm User" for testing)
-- 3. Copy the UUIDs from the created users
-- 4. Replace the UUIDs in this script with the actual ones
-- 5. Run this script in SQL Editor

-- Example test users (REPLACE UUIDs with actual ones from auth.users)

-- Admin user
-- Password: admin123 (create in Auth dashboard first)
DO $$
BEGIN
  -- Admin user profile
  INSERT INTO public.users (id, email, role, full_name)
  SELECT 'REPLACE_WITH_ADMIN_UUID', 'admin@mctrgit.ac.in', 'admin', 'Admin User'
  WHERE EXISTS (SELECT 1 FROM auth.users WHERE id = 'REPLACE_WITH_ADMIN_UUID')
  ON CONFLICT (id) DO NOTHING;

  -- Student user profile
  -- Password: student123 (create in Auth dashboard first)
  INSERT INTO public.users (id, email, role, full_name)
  SELECT 'REPLACE_WITH_STUDENT_UUID', 'student@mctrgit.ac.in', 'student', 'Test Student'
  WHERE EXISTS (SELECT 1 FROM auth.users WHERE id = 'REPLACE_WITH_STUDENT_UUID')
  ON CONFLICT (id) DO NOTHING;

  -- Teacher user profile
  -- Password: teacher123 (create in Auth dashboard first)
  INSERT INTO public.users (id, email, role, full_name)
  SELECT 'REPLACE_WITH_TEACHER_UUID', 'teacher@mctrgit.ac.in', 'teacher', 'Test Teacher'
  WHERE EXISTS (SELECT 1 FROM auth.users WHERE id = 'REPLACE_WITH_TEACHER_UUID')
  ON CONFLICT (id) DO NOTHING;

  -- Advisor user profile
  -- Password: advisor123 (create in Auth dashboard first)
  INSERT INTO public.users (id, email, role, full_name)
  SELECT 'REPLACE_WITH_ADVISOR_UUID', 'advisor@mctrgit.ac.in', 'advisor', 'Test Advisor'
  WHERE EXISTS (SELECT 1 FROM auth.users WHERE id = 'REPLACE_WITH_ADVISOR_UUID')
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Create student record for student user
INSERT INTO public.students (user_id, roll_number)
SELECT id, '201' FROM public.users WHERE email = 'student@mctrgit.ac.in'
ON CONFLICT DO NOTHING;

-- Create teacher record for teacher user
INSERT INTO public.teachers (user_id, employee_id)
SELECT id, 'EMP001' FROM public.users WHERE email = 'teacher@mctrgit.ac.in'
ON CONFLICT DO NOTHING;
