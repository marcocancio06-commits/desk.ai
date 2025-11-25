/**
 * Role-Based Permissions System
 * 
 * Defines what each role can access within a business
 */

export const ROLES = {
  OWNER: 'owner',
  STAFF: 'staff',
};

export const PERMISSIONS = {
  // Dashboard pages
  VIEW_DASHBOARD: 'view_dashboard',
  VIEW_LEADS: 'view_leads',
  VIEW_CALENDAR: 'view_calendar',
  VIEW_LOGS: 'view_logs',
  
  // Settings
  VIEW_SETTINGS: 'view_settings',
  EDIT_SETTINGS: 'edit_settings',
  
  // Team management
  VIEW_TEAM: 'view_team',
  INVITE_TEAM: 'invite_team',
  REMOVE_TEAM: 'remove_team',
  
  // Business management
  EDIT_BUSINESS: 'edit_business',
  DELETE_BUSINESS: 'delete_business',
};

// Define what each role can do
export const ROLE_PERMISSIONS = {
  [ROLES.OWNER]: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_LEADS,
    PERMISSIONS.VIEW_CALENDAR,
    PERMISSIONS.VIEW_LOGS,
    PERMISSIONS.VIEW_SETTINGS,
    PERMISSIONS.EDIT_SETTINGS,
    PERMISSIONS.VIEW_TEAM,
    PERMISSIONS.INVITE_TEAM,
    PERMISSIONS.REMOVE_TEAM,
    PERMISSIONS.EDIT_BUSINESS,
    PERMISSIONS.DELETE_BUSINESS,
  ],
  [ROLES.STAFF]: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_LEADS,
    PERMISSIONS.VIEW_CALENDAR,
    PERMISSIONS.VIEW_LOGS,
  ],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role, permission) {
  if (!role) return false;
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}

/**
 * Check if role can access a specific page
 */
export function canAccessPage(role, page) {
  const pagePermissions = {
    '/dashboard': PERMISSIONS.VIEW_DASHBOARD,
    '/dashboard/leads': PERMISSIONS.VIEW_LEADS,
    '/dashboard/calendar': PERMISSIONS.VIEW_CALENDAR,
    '/dashboard/logs': PERMISSIONS.VIEW_LOGS,
    '/dashboard/settings': PERMISSIONS.VIEW_SETTINGS,
    '/dashboard/team': PERMISSIONS.VIEW_TEAM,
  };
  
  const requiredPermission = pagePermissions[page];
  if (!requiredPermission) return true; // No permission required
  
  return hasPermission(role, requiredPermission);
}

/**
 * Get redirect path for unauthorized access
 */
export function getUnauthorizedRedirect(role) {
  // Staff users who hit unauthorized pages go to dashboard
  if (role === ROLES.STAFF) {
    return '/dashboard';
  }
  // Default redirect
  return '/dashboard';
}

/**
 * Filter sidebar links based on role
 */
export function getAuthorizedLinks(role, allLinks) {
  return allLinks.filter(link => {
    if (!link.permission) return true; // No permission required
    return hasPermission(role, link.permission);
  });
}
