/**
 * Frontend Configuration
 * 
 * This file centralizes configuration values for the frontend application.
 * 
 * DEMO BUSINESS ID:
 * For now, we only support a single demo business account. This ID is used
 * across all API calls to identify which business the data belongs to.
 * 
 * In the future, this will be replaced with:
 * - Real user authentication (login/signup)
 * - Multi-tenant support (each business owner gets their own account)
 * - Dynamic business ID from auth context/session
 * 
 * For now, all demo data is tied to this single business ID.
 * This matches the demo business in the database (see schema.sql initial data).
 */

// Backend API configuration
// Change this URL when deploying to production
export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

// Demo business identifier - matches the demo business in schema.sql
export const DEFAULT_BUSINESS_ID = 'demo-business-001';
