/**
 * Auth Helpers for Desk.ai
 * 
 * Centralized authentication and role-based routing logic
 * to ensure consistent user flows across the application.
 */

import { supabase } from './supabase';

/**
 * Handle post-authentication redirect based on user role and business status
 * 
 * This is the SINGLE SOURCE OF TRUTH for where users go after login/signup.
 * 
 * Flow:
 * - owner with no business → /onboarding
 * - owner with business → /dashboard
 * - client → /marketplace
 * - unknown/missing role → / (landing)
 * 
 * @param {Object} params
 * @param {Object} params.supabase - Supabase client instance
 * @param {Object} params.router - Next.js router instance
 * @param {string} params.explicitRoleFromQuery - Optional role from URL query params
 * @returns {Promise<void>}
 */
export async function handlePostAuthRedirect({ router, explicitRoleFromQuery = null }) {
  console.log('🔀 handlePostAuthRedirect called with role:', explicitRoleFromQuery);
  
  // 1. Get current user from Supabase auth
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    console.error('❌ No authenticated user:', userError);
    router.push('/auth/login');
    return;
  }
  
  console.log('✅ User authenticated:', user.id);
  
  // 2. Get user profile from database (includes role)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  
  if (profileError) {
    console.error('❌ Failed to load user profile:', profileError);
    // Profile might not exist yet - this is an error state
    router.push('/auth/login');
    return;
  }
  
  console.log('👤 User profile loaded, role:', profile?.role);
  
  // 3. Determine final role (query param overrides profile for signup flow)
  const role = explicitRoleFromQuery || profile?.role;
  
  if (!role) {
    console.warn('⚠️ No role found for user, sending to landing');
    router.push('/');
    return;
  }
  
  // 4. Route based on role
  if (role === 'owner') {
    console.log('🏢 Owner role detected, checking business status...');
    
    // Check if this owner has any businesses
    const { data: memberships, error: membershipError } = await supabase
      .from('business_users')
      .select('business_id, role')
      .eq('user_id', user.id)
      .eq('role', 'owner'); // Only count actual ownership
    
    if (membershipError) {
      console.error('❌ Failed to load business memberships:', membershipError);
      router.push('/auth/login');
      return;
    }
    
    const hasBusinesses = memberships && memberships.length > 0;
    console.log(`📊 Owner has ${memberships?.length || 0} business(es)`);
    
    if (!hasBusinesses) {
      console.log('📝 No business found → redirecting to onboarding');
      router.push('/onboarding');
    } else {
      console.log('✅ Business found → redirecting to dashboard');
      router.push('/dashboard');
    }
    return;
  }
  
  if (role === 'client') {
    console.log('🛒 Client role detected → redirecting to marketplace');
    router.push('/marketplace');
    return;
  }
  
  // 5. Fallback for unknown roles
  console.warn('⚠️ Unknown role, sending to landing:', role);
  router.push('/');
}

/**
 * Require owner role for a page
 * 
 * Use this in getServerSideProps or useEffect to protect owner-only pages
 * like /dashboard and /onboarding.
 * 
 * @param {Object} context - Next.js context (for getServerSideProps)
 * @returns {Promise<Object|null>} Redirect object or null if allowed
 */
export async function requireOwnerRole(context = null) {
  // Client-side check (useEffect)
  if (!context) {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { redirect: '/auth/login?role=owner', allowed: false };
    }
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (profile?.role !== 'owner') {
      return { redirect: '/', allowed: false };
    }
    
    return { allowed: true };
  }
  
  // Server-side check (getServerSideProps)
  // For now, we'll use client-side checks since we're using client components
  // This can be enhanced with @supabase/auth-helpers-nextjs for SSR
  return null;
}

/**
 * Require client role for a page
 * 
 * Use this to protect client-only pages like /marketplace and /b/[slug].
 * 
 * @param {Object} context - Next.js context (for getServerSideProps)
 * @param {string} returnPath - Path to return to after login
 * @returns {Promise<Object|null>} Redirect object or null if allowed
 */
export async function requireClientRole(context = null, returnPath = '/marketplace') {
  // Client-side check
  if (!context) {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { 
        redirect: `/auth/login?role=client&next=${encodeURIComponent(returnPath)}`, 
        allowed: false 
      };
    }
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (profile?.role !== 'client') {
      return { redirect: '/', allowed: false };
    }
    
    return { allowed: true };
  }
  
  // Server-side check (future enhancement)
  return null;
}

/**
 * Get user role from profile
 * 
 * @param {string} userId - User ID
 * @returns {Promise<string|null>} User role or null
 */
export async function getUserRole(userId) {
  if (!userId || !supabase) return null;
  
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();
  
  if (error) {
    console.error('Error fetching user role:', error);
    return null;
  }
  
  return profile?.role || null;
}

/**
 * Check if user is authenticated
 * 
 * @returns {Promise<boolean>}
 */
export async function isAuthenticated() {
  if (!supabase) return false;
  
  const { data: { user } } = await supabase.auth.getUser();
  return !!user;
}
