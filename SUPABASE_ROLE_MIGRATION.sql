-- Supabase Migration: Add role column to profiles table
-- Purpose: Enable role-based auth for owner vs client users
-- Date: 2025-11-23

-- Step 1: Add role column to profiles table
-- Default to 'client' for safety, allows 'owner' or 'client'
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'client' CHECK (role IN ('owner', 'client'));

-- Step 2: Update existing profiles to have 'owner' role
-- Assumption: All current users are business owners
UPDATE profiles 
SET role = 'owner' 
WHERE role IS NULL OR role = 'client';

-- Step 3: Create index for faster role lookups
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Step 4: Add comment for documentation
COMMENT ON COLUMN profiles.role IS 'User role: owner (business owner) or client (customer)';

-- Verification queries (run these after migration):
-- SELECT role, COUNT(*) FROM profiles GROUP BY role;
-- SELECT id, email, role FROM auth.users JOIN profiles ON auth.users.id = profiles.id LIMIT 10;

-- Rollback (if needed):
-- ALTER TABLE profiles DROP COLUMN role;
-- DROP INDEX IF EXISTS idx_profiles_role;
