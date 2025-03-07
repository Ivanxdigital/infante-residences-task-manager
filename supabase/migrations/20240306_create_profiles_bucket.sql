-- Create a storage bucket for profile pictures if it doesn't exist
DO $$
BEGIN
    -- Check if the bucket already exists
    IF NOT EXISTS (
        SELECT 1 FROM storage.buckets WHERE id = 'profiles'
    ) THEN
        -- Create the bucket
        INSERT INTO storage.buckets (id, name, public)
        VALUES ('profiles', 'profiles', true);
        
        -- Set up security policies for the profiles bucket
        -- Allow public access to view profile pictures
        BEGIN
            CREATE POLICY "Public Access" ON storage.objects
              FOR SELECT
              USING (bucket_id = 'profiles');
        EXCEPTION WHEN duplicate_object THEN
            -- Policy already exists, ignore
        END;

        -- Allow authenticated users to upload their own profile pictures
        BEGIN
            CREATE POLICY "Authenticated users can upload" ON storage.objects
              FOR INSERT
              TO authenticated
              WITH CHECK (bucket_id = 'profiles' AND (storage.foldername(name))[1] = 'avatars');
        EXCEPTION WHEN duplicate_object THEN
            -- Policy already exists, ignore
        END;

        -- Allow users to update their own profile pictures
        BEGIN
            CREATE POLICY "Users can update own profile pictures" ON storage.objects
              FOR UPDATE
              TO authenticated
              USING (bucket_id = 'profiles' AND (storage.foldername(name))[1] = 'avatars');
        EXCEPTION WHEN duplicate_object THEN
            -- Policy already exists, ignore
        END;

        -- Allow users to delete their own profile pictures
        BEGIN
            CREATE POLICY "Users can delete own profile pictures" ON storage.objects
              FOR DELETE
              TO authenticated
              USING (bucket_id = 'profiles' AND (storage.foldername(name))[1] = 'avatars');
        EXCEPTION WHEN duplicate_object THEN
            -- Policy already exists, ignore
        END;
    END IF;
END
$$; 