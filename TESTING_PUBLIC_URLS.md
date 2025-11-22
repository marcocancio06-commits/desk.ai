# Multi-Tenant Public Business URLs - Testing Guide

This guide explains how to test the new public business URLs and directory features.

## 🎯 What Was Implemented

### Step 3: Public Business URLs + Customer Chat
- ✅ Dynamic route `/b/[slug]` for public business pages
- ✅ Backend API endpoints for fetching business data
- ✅ Chat component wired to use business UUID
- ✅ Demo chat continues to work with demo business

### Step 4: Simple Business Directory
- ✅ `/directory` page showing all active businesses
- ✅ Client-side filtering by ZIP code and industry
- ✅ "Talk to this business" buttons linking to `/b/[slug]`
- ✅ Demo/sales tool for multi-tenant showcase

---

## 🧪 Testing Instructions

### Prerequisites

1. **Backend must be running:**
```bash
cd frontdesk-backend
npm run dev
# Should start on http://localhost:3001
```

2. **Frontend must be running:**
```bash
cd frontend
npm run dev
# Should start on http://localhost:3000
```

3. **Database must have demo business:**
The migration `007_add_multi_tenancy.sql` should have created:
- Business: Houston Premier Plumbing
- Slug: `demo-plumbing`
- ID: `00000000-0000-0000-0000-000000000001`

---

## Test 1: Backend API Endpoints

### Test `/api/business/:slug`

**Request:**
```bash
curl http://localhost:3001/api/business/demo-plumbing
```

**Expected Response:**
```json
{
  "ok": true,
  "business": {
    "id": "00000000-0000-0000-0000-000000000001",
    "slug": "demo-plumbing",
    "name": "Houston Premier Plumbing",
    "phone": "+1-713-555-0100",
    "email": "contact@houstonpremierplumbing.com",
    "industry": "plumbing",
    "serviceZipCodes": ["77005", "77030", "77098", "77025", "77019"],
    "services": ["Emergency Plumbing", "Drain Cleaning", ...],
    "hours": {...},
    "pricing": {...},
    "policies": {...}
  }
}
```

**Test non-existent business:**
```bash
curl http://localhost:3001/api/business/non-existent
# Should return 404
```

### Test `/api/businesses`

**Request:**
```bash
curl http://localhost:3001/api/businesses
```

**Expected Response:**
```json
{
  "ok": true,
  "businesses": [
    {
      "id": "00000000-0000-0000-0000-000000000001",
      "slug": "demo-plumbing",
      "name": "Houston Premier Plumbing",
      ...
    }
  ],
  "count": 1
}
```

---

## Test 2: Public Business Page (`/b/[slug]`)

### Access the page

1. Open browser to: http://localhost:3000/b/demo-plumbing

2. **Expected UI:**
   - Desk.ai logo in header
   - "Message Houston Premier Plumbing" title
   - Business info badges: Plumbing | Phone | ZIP codes
   - Phone number input field
   - Chat interface

### Test chat functionality

3. **Enter phone number:**
   - Type: `+1-555-TEST-001`
   - Should enable the chat input

4. **Send a message:**
   ```
   Message: "My water heater is leaking"
   ```
   
5. **Expected behavior:**
   - User message appears in chat (blue bubble, right-aligned)
   - Loading indicator shows (3 animated dots)
   - AI response appears (white bubble, left-aligned)
   - Response should be contextual to plumbing

6. **Verify in database:**
   ```sql
   -- In Supabase SQL Editor:
   SELECT id, phone, issue_summary, business_id 
   FROM leads 
   WHERE phone = '+1-555-TEST-001'
   ORDER BY created_at DESC 
   LIMIT 1;
   ```
   
   **Expected:**
   - `business_id` = `00000000-0000-0000-0000-000000000001`
   - `phone` = `+1-555-TEST-001`
   - `issue_summary` contains "water heater" or "leak"

### Test error states

7. **Test non-existent business:**
   - Visit: http://localhost:3000/b/non-existent-business
   - Should show "Business Not Found" error page
   - Should have buttons: "Browse Businesses" and "Go Home"

8. **Test timeout:**
   - If backend is slow, message should timeout after 30 seconds
   - Should show system error message in yellow

---

## Test 3: Business Directory (`/directory`)

### Access the directory

1. Open browser to: http://localhost:3000/directory

2. **Expected UI:**
   - "Find a Service Provider" title
   - Filter inputs for ZIP code and industry
   - Business cards in grid layout
   - Demo-plumbing business card showing:
     * Houston Premier Plumbing
     * "Plumbing" badge
     * Phone number
     * Service ZIP codes (77005, 77030, etc.)
     * Services (Emergency Plumbing, etc.)
     * "Chat with Houston Premier" button

### Test filtering

3. **Filter by ZIP code:**
   - Enter: `77005` in ZIP filter
   - Business should still appear (77005 is in service areas)
   - Enter: `99999` in ZIP filter
   - Business should disappear (not in service areas)
   - Clear filter

4. **Filter by industry:**
   - Enter: `plumbing` in Industry filter
   - Business should still appear
   - Enter: `hvac` in Industry filter
   - Business should disappear
   - Clear filter

5. **Filter by both:**
   - ZIP: `77005`, Industry: `plumbing`
   - Business should appear
   - Active filters shown with tags
   - "Clear all" button should reset both filters

### Test navigation

6. **Click business card button:**
   - Click "Chat with Houston Premier"
   - Should navigate to `/b/demo-plumbing`
   - Chat interface should load

---

## Test 4: Demo Chat (Backward Compatibility)

### Verify demo chat still works

1. Open browser to: http://localhost:3000/demo-chat

2. **Expected:**
   - Redirects to `/demo-chat/owner`
   - Chat interface loads
   - Enter phone: `+1-555-DEMO-001`
   - Send message: "Test demo chat"

3. **Verify in database:**
   ```sql
   SELECT id, phone, business_id 
   FROM leads 
   WHERE phone = '+1-555-DEMO-001'
   ORDER BY created_at DESC 
   LIMIT 1;
   ```
   
   **Expected:**
   - `business_id` = `00000000-0000-0000-0000-000000000001` (same demo business)
   - Lead created successfully

---

## Test 5: Business Isolation

### Create leads from different entry points

1. **From `/b/demo-plumbing`:**
   - Phone: `+1-555-PUBLIC-001`
   - Message: "Public page test"

2. **From `/demo-chat`:**
   - Phone: `+1-555-DEMO-002`
   - Message: "Demo chat test"

3. **Check database:**
   ```sql
   SELECT phone, channel, business_id, created_at
   FROM leads
   WHERE phone LIKE '+1-555-%'
   ORDER BY created_at DESC;
   ```
   
   **Expected:**
   - Both leads have `business_id` = demo UUID
   - One has `channel` = 'web_chat' (from public page)
   - One has `channel` = 'web_chat' (from demo)
   - Both correctly isolated to demo business

### (Future) Test with multiple businesses

When you add a second business:

```sql
-- Insert new business
INSERT INTO businesses (
  slug, name, phone, industry, 
  service_zip_codes, is_active
) VALUES (
  'austin-hvac',
  'Austin HVAC Pro',
  '+1-512-555-0200',
  'hvac',
  '["78701", "78702", "78703"]'::jsonb,
  true
);
```

Then:
- Visit `/directory` - should see both businesses
- Visit `/b/austin-hvac` - should work
- Send message - lead should have austin-hvac's business_id
- Verify isolation: demo-plumbing leads != austin-hvac leads

---

## 🐛 Troubleshooting

### Business not found

**Symptom:** `/b/demo-plumbing` shows "Business Not Found"

**Solutions:**
1. Check if migration ran:
   ```sql
   SELECT slug, name FROM businesses WHERE slug = 'demo-plumbing';
   ```
2. Verify business is active:
   ```sql
   SELECT is_active FROM businesses WHERE slug = 'demo-plumbing';
   ```
3. Check backend logs for API errors

### Chat not sending messages

**Symptom:** Messages don't send, or get timeout errors

**Solutions:**
1. Verify backend is running on port 3001
2. Check browser console for CORS errors
3. Verify business UUID is being passed:
   - Open DevTools → Network tab
   - Send message
   - Check `/api/message` request body
   - Should contain `businessId: "00000000-0000-0000-0000-000000000001"`

### Directory is empty

**Symptom:** `/directory` shows "No businesses found"

**Solutions:**
1. Check `/api/businesses` endpoint:
   ```bash
   curl http://localhost:3001/api/businesses
   ```
2. Verify demo business exists and is active
3. Check browser console for fetch errors

### Wrong business_id in database

**Symptom:** Leads have NULL or wrong business_id

**Solutions:**
1. Verify UUID is being passed from frontend:
   - Check `frontend/pages/b/[slug].js` line ~130
   - Should use `business.id` (UUID from API)
2. Check `frontend/lib/config.js`:
   - DEFAULT_BUSINESS_ID should be UUID string
3. Verify backend receives correct businessId:
   - Add logging in `index.js` at `/api/message` endpoint

---

## 📊 Verification SQL Queries

### Check all businesses
```sql
SELECT id, slug, name, industry, is_active 
FROM businesses;
```

### Check leads by business
```sql
SELECT 
  b.slug as business,
  COUNT(l.id) as lead_count
FROM businesses b
LEFT JOIN leads l ON l.business_id = b.id
GROUP BY b.id, b.slug;
```

### Check recent messages
```sql
SELECT 
  m.text,
  m.sender,
  l.phone,
  b.slug as business
FROM messages m
JOIN leads l ON m.lead_id = l.id
JOIN businesses b ON l.business_id = b.id
ORDER BY m.created_at DESC
LIMIT 10;
```

### Verify business isolation (RLS)
```sql
-- This should only show leads for businesses you have access to
-- If not authenticated, may return empty
SELECT * FROM leads;
```

---

## ✅ Success Criteria

All tests pass if:

1. ✅ `/api/business/demo-plumbing` returns business data
2. ✅ `/api/businesses` returns array of businesses
3. ✅ `/b/demo-plumbing` loads chat interface
4. ✅ Chat messages create leads with correct business_id
5. ✅ `/directory` shows business cards
6. ✅ Directory filters work (ZIP and industry)
7. ✅ `/demo-chat` still works (backward compatible)
8. ✅ All leads have business_id as UUID (not NULL)
9. ✅ Non-existent business slugs return 404
10. ✅ No console errors in browser

---

## 🚀 Next Steps

After verifying everything works:

1. **Add more demo businesses** (optional for demo)
2. **Implement business onboarding flow** (signup → create business)
3. **Add owner authentication** (link users to businesses)
4. **Create owner dashboard improvements** (business selector)
5. **Add custom branding per business** (logo, colors, etc.)

---

## 📁 Files Changed

**Backend:**
- `frontdesk-backend/index.js` - Added business API endpoints

**Frontend:**
- `frontend/pages/b/[slug].js` - NEW: Public business page
- `frontend/pages/directory.js` - NEW: Business directory
- `frontend/lib/config.js` - Updated business ID to UUID

**Database:**
- No new migrations required (uses existing multi-tenancy schema)

---

## 🔐 Environment Variables

No new environment variables required. Uses existing:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `ANTHROPIC_API_KEY`

---

## 📚 Related Documentation

- `MULTI_TENANCY_MIGRATION.md` - Database schema
- `MULTI_TENANCY_SCHEMA.md` - Entity relationships
- `RELIABILITY_SETUP.md` - Monitoring and logging
- `migrations/007_add_multi_tenancy.sql` - Migration SQL

---

**Testing completed:** [DATE]
**Tested by:** [YOUR NAME]
**All tests passed:** ☐ Yes ☐ No
**Issues found:** _____________________________
