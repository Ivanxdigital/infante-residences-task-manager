-- Fix for infinite recursion in policies

-- First, drop the problematic policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Housekeepers can view their assigned tasks" ON tasks;
DROP POLICY IF EXISTS "Admins can view all tasks" ON tasks;
DROP POLICY IF EXISTS "Admins can insert tasks" ON tasks;
DROP POLICY IF EXISTS "Admins can update all tasks" ON tasks;
DROP POLICY IF EXISTS "Admins can delete tasks" ON tasks;

-- Create a function to check if a user is an admin without using policies
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM profiles WHERE id = user_id;
  RETURN user_role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the policies using the function instead of a subquery
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    auth.uid() = id OR is_admin(auth.uid())
  );

CREATE POLICY "Housekeepers can view their assigned tasks" ON tasks
  FOR SELECT USING (
    auth.uid() = assigned_to OR is_admin(auth.uid())
  );

CREATE POLICY "Admins can view all tasks" ON tasks
  FOR SELECT USING (
    is_admin(auth.uid())
  );

CREATE POLICY "Admins can insert tasks" ON tasks
  FOR INSERT WITH CHECK (
    is_admin(auth.uid())
  );

CREATE POLICY "Admins can update all tasks" ON tasks
  FOR UPDATE USING (
    is_admin(auth.uid())
  );

CREATE POLICY "Admins can delete tasks" ON tasks
  FOR DELETE USING (
    is_admin(auth.uid())
  );

-- Set your user as admin
UPDATE profiles SET role = 'admin' WHERE id = '5ceca34f-054d-4d80-ab0c-906a7ed7d3c2'; 