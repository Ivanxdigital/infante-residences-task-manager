-- Create a table for rooms/categories
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all users to view rooms
CREATE POLICY "Users can view rooms" ON rooms
  FOR SELECT USING (true);

-- Create policy to allow admins to insert rooms
CREATE POLICY "Admins can insert rooms" ON rooms
  FOR INSERT WITH CHECK (
    is_admin(auth.uid())
  );

-- Create policy to allow admins to update rooms
CREATE POLICY "Admins can update rooms" ON rooms
  FOR UPDATE USING (
    is_admin(auth.uid())
  );

-- Create policy to allow admins to delete rooms
CREATE POLICY "Admins can delete rooms" ON rooms
  FOR DELETE USING (
    is_admin(auth.uid())
  );

-- Create a trigger to update the updated_at timestamp
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_rooms_updated_at') THEN
    CREATE TRIGGER update_rooms_updated_at
    BEFORE UPDATE ON rooms
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

-- Add room_id column to tasks table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.columns 
                WHERE table_name = 'tasks' AND column_name = 'room_id') THEN
    ALTER TABLE tasks ADD COLUMN room_id UUID REFERENCES rooms(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Insert some default rooms
INSERT INTO rooms (name, description, created_by)
SELECT 
  name, 
  description, 
  (SELECT id FROM auth.users ORDER BY created_at LIMIT 1)
FROM (
  VALUES 
    ('Master Bedroom', 'Primary bedroom suite'),
    ('Kitchen', 'Kitchen and dining area'),
    ('Living Room', 'Main living area'),
    ('Bathroom', 'Bathroom and shower'),
    ('Guest Room', 'Guest bedroom')
) AS default_rooms(name, description)
WHERE NOT EXISTS (SELECT 1 FROM rooms LIMIT 1); 