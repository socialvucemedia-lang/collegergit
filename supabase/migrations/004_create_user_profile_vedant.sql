-- Create User Profile for vedantchalke22@gmail.com
-- Run this in Supabase SQL Editor

-- Step 1: Create user profile
INSERT INTO public.users (id, email, role, full_name)
VALUES (
    '0861d37a-85be-4bc5-984a-d0112719ddff',
    'vedantchalke22@gmail.com',
    'student',
    'Vedant Chalke'
)
ON CONFLICT (id) DO UPDATE 
SET 
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    full_name = EXCLUDED.full_name;

-- Step 2: Create student record (optional but recommended)
-- Replace '201' with the actual roll number if you have one
INSERT INTO public.students (user_id, roll_number)
VALUES (
    '0861d37a-85be-4bc5-984a-d0112719ddff',
    '201'  -- Replace with your actual roll number
)
ON CONFLICT (user_id) DO UPDATE 
SET roll_number = EXCLUDED.roll_number;

-- Step 3: Verify the profile was created
SELECT 
    u.id,
    u.email,
    u.role,
    u.full_name,
    s.roll_number,
    CASE 
        WHEN s.id IS NOT NULL THEN '✅ Profile + Student Record'
        ELSE '⚠️  Profile Only (No Student Record)'
    END as status
FROM public.users u
LEFT JOIN public.students s ON u.id = s.user_id
WHERE u.email = 'vedantchalke22@gmail.com';
