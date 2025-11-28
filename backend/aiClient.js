const { getBusinessConfig } = require('./businessConfig');
const Anthropic = require('@anthropic-ai/sdk');
const { retryAIOperation } = require('./retryUtils');
const logger = require('./logger');
const alertSystem = require('./alertSystem');

// ============================================================================
// CONVERSATION STATE MACHINE
// ============================================================================
const CONVERSATION_STATES = {
  INITIAL: 'initial',
  COLLECTING_INFO: 'collecting_info',
  QUALIFIED: 'qualified',
  READY_TO_SCHEDULE: 'ready_to_schedule'
};

// State transition rules
function determineConversationState(collectedData, confidenceScores) {
  const { issue_summary, zip_code, preferred_time, urgency } = collectedData;
  const scores = confidenceScores || {};
  
  // Check if all fields are collected with sufficient confidence
  const hasIssue = issue_summary && (scores.issue || 0) >= 0.7;
  const hasZip = zip_code && (scores.zip_code || 0) >= 0.9;
  const hasTime = preferred_time && (scores.preferred_time || 0) >= 0.6;
  const hasUrgency = urgency && urgency !== 'none';
  
  // State transitions
  if (hasIssue && hasZip && hasTime && hasUrgency) {
    return CONVERSATION_STATES.READY_TO_SCHEDULE;
  } else if (hasIssue && (hasZip || hasTime || hasUrgency)) {
    return CONVERSATION_STATES.QUALIFIED;
  } else if (hasIssue || hasZip) {
    return CONVERSATION_STATES.COLLECTING_INFO;
  }
  
  return CONVERSATION_STATES.INITIAL;
}

// ============================================================================
// INDUSTRY PRESETS - Affects phrasing only, not data extraction
// ============================================================================
const INDUSTRY_PRESETS = {
  plumbing: {
    emergencyKeywords: ['leak', 'burst', 'flood', 'sewage', 'backup', 'overflow', 'no water', 'broken pipe'],
    exampleIssues: 'leaking pipe, clogged drain, water heater issue, toilet not flushing',
    questionPhrasing: {
      issue: "What's going on with your plumbing?",
      urgency: "Is this an emergency (like a leak or backup) or can it wait?"
    }
  },
  hvac: {
    emergencyKeywords: ['no heat', 'no cooling', 'no ac', 'freezing', 'carbon monoxide', 'gas smell', 'furnace not working'],
    exampleIssues: 'AC not cooling, heater not working, thermostat issue, strange noises',
    questionPhrasing: {
      issue: "What's happening with your heating or cooling system?",
      urgency: "Is your home too hot or too cold right now?"
    }
  },
  electrical: {
    emergencyKeywords: ['sparks', 'burning smell', 'no power', 'breaker tripping', 'shock', 'exposed wire', 'smoke'],
    exampleIssues: 'outlet not working, breaker keeps tripping, flickering lights, need new outlet',
    questionPhrasing: {
      issue: "What electrical issue are you experiencing?",
      urgency: "Is there any burning smell, sparks, or safety concern?"
    }
  },
  roofing: {
    emergencyKeywords: ['leak', 'water coming in', 'hole', 'storm damage', 'missing shingles', 'ceiling wet'],
    exampleIssues: 'roof leak, missing shingles, gutter repair, storm damage',
    questionPhrasing: {
      issue: "What's going on with your roof?",
      urgency: "Is water actively coming into your home?"
    }
  },
  cleaning: {
    emergencyKeywords: ['flood', 'sewage', 'biohazard', 'mold emergency'],
    exampleIssues: 'deep clean, move-out cleaning, regular maintenance, carpet cleaning',
    questionPhrasing: {
      issue: "What type of cleaning service do you need?",
      urgency: "When do you need this done?"
    }
  },
  handyman: {
    emergencyKeywords: ['broken door', 'lock broken', 'security', 'door won\'t close'],
    exampleIssues: 'door repair, drywall patch, shelf installation, general repairs',
    questionPhrasing: {
      issue: "What needs to be fixed or installed?",
      urgency: "Is this urgent or can we schedule it for later this week?"
    }
  }
};

function getIndustryPreset(servicesList) {
  const servicesLower = servicesList.map(s => s.toLowerCase()).join(' ');
  
  if (servicesLower.includes('plumb')) return INDUSTRY_PRESETS.plumbing;
  if (servicesLower.includes('hvac') || servicesLower.includes('heating') || servicesLower.includes('cooling')) return INDUSTRY_PRESETS.hvac;
  if (servicesLower.includes('electr')) return INDUSTRY_PRESETS.electrical;
  if (servicesLower.includes('roof')) return INDUSTRY_PRESETS.roofing;
  if (servicesLower.includes('clean')) return INDUSTRY_PRESETS.cleaning;
  if (servicesLower.includes('handyman') || servicesLower.includes('repair')) return INDUSTRY_PRESETS.handyman;
  
  // Default preset
  return {
    emergencyKeywords: ['emergency', 'urgent', 'asap', 'right now'],
    exampleIssues: 'describe your issue',
    questionPhrasing: {
      issue: "What can we help you with?",
      urgency: "How soon do you need service?"
    }
  };
}

// ============================================================================
// ENHANCED EMERGENCY DETECTION WITH CONFIDENCE SCORING
// ============================================================================
function detectEmergency(message) {
  const msgLower = message.toLowerCase();
  
  // Critical emergencies (confidence: 1.0)
  const critical = [
    'sparks', 'burning smell', 'smoke', 'fire', 'gas smell', 'carbon monoxide',
    'no heat', 'freezing', 'flood', 'sewage backup', 'burst pipe', 'water everywhere',
    'no power', 'electrical shock', 'exposed wire'
  ];
  
  // High urgency (confidence: 0.9)
  const highUrgency = [
    'leak', 'water coming in', 'won\'t turn off', 'overflowing', 
    'no water', 'no hot water', 'ac not working', 'heater not working',
    'broken pipe', 'toilet won\'t flush'
  ];
  
  // Medium urgency (confidence: 0.7)
  const mediumUrgency = [
    'soon', 'today', 'asap', 'urgent', 'emergency', 'right now', 'immediately'
  ];
  
  for (const keyword of critical) {
    if (msgLower.includes(keyword)) {
      return { level: 'emergency', confidence: 1.0, trigger: keyword };
    }
  }
  
  for (const keyword of highUrgency) {
    if (msgLower.includes(keyword)) {
      return { level: 'emergency', confidence: 0.9, trigger: keyword };
    }
  }
  
  for (const keyword of mediumUrgency) {
    if (msgLower.includes(keyword)) {
      return { level: 'high', confidence: 0.7, trigger: keyword };
    }
  }
  
  return { level: 'normal', confidence: 0.5, trigger: null };
}

// ============================================================================
// CONFIDENCE-BASED DATA EXTRACTION
// ============================================================================
function extractDataFromMessage(message, msgLower, previousData = {}) {
  const data = {
    issue_summary: previousData.issue_summary || null,
    zip_code: previousData.zip_code || null,
    preferred_time: previousData.preferred_time || null,
    urgency: previousData.urgency || null
  };
  
  const confidence = {
    issue: previousData.issue_summary ? 0.8 : 0,
    zip_code: previousData.zip_code ? 1.0 : 0,
    preferred_time: previousData.preferred_time ? 0.7 : 0,
    urgency: previousData.urgency ? 0.8 : 0
  };
  
  // Extract ZIP code (high confidence if 77xxx pattern)
  const zipMatch = msgLower.match(/\b(77\d{3})\b/);
  if (zipMatch) {
    data.zip_code = zipMatch[1];
    confidence.zip_code = 1.0;
  }
  
  // Detect emergency with confidence
  const emergency = detectEmergency(message);
  if (emergency.confidence >= 0.7 && !data.urgency) {
    data.urgency = emergency.level;
    confidence.urgency = emergency.confidence;
  }
  
  // Extract time preferences with confidence
  const timePatterns = [
    { pattern: /\b(right now|immediately|asap)\b/i, confidence: 1.0 },
    { pattern: /\b(today|this afternoon|this morning|tonight)\b/i, confidence: 0.9 },
    { pattern: /\b(tomorrow|this week)\b/i, confidence: 0.8 },
    { pattern: /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i, confidence: 0.85 },
    { pattern: /\b(\d{1,2}:\d{2}\s?(?:am|pm)?)\b/i, confidence: 0.95 },
    { pattern: /\b(morning|afternoon|evening)\b/i, confidence: 0.7 }
  ];
  
  for (const { pattern, confidence: conf } of timePatterns) {
    const match = message.match(pattern);
    if (match && (!data.preferred_time || conf > confidence.preferred_time)) {
      data.preferred_time = match[0];
      confidence.preferred_time = conf;
    }
  }
  
  // Extract issue with confidence scoring
  const issueKeywords = {
    // Plumbing
    leak: 0.9, leaking: 0.9, 'burst pipe': 1.0, clog: 0.9, clogged: 0.9, drain: 0.8,
    toilet: 0.85, 'water heater': 0.9, pipe: 0.7, faucet: 0.85, sewage: 1.0,
    // HVAC
    'no heat': 1.0, 'no cooling': 1.0, 'no ac': 1.0, 'ac not working': 1.0,
    'heater not working': 1.0, thermostat: 0.8, 'furnace': 0.85,
    // Electrical
    sparks: 1.0, 'burning smell': 1.0, 'no power': 0.95, 'breaker tripping': 0.9,
    outlet: 0.8, 'light not working': 0.75, flickering: 0.85,
    // General
    broken: 0.7, 'not working': 0.75, issue: 0.6, problem: 0.6
  };
  
  let highestConfidence = 0;
  let detectedIssue = '';
  
  for (const [keyword, conf] of Object.entries(issueKeywords)) {
    if (msgLower.includes(keyword) && conf > highestConfidence) {
      highestConfidence = conf;
      detectedIssue = keyword;
    }
  }
  
  if (detectedIssue && (!data.issue_summary || highestConfidence > confidence.issue)) {
    // Extract surrounding context (up to 50 chars before and after)
    const index = msgLower.indexOf(detectedIssue);
    const start = Math.max(0, index - 25);
    const end = Math.min(message.length, index + detectedIssue.length + 25);
    data.issue_summary = message.substring(start, end).trim();
    confidence.issue = highestConfidence;
  }
  
  return { data, confidence };
}

// ============================================================================
// IMPROVED SYSTEM PROMPT - State-aware with memory + per-business training
// ============================================================================
function buildSystemPrompt(businessInfo, industryPreset, conversationState, memory, trainingContext = '') {
  const alreadyKnown = [];
  if (memory.issue_summary) alreadyKnown.push(`issue: "${memory.issue_summary}"`);
  if (memory.zip_code) alreadyKnown.push(`ZIP: ${memory.zip_code}`);
  if (memory.preferred_time) alreadyKnown.push(`time: "${memory.preferred_time}"`);
  if (memory.urgency) alreadyKnown.push(`urgency: ${memory.urgency}`);
  
  const memoryContext = alreadyKnown.length > 0 
    ? `\n\nALREADY COLLECTED (NEVER ask again): ${alreadyKnown.join(', ')}`
    : '';
  
  const stateGuidance = {
    [CONVERSATION_STATES.INITIAL]: 'Start warm and natural. Ask what they need help with.',
    [CONVERSATION_STATES.COLLECTING_INFO]: 'Continue gathering missing fields. Be conversational and efficient.',
    [CONVERSATION_STATES.QUALIFIED]: 'Almost done! Collect the last 1-2 missing details.',
    [CONVERSATION_STATES.READY_TO_SCHEDULE]: 'All info collected. Confirm and set booking_intent="ready_to_book".'
  };

  return `You are Desk.ai, the AI front desk for ${businessInfo.business_name} (${businessInfo.services.join(', ')}).${trainingContext}

Your job is to carry a short, friendly conversation and collect exactly four fields:

1. issue_summary — what's wrong + any relevant details
2. zip_code — customer location (5 digits, must be in Houston area: 77xxx)
3. preferred_time — when they want service
4. urgency — "emergency" | "high" | "normal"

CURRENT STATE: ${conversationState}
${stateGuidance[conversationState]}${memoryContext}

INDUSTRY CONTEXT (${Object.keys(INDUSTRY_PRESETS).find(k => INDUSTRY_PRESETS[k] === industryPreset) || 'general'}):
• Common emergencies: ${industryPreset.emergencyKeywords.join(', ')}
• Example issues: ${industryPreset.exampleIssues}
• Use natural phrasing for this industry

CONVERSATION BEHAVIOR:
• NEVER ask for information already collected (see ALREADY COLLECTED above)
• Ask one or two questions at a time, SMS-style (short & natural)
• If a field is missing AND not in memory, you MUST ask for it
• If the customer is vague (e.g., "Help, something's broken"), ask clarifying questions
• If customer asks unrelated questions, answer briefly then guide back to the goal
• When all four fields are collected, set booking_intent="ready_to_book" and give a short confirmation message
• Always be friendly, concise, and natural — this is a real customer texting a business

EMERGENCY DETECTION:
• If you detect any of these: ${industryPreset.emergencyKeywords.slice(0, 5).join(', ')} — immediately set urgency="emergency"
• For emergencies, prioritize speed: collect ZIP + issue, then confirm "We'll call you right away"

GRACEFUL FALLBACKS:
• If uncertain about urgency and customer hasn't specified, ask: "${industryPreset.questionPhrasing.urgency}"
• If ZIP code seems wrong (not 77xxx), say "We serve the Houston area (ZIP 77xxx). What's your ZIP code?"
• If time is unclear, offer: "When works best? Today, tomorrow, or later this week?"

OUTPUT RULES:
• Always return valid JSON only, following this exact structure:

{
  "reply": "...",
  "booking_intent": "none | collecting_info | qualified | ready_to_book",
  "collected_data": {
    "issue_summary": "...",
    "zip_code": "...",
    "preferred_time": "...",
    "urgency": "emergency | high | normal"
  },
  "confidence_scores": {
    "issue": 0.0-1.0,
    "zip_code": 0.0-1.0,
    "preferred_time": 0.0-1.0,
    "urgency": 0.0-1.0
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
}

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

// ============================================================================
// IMPROVED FALLBACK - Uses simple extraction when AI is unavailable
// ============================================================================
function getFallbackResponse(message, previousData = {}) {
  const msgLower = message.toLowerCase();
  const { data, confidence } = extractDataFromMessage(message, msgLower, previousData);
  
  return {
    reply: 'Thanks for reaching out! We received your message and will get back to you shortly.',
    booking_intent: 'collecting_info',
    collected_data: data,
    confidence_scores: confidence,
    internal_notes: null, // Don't show technical fallback messages to users
    used_fallback: true   // Flag for debugging purposes
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
  if (!parsed.booking_intent || !['none', 'collecting_info', 'qualified', 'ready_to_book'].includes(parsed.booking_intent)) {
    issues.push('missing or invalid booking_intent');
  }
  if (!parsed.collected_data || typeof parsed.collected_data !== 'object') {
    issues.push('missing collected_data');
  }
  if (!parsed.confidence_scores || typeof parsed.confidence_scores !== 'object') {
    // Not critical, but helpful - add default scores
    parsed.confidence_scores = { issue: 0.5, zip_code: 0.5, preferred_time: 0.5, urgency: 0.5 };
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
// MAIN HANDLER - Now with state machine, memory, and confidence scoring
// ENHANCED: Multi-tenant with per-business training context
// ============================================================================

/**
 * Get business-specific training context for AI prompt
 * This is where we inject per-business knowledge, FAQ, scripts, etc.
 * 
 * TODO: Future enhancements:
 * - Query business_knowledge table for FAQ entries
 * - Fetch custom service scripts from business_settings
 * - Include business-specific policies and procedures
 * - Load brand voice guidelines
 * - Pull recent customer feedback/common questions
 * 
 * @param {Object} businessConfig - Business configuration from getBusinessConfig()
 * @returns {string} Training context to inject into AI prompt
 */
function getBusinessTrainingContext(businessConfig) {
  const contextParts = [];
  
  // ===== 1. SERVICE AREA SPECIFICS =====
  if (businessConfig.serviceAreas && businessConfig.serviceAreas.length > 0) {
    contextParts.push(`SERVICE AREA: We serve ZIP codes ${businessConfig.serviceAreas.join(', ')}. Only accept bookings from these areas.`);
  }
  
  // ===== 2. INDUSTRY-SPECIFIC KNOWLEDGE =====
  if (businessConfig.industry) {
    contextParts.push(`INDUSTRY: ${businessConfig.industry} services`);
  }
  
  // ===== 3. CUSTOM GREETING (if set) =====
  if (businessConfig.custom_greeting) {
    contextParts.push(`CUSTOM GREETING: ${businessConfig.custom_greeting}`);
  }
  
  // ===== 4. FAQ INJECTION (future feature) =====
  // TODO: Implement FAQ system
  // if (businessConfig.faq_enabled) {
  //   const faqEntries = await fetchBusinessFAQ(businessConfig.business_id);
  //   if (faqEntries.length > 0) {
  //     contextParts.push(`FREQUENTLY ASKED QUESTIONS:\n${faqEntries.map(faq => `Q: ${faq.question}\nA: ${faq.answer}`).join('\n\n')}`);
  //   }
  // }
  
  // ===== 5. SERVICE SCRIPTS (future feature) =====
  // TODO: Implement service-specific response templates
  // if (businessConfig._settings?.service_scripts) {
  //   contextParts.push(`SERVICE SCRIPTS:\n${JSON.stringify(businessConfig._settings.service_scripts, null, 2)}`);
  // }
  
  // ===== 6. BRAND VOICE GUIDELINES (future feature) =====
  // TODO: Implement tone/style customization
  // if (businessConfig._settings?.brand_voice) {
  //   contextParts.push(`BRAND VOICE: ${businessConfig._settings.brand_voice} (e.g., "professional and friendly" or "casual and fun")`);
  // }
  
  // ===== 7. ESCALATION RULES (future feature) =====
  // TODO: Define when to transfer to human
  // if (businessConfig._settings?.escalation_rules) {
  //   contextParts.push(`ESCALATION: ${businessConfig._settings.escalation_rules}`);
  // }
  
  // If no custom context, return empty string
  if (contextParts.length === 0) {
    return '';
  }
  
  return `\n\n===== BUSINESS-SPECIFIC TRAINING =====\n${contextParts.join('\n\n')}\n===== END TRAINING =====\n`;
}

async function handleCustomerMessage({ businessId, from, channel, message, conversationState = null }) {
  // ===== STEP 1: Load business config from database =====
  const config = await getBusinessConfig(businessId);
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  // Initialize memory from conversation state
  const memory = conversationState?.collected_data || {
    issue_summary: null,
    zip_code: null,
    preferred_time: null,
    urgency: null
  };
  
  const confidenceScores = conversationState?.confidence_scores || {
    issue: 0,
    zip_code: 0,
    preferred_time: 0,
    urgency: 0
  };
  
  // Pre-extract data from current message with confidence scoring
  const msgLower = message.toLowerCase();
  const extracted = extractDataFromMessage(message, msgLower, memory);
  
  // Merge extracted data with memory (new data overrides if confidence is higher)
  const updatedMemory = { ...memory };
  const updatedConfidence = { ...confidenceScores };
  
  for (const field of ['issue_summary', 'zip_code', 'preferred_time', 'urgency']) {
    if (extracted.data[field] && extracted.confidence[field] > (confidenceScores[field] || 0)) {
      updatedMemory[field] = extracted.data[field];
      updatedConfidence[field] = extracted.confidence[field];
    }
  }
  
  // Determine conversation state
  const state = determineConversationState(updatedMemory, updatedConfidence);
  
  // Get industry preset
  const industryPreset = getIndustryPreset(config.services);
  
  // ===== STEP 2: Get business-specific training context =====
  const trainingContext = getBusinessTrainingContext(config);
  
  // Determine which model to use (default: Haiku for cost efficiency)
  const preferredModel = process.env.AI_MODEL === 'sonnet' 
    ? 'claude-3-sonnet-20240229'
    : 'claude-3-haiku-20240307';
  
  const fallbackModel = 'claude-3-sonnet-20240229'; // Sonnet for rescue
  
  // Check if API key is available
  if (!apiKey) {
    console.warn('⚠️  ANTHROPIC_API_KEY not found. Using fallback response.');
    return getFallbackResponse(message, updatedMemory);
  }
  
  // Build prompts with state and memory awareness + training context
  const systemPrompt = buildSystemPrompt(config, industryPreset, state, updatedMemory, trainingContext);
  const userPrompt = buildUserPrompt({ 
    config, 
    channel, 
    from, 
    message,
    conversationState: {
      ...conversationState,
      collected_data: updatedMemory,
      confidence_scores: updatedConfidence,
      state: state
    }
  });
  
  try {
    // ===== ATTEMPT 1: Use preferred model (usually Haiku) with retry =====
    logger.info(`Calling AI (${preferredModel})`, { 
      state, 
      businessId: config.business_id,
      industry: config.industry 
    });
    
    const textContent = await retryAIOperation(async () => {
      return await callAnthropicAPI({
        apiKey,
        model: preferredModel,
        systemPrompt,
        userPrompt
      });
    }, `AI call (${preferredModel})`);
    
    // Try to parse JSON
    let parsedResponse;
    try {
      // Clean up any markdown code blocks if present
      const cleanedText = textContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsedResponse = JSON.parse(cleanedText);
    } catch (parseError) {
      logger.warn(`AI returned invalid JSON, trying fallback model`, { model: preferredModel });
      throw new Error('JSON parse failed');
    }
    
    // Validate the response
    const validation = validateResponse(parsedResponse, message);
    if (!validation.isValid) {
      logger.warn(`AI response validation failed`, {
        model: preferredModel,
        issues: validation.issues
      });
      throw new Error('Response validation failed');
    }
    
    // Success! Return the response
    logger.info(`AI call succeeded`, { 
      model: preferredModel,
      businessId: config.business_id,
      bookingIntent: parsedResponse.booking_intent 
    });
    return parsedResponse;
    
  } catch (firstAttemptError) {
    // ===== ATTEMPT 2: Rescue with Sonnet if Haiku failed =====
    // Only retry with Sonnet if we're not already using it
    if (preferredModel !== fallbackModel) {
      try {
        logger.info(`Retrying with fallback AI model`, { fallbackModel });
        
        const textContent = await retryAIOperation(async () => {
          return await callAnthropicAPI({
            apiKey,
            model: fallbackModel,
            systemPrompt,
            userPrompt
          });
        }, `AI call (${fallbackModel} rescue)`);
        
        // Parse and validate
        const cleanedText = textContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsedResponse = JSON.parse(cleanedText);
        
        const validation = validateResponse(parsedResponse, message);
        if (!validation.isValid) {
          throw new Error(`Sonnet validation failed: ${validation.issues.join(', ')}`);
        }
        
        logger.info(`AI fallback model succeeded`, { fallbackModel });
        return parsedResponse;
        
      } catch (secondAttemptError) {
        logger.error(`Both AI models failed`, {
          preferredModel,
          fallbackModel,
          error: secondAttemptError.message
        });
        
        // Send critical alert
        await alertSystem.alertAIFailure(
          `handleCustomerMessage (businessId: ${businessId})`,
          secondAttemptError,
          6 // 3 retries per model
        );
      }
    } else {
      logger.error(`AI model failed with no fallback available`, {
        model: preferredModel,
        error: firstAttemptError.message
      });
      
      // Send critical alert
      await alertSystem.alertAIFailure(
        `handleCustomerMessage (businessId: ${businessId})`,
        firstAttemptError,
        3
      );
    }
    
    // ===== FINAL FALLBACK: Use simple extraction =====
    logger.warn(`Using fallback response for message`);
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
    ? 'claude-3-sonnet-20240229'
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
