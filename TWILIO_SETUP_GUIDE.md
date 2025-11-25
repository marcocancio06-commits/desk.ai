# Twilio SMS Integration Setup Guide

**Date**: November 25, 2025  
**Status**: ✅ Fully Implemented & Ready to Use

---

## Quick Summary

**Twilio integration is ALREADY IMPLEMENTED** in this codebase. This guide explains how to configure your Twilio credentials so SMS messaging works in your Desk.ai deployment.

**What Twilio enables**:
- 📱 Two-way SMS conversations with customers
- 🤖 AI-powered auto-responses via text message
- 📊 Full SMS conversation history in the dashboard
- 🎯 Automatic lead capture from inbound texts
- 💬 Send outbound SMS from the lead detail view

---

## Table of Contents

1. [Overview](#overview)
2. [What Already Exists](#what-already-exists)
3. [Twilio Account Setup](#twilio-account-setup)
4. [Sandbox Mode (Free Testing)](#sandbox-mode-free-testing)
5. [Production Setup](#production-setup)
6. [Environment Configuration](#environment-configuration)
7. [Webhook Configuration](#webhook-configuration)
8. [Testing Your Setup](#testing-your-setup)
9. [Dashboard Integration](#dashboard-integration)
10. [API Endpoints](#api-endpoints)
11. [Database Schema](#database-schema)
12. [Troubleshooting](#troubleshooting)
13. [Cost & Security](#cost--security)

---

## Overview

### How Twilio Works in Desk.ai

```
Customer texts           Twilio receives it      Your backend processes it
+15551234567  ────────>  +1 (YOUR NUMBER) ────>  http://yourapp.com/api/twilio/sms/inbound
    │                           │                          │
    │                           │                          ├─> Creates/updates lead
    │                           │                          ├─> Sends to OpenAI
    │                           │                          └─> Generates AI response
    │                           │                          
    │<──────────────────────────┴───────────────────────────── AI response sent back
  Receives                   Twilio sends               
  AI response                response SMS
```

### Current Implementation Status

| Feature | Status | Location |
|---------|--------|----------|
| **Inbound SMS webhook** | ✅ Implemented | `frontdesk-backend/index.js` line 1224 |
| **Outbound SMS API** | ✅ Implemented | `frontdesk-backend/index.js` line 1333 |
| **Twilio service layer** | ✅ Implemented | `frontdesk-backend/twilioService.js` |
| **SMS queue system** | ✅ Implemented | `frontdesk-backend/smsQueue.js` |
| **Database tables** | ✅ Migrated | Migration 006 (messages table) |
| **Dashboard UI** | ✅ Built | Settings page shows Twilio status |
| **Lead SMS badges** | ✅ Working | Dashboard marks leads with SMS icon |
| **Conversation history** | ✅ Tracked | Full SMS thread stored in DB |

---

## What Already Exists

### Backend Files

**1. `/frontdesk-backend/twilioService.js` (219 lines)**
- Twilio SDK wrapper
- Send/receive SMS methods
- Webhook signature validation
- Sandbox vs Production mode handling
- Phone number formatting utilities

**2. `/frontdesk-backend/smsQueue.js` (183 lines)**
- Rate-limited SMS sending (1 msg/second)
- Automatic retry logic (3 attempts)
- Prevents Twilio API violations
- Queue status monitoring

**3. `/frontdesk-backend/index.js` - SMS Routes**

| Route | Method | Purpose | Line |
|-------|--------|---------|------|
| `/api/twilio/status` | GET | Configuration status | 1213 |
| `/api/twilio/sms/inbound` | POST | Receive SMS from Twilio | 1224 |
| `/api/twilio/sms/outbound` | POST | Send SMS to customer | 1333 |
| `/api/leads/:leadId/sms` | GET | Get SMS history for lead | 1410 |
| `/api/twilio/sms/status` | POST | Delivery status webhook | 1446 |
| `/api/admin/sms-queue` | GET | Queue monitoring | 1543 |

### Frontend Files

**1. `/frontend/pages/dashboard/settings.js`**
- Twilio integration card (line 817)
- Shows configuration status
- Displays phone number, test/prod mode
- Lists enabled features

**2. `/frontend/pages/dashboard/components/LeadTable.js`**
- SMS badge on leads (line 93)
- Shows last SMS timestamp
- Visual indicator for text conversations

**3. `/frontend/pages/dashboard/logs.js`**
- SMS queue status dashboard (line 148)
- Pending/sent/failed counters
- Real-time queue monitoring

### Database Schema

**Migration 006: `add_sms_messages.sql`**
- Created `messages` table for SMS storage
- Added `twilio_sid`, `direction`, `from_number`, `to_number` fields
- Added `sms_enabled`, `last_sms_at`, `sms_opt_out` to `leads` table
- Indexed for performance

---

## Twilio Account Setup

### Prerequisites

- [ ] A Twilio account (free trial or paid)
- [ ] Access to backend `.env` file
- [ ] Public URL for webhooks (ngrok for local dev)
- [ ] Supabase database with migration 006 applied

### Step 1: Create Twilio Account

1. Visit **https://www.twilio.com/try-twilio**
2. Sign up with your email
3. Verify your email and phone number
4. Complete onboarding (select "SMS" as your use case)
5. You'll get **$15 free trial credit** 🎉

### Step 2: Get Your Credentials

1. Go to Twilio Console: **https://console.twilio.com**
2. Click **Account** → **Dashboard**
3. Find **Account Info** section
4. Copy these values (you'll need them):

   ```
   Account SID:  ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   Auth Token:   (click "View" to reveal)
   ```

   **⚠️ Important**: Treat these like passwords. Never commit to git!

---

## Sandbox Mode (Free Testing)

Perfect for development and testing without buying a phone number.

### What is Sandbox Mode?

- **Free**: No phone number purchase required
- **Limitations**: Can only send SMS to verified phone numbers
- **Messages**: May include a sandbox prefix from Twilio
- **Use case**: Local development, testing, demos

### Step 1: Get Your Sandbox Number

1. In Twilio Console, go to **Messaging** → **Try it out** → **Send an SMS**
2. Click **Get a trial number** or **Get started with SMS**
3. Twilio assigns you a free sandbox number (e.g., `+15551234567`)
4. **Copy this number** - you'll use it in your `.env` file

### Step 2: Verify Your Test Phone Number

To receive SMS in sandbox mode, your personal phone must be verified:

1. Go to **Phone Numbers** → **Verified Caller IDs**
2. Click **Add a new caller ID** (the red `+` button)
3. Enter your personal phone number in E.164 format:
   - ✅ Correct: `+15551234567` (country code + area + number)
   - ❌ Wrong: `555-123-4567` or `15551234567`
4. Choose verification method: **Call** or **SMS**
5. Enter the verification code Twilio sends you
6. ✅ Your number is now verified for sandbox testing!

**Repeat this step** for any other phone numbers you want to test with (team members, test accounts, etc.).

### Step 3: Configure Environment Variables

Add these to `frontdesk-backend/.env`:

```bash
# =============================================
# Twilio SMS Configuration (SANDBOX MODE)
# =============================================
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+15551234567  # Your sandbox number
TWILIO_TEST_MODE=true              # CRITICAL: Must be "true" for sandbox
```

### Step 4: Restart Backend

```bash
cd frontdesk-backend
npm run dev
```

Look for this in your logs:

```
✅ Twilio SMS: Configured (SANDBOX/TEST mode)
📱 Twilio Phone: +15551234567
⚠️  Test Mode: SMS will only work in Twilio Sandbox
```

If you see ❌ errors, double-check your credentials and restart.

---

## Production Setup

For production use with unlimited recipients, you'll need a real Twilio phone number.

### Step 1: Purchase a Phone Number

1. In Twilio Console, go to **Phone Numbers** → **Manage** → **Buy a number**
2. Select your country (e.g., United States)
3. **Filter by capabilities**: Check **✓ SMS** (required)
4. Optional filters:
   - **Area code** (e.g., `713` for Houston)
   - **Contains** (search for specific digits)
5. Click **Buy** on your chosen number
6. Confirm purchase (~$1.15/month for US numbers)

### Step 2: Configure Production Environment

Update `frontdesk-backend/.env`:

```bash
# =============================================
# Twilio SMS Configuration (PRODUCTION MODE)
# =============================================
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+15551234567  # Your PURCHASED number
TWILIO_TEST_MODE=false             # CRITICAL: Must be "false" for production
```

### Step 3: Restart & Verify

```bash
cd frontdesk-backend
npm run dev
```

Look for:

```
✅ Twilio SMS: Configured (PRODUCTION mode)
📱 Twilio Phone: +15551234567
```

✅ **Production mode active** - can now send SMS to ANY phone number (not just verified)!

---

## Environment Configuration

### Complete .env Template

Your `frontdesk-backend/.env` should include:

```bash
# =============================================
# Server Configuration
# =============================================
PORT=3001
NODE_ENV=development

# =============================================
# Supabase Database
# =============================================
SUPABASE_URL=https://gvjowuscugbgvnemrlmi.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here

# =============================================
# OpenAI API (for AI chat responses)
# =============================================
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxx

# =============================================
# Twilio SMS Integration
# =============================================
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+15551234567
TWILIO_TEST_MODE=true  # true = sandbox, false = production

# =============================================
# Google Calendar (optional)
# =============================================
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# ... other existing variables ...
```

### Environment Variables Explained

| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| `TWILIO_ACCOUNT_SID` | ✅ Yes | `ACxxxxxxxx...` | Your Twilio account identifier (starts with AC) |
| `TWILIO_AUTH_TOKEN` | ✅ Yes | `abc123...` | Secret token for API authentication |
| `TWILIO_PHONE_NUMBER` | ✅ Yes | `+15551234567` | Your Twilio number in E.164 format |
| `TWILIO_TEST_MODE` | ❌ No | `true` / `false` | Defaults to `false`. Set `true` for sandbox |

---

## Webhook Configuration

Twilio needs to know where to send incoming SMS messages. This is called a **webhook**.

### Understanding Webhooks

When someone texts your Twilio number:
1. Twilio receives the SMS
2. Twilio sends an HTTP POST to your webhook URL
3. Your backend processes it and responds
4. Twilio sends your response back to the customer

### Webhook URL Format

```
<YOUR_BASE_URL>/api/twilio/sms/inbound
```

Examples:
- **Local dev**: `https://abc123.ngrok.io/api/twilio/sms/inbound`
- **Production**: `https://api.growzone.com/api/twilio/sms/inbound`

---

### Option A: Local Development (ngrok)

Perfect for testing on your local machine.

#### Step 1: Install ngrok

```bash
# macOS (via Homebrew)
brew install ngrok

# Or download from https://ngrok.com/download
```

#### Step 2: Start ngrok Tunnel

```bash
# Make sure your backend is running on port 3001
cd frontdesk-backend
npm run dev

# In a new terminal:
ngrok http 3001
```

You'll see output like:

```
ngrok

Session Status                online
Account                       you@email.com
Version                       3.5.0
Region                        United States (us)
Forwarding                    https://a1b2c3d4.ngrok.io -> http://localhost:3001

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

**Copy the HTTPS URL**: `https://a1b2c3d4.ngrok.io`

#### Step 3: Configure Twilio Webhook

1. Go to **Phone Numbers** → **Manage** → **Active numbers**
2. Click on your Twilio number
3. Scroll down to **Messaging Configuration**
4. Under **A MESSAGE COMES IN**:
   - **Webhook**: `https://a1b2c3d4.ngrok.io/api/twilio/sms/inbound`
   - **HTTP Method**: `POST`
5. **Optional**: Under **DELIVERY STATUS CALLBACK** (for tracking):
   - **Webhook**: `https://a1b2c3d4.ngrok.io/api/twilio/sms/status`
   - **HTTP Method**: `POST`
6. Click **Save** at the bottom

✅ Webhook configured for local testing!

**⚠️ Important**: Your ngrok URL changes every time you restart ngrok (unless you have a paid plan). You'll need to update the webhook URL in Twilio Console each time.

---

### Option B: Production Deployment

For your live production server.

#### Step 1: Deploy Backend

Make sure your backend is deployed and accessible at your production URL:
- Examples: `https://api.growzone.com`, `https://desk-backend.herokuapp.com`
- Must use **HTTPS** (HTTP won't work - Twilio requires SSL)

#### Step 2: Configure Twilio Webhook

1. Go to **Phone Numbers** → **Manage** → **Active numbers**
2. Click your production Twilio number
3. Under **Messaging Configuration**:
   - **A MESSAGE COMES IN**: `https://api.growzone.com/api/twilio/sms/inbound` (POST)
   - **DELIVERY STATUS CALLBACK**: `https://api.growzone.com/api/twilio/sms/status` (POST)
4. Save

✅ Production webhook configured!

---

## Testing Your Setup

### Test 1: Configuration Status

Check if Twilio is properly configured:

```bash
# Visit this URL in your browser or use curl
curl http://localhost:3001/api/twilio/status
```

**Expected response** (sandbox mode):

```json
{
  "ok": true,
  "data": {
    "configured": true,
    "testMode": true,
    "phoneNumber": "+15551234567",
    "accountSid": "ACxxxxxx..."
  }
}
```

If `configured: false`, check your `.env` file and restart the backend.

---

### Test 2: Send Inbound SMS

**Prerequisites**:
- ✅ Twilio webhook configured (ngrok or production)
- ✅ Backend server running
- ✅ Your phone number verified (if using sandbox mode)

#### Steps:

1. **Send a text** from your verified phone to your Twilio number:

   ```
   Hi, I need help with my plumbing issue. Can someone come tomorrow?
   ```

2. **Check backend logs** - you should see:

   ```
   📱 Incoming SMS: from: +15551234567, body: Hi, I need help...
   📝 Creating new lead from SMS
   ✅ SMS sent successfully: SMxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

3. **You should receive an AI response** within seconds:

   ```
   Hi! Thanks for reaching out to Houston Premier Plumbing. 
   I'd be happy to help with your plumbing issue. To schedule 
   a service call, could you share your zip code and a brief 
   description of the problem? 🔧
   ```

4. **Check your dashboard**:
   - Visit http://localhost:3000/dashboard/leads
   - Look for a new lead with:
     - 📱 **SMS badge** (blue bubble with "SMS")
     - Source: `sms`
     - Phone number: your number
     - Status: `new`

5. **Open the lead detail**:
   - Click on the lead
   - You should see the full SMS conversation thread
   - Both your message and the AI response

✅ **Inbound SMS working!**

---

### Test 3: Send Outbound SMS (API)

The outbound SMS API is implemented but not yet in the UI. You can test it via curl/Postman.

#### API Endpoint

```
POST http://localhost:3001/api/twilio/sms/outbound
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN
```

**Request body**:

```json
{
  "leadId": 123,
  "phoneNumber": "+15551234567",
  "message": "Thanks for your patience! We can come by tomorrow at 2pm. Does that work?"
}
```

**Expected response**:

```json
{
  "ok": true,
  "message": {
    "id": 456,
    "twilio_sid": "SMxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "status": "sent",
    "sent_at": "2025-11-25T10:30:00.000Z"
  }
}
```

**⚠️ Note**: You need a valid JWT token from login. The dashboard UI for sending SMS will be added in a future update.

---

### Test 4: Check Dashboard Integration

1. **Visit Settings page**: http://localhost:3000/dashboard/settings

2. **Scroll to "Twilio SMS Integration" card**

3. **You should see**:
   - ✅ **Status**: Green checkmark with "Configured and active"
   - **Phone Number**: Your Twilio number
   - **Account SID**: First 8 chars + "..."
   - **Mode**: "Sandbox / Test" or "Production"
   - **Features list**:
     - Inbound SMS webhook - auto-creates leads
     - Outbound SMS - send replies
     - SMS conversation logging
     - SMS badge on leads

4. **If sandbox mode**, you'll see a warning:
   > ⚠️ **Test Mode Active**: SMS will only work with verified phone numbers in your Twilio sandbox. To enable production SMS, configure a real Twilio phone number and set TWILIO_TEST_MODE=false.

✅ **Dashboard integration working!**

---

## Dashboard Integration

### Settings Page (Twilio Status Card)

**Location**: `/frontend/pages/dashboard/settings.js` (line 817)

**Shows**:
- ✅ Configuration status (configured/not configured)
- 📱 Your Twilio phone number
- 🔑 Account SID (partially masked)
- 🧪 Mode (Sandbox/Test or Production)
- ✅ List of enabled features

**Screenshot preview**:

```
┌─────────────────────────────────────────────────────┐
│ 📱 Twilio SMS Integration              ✅ Configured│
│                                                      │
│ ✅ Twilio SMS is configured and active              │
│    Desk.ai can now handle customer SMS              │
│    conversations automatically.                      │
│                                                      │
│ Phone Number:  +15551234567                         │
│ Account SID:   ACxxxxxx...                          │
│ Mode:          🧪 Sandbox / Test                     │
│                                                      │
│ ⚠️  Test Mode Active                                │
│    SMS will only work with verified numbers         │
│                                                      │
│ Enabled Features:                                   │
│ ✓ Inbound SMS webhook - auto-creates leads         │
│ ✓ Outbound SMS - send replies from dashboard       │
│ ✓ SMS conversation logging and history             │
│ ✓ SMS badge on leads with text conversations       │
└─────────────────────────────────────────────────────┘
```

---

### Lead Dashboard (SMS Badges)

**Location**: `/frontend/pages/dashboard/components/LeadTable.js` (line 93)

**Shows**:
- 📱 Blue "SMS" badge on leads with text conversations
- Hover tooltip shows last SMS timestamp
- Visual indicator for filtering SMS leads

**Screenshot preview**:

```
┌────────────────────────────────────────────────────────┐
│ Lead                Source    Status      Last Activity │
├────────────────────────────────────────────────────────┤
│ John Smith          📱 SMS    New         2 mins ago   │
│ (713) 555-1234      [SMS]                              │
│                                                         │
│ Jane Doe            🌐 Web    Contacted   1 hour ago   │
│ jane@email.com                                         │
└────────────────────────────────────────────────────────┘
```

---

### Logs Page (SMS Queue Status)

**Location**: `/frontend/pages/dashboard/logs.js` (line 148)

**Shows**:
- Pending SMS count
- Successfully sent count
- Failed SMS count
- Total SMS processed

**Screenshot preview**:

```
┌─────────────────────────────────────────────────┐
│ SMS Queue Status                                │
├─────────────────────────────────────────────────┤
│ Pending:    3                                   │
│ Sent:       127                                 │
│ Failed:     0                                   │
│ Total:      130                                 │
└─────────────────────────────────────────────────┘
```

---

## API Endpoints

### Summary Table

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/twilio/status` | GET | No | Get configuration status |
| `/api/twilio/sms/inbound` | POST | No* | Receive SMS from Twilio |
| `/api/twilio/sms/outbound` | POST | Yes | Send SMS to customer |
| `/api/leads/:leadId/sms` | GET | Yes | Get SMS history for lead |
| `/api/twilio/sms/status` | POST | No* | Receive delivery status |
| `/api/admin/sms-queue` | GET | Yes | SMS queue monitoring |

**\* Webhook signature validation** instead of JWT auth

---

### Endpoint Details

#### 1. GET `/api/twilio/status`

**Purpose**: Check if Twilio is configured

**Request**:
```bash
curl http://localhost:3001/api/twilio/status
```

**Response**:
```json
{
  "ok": true,
  "data": {
    "configured": true,
    "testMode": false,
    "phoneNumber": "+15551234567",
    "accountSid": "ACxxxxxx...",
    "message": "Production mode"
  }
}
```

---

#### 2. POST `/api/twilio/sms/inbound`

**Purpose**: Webhook for incoming SMS from Twilio

**Request** (sent by Twilio):
```
POST https://yourapp.com/api/twilio/sms/inbound
Content-Type: application/x-www-form-urlencoded
X-Twilio-Signature: abc123...

MessageSid=SMxxxxxxxxxx
From=+15551234567
To=+15559876543
Body=Hi, I need help
FromCity=Houston
FromState=TX
FromZip=77005
```

**What happens**:
1. Validates Twilio signature
2. Parses incoming message
3. Creates/updates lead in database
4. Sends message to OpenAI for AI response
5. Sends AI response back via SMS
6. Returns TwiML response to Twilio

**Response** (TwiML):
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response></Response>
```

---

#### 3. POST `/api/twilio/sms/outbound`

**Purpose**: Send SMS from dashboard

**Request**:
```bash
curl -X POST http://localhost:3001/api/twilio/sms/outbound \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "leadId": 123,
    "phoneNumber": "+15551234567",
    "message": "Thanks for contacting us! We can help tomorrow at 2pm."
  }'
```

**Response**:
```json
{
  "ok": true,
  "message": {
    "id": 456,
    "lead_id": 123,
    "twilio_sid": "SMxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "from_number": "+15559876543",
    "to_number": "+15551234567",
    "body": "Thanks for contacting us!...",
    "direction": "outbound",
    "status": "sent",
    "sent_at": "2025-11-25T10:30:00.000Z"
  }
}
```

**Error responses**:
- `400`: Missing required fields
- `401`: Not authenticated
- `403`: Lead belongs to different business
- `404`: Lead not found
- `500`: Twilio API error

---

#### 4. GET `/api/leads/:leadId/sms`

**Purpose**: Get SMS conversation history for a lead

**Request**:
```bash
curl http://localhost:3001/api/leads/123/sms \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response**:
```json
{
  "ok": true,
  "messages": [
    {
      "id": 1,
      "direction": "inbound",
      "from_number": "+15551234567",
      "to_number": "+15559876543",
      "body": "Hi, I need help with plumbing",
      "status": "received",
      "sent_at": "2025-11-25T10:00:00.000Z"
    },
    {
      "id": 2,
      "direction": "outbound",
      "from_number": "+15559876543",
      "to_number": "+15551234567",
      "body": "Thanks for reaching out! We can help...",
      "status": "delivered",
      "sent_at": "2025-11-25T10:00:15.000Z"
    }
  ]
}
```

---

#### 5. POST `/api/twilio/sms/status`

**Purpose**: Receive delivery status updates from Twilio

**Request** (sent by Twilio):
```
POST https://yourapp.com/api/twilio/sms/status
Content-Type: application/x-www-form-urlencoded

MessageSid=SMxxxxxxxxxx
MessageStatus=delivered
ErrorCode=
ErrorMessage=
```

**What happens**:
1. Updates message status in database
2. Logs delivery events

**Possible statuses**:
- `queued` - Twilio received it
- `sending` - In transit
- `sent` - Delivered to carrier
- `delivered` - Received by customer
- `failed` - Delivery failed
- `undelivered` - Could not deliver

---

#### 6. GET `/api/admin/sms-queue`

**Purpose**: Monitor SMS queue status

**Request**:
```bash
curl http://localhost:3001/api/admin/sms-queue \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response**:
```json
{
  "pending": 3,
  "sent": 127,
  "failed": 0,
  "total": 130,
  "isProcessing": true,
  "messagesPerSecond": 1
}
```

---

## Database Schema

### Tables Created by Migration 006

#### `messages` Table

Stores all SMS messages (inbound and outbound).

```sql
CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  
  -- Twilio specific
  twilio_sid VARCHAR(34) UNIQUE NOT NULL,  -- Unique Twilio message ID
  twilio_account_sid VARCHAR(34),
  
  -- Message details
  direction VARCHAR(10) NOT NULL,  -- 'inbound' or 'outbound'
  from_number VARCHAR(20) NOT NULL,
  to_number VARCHAR(20) NOT NULL,
  body TEXT NOT NULL,
  
  -- Status tracking
  status VARCHAR(20),              -- sent, delivered, failed, etc.
  error_code VARCHAR(10),
  error_message TEXT,
  
  -- Location data (from Twilio)
  from_city VARCHAR(100),
  from_state VARCHAR(50),
  from_zip VARCHAR(10),
  from_country VARCHAR(2),
  
  -- Timestamps
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_messages_lead_id ON messages(lead_id);
CREATE INDEX idx_messages_twilio_sid ON messages(twilio_sid);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_direction ON messages(direction);
```

---

#### `leads` Table Additions

Added SMS-specific columns to track text conversations.

```sql
ALTER TABLE leads
  ADD COLUMN sms_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN last_sms_at TIMESTAMP,
  ADD COLUMN sms_opt_out BOOLEAN DEFAULT FALSE;

-- Indexes
CREATE INDEX idx_leads_sms_enabled ON leads(sms_enabled) WHERE sms_enabled = TRUE;
CREATE INDEX idx_leads_last_sms_at ON leads(last_sms_at DESC);
```

**Column descriptions**:
- `sms_enabled`: TRUE if lead has ever sent/received SMS
- `last_sms_at`: Timestamp of most recent SMS interaction
- `sms_opt_out`: TRUE if lead has opted out of SMS (for compliance)

---

### Sample Data Structure

**Lead with SMS conversation**:

```json
{
  "id": 123,
  "name": "John Smith",
  "phone": "+15551234567",
  "source": "sms",
  "status": "new",
  "sms_enabled": true,
  "last_sms_at": "2025-11-25T10:30:00Z",
  "sms_opt_out": false,
  "created_at": "2025-11-25T10:00:00Z"
}
```

**Messages for that lead**:

```json
[
  {
    "id": 1,
    "lead_id": 123,
    "twilio_sid": "SM1111111111111111111111111111111111",
    "direction": "inbound",
    "from_number": "+15551234567",
    "to_number": "+15559876543",
    "body": "Hi, I need help with plumbing",
    "status": "received",
    "from_city": "Houston",
    "from_state": "TX",
    "from_zip": "77005",
    "sent_at": "2025-11-25T10:00:00Z"
  },
  {
    "id": 2,
    "lead_id": 123,
    "twilio_sid": "SM2222222222222222222222222222222222",
    "direction": "outbound",
    "from_number": "+15559876543",
    "to_number": "+15551234567",
    "body": "Thanks for reaching out! We can help...",
    "status": "delivered",
    "sent_at": "2025-11-25T10:00:15Z",
    "delivered_at": "2025-11-25T10:00:17Z"
  }
]
```

---

## Troubleshooting

### Problem 1: "Twilio SMS: Not configured"

**Symptoms**:
- Backend logs show: `⚠️ Twilio SMS: ⚠️ Not configured`
- Settings page shows "Not configured"

**Solution**:

1. **Check `.env` file** has all 3 required variables:
   ```bash
   TWILIO_ACCOUNT_SID=ACxxxxxxxx...
   TWILIO_AUTH_TOKEN=your_token
   TWILIO_PHONE_NUMBER=+15551234567
   ```

2. **Verify no typos** in variable names (they're case-sensitive)

3. **Restart backend server**:
   ```bash
   cd frontdesk-backend
   npm run dev
   ```

4. **Check logs** for the startup message:
   ```
   ✅ Twilio SMS: Configured (TEST mode)
   ```

5. **If still failing**, verify credentials in Twilio Console:
   - Account SID starts with `AC`
   - Auth Token is 32 characters
   - Phone number includes `+` and country code

---

### Problem 2: "Invalid webhook signature" (403 error)

**Symptoms**:
- Inbound SMS returns 403 Forbidden
- Backend logs: `❌ Invalid Twilio webhook signature`

**Causes & Solutions**:

**A. URL Mismatch**
- Problem: Webhook URL in Twilio doesn't match your actual URL
- Solution: Double-check the webhook URL in Twilio Console matches exactly

**B. HTTP instead of HTTPS**
- Problem: Twilio requires HTTPS for webhooks
- Solution: Use ngrok (provides HTTPS) for local dev, or ensure production uses SSL

**C. ngrok URL changed**
- Problem: ngrok generates new URL on restart (free tier)
- Solution: Update webhook URL in Twilio Console each time you restart ngrok
- Alternative: Upgrade to ngrok paid plan for static URLs

**D. Auth Token mismatch**
- Problem: `.env` has old/wrong auth token
- Solution: Copy fresh auth token from Twilio Console

---

### Problem 3: "SMS not sending in sandbox mode"

**Symptoms**:
- Can't send to certain phone numbers
- Error: "The number +15551234567 is unverified"

**Solution**:

1. **Verify the recipient number** in Twilio Console:
   - Go to **Phone Numbers** → **Verified Caller IDs**
   - Add the recipient's number
   - Complete verification

2. **Check phone number format** (E.164):
   - ✅ Correct: `+15551234567`
   - ❌ Wrong: `555-123-4567`, `15551234567`, `(555) 123-4567`

3. **Confirm `TWILIO_TEST_MODE=true`** in `.env`

4. **Remember sandbox limitations**:
   - Can only send to verified numbers
   - May include sandbox prefix in messages

**To send to anyone**, switch to production mode (buy a phone number).

---

### Problem 4: "Lead created but no AI response"

**Symptoms**:
- Inbound SMS creates a lead in dashboard
- But no reply is sent to the customer

**Possible causes**:

**A. OpenAI not configured**
```bash
# Check .env has:
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxx
```

**B. OpenAI API error**
- Check backend logs for OpenAI errors
- Verify API key is valid at https://platform.openai.com

**C. Twilio send failure**
- Check backend logs for SMS send errors
- Verify Twilio credentials
- Check Twilio Console logs

**D. Business configuration missing**
- Inbound SMS needs a valid business to associate with
- Check database has at least one business set up

---

### Problem 5: Webhook not receiving messages

**Symptoms**:
- Send SMS to Twilio number
- Nothing happens in backend logs
- No lead created

**Solution**:

1. **Check ngrok is running**:
   ```bash
   ngrok http 3001
   ```

2. **Verify webhook URL in Twilio**:
   - Must match ngrok URL exactly
   - Must end with `/api/twilio/sms/inbound`
   - Must be HTTPS

3. **Test webhook manually**:
   ```bash
   curl -X POST https://your-ngrok-url.ngrok.io/api/twilio/sms/inbound \
     -d "From=+15551234567" \
     -d "To=+15559876543" \
     -d "Body=test message"
   ```

4. **Check Twilio webhook logs**:
   - Go to **Monitor** → **Logs** → **Messaging**
   - Find your test message
   - Click to see webhook request/response
   - Look for HTTP status codes:
     - `200`: Success
     - `403`: Invalid signature
     - `404`: Wrong URL
     - `500`: Backend error

---

### Problem 6: Messages stuck in queue

**Symptoms**:
- SMS queue shows high "pending" count
- Messages not being sent

**Solution**:

1. **Check queue status**:
   ```bash
   curl http://localhost:3001/api/admin/sms-queue
   ```

2. **Check backend logs** for send errors

3. **Verify Twilio credentials** (may be expired/revoked)

4. **Restart backend** to reset queue:
   ```bash
   cd frontdesk-backend
   npm run dev
   ```

5. **For persistent issues**, check:
   - Twilio account status (suspended? out of credit?)
   - Rate limiting errors
   - Network connectivity

---

## Cost & Security

### Twilio Pricing (2025)

**Free Trial**:
- $15 credit when you sign up
- Enough for ~2,000 SMS messages
- Expires after a set period (check Twilio)

**Phone Numbers**:
- US: ~$1.15/month per number
- International: varies by country

**SMS Costs** (US):
| Type | Cost per Message |
|------|------------------|
| Outbound SMS (sent) | ~$0.0075 |
| Inbound SMS (received) | Free |
| Long messages (>160 chars) | Charged as multiple segments |

**Cost Example**:
- 100 inbound SMS: $0.00
- 100 outbound SMS: $0.75
- Phone number: $1.15/month
- **Monthly total**: ~$1.90

**⚠️ Cost Warnings**:
- SMS are charged per segment (160 chars)
- Emoji and special chars can increase segment count
- Set usage alerts in Twilio Console

---

### Security Best Practices

#### 1. Protect Your Credentials

```bash
# ❌ NEVER do this:
git add .env
git commit -m "add twilio keys"

# ✅ Always:
echo ".env" >> .gitignore
```

#### 2. Webhook Signature Validation

✅ **Already implemented** in `twilioService.js`:

```javascript
// Automatically validates all incoming webhooks
const isValid = twilioService.validateWebhookSignature(
  req.headers['x-twilio-signature'],
  webhookUrl,
  req.body
);

if (!isValid) {
  return res.status(403).json({ error: 'Invalid signature' });
}
```

This prevents spoofed/fake webhook requests.

#### 3. Rotate Credentials if Exposed

If you accidentally commit credentials:

1. **Immediately revoke** auth token in Twilio Console
2. **Generate new auth token**
3. **Update `.env` file**
4. **Restart backend**
5. **Force push** to overwrite git history (if needed)

#### 4. Monitor Usage

**Set up usage alerts**:
1. Go to Twilio Console → **Billing** → **Alerts**
2. Set threshold (e.g., $10/month)
3. Get email notifications if exceeded

**Review logs regularly**:
- Monitor → Logs → Messaging
- Check for unusual activity
- Review error rates

#### 5. Respect Opt-Outs

The database includes `sms_opt_out` field:

```sql
-- Check before sending
SELECT * FROM leads WHERE phone = '+15551234567' AND sms_opt_out = FALSE;
```

Implement opt-out handling:
- Listen for "STOP", "UNSUBSCRIBE" keywords
- Set `sms_opt_out = TRUE` in database
- Never send to opted-out numbers (legal requirement)

---

## Quick Setup Checklist

Use this to verify your Twilio integration is ready:

### Prerequisites
- [ ] Twilio account created
- [ ] Account SID and Auth Token copied
- [ ] Phone number obtained (sandbox or purchased)
- [ ] Backend `.env` file accessible

### Configuration
- [ ] `TWILIO_ACCOUNT_SID` added to `.env`
- [ ] `TWILIO_AUTH_TOKEN` added to `.env`
- [ ] `TWILIO_PHONE_NUMBER` added to `.env` (E.164 format)
- [ ] `TWILIO_TEST_MODE` set correctly (`true` for sandbox, `false` for production)
- [ ] Backend server restarted

### Webhook Setup (Local Dev)
- [ ] ngrok installed
- [ ] ngrok tunnel running (`ngrok http 3001`)
- [ ] HTTPS URL copied from ngrok
- [ ] Webhook configured in Twilio Console
- [ ] Webhook URL format: `https://xxx.ngrok.io/api/twilio/sms/inbound`

### Webhook Setup (Production)
- [ ] Backend deployed with HTTPS
- [ ] Webhook URL format: `https://yourapp.com/api/twilio/sms/inbound`
- [ ] Webhook configured in Twilio Console
- [ ] SSL certificate valid

### Testing
- [ ] Visit `/api/twilio/status` - shows `configured: true`
- [ ] Backend logs show: `✅ Twilio SMS: Configured`
- [ ] Send test SMS to Twilio number
- [ ] Receive AI auto-response
- [ ] Lead appears in dashboard with SMS badge
- [ ] Check Settings page shows Twilio card as configured

### Dashboard Verification
- [ ] Settings page shows Twilio status
- [ ] Phone number displayed correctly
- [ ] Mode shown (Sandbox vs Production)
- [ ] SMS badge appears on leads with text conversations
- [ ] Logs page shows SMS queue status

---

## Support & Resources

### Official Documentation
- **Twilio SMS Docs**: https://www.twilio.com/docs/sms
- **Twilio Console**: https://console.twilio.com
- **Twilio Webhooks Guide**: https://www.twilio.com/docs/usage/webhooks
- **ngrok Documentation**: https://ngrok.com/docs

### Desk.ai Resources
- **Main Setup Docs**: See `README.md` in repo root
- **Database Migrations**: `frontdesk-backend/migrations/006_add_sms_messages.sql`
- **Twilio Service Code**: `frontdesk-backend/twilioService.js`
- **SMS Queue Code**: `frontdesk-backend/smsQueue.js`

### Getting Help
- **GitHub Issues**: Create issue in this repo for bugs
- **Twilio Support**: https://support.twilio.com (paid accounts)
- **Twilio Community**: https://www.twilio.com/community

---

## Summary

✅ **Twilio integration is FULLY IMPLEMENTED** in this codebase  
✅ **Sandbox mode**: Free testing with verified numbers  
✅ **Production mode**: Real phone number, unlimited recipients  
✅ **Two-way SMS**: Inbound webhooks + outbound API  
✅ **AI responses**: Automatic OpenAI-powered replies  
✅ **Dashboard integration**: Status card, SMS badges, conversation history  
✅ **Database tracking**: Full message history and lead association  
✅ **Webhook security**: Automatic signature validation  
✅ **SMS queue**: Rate-limited sending with retry logic  

**What you need to do**:
1. Create Twilio account (free trial or paid)
2. Add 3 environment variables to `.env`
3. Configure webhook URL in Twilio Console
4. Restart backend server
5. Send test SMS to verify

**That's it!** 📱 Happy texting!

---

**Last Updated**: November 25, 2025  
**Created By**: AI Assistant (GitHub Copilot)  
**Maintained By**: Growzone Team
