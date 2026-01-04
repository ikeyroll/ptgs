-- ================================================================================
-- MPHS ASSET BORROWING SYSTEM - DATABASE SETUP
-- ================================================================================
-- Run this in your Supabase SQL Editor
-- ================================================================================

-- 1. Create applications table if not exists
CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ref_no VARCHAR(50) UNIQUE NOT NULL,
    no_siri VARCHAR(50) UNIQUE,
    application_type VARCHAR(20) NOT NULL,
    pemohon JSONB NOT NULL,
    tanggungan JSONB,
    documents JSONB,
    status VARCHAR(50) NOT NULL DEFAULT 'Dalam Proses',
    admin_notes TEXT,
    submitted_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_date TIMESTAMP WITH TIME ZONE,
    ready_date TIMESTAMP WITH TIME ZONE,
    collected_date TIMESTAMP WITH TIME ZONE,
    expiry_date TIMESTAMP WITH TIME ZONE,
    previous_ref_no VARCHAR(50),
    previous_app_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create session_settings table for capacity management
CREATE TABLE IF NOT EXISTS session_settings (
    year INTEGER PRIMARY KEY,
    capacity INTEGER NOT NULL DEFAULT 350,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_applications_ref_no ON applications(ref_no);
CREATE INDEX IF NOT EXISTS idx_applications_no_siri ON applications(no_siri);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_type ON applications(application_type);
CREATE INDEX IF NOT EXISTS idx_applications_submitted_date ON applications(submitted_date);

-- 4. Enable Row Level Security
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_settings ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for applications
DROP POLICY IF EXISTS "Allow public read applications" ON applications;
CREATE POLICY "Allow public read applications"
ON applications FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Allow public insert applications" ON applications;
CREATE POLICY "Allow public insert applications"
ON applications FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow admin update applications" ON applications;
CREATE POLICY "Allow admin update applications"
ON applications FOR UPDATE
USING (true);

DROP POLICY IF EXISTS "Allow admin delete applications" ON applications;
CREATE POLICY "Allow admin delete applications"
ON applications FOR DELETE
USING (true);

-- 6. Create RLS policies for session_settings
DROP POLICY IF EXISTS "Allow public read session_settings" ON session_settings;
CREATE POLICY "Allow public read session_settings"
ON session_settings FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Allow admin update session_settings" ON session_settings;
CREATE POLICY "Allow admin update session_settings"
ON session_settings FOR UPDATE
USING (true);

DROP POLICY IF EXISTS "Allow admin insert session_settings" ON session_settings;
CREATE POLICY "Allow admin insert session_settings"
ON session_settings FOR INSERT
WITH CHECK (true);

-- 7. Insert default session capacity for current year
INSERT INTO session_settings (year, capacity)
VALUES (EXTRACT(YEAR FROM NOW())::INTEGER, 350)
ON CONFLICT (year) DO NOTHING;

-- 8. Create function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Create triggers for auto-updating updated_at
DROP TRIGGER IF EXISTS update_applications_updated_at ON applications;
CREATE TRIGGER update_applications_updated_at
    BEFORE UPDATE ON applications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_session_settings_updated_at ON session_settings;
CREATE TRIGGER update_session_settings_updated_at
    BEFORE UPDATE ON session_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ================================================================================
-- SETUP COMPLETE!
-- ================================================================================
-- 
-- Next steps:
-- 1. Verify tables created: SELECT * FROM applications LIMIT 1;
-- 2. Verify session settings: SELECT * FROM session_settings;
-- 3. Test your application
--
-- ================================================================================
