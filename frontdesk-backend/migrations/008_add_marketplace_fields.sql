-- ============================================================================
-- MIGRATION 008: Add Marketplace Fields for Production
-- ============================================================================
-- Description: Adds public visibility and description fields for marketplace
-- Date: 2025-11-24
-- ============================================================================

-- Add new columns to businesses table
ALTER TABLE businesses 
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS short_description TEXT,
  ADD COLUMN IF NOT EXISTS tagline TEXT;

-- Add index for public businesses (for marketplace queries)
CREATE INDEX IF NOT EXISTS idx_businesses_is_public ON businesses(is_public) WHERE is_public = true;

-- Add comments
COMMENT ON COLUMN businesses.is_public IS 'Whether business appears in public marketplace';
COMMENT ON COLUMN businesses.short_description IS 'Brief description shown in marketplace listing (max 200 chars)';
COMMENT ON COLUMN businesses.tagline IS 'Short tagline for business (max 60 chars)';

-- Update existing businesses to be private by default (safety)
UPDATE businesses SET is_public = false WHERE is_public IS NULL;
