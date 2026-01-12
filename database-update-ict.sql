-- ================================================================================
-- ICT EQUIPMENT SYSTEM - DATABASE UPDATE SCRIPT
-- ================================================================================
-- Run this in your Supabase SQL Editor to update the system
-- ================================================================================

-- 1. Update existing status values to new 3-status system
-- Convert all rejected/incomplete statuses to 'Tidak Berjaya'
UPDATE applications 
SET status = 'Tidak Berjaya' 
WHERE status IN ('Ditolak', 'Tidak Lengkap');

-- 2. Update any 'Sedia Diambil' or 'Telah Diambil' to 'Diluluskan'
UPDATE applications 
SET status = 'Diluluskan' 
WHERE status IN ('Sedia Diambil', 'Telah Diambil');

-- 3. Add constraint to enforce only 3 status values
-- Note: This will prevent any other status values from being inserted
ALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_status_check;
ALTER TABLE applications ADD CONSTRAINT applications_status_check 
CHECK (status IN ('Dalam Proses', 'Diluluskan', 'Tidak Berjaya'));

-- ================================================================================
-- STORAGE BUCKET SETUP
-- ================================================================================
-- You need to create the storage bucket manually in Supabase Dashboard:
-- 1. Go to Storage in your Supabase Dashboard
-- 2. Click "New Bucket"
-- 3. Name it: "documents"
-- 4. Set it to PUBLIC (so files can be accessed via URL)
-- 5. Click "Create Bucket"
--
-- OR run this SQL if you have the storage extension enabled:
-- ================================================================================

-- Create storage bucket for documents (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for the documents bucket
CREATE POLICY IF NOT EXISTS "Allow public read access to documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'documents');

CREATE POLICY IF NOT EXISTS "Allow authenticated uploads to documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'documents');

CREATE POLICY IF NOT EXISTS "Allow public uploads to documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'documents');

-- ================================================================================
-- VERIFICATION
-- ================================================================================
-- Run these queries to verify the changes:

-- Check status distribution
SELECT status, COUNT(*) as count 
FROM applications 
GROUP BY status 
ORDER BY count DESC;

-- Check if bucket exists
SELECT * FROM storage.buckets WHERE id = 'documents';

-- ================================================================================
-- COMPLETE!
-- ================================================================================
