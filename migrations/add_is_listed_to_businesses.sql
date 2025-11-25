-- Migration: Add is_listed column to businesses table
-- Date: 2025-11-23
-- Description: Adds marketplace visibility toggle for businesses

-- Add is_listed column (default false for privacy)
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS is_listed BOOLEAN DEFAULT false;

-- Add index for marketplace queries
CREATE INDEX IF NOT EXISTS idx_businesses_is_listed ON businesses(is_listed);

-- Add helpful comment
COMMENT ON COLUMN businesses.is_listed IS 'Whether business is visible in public marketplace/directory';

-- Update demo business to be listed (if it exists)
UPDATE businesses 
SET is_listed = true 
WHERE slug = 'demo-business';

-- Show results
SELECT slug, name, is_active, is_listed 
FROM businesses 
ORDER BY created_at;
