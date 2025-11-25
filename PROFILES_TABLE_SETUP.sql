-- ============================================================================
-- PROFILES TABLE SETUP FOR SUPABASE
-- ============================================================================
-- Run this directly in Supabase SQL Editor to fix authentication errors
-- This creates the public.profiles table with proper RLS policies
-- ============================================================================

-- 1. Create profiles table in public schema
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- User information
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  email TEXT,
  
  -- Role for access control
  role TEXT DEFAULT 'client' CHECK (role IN ('owner', 'client', 'user', 'admin', 'super_admin')),
  
  -- User preferences (JSON object)
  preferences JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
-- Allow users to view their own profile
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = id);

-- Allow users to insert their own profile (critical for signup!)
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" 
  ON public.profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- 5. Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Apply trigger to profiles table
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Run these queries to verify everything is set up correctly:

-- Check table exists
SELECT schemaname, tablename FROM pg_tables WHERE tablename = 'profiles';

-- Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'profiles';

-- List all policies
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'profiles';

-- ============================================================================
-- SUCCESS!
-- ============================================================================
-- You should see:
-- ✅ profiles table in public schema
-- ✅ rowsecurity = true
-- ✅ Three policies: SELECT, INSERT, UPDATE
-- ============================================================================
