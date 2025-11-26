/**
 * Frontend Configuration
 * 
 * This file centralizes configuration values for the frontend application.
 * 
 * DEMO BUSINESS:
 * The demo business "Elite Auto Detailing" is used for:
 * - /demo-chat routes (sandbox for testing)
 * - Default business when no specific business is selected
 * 
 * The UUID matches the demo business created in the database.
 * Slug: elite-auto-detail
 * ID: a1b2c3d4-e5f6-7890-abcd-ef1234567890
 */

// Backend API configuration
// Change this URL when deploying to production
export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

// Demo business identifier - Elite Auto Detailing for car detailer demo
export const DEFAULT_BUSINESS_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

// Demo business slug for public URL
export const DEFAULT_BUSINESS_SLUG = 'elite-auto-detail';

