# Fix "This account is registered as unknown" Error

This error occurs when a user exists in Supabase Auth but doesn't have a profile in the `public.users` table, or the profile has a NULL role.

## Quick Fix

### Step 1: Check Your User in Supabase

1. Go to **Supabase Dashboard** > **Authentication** > **Users**
2. Find your user (by email)
3. **Copy the User ID** (UUID)

### Step 2: Check if Profile Exists

Go to **SQL Editor** in Supabase and run:

```sql
SELECT * FROM public.users WHERE email = 'your@email.com';
```

If this returns no rows, you need to create the profile.

### Step 3: Create the Missing Profile

Run this SQL (replace with your actual values):

```sql
-- Replace these values:
-- - USER_ID: Paste the UUID from Step 1
-- - your@email.com: Your actual email
-- - student: Your actual role (student, teacher, advisor, or admin)

INSERT INTO public.users (id, email, role, full_name)
VALUES (
    'USER_ID',  -- Paste UUID from Authentication > Users
    'your@email.com',
    'student',  -- Change to your role: student, teacher, advisor, or admin
    'Your Name'
);
```

### Step 4: Verify the Profile

```sql
SELECT id, email, role, full_name FROM public.users WHERE email = 'your@email.com';
```

You should now see your user with the correct role.

### Step 5: Try Logging In Again

Go back to the login page and try again with the **correct role selected**.

## Automated Fix

Run this script in **SQL Editor** to automatically create profiles for all auth users without profiles:

```sql
DO $$
DECLARE
    auth_user RECORD;
BEGIN
    FOR auth_user IN 
        SELECT au.id, au.email, au.raw_user_meta_data
        FROM auth.users au
        LEFT JOIN public.users u ON au.id = u.id
        WHERE u.id IS NULL
    LOOP
        INSERT INTO public.users (id, email, role, full_name)
        VALUES (
            auth_user.id,
            auth_user.email,
            COALESCE((auth_user.raw_user_meta_data->>'role')::text, 'student'),
            COALESCE(auth_user.raw_user_meta_data->>'full_name', 'User')
        )
        ON CONFLICT (id) DO NOTHING;
    END LOOP;
END $$;
```

**Note:** This sets default role to 'student'. Update roles manually if needed.

## Fix NULL Roles

If your profile exists but role is NULL:

```sql
-- Check which users have NULL roles
SELECT id, email, role FROM public.users WHERE role IS NULL;

-- Fix a specific user's role (replace email and role)
UPDATE public.users 
SET role = 'student'  -- Change to: student, teacher, advisor, or admin
WHERE email = 'your@email.com';
```

## Verify Everything is Fixed

Run this query to see all users and their profiles:

```sql
SELECT 
    au.email,
    au.id as auth_id,
    u.id as profile_id,
    u.role,
    u.full_name,
    CASE 
        WHEN u.id IS NULL THEN '❌ Missing Profile'
        WHEN u.role IS NULL THEN '⚠️  NULL Role'
        ELSE '✅ OK'
    END as status
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
ORDER BY au.created_at DESC;
```

All users should show "✅ OK" status.

## Prevention

To prevent this in the future:

1. **Always create the profile when creating auth users** (see `SUPABASE_AUTH_SETUP.md`)
2. **Use the registration API** which creates both auth and profile automatically
3. **Run migrations in order** to ensure schema is correct

## Need Help?

If you're still having issues:

1. Check the browser console for detailed error messages
2. Verify your Supabase credentials in `.env.local`
3. Ensure RLS policies allow you to read your own profile
4. Check that the `users` table exists and has the correct schema
