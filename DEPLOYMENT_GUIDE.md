# Desk.ai - Deployment Guide

**Version**: 1.0 (Production-Ready SaaS)  
**Date**: November 24, 2025  
**Status**: Ready for Beta Deployment

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Environment Setup](#environment-setup)
4. [Database Migrations](#database-migrations)
5. [Deployment Steps](#deployment-steps)
6. [Routing Map](#routing-map)
7. [Testing Scenarios](#testing-scenarios)
8. [Post-Deployment Verification](#post-deployment-verification)
9. [Known Limitations](#known-limitations)
10. [Rollback Plan](#rollback-plan)

---

## Overview

### Product Architecture

**Growzone** - Umbrella brand for AI-powered local service solutions  
**Desk.ai** - Flagship product for business customer service automation

### Stack
- **Frontend**: Next.js 14.2.33 (React)
- **Backend**: Express.js (Node.js)
- **Database**: Supabase PostgreSQL with RLS
- **Styling**: Tailwind CSS
- **Auth**: Supabase Auth

### Key Features
✅ Multi-tenant architecture with RLS  
✅ Marketplace for public business discovery  
✅ AI-powered customer chat  
✅ Business onboarding wizard  
✅ Owner dashboard with analytics  
✅ Public business pages (`/b/[slug]`)

---

## Prerequisites

### Required Accounts & Services
- [ ] Supabase project (database + auth)
- [ ] OpenAI API key (GPT-4 for chat)
- [ ] Twilio account (SMS notifications - optional)
- [ ] Deployment platform (Vercel/Railway recommended)

### Environment Variables Required

**Frontend (.env.local)**:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_BACKEND_URL=https://your-backend-url.com
```

**Backend (.env)**:
```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI
OPENAI_API_KEY=sk-your-openai-key

# Server
PORT=3001
NODE_ENV=production

# Twilio (optional)
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Google Calendar (optional)
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

---

## Environment Setup

### 1. Clone & Install Dependencies

```bash
# Clone repository
git clone https://github.com/marcocancio06-commits/desk.ai.git
cd desk.ai

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../frontdesk-backend
npm install
```

### 2. Configure Environment Variables

```bash
# Frontend
cp frontend/.env.example frontend/.env.local
# Edit frontend/.env.local with your values

# Backend
cp frontdesk-backend/.env.example frontdesk-backend/.env
# Edit frontdesk-backend/.env with your values
```

---

## Database Migrations

### Critical: Run Migration 008

This migration adds marketplace functionality (is_public, tagline, short_description).

**Option 1: Supabase Dashboard (Recommended)**

1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `frontdesk-backend/migrations/008_add_marketplace_fields.sql`
3. Paste and execute
4. Verify columns exist:
```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'businesses' 
  AND column_name IN ('is_public', 'tagline', 'short_description');
```

**Option 2: Supabase CLI**

```bash
cd frontdesk-backend
supabase db push
```

**What This Migration Does:**
- Adds `is_public` BOOLEAN (default: false)
- Adds `tagline` TEXT (max 60 chars)
- Adds `short_description` TEXT (max 200 chars)
- Creates index on `is_public` for marketplace queries
- Sets existing businesses to private (`is_public = false`)

**⚠️ Safety**: Uses `IF NOT EXISTS` - safe to run multiple times

---

## Deployment Steps

### Option A: Vercel (Frontend) + Railway (Backend)

#### Deploy Frontend to Vercel

```bash
cd frontend
vercel

# Or connect GitHub repo in Vercel dashboard
# Add environment variables in Vercel settings
```

**Vercel Configuration**:
- Framework: Next.js
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`
- Node Version: 18.x or higher

#### Deploy Backend to Railway

```bash
cd frontdesk-backend
railway login
railway init
railway up

# Add environment variables in Railway dashboard
```

**Railway Configuration**:
- Start Command: `node index.js`
- Port: 3001
- Node Version: 18.x or higher

### Option B: Single Platform (e.g., Railway for both)

```bash
# Create two services in Railway:
# Service 1: Frontend (Next.js)
# Service 2: Backend (Express)
```

---

## Routing Map

### Public Routes (No Auth Required)

| Route | Purpose | Status |
|-------|---------|--------|
| `/` | Growzone landing page | ✅ Production |
| `/marketplace` | Browse public businesses | ✅ Production |
| `/b/[slug]` | Public business page + chat | ✅ Production |
| `/auth/login` | User login | ✅ Production |
| `/auth/signup` | User signup | ✅ Production |
| `/demo-chat` | Internal demo (optional) | ⚠️ Beta only |

### Protected Routes (Auth Required)

| Route | Purpose | Auth Level | Status |
|-------|---------|------------|--------|
| `/dashboard` | Business owner home | Owner | ✅ Production |
| `/dashboard/leads` | Manage customer leads | Owner | ✅ Production |
| `/dashboard/calendar` | View appointments | Owner | ✅ Production |
| `/dashboard/team` | Manage team members | Owner | ✅ Production |
| `/dashboard/settings` | Business settings | Owner | ✅ Production |
| `/dashboard/analytics` | Business metrics | Owner | ✅ Production |
| `/onboarding` | New business setup | Authenticated | ✅ Production |

### API Endpoints

**Public Endpoints**:
```
GET  /api/marketplace              # List public businesses
GET  /api/business/:slug           # Get business by slug
POST /api/message                  # Send customer message (no auth)
GET  /health                       # Server health check
```

**Protected Endpoints** (require auth token):
```
POST /api/business/create          # Create new business
GET  /api/auth/businesses          # Get user's businesses
GET  /api/leads                    # Get business leads
POST /api/leads/:id/update         # Update lead status
GET  /api/calendar/availability    # Get calendar slots
POST /api/team/invite              # Invite team member
```

---

## Testing Scenarios

### End-to-End Test: Owner Flow

**Objective**: Verify complete business owner journey

1. **Sign Up**
   ```
   - Navigate to /auth/signup?role=owner
   - Enter email: test-owner@example.com
   - Enter password: Test123!
   - Click "Sign up with Email"
   - Verify email (check inbox or Supabase Auth)
   ```

2. **Onboarding**
   ```
   - Step 1: Business Details
     - Name: "Test Plumbing Co"
     - Industry: "plumbing"
     - Phone: "(555) 123-4567"
     - Email: "info@testplumbing.com"
   
   - Step 2: Service Area
     - ZIP codes: 77001, 77002, 77003
   
   - Step 3: Marketplace Visibility
     - Toggle ON for marketplace listing
     - Tagline: "Fast, Reliable Plumbing Services"
     - Description: "Licensed plumbers available 24/7 for all your plumbing needs. Emergency services, repairs, and installations."
     - Verify live preview shows correctly
   
   - Step 4: Review & Confirm
     - Verify all details
     - Click "Complete Setup"
   ```

3. **Dashboard Access**
   ```
   - Verify redirect to /dashboard
   - Check "Welcome to Desk.ai" message
   - Verify empty states for leads
   - Navigate to Settings
   - Navigate to Team
   ```

4. **Marketplace Verification**
   ```
   - Log out (or use incognito window)
   - Navigate to /marketplace
   - Verify "Test Plumbing Co" appears
   - Verify tagline and description display
   - Click "Chat with this business"
   - Verify redirects to /b/test-plumbing-co
   ```

**Expected Results**:
✅ Business created successfully  
✅ Appears in marketplace  
✅ Public page accessible  
✅ Chat interface loads  
✅ Dashboard displays correctly  

---

### End-to-End Test: Customer Flow

**Objective**: Verify customer can find and contact business

1. **Browse Marketplace**
   ```
   - Navigate to /marketplace
   - See list of public businesses
   - Use search: Enter "plumbing"
   - Filter by ZIP: Enter "77001"
   - Verify "Test Plumbing Co" shows in results
   ```

2. **View Business Page**
   ```
   - Click "Chat with this business"
   - Verify URL: /b/test-plumbing-co
   - Check tagline displays
   - Check description displays
   - Check service areas (ZIP codes)
   - Check industry badge
   ```

3. **Start Conversation**
   ```
   - Click "Chat with Us" button
   - Enter phone number: +1-555-987-6543
   - Type message: "I have a leaky faucet"
   - Click Send
   - Verify AI response appears
   - Continue conversation (2-3 messages)
   ```

4. **Verify Lead Capture** (as owner)
   ```
   - Log in as business owner
   - Navigate to /dashboard/leads
   - Verify new lead appears
   - Check phone number: +1-555-987-6543
   - Check conversation history
   - Verify lead status: "collecting_info"
   ```

**Expected Results**:
✅ Marketplace filters work  
✅ Business page loads correctly  
✅ Chat sends/receives messages  
✅ Lead captured in owner dashboard  
✅ Conversation linked to correct business  

---

### Critical Tests Before Go-Live

**Data Isolation (Multi-Tenancy)**:
```
✅ Owner A cannot see Owner B's leads
✅ Chat messages linked to correct business_id
✅ Business slug is unique across platform
✅ RLS policies prevent cross-tenant data access
```

**Marketplace Privacy**:
```
✅ Private businesses (is_public = false) do NOT appear in /marketplace
✅ Private businesses still accessible via /b/[slug] (optional: can add check)
✅ Only approved fields returned in marketplace API
```

**Auth & Security**:
```
✅ Protected routes redirect to login
✅ JWT tokens validated on backend
✅ Service role key not exposed to frontend
✅ API endpoints require business_id parameter
```

**Performance**:
```
✅ Marketplace query indexed (is_public column)
✅ Business lookup by slug indexed
✅ Chat responses < 5 seconds
✅ Dashboard loads < 2 seconds
```

---

## Post-Deployment Verification

### Health Checks

1. **Backend Health**
   ```bash
   curl https://your-backend-url.com/health
   # Expected: { "status": "ok", "timestamp": "..." }
   ```

2. **Frontend Pages**
   ```bash
   # Landing page
   curl -I https://your-frontend-url.com/
   # Expected: HTTP/2 200
   
   # Marketplace
   curl -I https://your-frontend-url.com/marketplace
   # Expected: HTTP/2 200
   ```

3. **API Endpoints**
   ```bash
   # Marketplace API
   curl https://your-backend-url.com/api/marketplace
   # Expected: { "ok": true, "businesses": [...], "count": N }
   ```

### Monitoring Checklist

- [ ] Backend logs show no errors
- [ ] Frontend builds successfully
- [ ] Database migrations completed
- [ ] Environment variables set correctly
- [ ] HTTPS enabled (SSL certificate)
- [ ] CORS configured for frontend domain
- [ ] Rate limiting enabled (optional)

---

## Known Limitations (v1.0 Beta)

### Features Not Yet Implemented

1. **Email Notifications**
   - Team invites send email (if configured)
   - Lead notifications not automated yet

2. **Calendar Integration**
   - Google Calendar integration code exists but not fully tested
   - Manual appointment scheduling required

3. **Payment Processing**
   - No billing/subscription system (free beta)
   - Add payment gateway before charging customers

4. **Advanced Analytics**
   - Basic metrics only (lead counts, statuses)
   - No revenue tracking or conversion funnels

5. **Mobile App**
   - Web-only (responsive design)
   - No native iOS/Android apps

### Temporary Workarounds

- **Demo Chat**: Keep `/demo-chat` route for internal testing, hide from nav
- **Directory**: Replaced by `/marketplace`, old `/directory` redirects
- **Settings**: Some fields read-only until backend endpoints added

---

## Rollback Plan

### If Deployment Fails

**Rollback Frontend**:
```bash
# Vercel
vercel rollback [deployment-url]

# Or redeploy previous version
git checkout [previous-commit]
vercel --prod
```

**Rollback Backend**:
```bash
# Railway
railway rollback

# Or redeploy previous version
git checkout [previous-commit]
railway up
```

**Rollback Database Migration**:
```sql
-- Remove marketplace fields if needed
ALTER TABLE businesses DROP COLUMN IF EXISTS is_public;
ALTER TABLE businesses DROP COLUMN IF EXISTS tagline;
ALTER TABLE businesses DROP COLUMN IF EXISTS short_description;
DROP INDEX IF EXISTS idx_businesses_is_public;
```

---

## Support & Troubleshooting

### Common Issues

**Issue**: Businesses not appearing in marketplace  
**Solution**: Verify `is_public = true` in database, check migration ran

**Issue**: Chat not responding  
**Solution**: Check OpenAI API key, verify backend logs, test `/health` endpoint

**Issue**: Login fails  
**Solution**: Check Supabase auth settings, verify JWT token in browser DevTools

**Issue**: RLS errors  
**Solution**: Verify service role key in backend, check Supabase policies

### Debug Endpoints

```bash
# Check backend health
GET /health

# Check if business exists
GET /api/business/:slug

# List marketplace businesses
GET /api/marketplace
```

---

## Launch Checklist

**Pre-Launch**:
- [ ] All environment variables set
- [ ] Migration 008 executed
- [ ] Test owner flow (signup → onboarding → dashboard)
- [ ] Test customer flow (marketplace → business page → chat)
- [ ] Verify data isolation (multi-tenancy)
- [ ] SSL certificate active
- [ ] Custom domain configured
- [ ] Backup database

**Launch Day**:
- [ ] Deploy frontend to production
- [ ] Deploy backend to production
- [ ] Verify health checks pass
- [ ] Test critical user flows
- [ ] Monitor error logs
- [ ] Announce beta launch

**Post-Launch**:
- [ ] Monitor server metrics (CPU, memory)
- [ ] Track user signups
- [ ] Collect feedback
- [ ] Plan v1.1 features

---

## Next Steps (Post-v1.0)

**Planned Enhancements**:
1. Email notification system
2. Payment/subscription management
3. Advanced analytics dashboard
4. Mobile app development
5. SMS notifications via Twilio
6. CRM integrations
7. White-label options

---

**Deployment Guide v1.0**  
Last Updated: November 24, 2025  
Contact: support@desk.ai (placeholder)
