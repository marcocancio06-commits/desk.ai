-- ============================================================================
-- MIGRATION 007: Multi-Tenancy Support for Desk.ai
-- ============================================================================
-- Description: Adds proper multi-business support with user authentication,
--              business isolation, and public-facing business pages
-- Date: 2025-11-22
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. BUSINESSES TABLE (Core business entities)
-- ============================================================================

CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Public-facing identifiers
  slug TEXT UNIQUE NOT NULL CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'), -- URL-safe lowercase slug
  name TEXT NOT NULL,
  
  -- Contact information
  phone TEXT,
  email TEXT,
  
  -- Service details
  service_zip_codes JSONB DEFAULT '[]'::jsonb, -- Array of ZIP codes served
  industry TEXT, -- e.g., 'plumbing', 'hvac', 'electrical', 'general_contractor'
  
  -- Business settings (moved from business_settings table)
  services JSONB DEFAULT '[]'::jsonb,
  pricing JSONB DEFAULT '{}'::jsonb,
  hours JSONB DEFAULT '{}'::jsonb,
  policies JSONB DEFAULT '{}'::jsonb,
  emergency_policy TEXT,
  
  -- Status and metadata
  is_active BOOLEAN DEFAULT true,
  onboarding_completed BOOLEAN DEFAULT false,
  subscription_tier TEXT DEFAULT 'trial', -- trial, basic, pro, enterprise
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for businesses
CREATE INDEX IF NOT EXISTS idx_businesses_slug ON businesses(slug);
CREATE INDEX IF NOT EXISTS idx_businesses_industry ON businesses(industry);
CREATE INDEX IF NOT EXISTS idx_businesses_is_active ON businesses(is_active);
CREATE INDEX IF NOT EXISTS idx_businesses_created_at ON businesses(created_at DESC);

-- Add constraint for slug format (lowercase, alphanumeric, hyphens only)
COMMENT ON COLUMN businesses.slug IS 'URL-safe business identifier (e.g., houston-premier-plumbing)';
COMMENT ON COLUMN businesses.service_zip_codes IS 'Array of ZIP codes where business provides service';

-- ============================================================================
-- 2. PROFILES TABLE (User profiles linked to Supabase Auth)
-- ============================================================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- User information
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  
  -- Role and permissions (global level)
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
  
  -- Preferences
  preferences JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for profiles
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at DESC);

COMMENT ON TABLE profiles IS 'User profiles linked to Supabase auth.users';
COMMENT ON COLUMN profiles.id IS 'FK to auth.users.id - one profile per authenticated user';

-- ============================================================================
-- 3. BUSINESS_USERS TABLE (Many-to-many: users ↔ businesses)
-- ============================================================================

CREATE TABLE IF NOT EXISTS business_users (
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Role within this specific business
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('owner', 'manager', 'staff', 'viewer')),
  
  -- Default business for this user (helpful if user belongs to multiple)
  is_default BOOLEAN DEFAULT false,
  
  -- Permissions (optional, can expand later)
  permissions JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Composite primary key
  PRIMARY KEY (business_id, user_id)
);

-- Indexes for business_users
CREATE INDEX IF NOT EXISTS idx_business_users_business_id ON business_users(business_id);
CREATE INDEX IF NOT EXISTS idx_business_users_user_id ON business_users(user_id);
CREATE INDEX IF NOT EXISTS idx_business_users_role ON business_users(role);
CREATE INDEX IF NOT EXISTS idx_business_users_default ON business_users(user_id, is_default) WHERE is_default = true;

COMMENT ON TABLE business_users IS 'Junction table: which users have access to which businesses';
COMMENT ON COLUMN business_users.role IS 'User role within this specific business';
COMMENT ON COLUMN business_users.is_default IS 'If user belongs to multiple businesses, which is their default';

-- ============================================================================
-- 4. UPDATE EXISTING TABLES - Add business_id foreign keys
-- ============================================================================

-- 4a. Update LEADS table
-- Add business_id as UUID FK if it doesn't exist, otherwise update type
DO $$
BEGIN
  -- Check if column exists and is VARCHAR
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads' 
    AND column_name = 'business_id' 
    AND data_type = 'character varying'
  ) THEN
    -- Column exists but wrong type - we'll handle migration below
    ALTER TABLE leads RENAME COLUMN business_id TO business_id_old;
    ALTER TABLE leads ADD COLUMN business_id UUID;
    CREATE INDEX IF NOT EXISTS idx_leads_business_id_uuid ON leads(business_id);
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads' 
    AND column_name = 'business_id'
  ) THEN
    -- Column doesn't exist at all
    ALTER TABLE leads ADD COLUMN business_id UUID;
    CREATE INDEX IF NOT EXISTS idx_leads_business_id_uuid ON leads(business_id);
  END IF;
  
  -- Add SMS fields if they don't exist (from previous migration)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads' AND column_name = 'sms_enabled'
  ) THEN
    ALTER TABLE leads ADD COLUMN sms_enabled BOOLEAN DEFAULT FALSE;
    ALTER TABLE leads ADD COLUMN last_sms_at TIMESTAMPTZ;
    ALTER TABLE leads ADD COLUMN sms_opt_out BOOLEAN DEFAULT FALSE;
    CREATE INDEX IF NOT EXISTS idx_leads_sms_enabled ON leads(sms_enabled) WHERE sms_enabled = TRUE;
  END IF;
END $$;

-- Add FK constraint for leads.business_id (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'leads_business_id_fkey'
  ) THEN
    ALTER TABLE leads 
      ADD CONSTRAINT leads_business_id_fkey 
      FOREIGN KEY (business_id) 
      REFERENCES businesses(id) 
      ON DELETE CASCADE;
  END IF;
END $$;

-- 4b. Update APPOINTMENTS table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'appointments' 
    AND column_name = 'business_id' 
    AND data_type = 'character varying'
  ) THEN
    ALTER TABLE appointments RENAME COLUMN business_id TO business_id_old;
    ALTER TABLE appointments ADD COLUMN business_id UUID;
    CREATE INDEX IF NOT EXISTS idx_appointments_business_id_uuid ON appointments(business_id);
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'appointments' 
    AND column_name = 'business_id'
  ) THEN
    ALTER TABLE appointments ADD COLUMN business_id UUID;
    CREATE INDEX IF NOT EXISTS idx_appointments_business_id_uuid ON appointments(business_id);
  END IF;
END $$;

-- Add FK constraint for appointments.business_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'appointments_business_id_fkey'
  ) THEN
    ALTER TABLE appointments 
      ADD CONSTRAINT appointments_business_id_fkey 
      FOREIGN KEY (business_id) 
      REFERENCES businesses(id) 
      ON DELETE CASCADE;
  END IF;
END $$;

-- 4c. Update MESSAGES table (add Twilio fields if not exists from previous migration)
DO $$
BEGIN
  -- Add Twilio SMS fields if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' AND column_name = 'twilio_sid'
  ) THEN
    ALTER TABLE messages ADD COLUMN twilio_sid VARCHAR(34) UNIQUE;
    ALTER TABLE messages ADD COLUMN twilio_account_sid VARCHAR(34);
    ALTER TABLE messages ADD COLUMN direction VARCHAR(20) CHECK (direction IN ('inbound', 'outbound'));
    ALTER TABLE messages ADD COLUMN from_number VARCHAR(20);
    ALTER TABLE messages ADD COLUMN to_number VARCHAR(20);
    ALTER TABLE messages ADD COLUMN body TEXT;
    ALTER TABLE messages ADD COLUMN status VARCHAR(20) DEFAULT 'sent';
    ALTER TABLE messages ADD COLUMN error_code VARCHAR(10);
    ALTER TABLE messages ADD COLUMN error_message TEXT;
    ALTER TABLE messages ADD COLUMN num_media INTEGER DEFAULT 0;
    ALTER TABLE messages ADD COLUMN from_city VARCHAR(100);
    ALTER TABLE messages ADD COLUMN from_state VARCHAR(50);
    ALTER TABLE messages ADD COLUMN from_zip VARCHAR(20);
    ALTER TABLE messages ADD COLUMN from_country VARCHAR(50);
    ALTER TABLE messages ADD COLUMN sent_at TIMESTAMPTZ;
    ALTER TABLE messages ADD COLUMN delivered_at TIMESTAMPTZ;
    
    CREATE INDEX IF NOT EXISTS idx_messages_twilio_sid ON messages(twilio_sid);
    CREATE INDEX IF NOT EXISTS idx_messages_direction ON messages(direction);
    CREATE INDEX IF NOT EXISTS idx_messages_from_number ON messages(from_number);
  END IF;
END $$;

-- ============================================================================
-- 5. SEED DATA - Demo Business
-- ============================================================================

-- Insert demo business (Houston Premier Plumbing)
INSERT INTO businesses (
  id,
  slug,
  name,
  phone,
  email,
  service_zip_codes,
  industry,
  services,
  pricing,
  hours,
  policies,
  emergency_policy,
  is_active,
  onboarding_completed,
  subscription_tier
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid, -- Fixed UUID for demo business
  'demo-plumbing',
  'Houston Premier Plumbing',
  '+1-713-555-0100',
  'contact@houstonpremierplumbing.com',
  '["77005", "77030", "77098", "77025", "77019"]'::jsonb,
  'plumbing',
  '["Emergency Plumbing", "Drain Cleaning", "Water Heater Repair", "Pipe Repair", "Leak Detection"]'::jsonb,
  '{"tripFee": "$89", "hourlyRate": "$120-180/hr", "emergencyRate": "$180-250/hr"}'::jsonb,
  '{"weekdays": "8:00 AM - 6:00 PM", "saturday": "9:00 AM - 4:00 PM", "sunday": "Closed (Emergency only)"}'::jsonb,
  '{"tripFee": "Standard $89 trip fee, waived if repair booked", "cancellation": "24-hour notice required", "warranty": "90-day warranty on all repairs"}'::jsonb,
  'Emergency services available 24/7 at premium rates. Call anytime for urgent issues.',
  true,
  true,
  'pro'
) ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  name = EXCLUDED.name,
  phone = EXCLUDED.phone,
  email = EXCLUDED.email,
  service_zip_codes = EXCLUDED.service_zip_codes,
  industry = EXCLUDED.industry,
  services = EXCLUDED.services,
  pricing = EXCLUDED.pricing,
  hours = EXCLUDED.hours,
  policies = EXCLUDED.policies,
  emergency_policy = EXCLUDED.emergency_policy,
  updated_at = NOW();

-- Migrate old business_settings data to new businesses table (if exists)
INSERT INTO businesses (
  slug,
  name,
  phone,
  email,
  service_zip_codes,
  services,
  pricing,
  hours,
  policies,
  emergency_policy
)
SELECT
  COALESCE(
    LOWER(REGEXP_REPLACE(business_name, '[^a-zA-Z0-9]+', '-', 'g')),
    'business-' || substr(md5(random()::text), 1, 8)
  ) as slug,
  business_name as name,
  phone,
  email,
  service_areas as service_zip_codes,
  services,
  pricing,
  hours,
  policies,
  emergency_policy
FROM business_settings
WHERE business_id NOT IN ('demo-business-001') -- Skip if already migrated
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- 6. DATA MIGRATION - Link old leads/appointments to demo business
-- ============================================================================

-- Update existing leads to point to demo business
UPDATE leads 
SET business_id = '00000000-0000-0000-0000-000000000001'::uuid
WHERE business_id IS NULL 
   OR (business_id_old IS NOT NULL AND business_id IS NULL);

-- Update existing appointments to point to demo business
UPDATE appointments 
SET business_id = '00000000-0000-0000-0000-000000000001'::uuid
WHERE business_id IS NULL
   OR (business_id_old IS NOT NULL AND business_id IS NULL);

-- ============================================================================
-- 7. TRIGGERS - Auto-update timestamps
-- ============================================================================

-- Trigger for businesses
DROP TRIGGER IF EXISTS update_businesses_updated_at ON businesses;
CREATE TRIGGER update_businesses_updated_at 
  BEFORE UPDATE ON businesses
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON profiles
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for business_users
DROP TRIGGER IF EXISTS update_business_users_updated_at ON business_users;
CREATE TRIGGER update_business_users_updated_at 
  BEFORE UPDATE ON business_users
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_users ENABLE ROW LEVEL SECURITY;

-- Policies for businesses table
DROP POLICY IF EXISTS "Public businesses are viewable by everyone" ON businesses;
CREATE POLICY "Public businesses are viewable by everyone" 
  ON businesses FOR SELECT 
  USING (is_active = true);

DROP POLICY IF EXISTS "Users can view businesses they belong to" ON businesses;
CREATE POLICY "Users can view businesses they belong to" 
  ON businesses FOR SELECT 
  USING (
    auth.uid() IN (
      SELECT user_id FROM business_users WHERE business_id = businesses.id
    )
  );

DROP POLICY IF EXISTS "Business owners can update their business" ON businesses;
CREATE POLICY "Business owners can update their business" 
  ON businesses FOR UPDATE 
  USING (
    auth.uid() IN (
      SELECT user_id FROM business_users 
      WHERE business_id = businesses.id AND role IN ('owner', 'manager')
    )
  );

-- Policies for profiles table
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile" 
  ON profiles FOR SELECT 
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Policies for business_users table
DROP POLICY IF EXISTS "Users can view their own business memberships" ON business_users;
CREATE POLICY "Users can view their own business memberships" 
  ON business_users FOR SELECT 
  USING (auth.uid() = user_id);

-- Update RLS policies for leads (business isolation)
DROP POLICY IF EXISTS "Users can view leads from their businesses" ON leads;
CREATE POLICY "Users can view leads from their businesses" 
  ON leads FOR SELECT 
  USING (
    business_id IN (
      SELECT business_id FROM business_users WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert leads to their businesses" ON leads;
CREATE POLICY "Users can insert leads to their businesses" 
  ON leads FOR INSERT 
  WITH CHECK (
    business_id IN (
      SELECT business_id FROM business_users WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update leads in their businesses" ON leads;
CREATE POLICY "Users can update leads in their businesses" 
  ON leads FOR UPDATE 
  USING (
    business_id IN (
      SELECT business_id FROM business_users WHERE user_id = auth.uid()
    )
  );

-- Update RLS policies for appointments (business isolation)
DROP POLICY IF EXISTS "Users can view appointments from their businesses" ON appointments;
CREATE POLICY "Users can view appointments from their businesses" 
  ON appointments FOR SELECT 
  USING (
    business_id IN (
      SELECT business_id FROM business_users WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert appointments to their businesses" ON appointments;
CREATE POLICY "Users can insert appointments to their businesses" 
  ON appointments FOR INSERT 
  WITH CHECK (
    business_id IN (
      SELECT business_id FROM business_users WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update appointments in their businesses" ON appointments;
CREATE POLICY "Users can update appointments in their businesses" 
  ON appointments FOR UPDATE 
  USING (
    business_id IN (
      SELECT business_id FROM business_users WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- 9. HELPER VIEWS
-- ============================================================================

-- View: businesses with user counts
CREATE OR REPLACE VIEW businesses_with_stats AS
SELECT 
  b.*,
  COUNT(DISTINCT bu.user_id) as user_count,
  COUNT(DISTINCT l.id) as lead_count,
  COUNT(DISTINCT a.id) as appointment_count
FROM businesses b
LEFT JOIN business_users bu ON bu.business_id = b.id
LEFT JOIN leads l ON l.business_id = b.id
LEFT JOIN appointments a ON a.business_id = b.id
GROUP BY b.id;

-- View: users with their businesses
CREATE OR REPLACE VIEW users_with_businesses AS
SELECT 
  p.id as user_id,
  p.full_name,
  p.email,
  p.role as global_role,
  bu.business_id,
  b.slug as business_slug,
  b.name as business_name,
  bu.role as business_role,
  bu.is_default,
  bu.created_at as joined_at
FROM profiles p
LEFT JOIN business_users bu ON bu.user_id = p.id
LEFT JOIN businesses b ON b.id = bu.business_id;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Add comments for documentation
COMMENT ON TABLE businesses IS 'Core table for multi-tenant business entities';
COMMENT ON TABLE profiles IS 'User profiles linked to Supabase auth';
COMMENT ON TABLE business_users IS 'Many-to-many junction: users can belong to multiple businesses';

-- Summary
DO $$
BEGIN
  RAISE NOTICE '=================================================================';
  RAISE NOTICE 'MIGRATION 007 COMPLETE: Multi-Tenancy Support';
  RAISE NOTICE '=================================================================';
  RAISE NOTICE 'Created tables: businesses, profiles, business_users';
  RAISE NOTICE 'Updated tables: leads, appointments, messages (added business_id FK)';
  RAISE NOTICE 'Demo business created: slug=demo-plumbing, id=00000000-0000-0000-0000-000000000001';
  RAISE NOTICE 'RLS policies enabled for business isolation';
  RAISE NOTICE '=================================================================';
END $$;
