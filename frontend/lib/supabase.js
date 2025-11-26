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

// ============================================================================
// AUTH HELPER FUNCTIONS
// ============================================================================

/**
 * Get current session
 */
export async function getSession() {
  if (!supabase) return null;
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

/**
 * Get current user
 */
export async function getCurrentUser() {
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * Listen for auth state changes
 * Returns an unsubscribe function
 */
export function onAuthStateChange(callback) {
  if (!supabase) {
    // Return a no-op unsubscribe function if Supabase isn't configured
    return () => {};
  }
  
  const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
  return () => subscription?.unsubscribe();
}

/**
 * Get user with their profile data
 */
export async function getUserWithProfile() {
  if (!supabase) return { user: null, profile: null };
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return { user: null, profile: null };
  
  // Fetch profile from profiles table
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  
  return { user, profile };
}

/**
 * Sign up a new user
 */
export async function signUp(email, password, metadata = {}) {
  if (!supabase) throw new Error('Supabase not configured');
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: metadata }
  });
  
  if (error) throw error;
  return data;
}

/**
 * Sign in with email and password
 */
export async function signIn(email, password) {
  if (!supabase) throw new Error('Supabase not configured');
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  if (error) throw error;
  return data;
}

/**
 * Sign out
 */
export async function signOut() {
  if (!supabase) return;
  await supabase.auth.signOut();
}

/**
 * Get auth header for API requests
 */
export async function getAuthHeader() {
  if (!supabase) return {};
  
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.access_token) return {};
  
  return {
    Authorization: `Bearer ${session.access_token}`
  };
}
