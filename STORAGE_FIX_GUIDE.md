# 🔧 Storage Document Upload Fix Guide

## Masalah
Dokumen tidak dapat dimuat naik dan menunjukkan "Upload failed" dalam admin panel.

## Punca Masalah
Storage bucket "documents" wujud tetapi **policies tidak betul** atau tidak lengkap.

---

## ✅ Penyelesaian: Run SQL Script

### Langkah 1: Buka Supabase Dashboard
1. Pergi ke [Supabase Dashboard](https://supabase.com/dashboard)
2. Pilih project anda
3. Klik **SQL Editor** di sidebar kiri

### Langkah 2: Run SQL Script
Copy dan paste SQL di bawah ke dalam SQL Editor, kemudian klik **RUN**:

```sql
-- ================================================================================
-- FIX STORAGE POLICIES FOR DOCUMENTS BUCKET
-- ================================================================================

-- 1. Drop all existing policies (clean slate)
DROP POLICY IF EXISTS "Allow public read access to documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow public uploads to documents" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Enable insert for all users" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for documents bucket" ON storage.objects;
DROP POLICY IF EXISTS "Public insert access for documents bucket" ON storage.objects;
DROP POLICY IF EXISTS "Public update access for documents bucket" ON storage.objects;
DROP POLICY IF EXISTS "Public delete access for documents bucket" ON storage.objects;

-- 2. Create new policies with correct permissions
-- Allow anyone to READ files
CREATE POLICY "Public read access for documents bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'documents');

-- Allow anyone to UPLOAD files
CREATE POLICY "Public insert access for documents bucket"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'documents');

-- Allow anyone to UPDATE files
CREATE POLICY "Public update access for documents bucket"
ON storage.objects FOR UPDATE
USING (bucket_id = 'documents');

-- Allow anyone to DELETE files (for admin cleanup)
CREATE POLICY "Public delete access for documents bucket"
ON storage.objects FOR DELETE
USING (bucket_id = 'documents');

-- 3. Verify bucket is PUBLIC
UPDATE storage.buckets 
SET public = true 
WHERE id = 'documents';
```

### Langkah 3: Verify Policies
Run query ini untuk check policies sudah betul:

```sql
-- Check all policies for documents bucket
SELECT * 
FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%documents%';

-- Check bucket settings
SELECT id, name, public 
FROM storage.buckets 
WHERE id = 'documents';
```

**Expected result:**
- Bucket `documents` dengan `public = true`
- 4 policies: read, insert, update, delete

---

## 🧪 Test Upload

### Langkah 4: Test di Application
1. Pergi ke halaman **Pendaftaran Baharu** (http://localhost:3000/pendaftaran)
2. Isi semua maklumat
3. Upload dokumen (pastikan < 5MB)
4. Submit form
5. Check browser console (F12) untuk error messages

### Langkah 5: Check Admin Panel
1. Login ke admin panel
2. Klik butang mata (👁️) untuk view permohonan
3. Scroll ke bawah ke bahagian "Dokumen Yang Dimuat Naik"
4. Sepatutnya dapat lihat dokumen dengan link yang boleh diklik

---

## 🐛 Troubleshooting

### Jika masih "Upload failed":

#### Check 1: Browser Console
Buka browser console (F12) dan check error message:
- Jika error: **"new row violates row-level security policy"** → Policies tidak betul
- Jika error: **"Bucket not found"** → Bucket tidak wujud
- Jika error: **"File size too large"** → File > 5MB

#### Check 2: Supabase Storage Policies
Di Supabase Dashboard:
1. Pergi ke **Storage** → **Policies**
2. Pastikan ada 4 policies untuk bucket "documents"
3. Semua policies mesti **ENABLED**

#### Check 3: Bucket Settings
Di Supabase Dashboard:
1. Pergi ke **Storage** → **documents** bucket
2. Click settings (gear icon)
3. Pastikan:
   - **Public bucket**: ✅ ENABLED
   - **File size limit**: Unset (atau > 5MB)
   - **Allowed MIME types**: Any

---

## 📝 Alternative: Manual Setup via Dashboard

Jika SQL tidak berfungsi, setup manual:

### 1. Create Policies via Dashboard
Pergi ke **Storage** → **Policies** → **New Policy**

**Policy 1: Read**
- Policy name: `Public read access for documents bucket`
- Allowed operation: `SELECT`
- Target roles: `public`
- USING expression: `bucket_id = 'documents'`

**Policy 2: Insert**
- Policy name: `Public insert access for documents bucket`
- Allowed operation: `INSERT`
- Target roles: `public`
- WITH CHECK expression: `bucket_id = 'documents'`

**Policy 3: Update**
- Policy name: `Public update access for documents bucket`
- Allowed operation: `UPDATE`
- Target roles: `public`
- USING expression: `bucket_id = 'documents'`

**Policy 4: Delete**
- Policy name: `Public delete access for documents bucket`
- Allowed operation: `DELETE`
- Target roles: `public`
- USING expression: `bucket_id = 'documents'`

---

## ✅ Success Indicators

Upload berjaya jika:
1. ✅ Tiada error dalam browser console
2. ✅ Dokumen muncul dalam admin panel dengan nama fail
3. ✅ Boleh klik dokumen untuk view/download
4. ✅ URL dokumen bermula dengan `https://[project].supabase.co/storage/v1/object/public/documents/...`

---

## 📞 Masih Ada Masalah?

Check console logs untuk error message yang lebih detail. Error message akan show:
- Nama fail yang gagal
- Error message dari Supabase
- Path fail yang cuba di-upload

Contoh console output:
```
Uploading file: ATTENDANCE EXPEDEA'22.pdf to path: pendaftaran/1736654321_0_ATTENDANCE EXPEDEA'22.pdf
Upload error: { message: "new row violates row-level security policy", statusCode: 403 }
```

Jika dapat error seperti di atas, bermakna policies masih tidak betul. Run SQL script sekali lagi.
