const { getBusinessConfig } = require('./businessConfig');

// System prompt defining the role and behavior
const systemPrompt = `You are a professional front desk assistant for a local service business. Your role is to:
- Greet customers warmly and professionally
- Answer questions about services, pricing, hours, and service areas
- Collect necessary information to book appointments: ZIP code, issue description, preferred time
- Assess urgency level (low, normal, high, emergency)
- Be helpful, concise, and guide the conversation toward booking when appropriate
- Always stay in character as a helpful business representative`;

// Build a prompt string from business context and customer message
function buildUserPrompt({ config, channel, from, message }) {
  const servicesList = config.services.join(', ');
  const serviceAreas = config.serviceAreas.join(', ');
  const pricingInfo = Object.entries(config.pricing)
    .map(([service, price]) => `${service}: ${price}`)
    .join(', ');
  
  return `Business: ${config.name}
Services: ${servicesList}
Service Areas (ZIP codes): ${serviceAreas}
Pricing: ${pricingInfo}
Hours: Weekdays ${config.hours.weekdays}, Saturday ${config.hours.saturday}, Sunday ${config.hours.sunday}
Policies: ${config.policies.tripFee}

Channel: ${channel}
Customer ID: ${from}
Customer Message: "${message}"

Respond to the customer and extract any relevant booking information.`;
}

// Extract data from message using simple pattern matching
function extractDataFromMessage(message, msgLower) {
  const data = {
    issue_summary: null,
    zip_code: null,
    preferred_time: null,
    urgency: null
  };
  
  // Extract ZIP code
  const zipMatch = msgLower.match(/\b(77\d{3})\b/);
  if (zipMatch) {
    data.zip_code = zipMatch[1];
  }
  
  // Detect urgency
  if (msgLower.includes('emergency') || msgLower.includes('urgent') || msgLower.includes('asap') || msgLower.includes('right now')) {
    data.urgency = 'emergency';
  } else if (msgLower.includes('soon') || msgLower.includes('today')) {
    data.urgency = 'high';
  } else if (msgLower.includes('whenever') || msgLower.includes('no rush')) {
    data.urgency = 'low';
  }
  
  // Extract time preferences
  const timePatterns = [
    /\b(morning|afternoon|evening)\b/,
    /\b(today|tomorrow|this week|next week)\b/,
    /\b(\d{1,2}:\d{2}\s?(?:am|pm)?)\b/,
    /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/
  ];
  
  for (const pattern of timePatterns) {
    const match = msgLower.match(pattern);
    if (match) {
      data.preferred_time = match[0];
      break;
    }
  }
  
  // Extract issue keywords
  const issueKeywords = ['leak', 'clog', 'drain', 'toilet', 'water heater', 'pipe', 'faucet', 'broken', 'not working'];
  const foundIssues = issueKeywords.filter(keyword => msgLower.includes(keyword));
  if (foundIssues.length > 0) {
    data.issue_summary = foundIssues.join(', ');
  }
  
  return data;
}

async function handleCustomerMessage({ businessId, from, channel, message }) {
  const config = getBusinessConfig(businessId);
  const msgLower = message.toLowerCase().trim();
  
  // Build the prompt (for future LLM integration)
  const userPrompt = buildUserPrompt({ config, channel, from, message });
  
  // Extract data from the message
  const extractedData = extractDataFromMessage(message, msgLower);
  
  // Initialize response structure
  let reply = '';
  let bookingIntent = 'none';
  let internalNotes = null;
  
  // Greeting pattern
  if (msgLower.match(/^(hi|hello|hey|good morning|good afternoon|good evening)/)) {
    reply = `Hello! Welcome to ${config.name}. We're your trusted plumbing experts. We offer: ${config.services.join(', ')}. How can we help you today?`;
    bookingIntent = 'none';
    internalNotes = 'Customer initiated conversation with greeting';
  }
  
  // Hours inquiry
  else if (msgLower.includes('hour') || msgLower.includes('open') || msgLower.includes('when are you')) {
    reply = `Our hours are:\n• Weekdays: ${config.hours.weekdays}\n• Saturday: ${config.hours.saturday}\n• Sunday: ${config.hours.sunday}\n\n${config.policies.emergency}`;
    bookingIntent = 'none';
    internalNotes = 'Customer asking about business hours';
  }
  
  // Pricing inquiry
  else if (msgLower.includes('price') || msgLower.includes('cost') || msgLower.includes('how much') || msgLower.includes('charge')) {
    const pricingList = Object.entries(config.pricing)
      .map(([service, price]) => `• ${service}: ${price}`)
      .join('\n');
    
    reply = `Here are our typical price ranges:\n${pricingList}\n\n${config.policies.tripFee}\n\nWhat service do you need?`;
    bookingIntent = 'none';
    internalNotes = 'Customer inquiring about pricing';
  }
  
  // ZIP code pattern (5 digits starting with 77)
  else if (extractedData.zip_code) {
    const zip = extractedData.zip_code;
    
    if (config.serviceAreas.includes(zip)) {
      reply = `Great news! We serve the ${zip} area. What plumbing issue are you experiencing? Also, what time would work best for you?`;
      bookingIntent = 'collecting_info';
      internalNotes = `Customer in service area ${zip}, collecting issue and time preference`;
    } else {
      reply = `Unfortunately, we don't currently serve the ${zip} area. We service these ZIP codes: ${config.serviceAreas.join(', ')}. If you're in one of these areas, we'd be happy to help!`;
      bookingIntent = 'none';
      internalNotes = `Customer outside service area (${zip})`;
    }
  }
  
  // Has issue description - collecting more info
  else if (extractedData.issue_summary) {
    reply = `I understand you're having trouble with ${extractedData.issue_summary}. To help you better, could you provide:\n• Your ZIP code\n• When you'd like us to come out`;
    bookingIntent = 'collecting_info';
    internalNotes = 'Customer described issue, need ZIP and time';
  }
  
  // Default response - gather information
  else {
    reply = `Thanks for reaching out to ${config.name}! To help you better, I need a few details:\n\n1. What's your ZIP code?\n2. What plumbing issue are you experiencing?\n3. What's your preferred appointment time?\n\nYou can also ask about our hours, pricing, or services anytime!`;
    bookingIntent = 'collecting_info';
    internalNotes = 'Initial contact, gathering all information';
  }
  
  // Check if we have enough info to book
  if (extractedData.zip_code && extractedData.issue_summary && extractedData.preferred_time) {
    if (config.serviceAreas.includes(extractedData.zip_code)) {
      bookingIntent = 'ready_to_book';
      internalNotes = 'All booking information collected and validated';
    }
  }
  
  return {
    reply,
    booking_intent: bookingIntent,
    collected_data: {
      issue_summary: extractedData.issue_summary,
      zip_code: extractedData.zip_code,
      preferred_time: extractedData.preferred_time,
      urgency: extractedData.urgency
    },
    internal_notes: internalNotes
  };
}

module.exports = { handleCustomerMessage };
