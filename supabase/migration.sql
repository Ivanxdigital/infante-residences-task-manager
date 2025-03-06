-- Migration script to update existing tables

-- Check if the profiles table exists, if not create it
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'housekeeper' CHECK (role IN ('housekeeper', 'admin')),
  full_name TEXT,
  push_token TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add push_token column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.columns 
                WHERE table_name = 'profiles' AND column_name = 'push_token') THEN
    ALTER TABLE profiles ADD COLUMN push_token TEXT;
  END IF;
END $$;

-- Enable Row Level Security on profiles if not already enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Add policies to profiles table (these will be skipped if they already exist)
DO $$
BEGIN
  BEGIN
    CREATE POLICY "Users can view their own profile" ON profiles
      FOR SELECT USING (auth.uid() = id);
  EXCEPTION
    WHEN duplicate_object THEN
      RAISE NOTICE 'Policy "Users can view their own profile" already exists';
  END;

  BEGIN
    CREATE POLICY "Users can update their own profile" ON profiles
      FOR UPDATE USING (auth.uid() = id);
  EXCEPTION
    WHEN duplicate_object THEN
      RAISE NOTICE 'Policy "Users can update their own profile" already exists';
  END;

  BEGIN
    CREATE POLICY "Admins can view all profiles" ON profiles
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
        )
      );
  EXCEPTION
    WHEN duplicate_object THEN
      RAISE NOTICE 'Policy "Admins can view all profiles" already exists';
  END;
END $$;

-- Check if the tasks table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tasks') THEN
    -- Table exists, check if columns need to be added
    
    -- Add notes column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                  WHERE table_name = 'tasks' AND column_name = 'notes') THEN
      ALTER TABLE tasks ADD COLUMN notes TEXT;
    END IF;
    
    -- Add assigned_to column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                  WHERE table_name = 'tasks' AND column_name = 'assigned_to') THEN
      ALTER TABLE tasks ADD COLUMN assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
    
    -- Rename user_id to created_by if user_id exists and created_by doesn't
    IF EXISTS (SELECT FROM information_schema.columns 
              WHERE table_name = 'tasks' AND column_name = 'user_id') 
       AND NOT EXISTS (SELECT FROM information_schema.columns 
                      WHERE table_name = 'tasks' AND column_name = 'created_by') THEN
      ALTER TABLE tasks RENAME COLUMN user_id TO created_by;
    END IF;
    
  ELSE
    -- Table doesn't exist, create it
    CREATE TABLE tasks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title TEXT NOT NULL,
      description TEXT,
      priority TEXT CHECK (priority IN ('low', 'medium', 'high')),
      completed BOOLEAN DEFAULT FALSE,
      estimated_time TEXT,
      notes TEXT,
      assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE
    );
  END IF;
END $$;

-- Enable Row Level Security on tasks if not already enabled
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies on tasks to avoid conflicts
DO $$
BEGIN
  BEGIN
    DROP POLICY IF EXISTS "Users can view their own tasks" ON tasks;
  EXCEPTION
    WHEN undefined_object THEN
      RAISE NOTICE 'Policy "Users can view their own tasks" does not exist';
  END;
  
  BEGIN
    DROP POLICY IF EXISTS "Users can insert their own tasks" ON tasks;
  EXCEPTION
    WHEN undefined_object THEN
      RAISE NOTICE 'Policy "Users can insert their own tasks" does not exist';
  END;
  
  BEGIN
    DROP POLICY IF EXISTS "Users can update their own tasks" ON tasks;
  EXCEPTION
    WHEN undefined_object THEN
      RAISE NOTICE 'Policy "Users can update their own tasks" does not exist';
  END;
  
  BEGIN
    DROP POLICY IF EXISTS "Users can delete their own tasks" ON tasks;
  EXCEPTION
    WHEN undefined_object THEN
      RAISE NOTICE 'Policy "Users can delete their own tasks" does not exist';
  END;
END $$;

-- Add new policies to tasks table
DO $$
BEGIN
  BEGIN
    CREATE POLICY "Housekeepers can view their assigned tasks" ON tasks
      FOR SELECT USING (
        auth.uid() = assigned_to OR
        EXISTS (
          SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
        )
      );
  EXCEPTION
    WHEN duplicate_object THEN
      RAISE NOTICE 'Policy "Housekeepers can view their assigned tasks" already exists';
  END;

  BEGIN
    CREATE POLICY "Housekeepers can update their assigned tasks" ON tasks
      FOR UPDATE USING (
        auth.uid() = assigned_to
      );
  EXCEPTION
    WHEN duplicate_object THEN
      RAISE NOTICE 'Policy "Housekeepers can update their assigned tasks" already exists';
  END;

  BEGIN
    CREATE POLICY "Admins can view all tasks" ON tasks
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
        )
      );
  EXCEPTION
    WHEN duplicate_object THEN
      RAISE NOTICE 'Policy "Admins can view all tasks" already exists';
  END;

  BEGIN
    CREATE POLICY "Admins can insert tasks" ON tasks
      FOR INSERT WITH CHECK (
        EXISTS (
          SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
        )
      );
  EXCEPTION
    WHEN duplicate_object THEN
      RAISE NOTICE 'Policy "Admins can insert tasks" already exists';
  END;

  BEGIN
    CREATE POLICY "Admins can update all tasks" ON tasks
      FOR UPDATE USING (
        EXISTS (
          SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
        )
      );
  EXCEPTION
    WHEN duplicate_object THEN
      RAISE NOTICE 'Policy "Admins can update all tasks" already exists';
  END;

  BEGIN
    CREATE POLICY "Admins can delete tasks" ON tasks
      FOR DELETE USING (
        EXISTS (
          SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
        )
      );
  EXCEPTION
    WHEN duplicate_object THEN
      RAISE NOTICE 'Policy "Admins can delete tasks" already exists';
  END;
END $$;

-- Create or replace the update_updated_at function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers if they don't exist
DO $$
BEGIN
  -- Check if the trigger exists for tasks
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_tasks_updated_at') THEN
    CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
  END IF;
  
  -- Check if the trigger exists for profiles
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_profiles_updated_at') THEN
    CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

-- Create or replace the handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name)
  VALUES (new.id, 'housekeeper', new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger if it doesn't exist
DO $$
BEGIN
  -- Check if the trigger exists
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
    CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;

-- Create profiles for existing users if they don't have one
INSERT INTO profiles (id, role, full_name, created_at, updated_at)
SELECT 
  id, 
  'housekeeper', 
  raw_user_meta_data->>'full_name', 
  created_at, 
  created_at
FROM 
  auth.users u
WHERE 
  NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = u.id);

-- Set the first user as admin (optional, uncomment if needed)
-- UPDATE profiles SET role = 'admin' WHERE id IN (SELECT id FROM auth.users ORDER BY created_at LIMIT 1);

-- Set specific user as admin
UPDATE profiles SET role = 'admin' WHERE id = '5ceca34f-054d-4d80-ab0c-906a7ed7d3c2'; 