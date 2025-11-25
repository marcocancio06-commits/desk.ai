/**
 * Role-Aware Redirect Utility
 * 
 * Centralizes navigation logic based on user role and context.
 * This ensures consistent routing throughout the application.
 * 
 * FLOWS:
 * - Owner (new): signup → /onboarding → /dashboard
 * - Owner (returning): login → /dashboard
 * - Owner (with business): all routes → /dashboard
 * - Client (new/returning): signup/login → /marketplace (if MARKETPLACE_ENABLED) or /client
 * - Client: can access /client, /marketplace (if enabled), /demo-chat, /b/[slug]
 */

import { MARKETPLACE_ENABLED } from './featureFlags';

/**
 * Determine where to redirect user after login/signup
 * 
 * @param {Object} user - Supabase user object
 * @param {Object} profile - User profile with role
 * @param {Object} currentBusiness - Business object (for owners)
 * @param {Object} router - Next.js router
 * @param {string} context - 'login' | 'signup' | 'session-check'
 */
export function redirectAfterLogin({ user, profile, currentBusiness, router, context = 'login' }) {
  // Safety check
  if (!user || !profile) {
    console.warn('redirectAfterLogin: Missing user or profile');
    return;
  }

  const role = profile.role;

  // ===== OWNER FLOWS =====
  if (role === 'owner') {
    // New owner (just signed up, no business yet)
    if (!currentBusiness && context === 'signup') {
      console.log('🎯 Redirecting new owner to onboarding');
      router.push('/onboarding');
      return;
    }

    // Owner without business (incomplete onboarding)
    if (!currentBusiness) {
      console.log('🎯 Redirecting owner without business to onboarding');
      router.push('/onboarding');
      return;
    }

    // Owner with business (returning or completed onboarding)
    console.log('🎯 Redirecting owner to dashboard');
    router.push('/dashboard');
    return;
  }

  // ===== CLIENT FLOWS =====
  if (role === 'client') {
    console.log('🎯 Redirecting client to client home');
    router.push('/client');
    return;
  }

  // ===== FALLBACK (no role set) =====
  console.warn('⚠️ User has no role, redirecting to landing page');
  router.push('/');
}

/**
 * Get the appropriate "home" route for a given role
 * Used for navbar links and programmatic navigation
 * 
 * @param {string} role - 'owner' | 'client'
 * @param {boolean} hasBusiness - Whether owner has completed onboarding
 * @returns {string} Route path
 */
export function getHomeRoute(role, hasBusiness = true) {
  if (role === 'owner') {
    return hasBusiness ? '/dashboard' : '/onboarding';
  }
  
  if (role === 'client') {
    return '/client';
  }
  
  return '/';
}

/**
 * Check if user should have access to a protected route
 * Returns redirect path if user should be redirected, null if access allowed
 * 
 * @param {Object} params
 * @param {string} params.currentPath - Current route path
 * @param {string} params.role - User role ('owner' | 'client')
 * @param {boolean} params.hasBusiness - Whether owner has business
 * @param {boolean} params.isAuthenticated - Whether user is logged in
 * @returns {string|null} Redirect path or null
 */
export function checkRouteAccess({ currentPath, role, hasBusiness, isAuthenticated }) {
  // Public routes (accessible to everyone) - conditional marketplace based on feature flag
  const publicRoutes = ['/', '/login', '/signup', '/directory', '/demo-chat', '/demo-chat/customer', '/demo-chat/owner'];
  
  // Add marketplace to public routes only if enabled
  if (MARKETPLACE_ENABLED) {
    publicRoutes.push('/marketplace');
  }
  
  // Check if route is public or is a business page /b/[slug]
  if (publicRoutes.includes(currentPath) || currentPath.startsWith('/b/')) {
    return null; // Access allowed
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return '/login';
  }

  // ===== OWNER-ONLY ROUTES =====
  const ownerRoutes = ['/dashboard', '/onboarding'];
  const isOwnerRoute = ownerRoutes.some(route => currentPath.startsWith(route));

  if (isOwnerRoute && role !== 'owner') {
    // Client trying to access owner route
    return '/client';
  }

  // ===== CLIENT-ONLY ROUTES =====
  const clientRoutes = ['/client'];
  const isClientRoute = clientRoutes.some(route => currentPath.startsWith(route));

  if (isClientRoute && role === 'owner') {
    // Owner trying to access client route
    return hasBusiness ? '/dashboard' : '/onboarding';
  }

  // ===== ONBOARDING LOGIC =====
  // Owner without business trying to access dashboard
  if (currentPath.startsWith('/dashboard') && role === 'owner' && !hasBusiness) {
    return '/onboarding';
  }

  // Owner with business trying to access onboarding (already completed)
  if (currentPath.startsWith('/onboarding') && role === 'owner' && hasBusiness) {
    return '/dashboard';
  }

  // Access allowed
  return null;
}

/**
 * Get navbar links based on authentication state and role
 * 
 * @param {Object} params
 * @param {boolean} params.isAuthenticated - Whether user is logged in
 * @param {string} params.role - User role ('owner' | 'client')
 * @param {boolean} params.hasBusiness - Whether owner has business
 * @param {Object} params.currentBusiness - Current business object (for public page link)
 * @returns {Array} Array of link objects { label, href, variant }
 */
export function getNavbarLinks({ isAuthenticated, role, hasBusiness, currentBusiness }) {
  // Not logged in - Show public navigation
  if (!isAuthenticated) {
    const links = [
      { label: 'Home', href: '/' },
    ];
    
    // Only show marketplace link if feature is enabled
    if (MARKETPLACE_ENABLED) {
      links.push({ label: 'Marketplace', href: '/marketplace' });
    }
    
    links.push(
      { label: 'About', href: '/#about' },
      { label: 'Login', href: '/login' },
      { label: 'For Business Owners', href: '/owner-signup', isCTA: true }
    );
    
    return links;
  }

  // Logged in as owner - Show avatar dropdown items as links
  if (role === 'owner') {
    const links = [
      { label: 'Dashboard', href: '/dashboard' },
    ];
    
    // Add public page link if business exists and has slug
    if (hasBusiness && currentBusiness?.slug) {
      links.push({ 
        label: 'Public Page', 
        href: `/b/${currentBusiness.slug}`,
        icon: 'external'
      });
    }
    
    links.push(
      { label: 'Settings', href: '/dashboard/settings' },
      { label: 'Logout', type: 'button' }
    );
    
    return links;
  }

  // Logged in as client
  if (role === 'client') {
    const links = [
      { label: 'Home', href: '/client' },
    ];
    
    // Only show marketplace link if feature is enabled
    if (MARKETPLACE_ENABLED) {
      links.push({ label: 'Marketplace', href: '/marketplace' });
    }
    
    links.push({ label: 'Logout', type: 'button' });
    
    return links;
  }

  // Fallback
  return [
    { label: 'Home', href: '/' },
    { label: 'Logout', type: 'button' }
  ];
}
