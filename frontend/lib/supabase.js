/**
 * Supabase Client for Desk.ai Frontend
 * 
 * Provides browser-based Supabase client with auth capabilities
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let supabaseClient = null;

if (supabaseUrl && supabaseAnonKey) {
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });
} else {
  console.warn('⚠️  Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

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
  
  return data;
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
