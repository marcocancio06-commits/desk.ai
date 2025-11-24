// Industry-based service generator
// Provides generic, factual service categories based on business industry

export const INDUSTRY_SERVICES = {
  plumbing: [
    { name: 'Leak Repairs', icon: '💧', description: 'Fix dripping faucets, pipes, and water leaks' },
    { name: 'Drain Cleaning', icon: '🚰', description: 'Clear clogged sinks, toilets, and drains' },
    { name: 'Water Heater Service', icon: '🔥', description: 'Installation, repair, and maintenance' },
    { name: 'Fixture Installation', icon: '🔧', description: 'Install sinks, faucets, and toilets' },
    { name: 'Pipe Repairs', icon: '⚙️', description: 'Repair or replace damaged piping' }
  ],
  
  hvac: [
    { name: 'AC Tune-Up', icon: '❄️', description: 'Seasonal maintenance and inspection' },
    { name: 'Heating Repairs', icon: '🔥', description: 'Furnace and heating system repairs' },
    { name: 'AC Repairs', icon: '🌬️', description: 'Air conditioning troubleshooting and fixes' },
    { name: 'Installation', icon: '🏠', description: 'New HVAC system installation' },
    { name: 'Duct Cleaning', icon: '🌪️', description: 'Air duct cleaning and maintenance' }
  ],
  
  electrical: [
    { name: 'Wiring Services', icon: '⚡', description: 'Electrical wiring and rewiring' },
    { name: 'Outlet Installation', icon: '🔌', description: 'Install or repair outlets and switches' },
    { name: 'Panel Upgrades', icon: '📊', description: 'Electrical panel repairs and upgrades' },
    { name: 'Lighting Installation', icon: '💡', description: 'Interior and exterior lighting' },
    { name: 'Safety Inspections', icon: '🔍', description: 'Electrical safety checks' }
  ],
  
  locksmith: [
    { name: 'Lock Installation', icon: '🔒', description: 'Install new locks and deadbolts' },
    { name: 'Lockout Service', icon: '🔑', description: 'Emergency lockout assistance' },
    { name: 'Rekeying', icon: '🗝️', description: 'Rekey existing locks' },
    { name: 'Key Duplication', icon: '🔐', description: 'Copy and duplicate keys' },
    { name: 'Security Upgrades', icon: '🛡️', description: 'Enhance home or business security' }
  ],
  
  'appliance_repair': [
    { name: 'Refrigerator Repair', icon: '🧊', description: 'Fix refrigerator and freezer issues' },
    { name: 'Washer/Dryer Repair', icon: '🧺', description: 'Repair washing machines and dryers' },
    { name: 'Oven Repair', icon: '🍳', description: 'Fix stoves, ovens, and ranges' },
    { name: 'Dishwasher Repair', icon: '🍽️', description: 'Repair dishwashers' },
    { name: 'Maintenance', icon: '🔧', description: 'Preventive appliance maintenance' }
  ],
  
  'general_contractor': [
    { name: 'Home Repairs', icon: '🏡', description: 'General home repair services' },
    { name: 'Remodeling', icon: '🔨', description: 'Kitchen, bathroom, and room remodels' },
    { name: 'Painting', icon: '🎨', description: 'Interior and exterior painting' },
    { name: 'Carpentry', icon: '🪚', description: 'Custom carpentry and woodwork' },
    { name: 'Handyman Services', icon: '🛠️', description: 'Various home improvement tasks' }
  ],
  
  handyman: [
    { name: 'General Repairs', icon: '🔧', description: 'Various household repairs' },
    { name: 'Furniture Assembly', icon: '🪑', description: 'Assemble furniture and fixtures' },
    { name: 'Drywall Repairs', icon: '🧱', description: 'Patch and repair walls' },
    { name: 'Minor Plumbing', icon: '🚰', description: 'Small plumbing fixes' },
    { name: 'Minor Electrical', icon: '💡', description: 'Basic electrical work' }
  ],
  
  default: [
    { name: 'Consultation', icon: '💬', description: 'Discuss your service needs' },
    { name: 'Estimates', icon: '📋', description: 'Free service estimates' },
    { name: 'Repairs', icon: '🔧', description: 'Professional repair services' },
    { name: 'Installation', icon: '⚙️', description: 'Installation services' },
    { name: 'Maintenance', icon: '🛠️', description: 'Regular maintenance' }
  ]
};

/**
 * Get service list for a specific industry
 * @param {string} industry - Business industry
 * @returns {Array} Array of service objects
 */
export function getIndustryServices(industry) {
  if (!industry) return INDUSTRY_SERVICES.default;
  
  const normalizedIndustry = industry.toLowerCase().replace(/\s+/g, '_');
  return INDUSTRY_SERVICES[normalizedIndustry] || INDUSTRY_SERVICES.default;
}

/**
 * Get SEO-friendly industry description
 * @param {string} industry - Business industry
 * @returns {string} Industry description
 */
export function getIndustryDescription(industry) {
  const descriptions = {
    plumbing: 'professional plumbing services',
    hvac: 'heating, ventilation, and air conditioning services',
    electrical: 'licensed electrical services',
    locksmith: 'locksmith and security services',
    appliance_repair: 'appliance repair and maintenance',
    general_contractor: 'general contracting and remodeling',
    handyman: 'handyman and home repair services'
  };
  
  return descriptions[industry?.toLowerCase()] || 'professional services';
}

/**
 * Format industry name for display
 * @param {string} industry - Business industry
 * @returns {string} Formatted industry name
 */
export function formatIndustryName(industry) {
  if (!industry) return '';
  
  const formatted = {
    plumbing: 'Plumbing',
    hvac: 'HVAC',
    electrical: 'Electrical',
    locksmith: 'Locksmith',
    appliance_repair: 'Appliance Repair',
    general_contractor: 'General Contractor',
    handyman: 'Handyman'
  };
  
  return formatted[industry.toLowerCase()] || industry.charAt(0).toUpperCase() + industry.slice(1);
}
