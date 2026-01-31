-- Fix Trigger: Ensure it is on auth.users, NOT public.users
-- The previous migration might have accidentally created it on public.users due to search_path or ambiguity.

-- 1. Drop the incorrect trigger on public.users if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON public.users;

-- 2. Drop the trigger on auth.users to be clean
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 3. Re-create the function (safe to replace)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'student')
  )
  ON CONFLICT (id) DO NOTHING; -- Add safety
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Re-create the trigger explicitly on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
