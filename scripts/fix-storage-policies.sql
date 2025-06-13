-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to upload files" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own files" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to view their own files" ON storage.objects;
DROP POLICY IF EXISTS "Allow public to view files" ON storage.objects;

-- Create more permissive storage policies for the attachments bucket
CREATE POLICY "Allow authenticated users to upload files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'attachments');

CREATE POLICY "Allow authenticated users to update files"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'attachments');

CREATE POLICY "Allow authenticated users to delete files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'attachments');

CREATE POLICY "Allow authenticated users to view files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'attachments');

CREATE POLICY "Allow public to view files"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'attachments');

-- Ensure the attachments bucket exists and is public
INSERT INTO storage.buckets (id, name, public, avif_autodetection)
VALUES ('attachments', 'attachments', true, false)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  avif_autodetection = false;
