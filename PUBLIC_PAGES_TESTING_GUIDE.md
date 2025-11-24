# Public Business Page Enhancement - Testing Guide

## Overview
This guide provides comprehensive testing procedures for the enhanced public business pages (`/b/[slug]`) and directory page (`/directory`).

**Key Enhancements:**
1. Polished public business page with SEO metadata
2. Enhanced directory with search/filtering
3. Industry-based service categories
4. Professional branding and design
5. Security: No internal data leakage

---

## Prerequisites

### 1. Start Development Servers
```bash
# Terminal 1: Backend
cd frontdesk-backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

### 2. Test Business Data
Create a test business through onboarding or manually insert:
```sql
INSERT INTO businesses (name, slug, industry, phone, email, zip_codes, logo_url, color_scheme, is_active)
VALUES (
  'Houston Premier Plumbing',
  'houston-premier-plumbing',
  'plumbing',
  '+1-713-555-0100',
  'info@houstonplumbing.com',
  '["77005", "77030", "77098"]',
  null,
  'professional',
  true
);
```

---

## Test Suite

### Test 1: Public Business Page - Header & Branding

**Objective:** Verify business header displays correctly with professional design

**Test 1.1: Logo Display**
1. Navigate to `http://localhost:3000/b/houston-premier-plumbing`
2. **Expected:** Business header shows:
   - Logo (if uploaded) OR default Desk.ai icon in gradient container
   - Logo is 96x96px, rounded, with shadow
   - Gradient accent bar (blue-purple) at top of header card

**Test 1.2: Business Information**
1. Check header card displays:
   - Business name (large, bold)
   - Industry badge (blue background, icon)
   - Service area ZIP codes (as chips)
2. **Expected:** All information clearly visible and styled

**Test 1.3: Action Buttons**
1. Locate "Call Now" button (if phone provided)
2. Locate "Chat with Us" button
3. **Expected:**
   - Call button: Gradient blue-purple, phone icon
   - Chat button: White background, border, chat icon
   - Buttons are clickable and styled correctly

**Test 1.4: Call Button Functionality**
1. Click "Call Now" button
2. **Expected:** Opens phone dialer with `tel:+1-713-555-0100`

---

### Test 2: Industry-Specific Services

**Objective:** Verify service categories are generated based on industry

**Test 2.1: Plumbing Services**
1. Navigate to plumbing business page
2. Scroll to "Our Services" section
3. **Expected:** Shows 5 services:
   - 💧 Leak Repairs
   - 🚰 Drain Cleaning
   - 🔥 Water Heater Service
   - 🔧 Fixture Installation
   - ⚙️ Pipe Repairs

**Test 2.2: HVAC Services**
1. Create HVAC business or navigate to HVAC business page
2. **Expected:** Shows:
   - ❄️ AC Tune-Up
   - 🔥 Heating Repairs
   - 🌬️ AC Repairs
   - 🏠 Installation
   - 🌪️ Duct Cleaning

**Test 2.3: Electrical Services**
1. Navigate to electrical business page
2. **Expected:** Shows:
   - ⚡ Wiring Services
   - 🔌 Outlet Installation
   - 📊 Panel Upgrades
   - 💡 Lighting Installation
   - 🔍 Safety Inspections

**Test 2.4: Default Services (Unknown Industry)**
1. Create business with industry = 'other' or null
2. **Expected:** Shows generic services:
   - 💬 Consultation
   - 📋 Estimates
   - 🔧 Repairs
   - ⚙️ Installation
   - 🛠️ Maintenance

---

### Test 3: SEO Metadata

**Objective:** Verify SEO tags are properly implemented

**Test 3.1: Page Title**
1. Navigate to `/b/houston-premier-plumbing`
2. Check browser tab title
3. **Expected:** "Houston Premier Plumbing | Desk.ai"

**Test 3.2: Meta Description**
1. View page source (Ctrl+U or Cmd+Option+U)
2. Search for `<meta name="description"`
3. **Expected:** Contains business name and industry description

**Test 3.3: OpenGraph Tags**
1. View page source
2. Verify presence of:
```html
<meta property="og:type" content="website" />
<meta property="og:title" content="Houston Premier Plumbing | Desk.ai" />
<meta property="og:description" content="Connect with Houston Premier Plumbing for professional plumbing services..." />
<meta property="og:image" content="..." />
<meta property="og:url" content="https://desk.ai/b/houston-premier-plumbing" />
```
4. **Expected:** All OG tags present

**Test 3.4: Twitter Card**
1. View page source
2. Verify presence of:
```html
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="..." />
<meta name="twitter:description" content="..." />
<meta name="twitter:image" content="..." />
```
5. **Expected:** All Twitter Card tags present

**Test 3.5: Social Preview Testing**
1. Use Facebook Sharing Debugger: https://developers.facebook.com/tools/debug/
2. Enter URL: `https://desk.ai/b/houston-premier-plumbing`
3. **Expected:** Shows business name, description, and logo

---

### Test 4: Chat Panel

**Objective:** Verify customer chat is polished and secure

**Test 4.1: Welcome Message**
1. Navigate to business page
2. Click "Chat with Us" button
3. **Expected:** Chat panel opens with message:
   - "💬 Chat with Houston Premier Plumbing"
   - "Hi! You're chatting with Houston Premier Plumbing. How can we help you today?"

**Test 4.2: Phone Number Input**
1. Check for phone number input field
2. **Expected:**
   - Label: "Your Phone Number"
   - Placeholder: "e.g., +1-555-123-4567"
   - Help text: "We'll use this to follow up on your request"

**Test 4.3: Chat UI (No Debug Panels)**
1. Enter phone number: `+1-555-999-8888`
2. Send a test message: "I need a plumber"
3. **Expected:**
   - Clean chat interface with message bubbles
   - NO extraction panel visible
   - NO debug information visible
   - NO internal business data visible
   - Chat title: "Live Chat"
   - Chat subtitle: "AI-powered assistance"

**Test 4.4: Business ID Routing**
1. Open browser dev tools → Network tab
2. Send a chat message
3. Check POST `/api/message` request payload
4. **Expected:** Payload contains correct `businessId` (UUID)

**Database Verification:**
```sql
-- Verify lead was created with correct business_id
SELECT * FROM leads 
WHERE customer_phone = '+1-555-999-8888'
ORDER BY created_at DESC 
LIMIT 1;

-- Expected: business_id matches the business you're chatting with
```

---

### Test 5: Directory Page

**Objective:** Verify directory shows all businesses with filtering

**Test 5.1: Business Cards Display**
1. Navigate to `http://localhost:3000/directory`
2. **Expected:** Page shows:
   - Page title: "Find a Service Provider"
   - Subtitle: "Connect with local businesses powered by AI-driven customer service"
   - Grid of business cards (1-3 columns depending on screen size)

**Test 5.2: Business Card Content**
1. Each card should display:
   - Business logo (or default icon)
   - Business name
   - Industry badge (with icon)
   - Phone number (with icon)
   - Service ZIP codes (as chips, max 4 shown)
   - "AI-Powered Response" badge
   - "💬 Chat with this Business" button (gradient)
   - "📞 Call Now" button (if phone exists)
2. **Expected:** All elements properly styled

**Test 5.3: ZIP Code Filter**
1. Enter ZIP code in filter: `77005`
2. **Expected:**
   - Only businesses serving 77005 are shown
   - Active filter chip appears: "ZIP: 77005"
   - "Clear all" button visible

**Test 5.4: Industry Filter**
1. Clear previous filters
2. Enter industry: `plumbing`
3. **Expected:**
   - Only plumbing businesses shown
   - Active filter chip: "Industry: plumbing"

**Test 5.5: Combined Filters**
1. Enter ZIP: `77005`
2. Enter industry: `plumbing`
3. **Expected:**
   - Only plumbing businesses in 77005 shown
   - Both filter chips visible
   - Click "Clear all" → filters reset

**Test 5.6: Empty State**
1. Enter ZIP code that no business serves: `99999`
2. **Expected:**
   - No businesses shown
   - Message: "No businesses found"
   - "Try adjusting your filters to see more results."

**Test 5.7: Business Card Navigation**
1. Click "💬 Chat with this Business" on any card
2. **Expected:** Redirects to `/b/[slug]` for that business

---

### Test 6: Data Security & Privacy

**Objective:** Ensure no internal/sensitive data leaks to public users

**Test 6.1: API Response Inspection**
1. Open dev tools → Network tab
2. Navigate to `/b/houston-premier-plumbing`
3. Find GET `/api/business/houston-premier-plumbing` request
4. Check response body
5. **Expected:** Response should NOT include:
   - `stripe_customer_id`
   - `subscription_tier`
   - `owner_user_id`
   - `created_by`
   - `api_keys`
   - Any internal settings
6. **Expected:** Response SHOULD include:
   - `id`, `slug`, `name`, `phone`, `email`
   - `industry`, `zip_codes`, `logo_url`, `color_scheme`
   - Public fields only

**Test 6.2: Directory API Response**
1. Load `/directory` page
2. Check GET `/api/businesses` response
3. **Expected:** Same security rules as above

**Test 6.3: Chat Message Privacy**
1. Send chat messages from public business page
2. Log in as business owner
3. Navigate to dashboard → Leads
4. **Expected:**
   - Lead appears with correct customer info
   - Chat conversation visible to owner
   - Customer phone matches what was entered

**Test 6.4: Cross-Business Data Isolation**
1. Chat with Business A (record conversation)
2. Navigate to Business B's page
3. Check chat panel
4. **Expected:**
   - Previous conversation NOT visible
   - Chat starts fresh
   - Messages go to correct business_id

---

### Test 7: Responsive Design

**Objective:** Verify pages work on mobile devices

**Test 7.1: Business Page Mobile**
1. Open dev tools → Toggle device toolbar
2. Select iPhone 12 Pro
3. Navigate to business page
4. **Expected:**
   - Header logo/info stacks vertically
   - Call/Chat buttons are full-width
   - Services section is readable
   - No horizontal scroll

**Test 7.2: Directory Mobile**
1. Navigate to `/directory` on mobile
2. **Expected:**
   - Business cards stack in single column
   - Filters are usable
   - All text is readable

---

### Test 8: Performance & Loading

**Objective:** Verify pages load quickly

**Test 8.1: Business Page Load Time**
1. Open dev tools → Network tab
2. Reload `/b/houston-premier-plumbing`
3. Check total load time
4. **Expected:** Page loads in <2 seconds

**Test 8.2: Directory Load Time**
1. Reload `/directory`
2. **Expected:** Page loads in <3 seconds (even with 10+ businesses)

**Test 8.3: Image Optimization**
1. Check logo images in Network tab
2. **Expected:** Logos are optimized (<500KB each)

---

## API Testing with cURL

### Test Business Page Data
```bash
# Get business by slug
curl -s http://localhost:3001/api/business/houston-premier-plumbing | jq

# Expected Response:
{
  "ok": true,
  "business": {
    "id": "uuid",
    "slug": "houston-premier-plumbing",
    "name": "Houston Premier Plumbing",
    "phone": "+1-713-555-0100",
    "email": "info@houstonplumbing.com",
    "industry": "plumbing",
    "logo_url": null,
    "color_scheme": "professional",
    "zip_codes": ["77005", "77030", "77098"],
    "serviceZipCodes": ["77005", "77030", "77098"],
    "services": [],
    "hours": {},
    "pricing": {},
    "policies": {}
  }
}
```

### Test Directory Listing
```bash
# Get all businesses
curl -s http://localhost:3001/api/businesses | jq

# Expected Response:
{
  "ok": true,
  "businesses": [
    {
      "id": "uuid",
      "slug": "houston-premier-plumbing",
      "name": "Houston Premier Plumbing",
      ...
    },
    ...
  ],
  "count": 2
}
```

### Test Chat Message Routing
```bash
# Send message to specific business
curl -X POST http://localhost:3001/api/message \
  -H "Content-Type: application/json" \
  -d '{
    "businessId": "uuid-of-business",
    "from": "+1-555-999-8888",
    "channel": "web_chat",
    "message": "I need help with a leaky faucet"
  }' | jq

# Expected Response:
{
  "reply": "I can definitely help with that leaky faucet!..."
}
```

---

## Database Verification Queries

### Check Business Data
```sql
SELECT 
  id,
  slug,
  name,
  industry,
  zip_codes,
  logo_url,
  color_scheme,
  is_active
FROM businesses
WHERE slug = 'houston-premier-plumbing';
```

**Expected:** All fields populated correctly

### Verify Leads Go to Correct Business
```sql
SELECT 
  l.id,
  l.business_id,
  l.customer_phone,
  l.status,
  b.name as business_name
FROM leads l
JOIN businesses b ON l.business_id = b.id
WHERE l.customer_phone = '+1-555-999-8888'
ORDER BY l.created_at DESC;
```

**Expected:** `business_id` matches the business you chatted with

### Check No Data Leakage
```sql
-- This query should NOT return sensitive fields in API responses
SELECT 
  id,
  slug,
  name,
  stripe_customer_id,  -- Should NOT be in API
  subscription_tier,    -- Should NOT be in API
  created_by           -- Should NOT be in API
FROM businesses
WHERE slug = 'houston-premier-plumbing';
```

**Manual Verification:** Check API responses don't include stripe_customer_id, subscription_tier, etc.

---

## Common Issues & Troubleshooting

### Issue 1: Business page shows "Business Not Found"
**Symptom:** Navigating to `/b/[slug]` shows error

**Fix:**
1. Check business exists: `SELECT * FROM businesses WHERE slug = 'your-slug'`
2. Check `is_active = true`
3. Verify slug matches URL exactly (case-sensitive)

### Issue 2: Services not showing
**Symptom:** "Our Services" section is empty

**Fix:**
1. Check `industryServices.js` has entry for your industry
2. Verify industry name matches exactly (lowercase, underscores)
3. Check browser console for errors

### Issue 3: Logo not displaying
**Symptom:** Default icon shows instead of uploaded logo

**Fix:**
1. Check `logo_url` field in database is not null
2. Verify logo URL is accessible
3. Check image file size (<2MB recommended)

### Issue 4: ZIP code filter not working
**Symptom:** Filtering by ZIP shows no results

**Fix:**
1. Check `zip_codes` field is JSON array: `["77005", "77030"]`
2. Verify ZIP codes don't have extra spaces
3. Clear browser cache

### Issue 5: Chat messages go to wrong business
**Symptom:** Lead appears in different business's dashboard

**Fix:**
1. Check browser dev tools → Network → POST `/api/message`
2. Verify `businessId` in payload matches expected business
3. Check `business.id` is being passed correctly from page

### Issue 6: SEO tags not showing
**Symptom:** Facebook preview doesn't work

**Fix:**
1. View page source (not dev tools Elements)
2. Verify `<Head>` tags are rendered on server-side
3. Use Facebook Debugger to clear cache
4. Check Next.js is rendering `<Head>` correctly

---

## Success Criteria

All tests should pass with the following criteria:

✅ **Public Business Page**
- Header displays logo, name, industry, ZIP codes
- Call and Chat buttons functional
- Services section shows industry-specific categories
- No debug panels or internal data visible
- Professional gradient branding (blue-purple)
- SEO metadata complete (title, description, OG tags)

✅ **Chat Functionality**
- Welcome message displays business name
- Phone input required before chatting
- Messages route to correct business_id
- Leads appear in correct business dashboard
- No extraction/debug panels visible

✅ **Directory Page**
- All active businesses displayed
- Business cards show logo, industry, ZIPs, phone
- ZIP code filtering works correctly
- Industry filtering works correctly
- Combined filters work correctly
- "Chat with this Business" navigates correctly
- "Call Now" opens phone dialer

✅ **Security & Privacy**
- API responses exclude sensitive fields
- No stripe_customer_id, subscription_tier, etc. in public APIs
- Cross-business data isolation verified
- Customer chat data only visible to correct business owner

✅ **SEO & Metadata**
- Page titles unique per business
- Meta descriptions include business name and industry
- OpenGraph tags complete for social sharing
- Twitter Card tags present
- Canonical URLs set correctly

✅ **Performance**
- Business pages load in <2 seconds
- Directory loads in <3 seconds
- Images optimized (<500KB)
- No console errors

✅ **Responsive Design**
- Mobile layout works (no horizontal scroll)
- Buttons accessible on touch devices
- Text readable on small screens

---

## Deployment Checklist

Before deploying to production:

- [ ] Test all business pages with real data
- [ ] Verify SEO tags with Facebook Sharing Debugger
- [ ] Test chat routing with multiple businesses
- [ ] Confirm no data leakage in API responses
- [ ] Test on multiple mobile devices
- [ ] Optimize all logo images
- [ ] Set up proper error tracking (Sentry)
- [ ] Configure proper CORS for production domain
- [ ] Test social sharing previews
- [ ] Verify SSL certificates for HTTPS

---

## Support & Contact

For issues during testing:
- Check frontend console for errors
- Check backend logs for API errors
- Verify database state in Supabase dashboard
- Reference `PUBLIC_PAGES_COMMIT_SUMMARY.md` for implementation details
