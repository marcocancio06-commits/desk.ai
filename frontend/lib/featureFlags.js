/**
 * Feature Flags for Desk.ai / Growzone
 * 
 * Centralized feature toggles for easy enable/disable of features
 * without deleting code. Set to true to enable, false to disable.
 */

/**
 * MARKETPLACE_ENABLED
 * Controls the Growzone Marketplace feature
 * 
 * When disabled:
 * - /marketplace and /market routes return empty/redirect
 * - Marketplace links removed from navigation
 * - Marketplace CTAs hidden from landing page
 * - API endpoints return empty arrays
 * - Dashboard/onboarding marketplace UI hidden
 * 
 * When enabled:
 * - Full marketplace functionality restored
 * 
 * To re-enable: Change this value to true
 */
export const MARKETPLACE_ENABLED = false;

/**
 * Future feature flags can be added here:
 * 
 * export const CALENDAR_ENABLED = true;
 * export const TEAM_COLLABORATION_ENABLED = false;
 * export const ADVANCED_ANALYTICS_ENABLED = false;
 */
