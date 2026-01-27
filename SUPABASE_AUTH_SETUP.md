# Setting Up Login Credentials

This guide explains how to create user accounts and get login credentials for the attendance system.

## Method 1: Create Users via Supabase Dashboard (Recommended for Testing)

### Step 1: Create Auth Users in Supabase

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** > **Users**
3. Click **Add User** or **Invite User**
4. Enter:
   - **Email**: e.g., `admin@mctrgit.ac.in`
   - **Password**: Create a secure password
   - **Auto Confirm User**: Check this to skip email confirmation (for testing)
5. Click **Create User**

### Step 2: Create User Profile in Database

After creating the auth user, you need to create the corresponding profile in the `users` table.

Go to **SQL Editor** in Supabase and run:

```sql
-- Get the user ID from Authentication > Users (copy the UUID)
-- Replace 'YOUR_USER_ID_HERE' with the actual user ID from step 1

-- Example: Create an admin user
INSERT INTO public.users (id, email, role, full_name)
VALUES (
  'YOUR_USER_ID_HERE',  -- Get this from Auth > Users
  'admin@mctrgit.ac.in',
  'admin',
  'Admin User'
);

-- Example: Create a student user
INSERT INTO public.users (id, email, role, full_name)
VALUES (
  'STUDENT_USER_ID_HERE',
  'student@mctrgit.ac.in',
  'student',
  'John Doe'
);

-- Example: Create a teacher user
INSERT INTO public.users (id, email, role, full_name)
VALUES (
  'TEACHER_USER_ID_HERE',
  'teacher@mctrgit.ac.in',
  'teacher',
  'Jane Smith'
);
```

### Step 3: Create Role-Specific Records (Optional)

If needed, create additional records:

```sql
-- For students: Create student record
INSERT INTO public.students (user_id, roll_number, department_id)
VALUES (
  'STUDENT_USER_ID_HERE',
  '201',
  NULL  -- Or set a department_id if you have departments
);

-- For teachers: Create teacher record
INSERT INTO public.teachers (user_id, employee_id, department_id)
VALUES (
  'TEACHER_USER_ID_HERE',
  'EMP001',
  NULL  -- Or set a department_id if you have departments
);
```

## Method 2: Use the Registration API Endpoint

You can register new users via the API endpoint:

```bash
# Register a new admin user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@mctrgit.ac.in",
    "password": "your_password_here",
    "full_name": "Admin User",
    "role": "admin"
  }'

# Register a new student
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@mctrgit.ac.in",
    "password": "your_password_here",
    "full_name": "John Doe",
    "role": "student",
    "roll_number": "201"
  }'

# Register a new teacher
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@mctrgit.ac.in",
    "password": "your_password_here",
    "full_name": "Jane Smith",
    "role": "teacher",
    "employee_id": "EMP001"
  }'
```

## Method 3: Seed Test Data (SQL Script)

Create a SQL script to seed test users:

```sql
-- First, create auth users in Supabase Dashboard
-- Then run this script to create profiles

-- Replace these UUIDs with actual user IDs from Authentication > Users
DO $$
DECLARE
  admin_id UUID;
  student_id UUID;
  teacher_id UUID;
  advisor_id UUID;
BEGIN
  -- Get or create user IDs (you need to create these in Auth first)
  -- For now, we'll use placeholders - REPLACE THESE with actual UUIDs
  
  -- Admin User (create in Auth dashboard first, then copy UUID here)
  admin_id := '00000000-0000-0000-0000-000000000001';  -- REPLACE
  
  -- Student User
  student_id := '00000000-0000-0000-0000-000000000002';  -- REPLACE
  
  -- Teacher User
  teacher_id := '00000000-0000-0000-0000-000000000003';  -- REPLACE
  
  -- Advisor User
  advisor_id := '00000000-0000-0000-0000-000000000004';  -- REPLACE

  -- Insert user profiles
  INSERT INTO public.users (id, email, role, full_name)
  VALUES
    (admin_id, 'admin@mctrgit.ac.in', 'admin', 'Admin User'),
    (student_id, 'student@mctrgit.ac.in', 'student', 'Test Student'),
    (teacher_id, 'teacher@mctrgit.ac.in', 'teacher', 'Test Teacher'),
    (advisor_id, 'advisor@mctrgit.ac.in', 'advisor', 'Test Advisor')
  ON CONFLICT (id) DO NOTHING;

  -- Create student record
  INSERT INTO public.students (user_id, roll_number)
  VALUES (student_id, '201')
  ON CONFLICT DO NOTHING;

  -- Create teacher record
  INSERT INTO public.teachers (user_id, employee_id)
  VALUES (teacher_id, 'EMP001')
  ON CONFLICT DO NOTHING;

END $$;
```

## Quick Test Credentials Setup

### Step 1: Create Auth User in Supabase Dashboard

1. Go to **Authentication** > **Users** > **Add User**
2. Email: `admin@mctrgit.ac.in`
3. Password: `admin123` (or your choice)
4. **Auto Confirm User**: ✅ Check this
5. Click **Create User**
6. **Copy the User ID** (UUID) - you'll need this

### Step 2: Create User Profile

In **SQL Editor**, run (replace `USER_ID` with the UUID you copied):

```sql
INSERT INTO public.users (id, email, role, full_name)
VALUES (
  'USER_ID',  -- Paste the UUID from step 1
  'admin@mctrgit.ac.in',
  'admin',
  'Admin User'
);
```

### Step 3: Login

Now you can login at `/login`:
- **Email**: `admin@mctrgit.ac.in`
- **Password**: `admin123` (or what you set)
- **Role**: Select "Admin"

## Important Notes

1. **Email Confirmation**: 
   - If email confirmation is enabled in Supabase, users need to confirm their email
   - For testing, disable it in **Authentication** > **Settings** > **Email Auth** > **Enable email confirmations** (uncheck)

2. **Password Requirements**:
   - Supabase default: minimum 6 characters
   - Can be changed in **Authentication** > **Settings**

3. **User ID Matching**:
   - The `id` in the `users` table MUST match the UUID from `auth.users`
   - This is how the system links authentication to user profiles

4. **Role Verification**:
   - Users can only access dashboards matching their role
   - A user with role `student` cannot access `/admin` even if authenticated

## Troubleshooting

### "User not found" error
- Make sure the user exists in `auth.users` (check Authentication dashboard)
- Make sure the profile exists in `public.users` table

### "Role mismatch" error
- Verify the `role` in `public.users` matches what you selected at login
- Check: `SELECT * FROM public.users WHERE email = 'your@email.com';`

### "Invalid credentials" error
- Verify email and password in Authentication dashboard
- Make sure the user is confirmed (check "Auto Confirm User" when creating)

### Can't see user in database
- Make sure you created the profile in `public.users` table
- The auth user and profile user are separate - both need to exist

## Security Best Practices

For production:
- Use strong, unique passwords
- Enable email confirmation
- Enable MFA (Multi-Factor Authentication)
- Use environment-specific user creation scripts
- Never commit real credentials to version control
