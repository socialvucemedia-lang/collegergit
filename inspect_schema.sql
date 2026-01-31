
-- Check user_role enum
SELECT t.typname, e.enumlabel
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typname = 'user_role';

-- Check public.users table structure
SELECT column_name, data_type, udt_name, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'users';

-- Check if trigger exists
SELECT trigger_name, event_manipulation, event_object_table, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'users' 
   OR event_object_table = 'auth.users';
