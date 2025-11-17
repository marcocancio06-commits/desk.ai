const { getBusinessConfig } = require('./businessConfig');
const Anthropic = require('@anthropic-ai/sdk');

// System prompt defining the role and behavior
const systemPrompt = `You are a professional front desk assistant for a local service business. Your role is to:
- Greet customers warmly and professionally
- Answer questions about services, pricing, hours, and service areas
- Collect necessary information to book appointments: ZIP code, issue description, preferred time
- Assess urgency level (low, normal, high, emergency)
- Be helpful, concise, and guide the conversation toward booking when appropriate
- Always stay in character as a helpful business representative

CRITICAL: You must respond with ONLY valid JSON. No markdown, no extra text, no code blocks.
Use this exact schema:
{
  "reply": "your response to the customer",
  "booking_intent": "none" or "collecting_info" or "ready_to_book",
  "collected_data": {
    "issue_summary": "brief description of the issue or null",
    "zip_code": "5-digit ZIP code or null",
    "preferred_time": "time preference or null",
    "urgency": "low" or "normal" or "high" or "emergency" or null
  },
  "internal_notes": "brief note about conversation state or null"
}`;

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

Respond to the customer and extract any relevant booking information. Return ONLY valid JSON, no other text.`;
}

// Extract data from message using simple pattern matching (fallback)
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

// Fallback response when LLM is unavailable
function getFallbackResponse() {
  return {
    reply: 'Thanks for your message — a team member will follow up shortly.',
    booking_intent: 'none',
    collected_data: {
      issue_summary: null,
      zip_code: null,
      preferred_time: null,
      urgency: null
    },
    internal_notes: 'LLM error, used fallback response.'
  };
}

async function handleCustomerMessage({ businessId, from, channel, message }) {
  const config = getBusinessConfig(businessId);
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  // Check if API key is available
  if (!apiKey) {
    console.warn('WARNING: ANTHROPIC_API_KEY not found in environment variables. Using fallback response.');
    return getFallbackResponse();
  }
  
  // Build the user prompt
  const userPrompt = buildUserPrompt({ config, channel, from, message });
  
  try {
    // Initialize the client
    const client = new Anthropic({
      apiKey: apiKey,
    });
    
    // Call the API
    const response = await client.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt
        }
      ],
    });
    
    // Extract the text content
    const textContent = response.content[0].text;
    
    // Parse the JSON response
    const parsedResponse = JSON.parse(textContent);
    
    // Validate the response has required fields
    if (!parsedResponse.reply || !parsedResponse.booking_intent || !parsedResponse.collected_data) {
      throw new Error('Invalid response structure from LLM');
    }
    
    return parsedResponse;
    
  } catch (error) {
    console.error('Error calling LLM:', error.message);
    
    // Return fallback response
    return getFallbackResponse();
  }
}

module.exports = { handleCustomerMessage };
