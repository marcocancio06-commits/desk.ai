# Training Hook Integration Map

Quick visual reference for where to add per-business AI training content.

## File: `frontdesk-backend/businessConfig.js`

```javascript
async function getBusinessConfig(businessId) {
  // ┌─────────────────────────────────────────────────────────┐
  // │ 1. FETCH FROM DATABASE                                  │
  // │    - businesses table (name, industry, ZIP codes)       │
  // │    - business_settings table (custom AI behavior)       │
  // └─────────────────────────────────────────────────────────┘
  
  const { data: business } = await supabase
    .from('businesses')
    .select('id, name, industry, service_zip_codes, ...')
    .eq('id', businessId)
    .single();
  
  const { data: settings } = await supabase
    .from('business_settings')
    .select('*')
    .eq('business_id', business.id)
    .maybeSingle();
  
  // ┌─────────────────────────────────────────────────────────┐
  // │ 2. BUILD CONFIG OBJECT                                  │
  // │    ✅ Industry-specific defaults                        │
  // │    ✅ Custom hours/policies from settings               │
  // │    📍 FUTURE: FAQ, scripts, brand voice from settings   │
  // └─────────────────────────────────────────────────────────┘
  
  return {
    business_id: business.id,
    business_name: business.name,
    industry: business.industry,
    serviceAreas: business.service_zip_codes,
    
    // Training hooks (ready for expansion)
    training_context: settings?.training_context || null,
    custom_greeting: settings?.custom_greeting || null,
    faq_enabled: settings?.faq_enabled || false,
    _settings: settings // Raw settings for advanced use
  };
}
```

---

## File: `frontdesk-backend/aiClient.js`

### Function 1: `getBusinessTrainingContext(businessConfig)` (Line ~484)

```javascript
function getBusinessTrainingContext(businessConfig) {
  const contextParts = [];
  
  // ┌─────────────────────────────────────────────────────────┐
  // │ ✅ IMPLEMENTED: Service Area Enforcement                │
  // └─────────────────────────────────────────────────────────┘
  if (businessConfig.serviceAreas?.length > 0) {
    contextParts.push(`SERVICE AREA: We serve ZIP codes ${businessConfig.serviceAreas.join(', ')}.`);
  }
  
  // ┌─────────────────────────────────────────────────────────┐
  // │ ✅ IMPLEMENTED: Industry Context                        │
  // └─────────────────────────────────────────────────────────┘
  if (businessConfig.industry) {
    contextParts.push(`INDUSTRY: ${businessConfig.industry} services`);
  }
  
  // ┌─────────────────────────────────────────────────────────┐
  // │ ✅ IMPLEMENTED: Custom Greeting                         │
  // └─────────────────────────────────────────────────────────┘
  if (businessConfig.custom_greeting) {
    contextParts.push(`CUSTOM GREETING: ${businessConfig.custom_greeting}`);
  }
  
  // ┌─────────────────────────────────────────────────────────┐
  // │ 📍 TODO: FAQ Injection (Line ~490)                      │
  // │    UNCOMMENT THIS BLOCK TO ENABLE                       │
  // └─────────────────────────────────────────────────────────┘
  // if (businessConfig.faq_enabled) {
  //   const faqEntries = await fetchBusinessFAQ(businessConfig.business_id);
  //   if (faqEntries.length > 0) {
  //     contextParts.push(`FREQUENTLY ASKED QUESTIONS:\n${faqText}`);
  //   }
  // }
  
  // ┌─────────────────────────────────────────────────────────┐
  // │ 📍 TODO: Service Scripts (Line ~497)                    │
  // │    Pre-written responses for specific services          │
  // └─────────────────────────────────────────────────────────┘
  // if (businessConfig._settings?.service_scripts) {
  //   contextParts.push(`SERVICE SCRIPTS:\n${scriptText}`);
  // }
  
  // ┌─────────────────────────────────────────────────────────┐
  // │ 📍 TODO: Brand Voice Guidelines (Line ~504)             │
  // │    Tone/style customization (formal vs casual)          │
  // └─────────────────────────────────────────────────────────┘
  // if (businessConfig._settings?.brand_voice) {
  //   contextParts.push(`BRAND VOICE: ${brandVoiceGuidelines}`);
  // }
  
  // ┌─────────────────────────────────────────────────────────┐
  // │ 📍 TODO: Escalation Rules (Line ~511)                   │
  // │    When to alert owner or transfer to human            │
  // └─────────────────────────────────────────────────────────┘
  // if (businessConfig._settings?.escalation_rules) {
  //   contextParts.push(`ESCALATION: ${escalationText}`);
  // }
  
  return contextParts.length > 0 
    ? `\n\n===== BUSINESS-SPECIFIC TRAINING =====\n${contextParts.join('\n\n')}\n===== END TRAINING =====\n`
    : '';
}
```

### Function 2: `buildSystemPrompt()` (Line ~356)

```javascript
function buildSystemPrompt(businessInfo, industryPreset, conversationState, memory, trainingContext = '') {
  // ... memory and state logic ...
  
  return `You are Desk.ai, the AI front desk for ${businessInfo.business_name} (${businessInfo.services.join(', ')}).${trainingContext}
  
  // ┌─────────────────────────────────────────────────────────┐
  // │ ↑ TRAINING CONTEXT INJECTED HERE                        │
  // │   Contains: ZIP codes, industry, custom greeting,       │
  // │   and future: FAQ, scripts, brand voice, etc.           │
  // └─────────────────────────────────────────────────────────┘
  
Your job is to carry a short, friendly conversation and collect exactly four fields:
...
`;
}
```

### Function 3: `handleCustomerMessage()` (Line ~520)

```javascript
async function handleCustomerMessage({ businessId, from, channel, message, conversationState = null }) {
  // ┌─────────────────────────────────────────────────────────┐
  // │ STEP 1: Load Business Config (Now Async!)               │
  // └─────────────────────────────────────────────────────────┘
  const config = await getBusinessConfig(businessId);
  
  // ... conversation state and memory logic ...
  
  // ┌─────────────────────────────────────────────────────────┐
  // │ STEP 2: Get Business-Specific Training Context          │
  // └─────────────────────────────────────────────────────────┘
  const trainingContext = getBusinessTrainingContext(config);
  
  // ┌─────────────────────────────────────────────────────────┐
  // │ STEP 3: Build System Prompt with Training Context       │
  // └─────────────────────────────────────────────────────────┘
  const systemPrompt = buildSystemPrompt(
    config, 
    industryPreset, 
    state, 
    updatedMemory, 
    trainingContext  // ← Injected here
  );
  
  // ... AI call and response logic ...
}
```

---

## File: `frontdesk-backend/index.js`

### Function: `POST /api/message` Handler (Line ~64)

```javascript
app.post('/api/message', async (req, res) => {
  const { businessId, from, channel, message } = req.body;
  
  // ┌─────────────────────────────────────────────────────────┐
  // │ ✅ SECURITY: businessId is REQUIRED                     │
  // └─────────────────────────────────────────────────────────┘
  if (!businessId) {
    return res.status(400).json({ 
      error: 'business_id required',
      code: 'BUSINESS_ID_REQUIRED'
    });
  }
  
  // ┌─────────────────────────────────────────────────────────┐
  // │ ✅ VERIFY BUSINESS: Exists and is active                │
  // └─────────────────────────────────────────────────────────┘
  const { data: business } = await supabase
    .from('businesses')
    .select('id, is_active')
    .eq('id', businessId)
    .eq('is_active', true)
    .single();
  
  if (!business) {
    return res.status(404).json({
      error: 'Business not found or inactive'
    });
  }
  
  // ┌─────────────────────────────────────────────────────────┐
  // │ ✅ MULTI-TENANT ISOLATION: All DB ops scoped to business│
  // └─────────────────────────────────────────────────────────┘
  const lead = await db.getOrCreateLead(businessId, from, channel);
  
  // ┌─────────────────────────────────────────────────────────┐
  // │ ✅ CALL AI: Now includes business-specific training     │
  // └─────────────────────────────────────────────────────────┘
  const aiResult = await handleCustomerMessage({
    businessId,  // ← Used to load config and training context
    from,
    channel,
    message,
    conversationState
  });
  
  // ┌─────────────────────────────────────────────────────────┐
  // │ 📍 FUTURE: Escalation Rules Hook                        │
  // │    Check if AI response triggers owner alert            │
  // └─────────────────────────────────────────────────────────┘
  // if (shouldEscalate(aiResult, businessConfig)) {
  //   await alertOwner(business.id, lead.id, aiResult.escalation_reason);
  // }
  
  res.status(200).json(aiResult);
});
```

---

## Database Tables

### Table: `businesses` (Core Business Data)

```sql
┌─────────────────────┬──────────────────────────────────────────┐
│ Column              │ Training Use                             │
├─────────────────────┼──────────────────────────────────────────┤
│ id                  │ Primary key for all training lookups     │
│ name                │ AI identifies as this business           │
│ industry            │ Determines default services, pricing,    │
│                     │ keywords, and AI behavior                │
│ service_zip_codes   │ Enforces service area, injected into     │
│                     │ AI prompt for validation                 │
│ phone               │ Contact info for escalations             │
│ email               │ Alert destination for owner              │
└─────────────────────┴──────────────────────────────────────────┘
```

### Table: `business_settings` (Custom AI Behavior)

```sql
┌─────────────────────┬──────────────────────────────────────────┐
│ Column              │ Training Use                             │
├─────────────────────┼──────────────────────────────────────────┤
│ business_id         │ Foreign key to businesses                │
│ custom_greeting     │ ✅ Custom AI opening message             │
│ faq_enabled         │ 📍 Enable FAQ system (TODO)              │
│ brand_voice         │ 📍 Tone/style (formal, casual) (TODO)    │
│ training_context    │ 📍 JSONB for experimental features       │
│ hours               │ Business hours (JSON)                    │
│ policies            │ Trip fee, cancellation (JSON)            │
└─────────────────────┴──────────────────────────────────────────┘
```

### Table: `business_knowledge` (Future - FAQ System)

```sql
┌─────────────────────┬──────────────────────────────────────────┐
│ Column              │ Training Use                             │
├─────────────────────┼──────────────────────────────────────────┤
│ business_id         │ Foreign key to businesses                │
│ knowledge_type      │ 'faq', 'policy', 'procedure', 'script'   │
│ question            │ Customer question text                   │
│ answer              │ Business answer (injected into AI)       │
│ category            │ 'pricing', 'hours', 'emergency', etc.    │
│ is_active           │ Enable/disable individual entries        │
└─────────────────────┴──────────────────────────────────────────┘
```

---

## Quick Action Checklist

### To Add a Custom Greeting

1. ✅ Update `business_settings` table:
   ```sql
   UPDATE business_settings 
   SET custom_greeting = 'Hi! Thanks for choosing Awesome Plumbing. How can we help you today?'
   WHERE business_id = 'your-business-uuid';
   ```

2. ✅ Restart backend (config is loaded per request, so no restart needed!)

3. ✅ Test: Send message to `/b/your-business-slug` and verify AI uses custom greeting

### To Add FAQ System

1. 📍 Create `business_knowledge` table (see BUSINESS_TRAINING.md)

2. 📍 Uncomment code in `aiClient.js` line ~490

3. 📍 Add FAQ entries:
   ```sql
   INSERT INTO business_knowledge (business_id, knowledge_type, question, answer, category)
   VALUES ('uuid-here', 'faq', 'Do you offer same-day service?', 'Yes! We offer same-day...', 'service_hours');
   ```

4. 📍 Enable in settings:
   ```sql
   UPDATE business_settings SET faq_enabled = true WHERE business_id = 'uuid-here';
   ```

### To Add Service Scripts

1. 📍 Update `business_settings`:
   ```sql
   UPDATE business_settings 
   SET training_context = jsonb_set(
     COALESCE(training_context, '{}'::jsonb),
     '{service_scripts}',
     '{
       "water_heater": {
         "diagnostic_questions": ["How old is your water heater?", "Is it gas or electric?"],
         "pricing_note": "Water heater repairs: $200-$400"
       }
     }'::jsonb
   )
   WHERE business_id = 'uuid-here';
   ```

2. 📍 Uncomment code in `aiClient.js` line ~497

3. 📍 Test with water heater issue

---

## Legend

- ✅ **Implemented** - Working now, ready to use
- 📍 **TODO** - Code hook exists, just uncomment and test
- 🔮 **Future** - Requires additional implementation

---

**See BUSINESS_TRAINING.md for detailed implementation guides and examples.**
