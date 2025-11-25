/**
 * Supabase Auth Helper for Desk.ai Backend
 * 
 * Provides authentication utilities for verifying Supabase tokens
 * and loading user/business context from requests.
 */

const { supabase } = require('./supabaseClient');
const db = require('./db');

/**
 * Verify Supabase access token and get user info
 * @param {string} accessToken - JWT access token from Supabase
 * @returns {Promise<{user: object, error: object}>}
 */
async function verifyAccessToken(accessToken) {
  if (!supabase) {
    return { user: null, error: { message: 'Supabase not configured' } };
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error) {
      console.error('Token verification failed:', error.message);
      return { user: null, error };
    }

    return { user, error: null };
  } catch (error) {
    console.error('Token verification error:', error);
    return { user: null, error };
  }
}

/**
 * Get or create user profile from Supabase auth user
 * @param {string} userId - Supabase auth user ID
 * @param {object} authUser - Full auth user object (optional, for initial creation)
 * @returns {Promise<object>} Profile object
 */
async function getOrCreateProfile(userId, authUser = null) {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  // Try to get existing profile
  const { data: existingProfile, error: fetchError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (existingProfile) {
    return existingProfile;
  }

  // Profile doesn't exist, create it
  const { data: newProfile, error: createError } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      full_name: authUser?.user_metadata?.full_name || authUser?.email?.split('@')[0] || 'User',
      email: authUser?.email,
      role: authUser?.user_metadata?.role || 'client' // Use role from signup metadata
    })
    .select()
    .single();

  if (createError) {
    console.error('Error creating profile:', createError);
    throw createError;
  }

  // Only auto-assign to demo business if role is 'client' (not owner)
  if (newProfile.role === 'client') {
    await assignUserToDemoBusiness(userId);
  }
  // Owners will create their business during onboarding

  return newProfile;
}

/**
 * Automatically assign a new user to the demo business
 * This is temporary - will be replaced with proper onboarding
 * @param {string} userId - User ID to assign
 */
async function assignUserToDemoBusiness(userId) {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  const DEMO_BUSINESS_ID = '00000000-0000-0000-0000-000000000001';

  try {
    // Check if user already has a business assignment
    const { data: existingAssignment } = await supabase
      .from('business_users')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (existingAssignment) {
      console.log(`User ${userId} already assigned to a business`);
      return;
    }

    // Assign to demo business as owner
    const { data, error } = await supabase
      .from('business_users')
      .insert({
        business_id: DEMO_BUSINESS_ID,
        user_id: userId,
        role: 'owner',
        is_default: true
      })
      .select()
      .single();

    if (error) {
      console.error('Error assigning user to demo business:', error);
      throw error;
    }

    console.log(`✅ User ${userId} assigned to demo-plumbing business`);
    return data;
  } catch (error) {
    console.error('Error in assignUserToDemoBusiness:', error);
    throw error;
  }
}

/**
 * Get user's default or first business
 * @param {string} userId - User ID
 * @returns {Promise<object|null>} Business object or null
 */
async function getUserDefaultBusiness(userId) {
  if (!supabase) {
    return null;
  }

  try {
    // First, try to get default business
    const { data: defaultAssignment } = await supabase
      .from('business_users')
      .select('business_id, businesses(*)')
      .eq('user_id', userId)
      .eq('is_default', true)
      .single();

    if (defaultAssignment?.businesses) {
      return {
        ...defaultAssignment.businesses,
        userRole: defaultAssignment.role
      };
    }

    // No default set, get first business
    const { data: assignments } = await supabase
      .from('business_users')
      .select('business_id, role, businesses(*)')
      .eq('user_id', userId)
      .limit(1);

    if (assignments && assignments.length > 0) {
      return {
        ...assignments[0].businesses,
        userRole: assignments[0].role
      };
    }

    return null;
  } catch (error) {
    console.error('Error getting user default business:', error);
    return null;
  }
}

/**
 * Extract auth context from Express request
 * Checks for Authorization header or demo mode
 * 
 * @param {object} req - Express request object
 * @returns {Promise<{userId: string|null, businessId: string|null, profile: object|null, business: object|null, isDemo: boolean}>}
 */
async function getContextFromRequest(req) {
  const context = {
    userId: null,
    businessId: null,
    profile: null,
    business: null,
    isDemo: false
  };

  // Check for demo mode (allows public access to demo data)
  const queryBusinessId = req.query.businessId || req.body?.businessId;
  if (queryBusinessId === 'demo-plumbing' || queryBusinessId === '00000000-0000-0000-0000-000000000001') {
    context.isDemo = true;
    context.businessId = '00000000-0000-0000-0000-000000000001';
    return context;
  }

  // Extract access token from Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return context; // No auth, return empty context
  }

  const accessToken = authHeader.substring(7); // Remove "Bearer " prefix

  // Verify token and get user
  const { user, error } = await verifyAccessToken(accessToken);
  if (error || !user) {
    return context; // Invalid token
  }

  context.userId = user.id;

  // Get or create user profile
  try {
    context.profile = await getOrCreateProfile(user.id, user);
  } catch (error) {
    console.error('Error loading profile:', error);
    return context;
  }

  // Get user's default business
  const business = await getUserDefaultBusiness(user.id);
  if (business) {
    context.business = business;
    context.businessId = business.id;
  }

  return context;
}

/**
 * Express middleware to require authentication
 * Usage: app.get('/api/protected', requireAuth, (req, res) => { ... })
 */
async function requireAuth(req, res, next) {
  const context = await getContextFromRequest(req);
  
  if (!context.userId && !context.isDemo) {
    return res.status(401).json({
      ok: false,
      error: 'Authentication required',
      code: 'UNAUTHORIZED'
    });
  }

  // Attach context to request for use in route handlers
  req.authContext = context;
  next();
}

/**
 * Express middleware to require business access
 * User must be authenticated AND have a business assigned
 */
async function requireBusiness(req, res, next) {
  const context = await getContextFromRequest(req);
  
  if (!context.businessId && !context.isDemo) {
    if (!context.userId) {
      return res.status(401).json({
        ok: false,
        error: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
    }
    
    return res.status(403).json({
      ok: false,
      error: 'No business assigned to user',
      code: 'NO_BUSINESS'
    });
  }

  req.authContext = context;
  next();
}

/**
 * Verify user has access to a specific business
 * Checks business_users table for ownership/membership
 * @param {string} userId - User ID
 * @param {string} businessId - Business ID to check access for
 * @returns {Promise<{hasAccess: boolean, role: string|null}>}
 */
async function verifyBusinessAccess(userId, businessId) {
  if (!supabase) {
    return { hasAccess: false, role: null };
  }

  try {
    const { data, error } = await supabase
      .from('business_users')
      .select('role')
      .eq('user_id', userId)
      .eq('business_id', businessId)
      .single();

    if (error || !data) {
      return { hasAccess: false, role: null };
    }

    return { hasAccess: true, role: data.role };
  } catch (error) {
    console.error('Error verifying business access:', error);
    return { hasAccess: false, role: null };
  }
}

/**
 * Express middleware to verify user owns or has access to the business in the request
 * Requires businessId in req.params or req.query or req.body
 * Usage: app.get('/api/business/:businessId/data', requireAuth, requireBusinessOwnership, ...)
 */
async function requireBusinessOwnership(req, res, next) {
  const context = req.authContext;
  
  if (!context || !context.userId) {
    return res.status(401).json({
      ok: false,
      error: 'Authentication required',
      code: 'UNAUTHORIZED'
    });
  }

  // Demo mode allows access
  if (context.isDemo) {
    return next();
  }

  // Get businessId from params, query, or body
  const requestedBusinessId = req.params.businessId || req.query.businessId || req.body?.businessId;
  
  if (!requestedBusinessId) {
    return res.status(400).json({
      ok: false,
      error: 'business_id required',
      code: 'BUSINESS_ID_REQUIRED'
    });
  }

  // Verify user has access to this business
  const { hasAccess, role } = await verifyBusinessAccess(context.userId, requestedBusinessId);
  
  if (!hasAccess) {
    return res.status(403).json({
      ok: false,
      error: 'Access denied - you do not have permission to access this business',
      code: 'FORBIDDEN'
    });
  }

  // Attach verified business info to context
  req.authContext.verifiedBusinessId = requestedBusinessId;
  req.authContext.businessRole = role;
  
  next();
}

/**
 * Get all businesses a user has access to
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of businesses with user roles
 */
async function getUserBusinesses(userId) {
  if (!supabase) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('business_users')
      .select(`
        role,
        is_default,
        businesses (
          id,
          slug,
          name,
          phone,
          email,
          industry,
          is_active,
          subscription_tier
        )
      `)
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching user businesses:', error);
      return [];
    }

    return data.map(item => ({
      ...item.businesses,
      userRole: item.role,
      isDefault: item.is_default
    }));
  } catch (error) {
    console.error('Error in getUserBusinesses:', error);
    return [];
  }
}

module.exports = {
  verifyAccessToken,
  getOrCreateProfile,
  assignUserToDemoBusiness,
  getUserDefaultBusiness,
  getContextFromRequest,
  requireAuth,
  requireBusiness,
  requireBusinessOwnership,
  verifyBusinessAccess,
  getUserBusinesses
};
