const { getBusinessConfig } = require('./businessConfig');
const Anthropic = require('@anthropic-ai/sdk');

// ============================================================================
// IMPROVED SYSTEM PROMPT - Dramatically smarter, with few-shot examples
// ============================================================================
const systemPrompt = `You are Desk.ai, the AI front desk for local service businesses (plumbing, HVAC, electricians, cleaning, appliance repair, etc.)

Your job is to carry a short, friendly conversation and collect exactly four fields:

1. issue_summary — what's wrong + any relevant details
2. zip_code — customer location (5 digits)
3. preferred_time — when they want service
4. urgency — "emergency" | "high" | "normal"

CONVERSATION BEHAVIOR:
• Ask one or two questions at a time, SMS-style (short & natural)
• If a field is missing, you MUST ask for it explicitly
• If the customer is vague (e.g., "Help, something's broken"), ask clarifying questions
• If customer asks unrelated questions, answer briefly then guide back to the goal
• When all four fields are collected, set booking_intent="ready_to_book" and give a short confirmation message
• Always be friendly, concise, and natural — this is a real customer texting a business

OUTPUT RULES:
• Always return valid JSON only, following this exact structure:

{
  "reply": "...",
  "booking_intent": "none | collecting_info | ready_to_book",
  "collected_data": {
    "issue_summary": "...",
    "zip_code": "...",
    "preferred_time": "...",
    "urgency": "emergency | high | normal"
  },
  "internal_notes": "Short summary for business owner, 1–2 sentences max."
}

• Never include explanation, reasoning, or text outside JSON
• If user gives multiple pieces of info at once, extract everything you can
• Use "none" for urgency only if truly unknown; default to "normal" if unclear

FEW-SHOT EXAMPLES:

Example 1 - Initial contact:
User: "My water heater is leaking everywhere"
Assistant: {
  "reply": "Oh no, a leaking water heater needs immediate attention! What's your ZIP code so I can confirm we service your area?",
  "booking_intent": "collecting_info",
  "collected_data": {
    "issue_summary": "water heater leaking",
    "zip_code": null,
    "preferred_time": null,
    "urgency": "emergency"
  },
  "internal_notes": "Emergency leak reported, collecting ZIP code next."
}

Example 2 - Multiple data points at once:
User: "I'm in 77001 and need someone this afternoon if possible, my toilet won't flush"
Assistant: {
  "reply": "Got it — clogged toilet in 77001, this afternoon. We can definitely help! Just to confirm the urgency, is this your only toilet or do you have another one you can use?",
  "booking_intent": "collecting_info",
  "collected_data": {
    "issue_summary": "toilet won't flush",
    "zip_code": "77001",
    "preferred_time": "this afternoon",
    "urgency": "high"
  },
  "internal_notes": "Customer provided issue, ZIP, and time. Confirming urgency level."
}

Example 3 - Ready to book:
User: "Yeah it's the only one, so kinda urgent"
Assistant: {
  "reply": "Understood! We'll prioritize this. I have you down for a clogged toilet in 77001, this afternoon, marked as high priority. A technician will reach out within the hour to confirm the exact time. Anything else I should know?",
  "booking_intent": "ready_to_book",
  "collected_data": {
    "issue_summary": "toilet won't flush, only toilet in home",
    "zip_code": "77001",
    "preferred_time": "this afternoon",
    "urgency": "high"
  },
  "internal_notes": "All info collected. Customer ready to book, high priority single-toilet issue."
}

NOW HANDLE THE CUSTOMER'S MESSAGE USING THESE GUIDELINES.`;

// ============================================================================
// BUILD USER PROMPT - Now includes conversation state for better extraction
// ============================================================================
function buildUserPrompt({ config, channel, from, message, conversationState = null }) {
  const servicesList = config.services.join(', ');
  const serviceAreas = config.serviceAreas.join(', ');
  const pricingInfo = Object.entries(config.pricing)
    .map(([service, price]) => `${service}: ${price}`)
    .join(', ');
  
  let stateInfo = '';
  if (conversationState && conversationState.collected_data) {
    const { issue_summary, zip_code, preferred_time, urgency } = conversationState.collected_data;
    const missing = [];
    if (!issue_summary) missing.push('issue_summary');
    if (!zip_code) missing.push('zip_code');
    if (!preferred_time) missing.push('preferred_time');
    if (!urgency || urgency === 'none') missing.push('urgency');
    
    stateInfo = `
CONVERSATION STATE (what you've already collected):
- Issue: ${issue_summary || 'NOT YET COLLECTED'}
- ZIP Code: ${zip_code || 'NOT YET COLLECTED'}
- Preferred Time: ${preferred_time || 'NOT YET COLLECTED'}
- Urgency: ${urgency || 'NOT YET COLLECTED'}

STILL MISSING: ${missing.length > 0 ? missing.join(', ') : 'Nothing! All fields collected.'}

IMPORTANT: Only ask for fields that are still missing. Don't re-ask for data you already have.`;
  }
  
  return `Business: ${config.name}
Services: ${servicesList}
Service Areas (ZIP codes): ${serviceAreas}
Pricing: ${pricingInfo}
Hours: Weekdays ${config.hours.weekdays}, Saturday ${config.hours.saturday}, Sunday ${config.hours.sunday}
Policies: ${config.policies.tripFee}
${stateInfo}

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

// ============================================================================
// IMPROVED FALLBACK - Uses simple extraction when AI is unavailable
// ============================================================================
function getFallbackResponse(message) {
  const msgLower = message.toLowerCase();
  const extractedData = extractDataFromMessage(message, msgLower);
  
  return {
    reply: 'Thanks for reaching out! We received your message and will get back to you shortly.',
    booking_intent: 'collecting_info',
    collected_data: extractedData,
    internal_notes: 'LLM unavailable, used fallback extraction.'
  };
}

// ============================================================================
// VALIDATE RESPONSE - Ensures the AI response is complete and valid
// ============================================================================
function validateResponse(parsed, message) {
  const issues = [];
  
  // Check required top-level fields
  if (!parsed.reply || typeof parsed.reply !== 'string') {
    issues.push('missing or invalid reply');
  }
  if (!parsed.booking_intent || !['none', 'collecting_info', 'ready_to_book'].includes(parsed.booking_intent)) {
    issues.push('missing or invalid booking_intent');
  }
  if (!parsed.collected_data || typeof parsed.collected_data !== 'object') {
    issues.push('missing collected_data');
  }
  
  // Check collected_data fields exist
  if (parsed.collected_data) {
    const requiredFields = ['issue_summary', 'zip_code', 'preferred_time', 'urgency'];
    for (const field of requiredFields) {
      if (!(field in parsed.collected_data)) {
        issues.push(`missing field: ${field}`);
      }
    }
  }
  
  return {
    isValid: issues.length === 0,
    issues: issues
  };
}

// ============================================================================
// CALL ANTHROPIC API - Supports both Haiku and Sonnet models
// ============================================================================
async function callAnthropicAPI({ apiKey, model, systemPrompt, userPrompt }) {
  const client = new Anthropic({ apiKey });
  
  const response = await client.messages.create({
    model: model,
    max_tokens: 1024,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: userPrompt
      }
    ],
  });
  
  return response.content[0].text;
}

// ============================================================================
// MAIN HANDLER - Now with state tracking and hybrid Haiku/Sonnet strategy
// ============================================================================
async function handleCustomerMessage({ businessId, from, channel, message, conversationState = null }) {
  const config = getBusinessConfig(businessId);
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  // Determine which model to use (default: Haiku for cost efficiency)
  const preferredModel = process.env.AI_MODEL === 'sonnet' 
    ? 'claude-3-5-sonnet-20241022'
    : 'claude-3-haiku-20240307';
  
  const fallbackModel = 'claude-3-5-sonnet-20241022'; // Sonnet for rescue
  
  // Check if API key is available
  if (!apiKey) {
    console.warn('⚠️  ANTHROPIC_API_KEY not found. Using fallback response.');
    return getFallbackResponse(message);
  }
  
  // Build the user prompt with conversation state
  const userPrompt = buildUserPrompt({ 
    config, 
    channel, 
    from, 
    message,
    conversationState 
  });
  
  try {
    // ===== ATTEMPT 1: Use preferred model (usually Haiku) =====
    console.log(`🤖 Calling ${preferredModel}...`);
    let textContent = await callAnthropicAPI({
      apiKey,
      model: preferredModel,
      systemPrompt,
      userPrompt
    });
    
    // Try to parse JSON
    let parsedResponse;
    try {
      // Clean up any markdown code blocks if present
      textContent = textContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsedResponse = JSON.parse(textContent);
    } catch (parseError) {
      console.warn(`⚠️  ${preferredModel} returned invalid JSON. Trying Sonnet rescue...`);
      throw new Error('JSON parse failed');
    }
    
    // Validate the response
    const validation = validateResponse(parsedResponse, message);
    if (!validation.isValid) {
      console.warn(`⚠️  ${preferredModel} response invalid: ${validation.issues.join(', ')}. Trying Sonnet rescue...`);
      throw new Error('Response validation failed');
    }
    
    // Success! Return the response
    console.log(`✅ ${preferredModel} succeeded`);
    return parsedResponse;
    
  } catch (firstAttemptError) {
    // ===== ATTEMPT 2: Rescue with Sonnet if Haiku failed =====
    // Only retry with Sonnet if we're not already using it
    if (preferredModel !== fallbackModel) {
      try {
        console.log(`🔄 Retrying with ${fallbackModel} (rescue mode)...`);
        
        let textContent = await callAnthropicAPI({
          apiKey,
          model: fallbackModel,
          systemPrompt,
          userPrompt
        });
        
        // Parse and validate
        textContent = textContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsedResponse = JSON.parse(textContent);
        
        const validation = validateResponse(parsedResponse, message);
        if (!validation.isValid) {
          throw new Error(`Sonnet validation failed: ${validation.issues.join(', ')}`);
        }
        
        console.log(`✅ ${fallbackModel} rescue succeeded`);
        return parsedResponse;
        
      } catch (secondAttemptError) {
        console.error(`❌ Both models failed. Using fallback.`);
        console.error('Sonnet error:', secondAttemptError.message);
      }
    } else {
      console.error(`❌ ${preferredModel} failed and no rescue available.`);
      console.error('Error:', firstAttemptError.message);
    }
    
    // ===== FINAL FALLBACK: Use simple extraction =====
    return getFallbackResponse(message);
  }
}

// ============================================================================
// GENERATE DAILY SUMMARY - Now with improved prompts and model selection
// ============================================================================
async function generateDailySummary({ businessId, metrics, appointments }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  // Fallback if no API key
  if (!apiKey) {
    const todayLeads = metrics.today.totalLeads;
    const urgentCount = metrics.today.urgent || 0;
    const qualifiedCount = metrics.today.qualified || 0;
    
    return {
      text: `Today you received ${todayLeads} lead${todayLeads !== 1 ? 's' : ''}, with ${urgentCount} urgent and ${qualifiedCount} ready to book. Check the dashboard for details.`,
      model: null,
      generatedAt: new Date().toISOString()
    };
  }
  
  // Use Sonnet for summaries if AI_MODEL=sonnet, otherwise Haiku
  const summaryModel = process.env.AI_MODEL === 'sonnet'
    ? 'claude-3-5-sonnet-20241022'
    : 'claude-3-haiku-20240307';
  
  const enhancedSystemPrompt = `You are an assistant generating a concise daily operational summary for a small service business owner.

GOALS:
- Highlight key metrics and trends
- Flag urgent items that need immediate attention
- Provide actionable insights (e.g., "3 leads waiting for callbacks")
- Keep it brief: 2-4 short paragraphs or bullet points
- No marketing fluff — focus on operations

TONE: Direct, helpful, action-oriented.`;
  
  const userPrompt = `Generate a brief daily summary based on this data:

TODAY'S METRICS:
- Total leads: ${metrics.today.totalLeads}
- New: ${metrics.today.new}
- Collecting info: ${metrics.today.collecting_info}
- Qualified: ${metrics.today.qualified}
- Scheduled: ${metrics.today.scheduled}
- Urgent: ${metrics.today.urgent}

LAST 7 DAYS:
- Total leads: ${metrics.last7Days.totalLeads}
- Urgent: ${metrics.last7Days.urgent}

APPOINTMENTS READY TO SCHEDULE: ${appointments.length}
${appointments.length > 0 ? '\nSample appointments:\n' + appointments.slice(0, 3).map(apt => 
  `- ${apt.issueSummary} (${apt.urgency}) - ${apt.scheduledTime || 'time TBD'}`
).join('\n') : ''}

Provide a brief, actionable summary for the business owner. What do they need to know and do today?`;
  
  try {
    const summaryText = await callAnthropicAPI({
      apiKey,
      model: summaryModel,
      systemPrompt: enhancedSystemPrompt,
      userPrompt
    });
    
    return {
      text: summaryText.trim(),
      model: summaryModel,
      generatedAt: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('Error generating AI summary:', error.message);
    
    // Fallback
    const todayLeads = metrics.today.totalLeads;
    const urgentCount = metrics.today.urgent || 0;
    const qualifiedCount = metrics.today.qualified || 0;
    
    return {
      text: `Today you received ${todayLeads} lead${todayLeads !== 1 ? 's' : ''}, with ${urgentCount} urgent and ${qualifiedCount} ready to book. Check the dashboard for details.`,
      model: null,
      generatedAt: new Date().toISOString()
    };
  }
}

module.exports = { handleCustomerMessage, generateDailySummary };
