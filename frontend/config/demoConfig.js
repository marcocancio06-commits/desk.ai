// ============================================================================
// SINGLE-TENANT DEMO CONFIGURATION
// ============================================================================
// To deploy for a new client, just change these values.
// This file is the single source of truth for the demo business.
// ============================================================================

export const DEMO_BUSINESS = {
  // Database identifiers
  id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',  // UUID in database
  slug: 'elite-auto-detail',                     // URL-friendly slug
  
  // Business information
  name: 'Elite Auto Detailing',
  phone: '+1 (832) 555-0123',
  email: 'info@eliteautodetailing.com',
  
  // Industry & services
  industry: 'auto_detailing',
  services: [
    'Interior Detailing',
    'Exterior Wash', 
    'Full Detail',
    'Ceramic Coating',
    'Paint Correction'
  ],
  
  // Service areas (ZIP codes)
  serviceAreas: ['77005', '77004', '77006', '77019', '77098'],
  
  // Branding
  branding: {
    primaryColor: '#3B82F6',
    logo: null // Add logo URL when available
  }
};

// Backend API URL
export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://growzone-dobi-production.up.railway.app';

// Demo mode flag - when true, auth is bypassed
export const DEMO_MODE = true;

// Helper to get the businessId to send to API
// Uses UUID for database queries
export const getBusinessId = () => DEMO_BUSINESS.id;

// Helper to get display name
export const getBusinessName = () => DEMO_BUSINESS.name;
