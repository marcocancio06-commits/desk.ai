const { supabase } = require('./supabaseClient');
const logger = require('./logger');

// ============================================================================
// MULTI-TENANT BUSINESS CONFIGURATION
// ============================================================================
// This module fetches business-specific configuration from the database
// to enable per-business AI customization and training.
//
// KEY FEATURES:
// 1. Database-driven config (businesses table)
// 2. Business-specific training context (industry, service areas)
// 3. Custom settings support (business_settings table)
// 4. Fallback to demo business for backward compatibility
// ============================================================================

/**
 * Fetch business configuration from database by business ID (UUID or slug)
 * Returns business-specific data for AI prompt construction
 * 
 * @param {string} businessId - Business UUID or slug (e.g., 'demo-plumbing' or UUID)
 * @returns {Promise<Object>} Business configuration object
 */
async function getBusinessConfig(businessId) {
  // ===== FALLBACK: Demo Business (for backward compatibility) =====
  const DEMO_CONFIG = {
    business_id: 'elite-auto-detail',
    business_name: 'Elite Auto Detailing',
    name: 'Elite Auto Detailing',
    serviceAreas: ['77005', '77004', '77006', '77019', '77098'],
    services: [
      'interior detailing',
      'exterior wash',
      'full detail',
      'ceramic coating',
      'paint correction'
    ],
    pricing: {
      'interior detailing': '$150–$250',
      'exterior wash': '$50–$100',
      'full detail': '$250–$400',
      'ceramic coating': '$500–$1200',
      'paint correction': '$300–$600'
    },
    hours: {
      monday: '8:00 AM - 6:00 PM',
      tuesday: '8:00 AM - 6:00 PM',
      wednesday: '8:00 AM - 6:00 PM',
      thursday: '8:00 AM - 6:00 PM',
      friday: '8:00 AM - 6:00 PM',
      saturday: '9:00 AM - 4:00 PM',
      sunday: 'Closed'
    },
    policies: {
      cancellation: '24-hour notice required',
      payment: 'Payment due upon completion'
    },
    industry: 'auto_detailing',
    // TODO: Add training_context field for per-business AI customization
    training_context: null
  };

  // If no database connection, return demo config
  if (!supabase) {
    logger.warn('No database connection, using demo config', { businessId });
    return DEMO_CONFIG;
  }

  try {
    // ===== STEP 1: Fetch business from database =====
    // Support both UUID and slug lookups
    let query = supabase
      .from('businesses')
      .select(`
        id,
        slug,
        name,
        industry,
        service_zip_codes,
        phone,
        email,
        is_active,
        created_at
      `)
      .eq('is_active', true)
      .single();

    // Determine if businessId is a UUID or slug
    const isUUID = businessId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    
    if (isUUID) {
      query = query.eq('id', businessId);
    } else {
      query = query.eq('slug', businessId);
    }

    const { data: business, error: businessError } = await query;

    if (businessError || !business) {
      // Special case: if looking for 'demo-plumbing' slug, use demo UUID
      if (businessId === 'demo-plumbing' || businessId === '00000000-0000-0000-0000-000000000001') {
        logger.warn('Demo business not found in database, using hardcoded config', { businessId });
        return DEMO_CONFIG;
      }
      
      logger.warn('Business not found in database, using demo config', { 
        businessId, 
        error: businessError?.message 
      });
      return DEMO_CONFIG;
    }

    logger.info('Loaded business config from database', { 
      businessId: business.id, 
      slug: business.slug,
      industry: business.industry 
    });

    // ===== STEP 2: Fetch business settings (if any) =====
    // TODO: Query business_settings table for custom AI behavior
    // Example: custom_greeting, faq_enabled, escalation_rules, etc.
    const { data: settings, error: settingsError } = await supabase
      .from('business_settings')
      .select('*')
      .eq('business_id', business.id)
      .maybeSingle();

    if (settingsError && settingsError.code !== 'PGRST116') {
      logger.warn('Error fetching business settings', { 
        businessId: business.id, 
        error: settingsError.message 
      });
    }

    // ===== STEP 3: Build config object =====
    const config = {
      business_id: business.id,
      business_name: business.name,
      name: business.name, // Alias for backward compatibility
      serviceAreas: business.service_zip_codes || [],
      industry: business.industry || 'general',
      phone: business.phone,
      email: business.email,
      
      // Industry-based defaults (can be overridden by settings)
      services: getDefaultServicesForIndustry(business.industry),
      pricing: getDefaultPricingForIndustry(business.industry),
      hours: settings?.hours || {
        weekdays: '8:00 AM - 6:00 PM',
        saturday: '9:00 AM - 4:00 PM',
        sunday: 'Closed'
      },
      policies: settings?.policies || {
        tripFee: 'Standard service call fee applies',
        cancellation: 'Free cancellation up to 2 hours before appointment',
        emergency: '24/7 emergency service available'
      },
      
      // ===== TRAINING HOOKS (for future per-business AI customization) =====
      // TODO: Implement these features:
      // - settings.custom_greeting: Override default AI greeting
      // - settings.faq_content: Inject business-specific FAQ into AI context
      // - settings.service_scripts: Custom response templates
      // - settings.escalation_rules: When to transfer to human
      // - settings.brand_voice: Tone/style guidelines (formal, casual, etc.)
      training_context: settings?.training_context || null,
      custom_greeting: settings?.custom_greeting || null,
      faq_enabled: settings?.faq_enabled || false,
      
      // Raw settings for advanced customization
      _settings: settings
    };

    return config;

  } catch (error) {
    logger.error('Error loading business config from database', { 
      businessId, 
      error: error.message 
    });
    
    // Fallback to demo config on error
    return DEMO_CONFIG;
  }
}

/**
 * Get default services based on industry
 * This is a fallback when business hasn't customized their service list
 * 
 * @param {string} industry - Industry slug (plumbing, hvac, electrical, etc.)
 * @returns {string[]} Array of service names
 */
function getDefaultServicesForIndustry(industry) {
  const industryServices = {
    plumbing: [
      'drain cleaning',
      'water heater repair',
      'leak detection',
      'toilet repair',
      'emergency plumbing'
    ],
    hvac: [
      'AC repair',
      'heating repair',
      'thermostat installation',
      'duct cleaning',
      'emergency HVAC service'
    ],
    electrical: [
      'outlet installation',
      'circuit breaker repair',
      'lighting installation',
      'electrical inspection',
      'emergency electrical service'
    ],
    roofing: [
      'roof repair',
      'roof replacement',
      'gutter installation',
      'leak repair',
      'emergency roof repair'
    ],
    cleaning: [
      'deep cleaning',
      'move-out cleaning',
      'carpet cleaning',
      'window cleaning',
      'recurring cleaning service'
    ],
    handyman: [
      'general repairs',
      'furniture assembly',
      'drywall repair',
      'door installation',
      'home maintenance'
    ]
  };

  return industryServices[industry] || [
    'general service',
    'repairs',
    'maintenance',
    'emergency service'
  ];
}

/**
 * Get default pricing based on industry
 * This is a fallback when business hasn't set custom pricing
 * 
 * @param {string} industry - Industry slug
 * @returns {Object} Pricing object with service: price mapping
 */
function getDefaultPricingForIndustry(industry) {
  const industryPricing = {
    plumbing: {
      'drain cleaning': '$150–$250',
      'water heater repair': '$200–$400',
      'leak detection': '$125–$200',
      'toilet repair': '$100–$175',
      'emergency plumbing': '$250–$500'
    },
    hvac: {
      'AC repair': '$200–$400',
      'heating repair': '$200–$400',
      'thermostat installation': '$150–$250',
      'duct cleaning': '$300–$500',
      'emergency HVAC service': '$300–$600'
    },
    electrical: {
      'outlet installation': '$100–$200',
      'circuit breaker repair': '$150–$300',
      'lighting installation': '$125–$250',
      'electrical inspection': '$100–$175',
      'emergency electrical service': '$250–$500'
    },
    roofing: {
      'roof repair': '$300–$800',
      'roof replacement': '$5,000–$15,000',
      'gutter installation': '$500–$1,500',
      'leak repair': '$200–$500',
      'emergency roof repair': '$400–$1,000'
    },
    cleaning: {
      'deep cleaning': '$200–$400',
      'move-out cleaning': '$250–$450',
      'carpet cleaning': '$150–$300',
      'window cleaning': '$100–$250',
      'recurring cleaning service': '$150–$300 per visit'
    },
    handyman: {
      'general repairs': '$100–$200',
      'furniture assembly': '$75–$150',
      'drywall repair': '$100–$250',
      'door installation': '$150–$350',
      'home maintenance': '$100–$200 per hour'
    }
  };

  return industryPricing[industry] || {
    'general service': '$100–$200',
    'emergency service': '$200–$400'
  };
}

module.exports = { getBusinessConfig };
