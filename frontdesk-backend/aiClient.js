const { getBusinessConfig } = require('./businessConfig');

async function handleCustomerMessage({ businessId, from, channel, message }) {
  const config = getBusinessConfig(businessId);
  const msgLower = message.toLowerCase().trim();
  
  // Greeting pattern
  if (msgLower.match(/^(hi|hello|hey|good morning|good afternoon|good evening)/)) {
    return {
      reply: `Hello! Welcome to ${config.name}. We're your trusted plumbing experts. We offer: ${config.services.join(', ')}. How can we help you today?`
    };
  }
  
  // Hours inquiry
  if (msgLower.includes('hour') || msgLower.includes('open') || msgLower.includes('when are you')) {
    return {
      reply: `Our hours are:\n• Weekdays: ${config.hours.weekdays}\n• Saturday: ${config.hours.saturday}\n• Sunday: ${config.hours.sunday}\n\n${config.policies.emergency}`
    };
  }
  
  // Pricing inquiry
  if (msgLower.includes('price') || msgLower.includes('cost') || msgLower.includes('how much') || msgLower.includes('charge')) {
    const pricingList = Object.entries(config.pricing)
      .map(([service, price]) => `• ${service}: ${price}`)
      .join('\n');
    
    return {
      reply: `Here are our typical price ranges:\n${pricingList}\n\n${config.policies.tripFee}\n\nWhat service do you need?`
    };
  }
  
  // ZIP code pattern (5 digits starting with 77)
  const zipMatch = msgLower.match(/\b(77\d{3})\b/);
  if (zipMatch) {
    const zip = zipMatch[1];
    
    if (config.serviceAreas.includes(zip)) {
      return {
        reply: `Great news! We serve the ${zip} area. What plumbing issue are you experiencing? Also, what time would work best for you?`
      };
    } else {
      return {
        reply: `Unfortunately, we don't currently serve the ${zip} area. We service these ZIP codes: ${config.serviceAreas.join(', ')}. If you're in one of these areas, we'd be happy to help!`
      };
    }
  }
  
  // Default response - gather information
  return {
    reply: `Thanks for reaching out to ${config.name}! To help you better, I need a few details:\n\n1. What's your ZIP code?\n2. What plumbing issue are you experiencing?\n3. What's your preferred appointment time?\n\nYou can also ask about our hours, pricing, or services anytime!`
  };
}

module.exports = { handleCustomerMessage };
