-- ============================================================================
-- MARKETPLACE SETUP: Complete Schema + Seed Data
-- ============================================================================
-- Run this in Supabase SQL Editor to set up the marketplace
-- This combines migrations 007, 008, and seed data
-- ============================================================================

-- ============================================================================
-- PART 1: Create businesses table (from migration 007)
-- ============================================================================

CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Public-facing identifiers
  slug TEXT UNIQUE NOT NULL CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name TEXT NOT NULL,
  
  -- Contact information
  phone TEXT,
  email TEXT,
  
  -- Service details
  service_zip_codes JSONB DEFAULT '[]'::jsonb,
  industry TEXT,
  
  -- Business settings
  services JSONB DEFAULT '[]'::jsonb,
  pricing JSONB DEFAULT '{}'::jsonb,
  hours JSONB DEFAULT '{}'::jsonb,
  policies JSONB DEFAULT '{}'::jsonb,
  emergency_policy TEXT,
  
  -- Branding
  logo_url TEXT,
  
  -- Status and metadata
  is_active BOOLEAN DEFAULT true,
  onboarding_completed BOOLEAN DEFAULT false,
  subscription_tier TEXT DEFAULT 'trial',
  
  -- Marketplace fields (from migration 008)
  is_public BOOLEAN DEFAULT false,
  short_description TEXT,
  tagline TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_businesses_slug ON businesses(slug);
CREATE INDEX IF NOT EXISTS idx_businesses_industry ON businesses(industry);
CREATE INDEX IF NOT EXISTS idx_businesses_is_active ON businesses(is_active);
CREATE INDEX IF NOT EXISTS idx_businesses_created_at ON businesses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_businesses_is_public ON businesses(is_public) WHERE is_public = true;

-- Add comments
COMMENT ON COLUMN businesses.slug IS 'URL-safe business identifier (e.g., houston-premier-plumbing)';
COMMENT ON COLUMN businesses.service_zip_codes IS 'Array of ZIP codes where business provides service';
COMMENT ON COLUMN businesses.is_public IS 'Whether business appears in public marketplace';
COMMENT ON COLUMN businesses.short_description IS 'Brief description shown in marketplace listing (max 200 chars)';
COMMENT ON COLUMN businesses.tagline IS 'Short tagline for business (max 60 chars)';

-- ============================================================================
-- PART 2: Enable RLS (Row Level Security)
-- ============================================================================

ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

-- Public read policy for marketplace (anyone can see public businesses)
CREATE POLICY "Public businesses are viewable by everyone"
  ON businesses
  FOR SELECT
  USING (is_public = true AND is_active = true);

-- Service role can do anything (for backend operations)
CREATE POLICY "Service role has full access"
  ON businesses
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- PART 3: Seed Data - Example Marketplace Businesses
-- ============================================================================

-- Delete existing seed data if re-running
DELETE FROM businesses WHERE slug IN ('houston-premier-plumbing', 'bayou-hvac-specialists');

-- Seed Business #1: Houston Premier Plumbing
INSERT INTO businesses (
  slug,
  name,
  phone,
  email,
  service_zip_codes,
  industry,
  is_public,
  tagline,
  short_description,
  is_active,
  onboarding_completed,
  created_at
) VALUES (
  'houston-premier-plumbing',
  'Houston Premier Plumbing',
  '(713) 555-0142',
  'info@houstonplumbing.example',
  '["77005", "77030", "77019", "77098"]'::jsonb,
  'plumbing',
  true,
  'Fast, Reliable Plumbing Services',
  'Licensed plumbers available 24/7 for all your plumbing needs. Emergency services, repairs, and installations throughout Houston.',
  true,
  true,
  NOW() - INTERVAL '15 days'
);

-- Seed Business #2: Bayou HVAC Specialists
INSERT INTO businesses (
  slug,
  name,
  phone,
  email,
  service_zip_codes,
  industry,
  is_public,
  tagline,
  short_description,
  is_active,
  onboarding_completed,
  created_at
) VALUES (
  'bayou-hvac-specialists',
  'Bayou HVAC Specialists',
  '(713) 555-0198',
  'service@bayouhvac.example',
  '["77005", "77025", "77056", "77024"]'::jsonb,
  'hvac',
  true,
  'Keep Houston Cool & Comfortable',
  'Expert HVAC installation, repair, and maintenance. Serving Houston homeowners and businesses with honest, professional service.',
  true,
  true,
  NOW() - INTERVAL '8 days'
);

-- ============================================================================
-- PART 4: Verification Queries
-- ============================================================================

-- Check that businesses were created
SELECT 
  name,
  slug,
  industry,
  is_public,
  tagline,
  array_length(service_zip_codes::text[]::text[], 1) as zip_count,
  created_at
FROM businesses
WHERE is_public = true
ORDER BY created_at DESC;

-- Verify marketplace query works (this is what the API calls)
SELECT 
  id,
  slug,
  name,
  industry,
  tagline,
  short_description,
  service_zip_codes
FROM businesses
WHERE is_active = true AND is_public = true
ORDER BY created_at DESC;

