-- Fix Missing User Profiles
-- This script helps identify and fix users that exist in auth.users but don't have profiles in public.users

-- Step 1: Check for users without profiles
-- Run this query to see which auth users are missing profiles:
SELECT 
    au.id,
    au.email,
    au.created_at as auth_created_at,
    CASE 
        WHEN u.id IS NULL THEN 'MISSING PROFILE'
        ELSE 'PROFILE EXISTS'
    END as profile_status,
    u.role as current_role
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
ORDER BY au.created_at DESC;

-- Step 2: Create missing profiles for auth users
-- WARNING: This will create profiles with default 'student' role
-- You should manually set the correct role after running this
DO $$
DECLARE
    auth_user RECORD;
BEGIN
    -- Loop through auth users without profiles
    FOR auth_user IN 
        SELECT au.id, au.email, au.raw_user_meta_data
        FROM auth.users au
        LEFT JOIN public.users u ON au.id = u.id
        WHERE u.id IS NULL
    LOOP
        -- Create profile with role from metadata or default to 'student'
        INSERT INTO public.users (id, email, role, full_name)
        VALUES (
            auth_user.id,
            auth_user.email,
            COALESCE((auth_user.raw_user_meta_data->>'role')::text, 'student'),
            COALESCE(auth_user.raw_user_meta_data->>'full_name', 'User')
        )
        ON CONFLICT (id) DO NOTHING;
        
        RAISE NOTICE 'Created profile for user: % (%)', auth_user.email, auth_user.id;
    END LOOP;
END $$;

-- Step 3: Check for profiles with NULL role
-- Run this to see users with NULL roles:
SELECT id, email, role, full_name, created_at
FROM public.users
WHERE role IS NULL;

-- Step 4: Fix NULL roles (set to 'student' by default)
-- CAUTION: Review and set appropriate roles before running this
-- UPDATE public.users SET role = 'student' WHERE role IS NULL;

-- Step 5: Verify all users have profiles
-- This query should return 0 rows if all users have profiles:
SELECT au.id, au.email
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
WHERE u.id IS NULL;
