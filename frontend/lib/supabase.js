/**
 * Minimal Supabase Client for Desk.ai Frontend
 * MVP: Simple, direct Supabase auth - no wrappers, no complexity
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Get current session
 */
export async function getSession() {
  if (!supabase) return null;
  
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    console.error('Error getting session:', error);
    return null;
  }
  
  return session;
}

/**
 * Get current user
 */
export async function getCurrentUser() {
  if (!supabase) return null;
  
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    console.error('Error getting user:', error);
    return null;
  }
  
  return user;
}

/**
 * Sign in with email and password
 */
export async function signIn(email, password) {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  if (error) {
    throw error;
  }
  
  return data;
}

/**
 * Sign up with email and password
 * 
 * Returns a safe structured object that handles email confirmation:
 * {
 *   user: User | null,
 *   session: Session | null,
 *   emailConfirmationRequired: boolean
 * }
 * 
 * When Supabase email confirmation is enabled, data.user will be null
 * until the user confirms their email. This function safely handles that case.
 */
export async function signUp(email, password, metadata = {}) {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata
    }
  });
  
  if (error) {
    throw error;
  }
  
  // Return safe structured object
  // If data.user is null, email confirmation is required
  return {
    user: data.user ?? null,
    session: data.session ?? null,
    emailConfirmationRequired: !data.user
  };
}

/**
 * Sign out
 */
export async function signOut() {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }
  
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    throw error;
  }
}

/**
 * Get auth header for API requests
 */
export async function getAuthHeader() {
  const session = await getSession();
  
  if (!session?.access_token) {
    return {};
  }
  
  return {
    'Authorization': `Bearer ${session.access_token}`
  };
}

/**
 * Subscribe to auth state changes
 */
export function onAuthStateChange(callback) {
  if (!supabase) {
    return () => {};
  }
  
  const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
  
  return () => subscription.unsubscribe();
}

/**
 * Get user profile from database
 * Returns the profile record including role
 */
export async function getUserProfile(userId) {
  if (!supabase || !userId) return null;
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
  
  return data;
}

/**
 * Get current user with their profile (including role)
 * Returns { user, profile } or { user: null, profile: null }
 */
export async function getUserWithProfile() {
  if (!supabase) {
    return { user: null, profile: null };
  }
  
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { user: null, profile: null };
    }
    
    // Get user profile
    const profile = await getUserProfile(user.id);
    
    return { user, profile };
  } catch (error) {
    console.error('Error in getUserWithProfile:', error);
    return { user: null, profile: null };
  }
}

/**
 * Create or update user profile with role
 */
export async function upsertProfile(userId, profileData) {
  if (!supabase || !userId) {
    throw new Error('Invalid parameters for upsertProfile');
  }
  
  const { data, error } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      ...profileData,
      updated_at: new Date().toISOString()
    })
    .select()
    .single();
  
  if (error) {
    throw error;
  }
  
  return data;
}

/**
 * Check if user has a specific role
 */
export async function checkUserRole(requiredRole) {
  const { profile } = await getUserWithProfile();
  
  if (!profile) {
    return false;
  }
  
  return profile.role === requiredRole;
}

/**
 * Check if user owns any businesses
 * Returns { hasBusiness: boolean, businessCount: number, firstBusinessSlug: string | null }
 */
export async function getUserBusinessStatus(userId) {
  if (!supabase || !userId) {
    return { hasBusiness: false, businessCount: 0, firstBusinessSlug: null };
  }
  
  try {
    // Query business_users table joined with businesses
    const { data, error } = await supabase
      .from('business_users')
      .select('business_id, businesses(slug)')
      .eq('user_id', userId)
      .eq('role', 'owner'); // Only count owner relationships
    
    if (error) {
      console.error('Error checking user business status:', error);
      return { hasBusiness: false, businessCount: 0, firstBusinessSlug: null };
    }
    
    const businessCount = data?.length || 0;
    const firstBusinessSlug = businessCount > 0 && data[0]?.businesses?.slug 
      ? data[0].businesses.slug 
      : null;
    
    return {
      hasBusiness: businessCount > 0,
      businessCount,
      firstBusinessSlug
    };
  } catch (error) {
    console.error('Error in getUserBusinessStatus:', error);
    return { hasBusiness: false, businessCount: 0, firstBusinessSlug: null };
  }
}
