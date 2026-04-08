-- Existing-project migration for "Supabase as database only" mode.
-- File assets stay in Aliyun OSS; Supabase stores only metadata.

ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE assets DISABLE ROW LEVEL SECURITY;
ALTER TABLE screenshot_configs DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
DROP POLICY IF EXISTS "Users can insert their own projects" ON projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;

DROP POLICY IF EXISTS "Users can view their own assets" ON assets;
DROP POLICY IF EXISTS "Users can insert their own assets" ON assets;
DROP POLICY IF EXISTS "Users can update their own assets" ON assets;
DROP POLICY IF EXISTS "Users can delete their own assets" ON assets;

DROP POLICY IF EXISTS "Users can view their own screenshot configs" ON screenshot_configs;
DROP POLICY IF EXISTS "Users can insert their own screenshot configs" ON screenshot_configs;
DROP POLICY IF EXISTS "Users can update their own screenshot configs" ON screenshot_configs;
DROP POLICY IF EXISTS "Users can delete their own screenshot configs" ON screenshot_configs;

ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_user_id_fkey;
ALTER TABLE assets DROP CONSTRAINT IF EXISTS assets_user_id_fkey;

DROP INDEX IF EXISTS idx_projects_user_id;
DROP INDEX IF EXISTS idx_assets_user_id;
