# Business-Specific AI Training Architecture

**Last Updated:** November 24, 2025  
**Status:** ✅ Infrastructure Complete — Ready for Content

---

## Overview

This document explains how to add per-business training data to customize the AI front desk behavior for each business in the Desk.ai platform.

**Multi-tenant architecture ensures:**
- ✅ Each business gets their own AI personality and knowledge base
- ✅ Complete data isolation (leads, conversations, appointments)
- ✅ Industry-specific defaults with business-level overrides
- ✅ Scalable training system for future FAQ/knowledge base features

---

## Architecture Summary

### 1. Business Identification Flow

```
Customer Request → /b/[slug] Page → Fetch Business Data → Extract business.id (UUID)
                                                                      ↓
API Call (/api/message) → Backend with businessId → getBusinessConfig(businessId)
                                                                      ↓
                                         Load from Database (businesses + business_settings)
                                                                      ↓
                                         Build AI Prompt with Training Context
```

### 2. Key Files & Responsibilities

| File | Purpose | Training Integration Point |
|------|---------|---------------------------|
| `frontdesk-backend/businessConfig.js` | Fetches business data from database | Returns config object with training hooks |
| `frontdesk-backend/aiClient.js` | Builds AI prompts and handles conversations | `getBusinessTrainingContext()` function |
| `frontdesk-backend/index.js` | API endpoints and message routing | Passes businessId to AI handler |
| Database: `businesses` table | Stores business core data | `industry`, `service_zip_codes`, `name` |
| Database: `business_settings` table | Stores custom AI behavior | Future: FAQ, scripts, brand voice |

---

## Current Implementation (Prompt 6)

### ✅ What's Working Now

**Multi-Tenant Chat Routing:**
- `/b/[slug]` pages send `business.id` (UUID) in all chat API calls
- Backend verifies business exists and is active before processing
- Leads and appointments are stored with correct `business_id` foreign key
- Complete tenant isolation enforced at database level

**Business-Specific Context:**
- **Service Areas:** ZIP codes from `businesses.service_zip_codes` injected into AI prompt
- **Industry Defaults:** AI uses industry-specific keywords, pricing, and service lists
- **Business Identity:** AI identifies as business name (e.g., "Houston Premier Plumbing")

**Database-Driven Configuration:**
- `getBusinessConfig(businessId)` queries database instead of hardcoded values
- Supports both UUID and slug lookups for backward compatibility
- Fallback to demo business if database unavailable or business not found

### 📍 Training Hook Locations

**File:** `frontdesk-backend/aiClient.js`

**Function:** `getBusinessTrainingContext(businessConfig)`
- **Line ~484:** Training context builder
- **Purpose:** Inject business-specific knowledge into AI system prompt
- **Current Injections:**
  - Service area ZIP codes
  - Industry type
  - Custom greeting (if set in business_settings)

**Function:** `buildSystemPrompt(businessInfo, industryPreset, conversationState, memory, trainingContext)`
- **Line ~356:** System prompt builder
- **Purpose:** Constructs the main AI instruction set
- **Integration:** `trainingContext` parameter appended after business name

---

## Future Training Features (TODO)

### 🎯 Phase 1: FAQ System (High Priority)

**Goal:** Allow businesses to add frequently asked questions that the AI will reference.

**Database Schema:**
```sql
CREATE TABLE business_knowledge (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  knowledge_type TEXT NOT NULL, -- 'faq', 'policy', 'procedure', 'script'
  question TEXT,
  answer TEXT NOT NULL,
  category TEXT, -- 'pricing', 'hours', 'service_area', 'emergency', etc.
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_business_knowledge_business_id ON business_knowledge(business_id);
CREATE INDEX idx_business_knowledge_type ON business_knowledge(knowledge_type);
```

**Implementation Steps:**

1. **Create Migration:**
   ```bash
   # In Supabase SQL Editor
   -- Run the CREATE TABLE statement above
   ```

2. **Update `getBusinessTrainingContext()` in `aiClient.js`:**
   ```javascript
   // UNCOMMENT AND IMPLEMENT THIS SECTION (currently line ~490)
   
   // ===== 4. FAQ INJECTION =====
   if (businessConfig.faq_enabled) {
     const { data: faqEntries } = await supabase
       .from('business_knowledge')
       .select('question, answer, category')
       .eq('business_id', businessConfig.business_id)
       .eq('knowledge_type', 'faq')
       .eq('is_active', true)
       .order('category', { ascending: true });
     
     if (faqEntries && faqEntries.length > 0) {
       const faqText = faqEntries.map(faq => 
         `Q: ${faq.question}\nA: ${faq.answer}`
       ).join('\n\n');
       
       contextParts.push(`FREQUENTLY ASKED QUESTIONS:\n${faqText}`);
     }
   }
   ```

3. **Add FAQ Management to Owner Dashboard:**
   - Create `/dashboard/knowledge` page
   - CRUD interface for FAQ entries
   - Category tagging and search
   - Enable/disable toggle per FAQ

4. **Enable in `business_settings`:**
   ```sql
   UPDATE business_settings 
   SET faq_enabled = true 
   WHERE business_id = '...';
   ```

**Example FAQ Entry:**
```json
{
  "business_id": "uuid-here",
  "knowledge_type": "faq",
  "question": "Do you offer 24/7 emergency service?",
  "answer": "Yes, we provide 24/7 emergency plumbing services with priority response times. Emergency service fees start at $250.",
  "category": "emergency"
}
```

---

### 🎯 Phase 2: Service Scripts (Medium Priority)

**Goal:** Provide templated responses for specific service types.

**Use Case:** When AI detects "water heater" issue, inject specific diagnostic questions and pricing info.

**Implementation in `business_settings`:**
```json
{
  "service_scripts": {
    "water_heater": {
      "diagnostic_questions": [
        "How old is your water heater?",
        "Is it gas or electric?",
        "Are you getting no hot water at all, or is it just lukewarm?"
      ],
      "pricing_note": "Water heater repairs typically range from $200-$400. Replacements start at $1,200.",
      "urgency_trigger": "no hot water"
    },
    "drain_cleaning": {
      "diagnostic_questions": [
        "Which drain is clogged - sink, toilet, or shower?",
        "Is water backing up or just draining slowly?"
      ],
      "pricing_note": "Standard drain cleaning is $150-$250."
    }
  }
}
```

**Code Hook (in `getBusinessTrainingContext()`):**
```javascript
// UNCOMMENT LINE ~497
if (businessConfig._settings?.service_scripts) {
  const scripts = businessConfig._settings.service_scripts;
  const scriptText = Object.entries(scripts).map(([service, script]) => 
    `${service.toUpperCase()}:\n` +
    `Questions to ask: ${script.diagnostic_questions.join(', ')}\n` +
    `Pricing info: ${script.pricing_note}`
  ).join('\n\n');
  
  contextParts.push(`SERVICE-SPECIFIC SCRIPTS:\n${scriptText}`);
}
```

---

### 🎯 Phase 3: Brand Voice Customization (Low Priority)

**Goal:** Allow businesses to set tone/style for AI responses.

**Options:**
- `professional_formal`: "Good afternoon, how may I assist you today?"
- `friendly_casual`: "Hey there! What can I help you with?"
- `technical_expert`: "I understand you're experiencing a plumbing issue. Let's diagnose it."
- `empathetic_service`: "I'm sorry you're dealing with this. Let's get it fixed quickly."

**Implementation:**
```json
{
  "brand_voice": "friendly_casual",
  "brand_voice_guidelines": "Use warm, conversational language. Avoid jargon. Be empathetic to customer stress."
}
```

**Code Hook (in `buildSystemPrompt()` near line ~360):**
```javascript
const voiceGuidelines = {
  'professional_formal': 'Use formal language, proper grammar, and respectful tone.',
  'friendly_casual': 'Be warm and conversational. Use contractions and casual phrasing.',
  'technical_expert': 'Focus on technical accuracy and diagnostic precision.',
  'empathetic_service': 'Show understanding of customer stress and urgency.'
};

if (businessConfig._settings?.brand_voice) {
  const voice = businessConfig._settings.brand_voice;
  contextParts.push(`BRAND VOICE: ${voiceGuidelines[voice] || voiceGuidelines['friendly_casual']}`);
}
```

---

### 🎯 Phase 4: Escalation Rules (Medium Priority)

**Goal:** Define when AI should transfer to human or trigger alerts.

**Use Cases:**
- Customer asks for refund or complains about past service
- Issue is outside service area
- Customer requests specific technician
- High-value lead (e.g., mentions "whole house replumb")

**Implementation:**
```json
{
  "escalation_rules": {
    "triggers": [
      {"keyword": "refund", "action": "alert_owner", "message": "Customer requesting refund"},
      {"keyword": "complaint", "action": "alert_owner", "message": "Customer has complaint"},
      {"condition": "zip_code_not_in_service_area", "action": "polite_decline"}
    ],
    "high_value_threshold": 1000,
    "owner_alert_email": "owner@business.com"
  }
}
```

**Code Integration:**
- Add check in `handleCustomerMessage()` after AI response
- If escalation triggered, send email/SMS to owner and flag lead

---

## Database Tables Reference

### `businesses` Table
```sql
CREATE TABLE businesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  industry TEXT, -- 'plumbing', 'hvac', 'electrical', etc.
  service_zip_codes TEXT[], -- Array of ZIP codes
  phone TEXT,
  email TEXT,
  is_active BOOLEAN DEFAULT true,
  is_listed BOOLEAN DEFAULT false, -- Marketplace visibility
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Training-Relevant Fields:**
- `industry`: Determines default services, pricing, keywords
- `service_zip_codes`: Injected into AI prompt for area validation
- `name`: AI identifies as this business

### `business_settings` Table
```sql
CREATE TABLE business_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID UNIQUE REFERENCES businesses(id) ON DELETE CASCADE,
  
  -- AI Behavior Settings
  custom_greeting TEXT,
  faq_enabled BOOLEAN DEFAULT false,
  brand_voice TEXT, -- 'professional_formal', 'friendly_casual', etc.
  training_context JSONB, -- Free-form JSON for experimental features
  
  -- Operational Settings
  hours JSONB, -- { "weekdays": "8-6", "saturday": "9-4", "sunday": "Closed" }
  policies JSONB, -- { "tripFee": "$75", "cancellation": "2 hours" }
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Future Fields to Add:**
- `service_scripts JSONB`: Service-specific response templates
- `escalation_rules JSONB`: When to alert owner or transfer to human
- `knowledge_base_enabled BOOLEAN`: Enable full knowledge base system

---

## Testing Guide

### Test Multi-Tenant Isolation

**Scenario:** Ensure leads from Business A don't appear in Business B's dashboard.

**Steps:**
1. Create two test businesses in database (or use existing demo + real business)
2. Send messages to both businesses via `/b/[slug-a]` and `/b/[slug-b]`
3. Check leads in each business's dashboard (`/api/leads?businessId=...`)
4. Verify leads are correctly scoped

**Expected Result:**
- Each business sees only their own leads
- `business_id` foreign key correctly set in `leads` table

### Test Industry-Specific Behavior

**Scenario:** Verify AI uses correct industry keywords and pricing.

**Steps:**
1. Create business with `industry = 'hvac'`
2. Send message: "My AC isn't cooling"
3. Check AI response includes HVAC-specific questions (not plumbing questions)

**Expected Result:**
- AI asks about thermostat, cooling vs heating, etc.
- Pricing mentioned is HVAC-appropriate ($200-$400 for AC repair)

### Test Service Area Enforcement

**Scenario:** AI should decline or flag requests outside service area.

**Steps:**
1. Set business `service_zip_codes = ['77005', '77030']`
2. Send message: "I'm in 90210, can you help?"
3. Check AI response

**Expected Result:**
- AI politely explains service area limitation
- Suggests customer find local provider OR offers to add them to waitlist

---

## Best Practices

### 1. Keep Training Context Concise
- AI prompt has token limits (~8K for Haiku, ~200K for Sonnet)
- Prioritize most important information
- Use summaries, not full documentation

### 2. Test Before Deploying to Production
- Use `/demo-chat` to test new training features
- Create test business in database for experimentation
- Monitor `logs/app.log` for AI errors or unexpected behavior

### 3. Version Control Training Data
- Store training content in database, not hardcoded
- Use `business_settings.updated_at` to track changes
- Keep audit log of who changed what settings

### 4. Monitor AI Performance
- Track booking_intent success rate (how often AI gets to "ready_to_book")
- Measure average conversation length (fewer turns = better UX)
- Review internal_notes from AI responses for quality

---

## Quick Reference: Where to Add Training

| Feature | File | Function | Line Approx. |
|---------|------|----------|--------------|
| FAQ Content | `aiClient.js` | `getBusinessTrainingContext()` | ~490 (uncomment TODO) |
| Service Scripts | `aiClient.js` | `getBusinessTrainingContext()` | ~497 (uncomment TODO) |
| Brand Voice | `aiClient.js` | `buildSystemPrompt()` | ~360 (add to prompt) |
| Escalation Rules | `index.js` | `POST /api/message` handler | After AI response |
| Custom Greeting | `business_settings` table | `custom_greeting` column | Already wired |
| Knowledge Base | New `business_knowledge` table | Query in `getBusinessTrainingContext()` | N/A (create first) |

---

## Example: Adding a Custom FAQ Entry

**Step 1: Insert into Database**
```sql
INSERT INTO business_knowledge (business_id, knowledge_type, question, answer, category)
VALUES (
  '00000000-0000-0000-0000-000000000001', -- demo business UUID
  'faq',
  'Do you offer same-day service?',
  'Yes! For emergency plumbing issues, we offer same-day service 7 days a week. Call us at (555) 123-4567 or book through this chat.',
  'service_hours'
);
```

**Step 2: Enable FAQ in Settings**
```sql
UPDATE business_settings 
SET faq_enabled = true 
WHERE business_id = '00000000-0000-0000-0000-000000000001';
```

**Step 3: Uncomment Code in `aiClient.js`**
- Navigate to line ~490 in `getBusinessTrainingContext()`
- Uncomment the FAQ injection block
- Restart backend server

**Step 4: Test**
- Go to `/demo-chat`
- Ask: "Do you offer same-day service?"
- AI should respond with the FAQ answer

---

## Troubleshooting

### AI Isn't Using Custom Training Data

**Check:**
1. Is `business_settings.faq_enabled = true`?
2. Did you restart the backend after uncommenting code?
3. Check `logs/app.log` for database query errors
4. Verify business_id matches between tables

### Training Context Too Long (Token Limit Exceeded)

**Solution:**
- Reduce FAQ count (limit to top 10 most common)
- Summarize service scripts instead of full text
- Use Claude Sonnet instead of Haiku (has larger context window)

### Business Not Found in Database

**Check:**
- Is `businesses.is_active = true`?
- Does business exist with correct UUID or slug?
- Is Supabase connection configured (`.env` file)?

---

## Next Steps

**After implementing FAQ system:**
1. Add FAQ management UI to owner dashboard (`/dashboard/knowledge`)
2. Create API endpoints: `POST /api/knowledge`, `GET /api/knowledge`, `PATCH /api/knowledge/:id`
3. Add search/filter for FAQ entries
4. Consider AI-powered FAQ auto-generation from conversation history

**Long-term vision:**
- Full knowledge base with vector embeddings for semantic search
- Automatic training from owner-customer interactions
- A/B testing different AI personalities per business
- Multi-language support with per-business language settings

---

## Summary

**Current State (Post-Prompt 6):**
✅ Multi-tenant routing with business isolation  
✅ Database-driven business configuration  
✅ Industry-specific AI defaults  
✅ Training hook infrastructure ready  

**Ready to Implement:**
🎯 FAQ system (just uncomment code + create table)  
🎯 Service scripts (add to business_settings)  
🎯 Brand voice customization (extend prompt builder)  

**Future Enhancements:**
🔮 Knowledge base with semantic search  
🔮 Automatic training from conversation history  
🔮 Advanced escalation and routing logic  

---

**Questions or need help?** Check the code comments in:
- `frontdesk-backend/businessConfig.js` (lines 1-50 for architecture overview)
- `frontdesk-backend/aiClient.js` (lines 484-520 for training hooks)
