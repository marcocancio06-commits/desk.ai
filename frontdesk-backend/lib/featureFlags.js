/**
 * Feature Flags for Desk.ai Backend
 * 
 * Centralized feature toggles for easy enable/disable of features
 * without deleting code. Set to true to enable, false to disable.
 */

/**
 * MARKETPLACE_ENABLED
 * Controls the Growzone Marketplace feature
 * 
 * When disabled:
 * - /api/marketplace returns empty array
 * - /api/marketplace/businesses returns empty array
 * - Marketplace-related business fields still stored but not exposed
 * 
 * When enabled:
 * - Full marketplace API functionality restored
 * 
 * To re-enable: Change this value to true
 */
const MARKETPLACE_ENABLED = false;

module.exports = {
  MARKETPLACE_ENABLED
};
