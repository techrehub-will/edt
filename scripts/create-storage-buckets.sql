-- Create storage buckets for file uploads
INSERT INTO storage.buckets (id, name, public, avif_autodetection)
VALUES ('attachments', 'attachments', true, false)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for attachments bucket
CREATE POLICY "Allow authenticated users to upload files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'attachments' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Allow users to update their own files"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'attachments' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Allow users to delete their own files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'attachments' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Allow users to view their own files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'attachments' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Allow public to view files"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'attachments');
