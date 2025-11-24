/**
 * Supabase Client for Desk.ai Frontend
 * 
 * Provides browser-based Supabase client with auth capabilities
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Validate environment variables at build time
if (!supabaseUrl || !supabaseAnonKey) {
  if (typeof window === 'undefined') {
    // Server-side: Log error during build/SSR
    console.error('❌ CRITICAL: Missing Supabase configuration!');
    console.error('❌ Required environment variables:');
    console.error('   - NEXT_PUBLIC_SUPABASE_URL');
    console.error('   - NEXT_PUBLIC_SUPABASE_ANON_KEY');
    console.error('❌ Add these to /frontend/.env.local');
  }
}

// Create Supabase client with enhanced configuration
const supabaseClient = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        storageKey: 'deskai-auth-token',
        flowType: 'pkce'
      },
      global: {
        headers: {
          'x-application-name': 'desk.ai'
        }
      }
    })
  : null;

export const supabase = supabaseClient;

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
