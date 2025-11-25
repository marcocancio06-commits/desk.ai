-- Desk.ai Database Schema
-- Complete reference for Supabase tables

-- ============================================================================
-- AUTHENTICATION & PROFILES
-- ============================================================================

-- profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  role TEXT DEFAULT 'client' CHECK (role IN ('owner', 'client')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

COMMENT ON TABLE profiles IS 'User profiles with role-based access (owner vs client)';
COMMENT ON COLUMN profiles.role IS 'User role: owner (business owner) or client (customer)';

-- ============================================================================
-- BUSINESSES
-- ============================================================================

-- businesses table
CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  industry TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  service_zip_codes TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  is_listed BOOLEAN DEFAULT false,
  onboarding_completed BOOLEAN DEFAULT false,
  subscription_tier TEXT DEFAULT 'free',
  logo_url TEXT,
  color_scheme TEXT DEFAULT 'default',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_businesses_slug ON businesses(slug);
CREATE INDEX IF NOT EXISTS idx_businesses_industry ON businesses(industry);
CREATE INDEX IF NOT EXISTS idx_businesses_is_active ON businesses(is_active);
CREATE INDEX IF NOT EXISTS idx_businesses_is_listed ON businesses(is_listed);

COMMENT ON TABLE businesses IS 'Business profiles that appear in marketplace and power /b/[slug] pages';
COMMENT ON COLUMN businesses.slug IS 'Unique URL slug for the business (e.g., desk.ai/b/acme-plumbing)';
COMMENT ON COLUMN businesses.is_listed IS 'Whether business is visible in public marketplace/directory';
COMMENT ON COLUMN businesses.service_zip_codes IS 'Array of ZIP codes where business provides services';
COMMENT ON COLUMN businesses.subscription_tier IS 'Subscription tier: free, pro, enterprise';

-- ============================================================================
-- BUSINESS-USER RELATIONSHIPS
-- ============================================================================

-- business_users table (join table for many-to-many relationship)
CREATE TABLE IF NOT EXISTS business_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'admin', 'member')),
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(business_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_business_users_business ON business_users(business_id);
CREATE INDEX IF NOT EXISTS idx_business_users_user ON business_users(user_id);
CREATE INDEX IF NOT EXISTS idx_business_users_default ON business_users(user_id, is_default);

COMMENT ON TABLE business_users IS 'Links users to businesses with specific roles';
COMMENT ON COLUMN business_users.role IS 'User role within the business: owner, admin, or member';
COMMENT ON COLUMN business_users.is_default IS 'Whether this is the users primary/default business';

-- ============================================================================
-- LEADS & CONVERSATIONS
-- ============================================================================

-- leads table
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  client_name TEXT,
  client_phone TEXT,
  client_email TEXT,
  service_requested TEXT,
  service_zip TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'lost')),
  source TEXT DEFAULT 'chat',
  conversation_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_business ON leads(business_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at DESC);

COMMENT ON TABLE leads IS 'Customer leads generated from chat conversations';
COMMENT ON COLUMN leads.source IS 'How the lead was generated: chat, form, phone, etc.';

-- ============================================================================
-- EXAMPLE DATA (Optional - for development/testing)
-- ============================================================================

-- Demo business (for testing)
INSERT INTO businesses (
  id,
  slug,
  name,
  industry,
  phone,
  email,
  service_zip_codes,
  is_active,
  onboarding_completed
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'demo-plumbing',
  'Demo Plumbing Co.',
  'plumbing',
  '+1-555-DEMO-123',
  'demo@example.com',
  ARRAY['90210', '90211', '90212'],
  true,
  true
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can view and update their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Businesses: Public read, owners can update
CREATE POLICY "Businesses are publicly viewable" ON businesses
  FOR SELECT USING (true);

CREATE POLICY "Business owners can update their business" ON businesses
  FOR UPDATE USING (
    id IN (
      SELECT business_id FROM business_users
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Business Users: Users can view their own relationships
CREATE POLICY "Users can view own business relationships" ON business_users
  FOR SELECT USING (user_id = auth.uid());

-- Leads: Business owners can view and manage their leads
CREATE POLICY "Business owners can view their leads" ON leads
  FOR SELECT USING (
    business_id IN (
      SELECT business_id FROM business_users
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Business owners can update their leads" ON leads
  FOR UPDATE USING (
    business_id IN (
      SELECT business_id FROM business_users
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- HELPFUL QUERIES
-- ============================================================================

-- Get all businesses for a user
/*
SELECT b.*, bu.role, bu.is_default
FROM businesses b
JOIN business_users bu ON bu.business_id = b.id
WHERE bu.user_id = '<user-id>';
*/

-- Get all leads for a business
/*
SELECT *
FROM leads
WHERE business_id = '<business-id>'
ORDER BY created_at DESC;
*/

-- Check if slug exists
/*
SELECT id FROM businesses WHERE slug = 'acme-plumbing';
*/

-- Get user's default business
/*
SELECT b.*
FROM businesses b
JOIN business_users bu ON bu.business_id = b.id
WHERE bu.user_id = '<user-id>' AND bu.is_default = true
LIMIT 1;
*/
