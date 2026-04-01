-- iOS Kit Database Schema for Supabase
-- Run this in your Supabase SQL Editor to create the required tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  device_type VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Assets table (screenshots, logos, etc.)
CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('screenshot', 'logo', 'other')),
  storage_path VARCHAR(512) NOT NULL,
  storage_url VARCHAR(1024) NOT NULL,
  filename VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100),
  width INTEGER,
  height INTEGER,
  file_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Screenshot configurations table
CREATE TABLE IF NOT EXISTS screenshot_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  version VARCHAR(50) NOT NULL CHECK (version IN ('ai_original', 'user_edited')),
  config JSONB NOT NULL,
  exported_png_urls TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_assets_project_id ON assets(project_id);
CREATE INDEX IF NOT EXISTS idx_assets_user_id ON assets(user_id);
CREATE INDEX IF NOT EXISTS idx_screenshot_configs_project_id ON screenshot_configs(project_id);
CREATE INDEX IF NOT EXISTS idx_screenshot_configs_version ON screenshot_configs(version);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_screenshot_configs_updated_at
  BEFORE UPDATE ON screenshot_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
-- Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE screenshot_configs ENABLE ROW LEVEL SECURITY;

-- Projects policies
CREATE POLICY "Users can view their own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
  ON projects FOR DELETE
  USING (auth.uid() = user_id);

-- Assets policies
CREATE POLICY "Users can view their own assets"
  ON assets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own assets"
  ON assets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own assets"
  ON assets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own assets"
  ON assets FOR DELETE
  USING (auth.uid() = user_id);

-- Screenshot configs policies
CREATE POLICY "Users can view their own screenshot configs"
  ON screenshot_configs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = screenshot_configs.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own screenshot configs"
  ON screenshot_configs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = screenshot_configs.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own screenshot configs"
  ON screenshot_configs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = screenshot_configs.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own screenshot configs"
  ON screenshot_configs FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = screenshot_configs.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Storage bucket for assets (run this separately in Supabase Storage)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('assets', 'assets', true);
--
-- CREATE POLICY "Allow public read access to assets"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'assets');
--
-- CREATE POLICY "Allow authenticated users to upload assets"
--   ON storage.objects FOR INSERT
--   WITH CHECK (
--     bucket_id = 'assets' AND
--     auth.role() = 'authenticated'
--   );
--
-- CREATE POLICY "Allow users to delete their own assets"
--   ON storage.objects FOR DELETE
--   USING (
--     bucket_id = 'assets' AND
--     auth.uid()::text = (storage.foldername(name))[1]
--   );
