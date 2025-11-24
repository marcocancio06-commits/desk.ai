/**
 * useCurrentUser Hook
 * 
 * Fetches current user and their profile (including role)
 * Handles role-based redirects for protected routes
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { getUserWithProfile, onAuthStateChange } from '../lib/supabase';

export function useCurrentUser(options = {}) {
  const {
    requiredRole = null, // 'owner' or 'client' - if set, redirects non-matching users
    redirectTo = null,   // Where to redirect if role doesn't match
    redirectMessage = null // Message to show when redirecting
  } = options;

  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      try {
        const { user: currentUser, profile: currentProfile } = await getUserWithProfile();
        
        if (!mounted) return;

        setUser(currentUser);
        setProfile(currentProfile);
        
        // Role-based redirect logic
        if (currentUser && currentProfile && requiredRole) {
          if (currentProfile.role !== requiredRole) {
            console.warn(`User role mismatch: expected ${requiredRole}, got ${currentProfile.role}`);
            
            // Determine redirect destination
            let destination = redirectTo;
            if (!destination) {
              destination = currentProfile.role === 'owner' ? '/dashboard' : '/client';
            }
            
            // Add message to URL if provided
            if (redirectMessage) {
              const params = new URLSearchParams({ message: redirectMessage });
              destination = `${destination}?${params.toString()}`;
            }
            
            router.push(destination);
          }
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error loading user:', err);
        if (mounted) {
          setError(err.message);
          setLoading(false);
        }
      }
    }

    loadUser();

    // Listen for auth state changes
    const unsubscribe = onAuthStateChange(async (event, session) => {
      console.log('Auth state changed in useCurrentUser:', event);
      
      if (event === 'SIGNED_IN' && session?.user) {
        const { user: currentUser, profile: currentProfile } = await getUserWithProfile();
        if (mounted) {
          setUser(currentUser);
          setProfile(currentProfile);
        }
      } else if (event === 'SIGNED_OUT') {
        if (mounted) {
          setUser(null);
          setProfile(null);
        }
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [requiredRole, redirectTo, redirectMessage, router]);

  return {
    user,
    profile,
    loading,
    error,
    role: profile?.role || null,
    isOwner: profile?.role === 'owner',
    isClient: profile?.role === 'client'
  };
}

/**
 * Hook specifically for owner-only pages
 * Redirects clients to /client with a message
 */
export function useOwnerAuth() {
  return useCurrentUser({
    requiredRole: 'owner',
    redirectTo: '/client',
    redirectMessage: "You're signed in as a customer. Business owners should use the owner dashboard."
  });
}

/**
 * Hook specifically for client-only pages
 * Redirects owners to /dashboard with a message
 */
export function useClientAuth() {
  return useCurrentUser({
    requiredRole: 'client',
    redirectTo: '/dashboard',
    redirectMessage: "You're signed in as a business owner. Use the dashboard to manage your business."
  });
}
