-- iOS Kit Database Schema for Supabase
-- Run this in your Supabase SQL Editor to create the required tables

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  device_type VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
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

CREATE TABLE IF NOT EXISTS screenshot_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  version VARCHAR(50) NOT NULL CHECK (version IN ('ai_original', 'user_edited')),
  config JSONB NOT NULL,
  exported_png_urls TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE IF NOT EXISTS policy_site_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
  version VARCHAR(50) NOT NULL DEFAULT 'user_edited',
  locale_default VARCHAR(10) NOT NULL DEFAULT 'en' CHECK (locale_default IN ('en', 'zh')),
  answers JSONB NOT NULL,
  render_data JSONB NOT NULL,
  published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE IF NOT EXISTS project_entitlements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
  plan_code VARCHAR(20) NOT NULL CHECK (plan_code IN ('free', 'base', 'pro')),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('inactive', 'active', 'revoked')),
  ai_quota_total INTEGER,
  ai_quota_used INTEGER NOT NULL DEFAULT 0 CHECK (ai_quota_used >= 0),
  activated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE IF NOT EXISTS payment_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  from_plan_code VARCHAR(20) NOT NULL CHECK (from_plan_code IN ('free', 'base', 'pro')),
  stripe_checkout_session_id VARCHAR(255) NOT NULL UNIQUE,
  stripe_payment_intent_id VARCHAR(255),
  stripe_customer_id VARCHAR(255),
  plan_code VARCHAR(20) NOT NULL CHECK (plan_code IN ('free', 'base', 'pro')),
  amount INTEGER NOT NULL DEFAULT 0,
  currency VARCHAR(16) NOT NULL DEFAULT 'usd',
  mode VARCHAR(20) NOT NULL DEFAULT 'payment' CHECK (mode IN ('payment')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded', 'expired')),
  provider_event_id VARCHAR(255),
  provider_payload JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE IF NOT EXISTS ai_usage_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  feature_type VARCHAR(50) NOT NULL CHECK (feature_type IN ('screenshots_ai_generate', 'metadata_ai_generate', 'policy_ai_generate')),
  units INTEGER NOT NULL DEFAULT 1 CHECK (units > 0),
  source VARCHAR(20) NOT NULL DEFAULT 'api',
  result_status VARCHAR(20) NOT NULL DEFAULT 'succeeded' CHECK (result_status IN ('succeeded', 'failed')),
  idempotency_key VARCHAR(255) NOT NULL UNIQUE,
  request_ref VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_assets_project_id ON assets(project_id);
CREATE INDEX IF NOT EXISTS idx_screenshot_configs_project_id ON screenshot_configs(project_id);
CREATE INDEX IF NOT EXISTS idx_screenshot_configs_version ON screenshot_configs(version);
CREATE INDEX IF NOT EXISTS idx_policy_site_configs_project_id ON policy_site_configs(project_id);
CREATE INDEX IF NOT EXISTS idx_project_entitlements_project_id ON project_entitlements(project_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_project_id ON payment_orders(project_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_status ON payment_orders(status);
CREATE INDEX IF NOT EXISTS idx_ai_usage_events_project_id ON ai_usage_events(project_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_events_feature_type ON ai_usage_events(feature_type);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION consume_project_ai_quota(
  p_project_id UUID,
  p_units INTEGER DEFAULT 1
)
RETURNS TABLE(consumed BOOLEAN, ai_quota_used INTEGER, ai_quota_total INTEGER) AS $$
DECLARE
  updated_row project_entitlements%ROWTYPE;
BEGIN
  UPDATE project_entitlements
  SET
    ai_quota_used = ai_quota_used + p_units,
    updated_at = TIMEZONE('utc', NOW())
  WHERE project_id = p_project_id
    AND status = 'active'
    AND plan_code = 'base'
    AND ai_quota_total IS NOT NULL
    AND ai_quota_used + p_units <= ai_quota_total
  RETURNING * INTO updated_row;

  IF FOUND THEN
    RETURN QUERY SELECT TRUE, updated_row.ai_quota_used, updated_row.ai_quota_total;
    RETURN;
  END IF;

  SELECT *
  INTO updated_row
  FROM project_entitlements
  WHERE project_id = p_project_id
  LIMIT 1;

  IF FOUND AND updated_row.plan_code = 'pro' AND updated_row.status = 'active' THEN
    RETURN QUERY SELECT TRUE, updated_row.ai_quota_used, updated_row.ai_quota_total;
  ELSE
    RETURN QUERY SELECT FALSE, COALESCE(updated_row.ai_quota_used, 0), updated_row.ai_quota_total;
  END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_screenshot_configs_updated_at ON screenshot_configs;
CREATE TRIGGER update_screenshot_configs_updated_at
  BEFORE UPDATE ON screenshot_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_policy_site_configs_updated_at ON policy_site_configs;
CREATE TRIGGER update_policy_site_configs_updated_at
  BEFORE UPDATE ON policy_site_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_project_entitlements_updated_at ON project_entitlements;
CREATE TRIGGER update_project_entitlements_updated_at
  BEFORE UPDATE ON project_entitlements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payment_orders_updated_at ON payment_orders;
CREATE TRIGGER update_payment_orders_updated_at
  BEFORE UPDATE ON payment_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- No RLS is configured here.
-- In this project, Supabase is used as an application database only.
-- Uploaded files are stored in Aliyun OSS rather than Supabase Storage.
