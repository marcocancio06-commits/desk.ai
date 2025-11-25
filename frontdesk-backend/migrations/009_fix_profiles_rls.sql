-- Migration 009: Fix profiles table RLS policies
-- ============================================================================
-- Purpose: Add missing INSERT policy for profiles table to fix signup errors
-- Date: 2025-11-25
-- Issue: "Could not find the table 'public.profiles' in the schema cache"
-- Root Cause: Missing INSERT policy prevents users from creating profiles during signup
-- ============================================================================

-- Ensure profiles table exists in public schema (idempotent)
-- This should already exist from migration 007, but we ensure it here
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- User information
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  email TEXT,
  
  -- Role and permissions (global level)
  role TEXT DEFAULT 'client' CHECK (role IN ('owner', 'client', 'user', 'admin', 'super_admin')),
  
  -- Preferences
  preferences JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES FOR PROFILES
-- ============================================================================

-- Policy 1: Users can view their own profile
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = id);

-- Policy 2: Users can insert their own profile (CRITICAL for signup)
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" 
  ON public.profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Policy 3: Users can update their own profile
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- INDEXES (ensure they exist)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- ============================================================================
-- TRIGGER FOR updated_at
-- ============================================================================

-- Create or replace the trigger function for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to profiles table
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- COMMENTS (documentation)
-- ============================================================================

COMMENT ON TABLE public.profiles IS 'User profiles linked to Supabase auth.users with role-based access';
COMMENT ON COLUMN public.profiles.id IS 'FK to auth.users.id - one profile per authenticated user';
COMMENT ON COLUMN public.profiles.role IS 'User role: owner (business owner), client (customer), admin, etc.';
COMMENT ON COLUMN public.profiles.email IS 'Cached email from auth.users for easier querying';
COMMENT ON COLUMN public.profiles.preferences IS 'User preferences stored as JSONB (theme, notifications, etc.)';

-- ============================================================================
-- VERIFICATION QUERIES (run these after migration to verify)
-- ============================================================================

-- Check if table exists and is in public schema
-- SELECT schemaname, tablename FROM pg_tables WHERE tablename = 'profiles';

-- Check RLS is enabled
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'profiles';

-- List all policies on profiles table
-- SELECT policyname, cmd, qual, with_check FROM pg_policies WHERE tablename = 'profiles';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
