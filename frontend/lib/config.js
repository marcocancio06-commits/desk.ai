/**
 * Frontend Configuration
 * 
 * This file centralizes configuration values for the frontend application.
 * 
 * DEMO BUSINESS:
 * The demo business "Houston Premier Plumbing" is used for:
 * - /demo-chat routes (sandbox for testing)
 * - Default business when no specific business is selected
 * 
 * The UUID matches the demo business created in the database migration.
 * Slug: demo-plumbing
 * ID: 00000000-0000-0000-0000-000000000001
 */

// Backend API configuration
// Change this URL when deploying to production
export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

// Demo business identifier - UUID from database migration
export const DEFAULT_BUSINESS_ID = '00000000-0000-0000-0000-000000000001';

// Demo business slug for public URL
export const DEFAULT_BUSINESS_SLUG = 'demo-plumbing';

