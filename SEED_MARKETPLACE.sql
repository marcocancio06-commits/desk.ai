-- ============================================================================
-- MARKETPLACE SEED DATA ONLY
-- ============================================================================
-- Use this if migrations 007 & 008 are already run
-- This only adds the 2 seed businesses
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

-- Verify seed data
SELECT 
  name,
  slug,
  industry,
  is_public,
  tagline,
  service_zip_codes,
  created_at
FROM businesses
WHERE slug IN ('houston-premier-plumbing', 'bayou-hvac-specialists')
ORDER BY created_at DESC;

