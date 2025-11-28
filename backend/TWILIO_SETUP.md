# Twilio SMS Integration Setup Guide

This guide will walk you through setting up Twilio SMS integration for Desk.ai, enabling automatic lead capture and AI-powered SMS conversations with your customers.

## Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Twilio Account Setup](#twilio-account-setup)
4. [Sandbox Mode (Testing)](#sandbox-mode-testing)
5. [Production Setup](#production-setup)
6. [Environment Configuration](#environment-configuration)
7. [Webhook Configuration](#webhook-configuration)
8. [Testing](#testing)
9. [Troubleshooting](#troubleshooting)

---

## Overview

The Twilio SMS integration allows Desk.ai to:
- **Receive inbound SMS** from customers and automatically create/update leads
- **Send AI-powered responses** based on customer messages
- **Track conversation history** in the database
- **Send outbound SMS** from the dashboard
- **Work in test mode** (sandbox) or production mode

---

## Prerequisites

Before you begin, ensure you have:
- [ ] A Twilio account (free trial or paid)
- [ ] Access to your Desk.ai backend `.env` file
- [ ] A public URL for webhooks (use ngrok for local development)
- [ ] Supabase database configured and running

---

## Twilio Account Setup

### Step 1: Create a Twilio Account

1. Go to [https://www.twilio.com/try-twilio](https://www.twilio.com/try-twilio)
2. Sign up for a free trial account
3. Verify your email and phone number
4. Complete the onboarding questionnaire

### Step 2: Find Your Credentials

Once logged in to the Twilio Console:

1. Navigate to **Dashboard** → **Account Info**
2. Copy these values (you'll need them later):
   - **Account SID** (starts with `AC...`)
   - **Auth Token** (click to reveal)

---

## Sandbox Mode (Testing)

For development and testing, Twilio provides a **free sandbox** that doesn't require buying a phone number.

### Enable SMS Sandbox

1. In Twilio Console, go to **Messaging** → **Try it out** → **Send an SMS**
2. Click **Get a sandbox phone number**
3. Note your sandbox phone number (e.g., `+1 555-123-4567`)

### Verify Test Phone Numbers

In sandbox mode, you can only send SMS to **verified phone numbers**:

1. Go to **Phone Numbers** → **Verified Caller IDs**
2. Click **Add a new caller ID**
3. Enter the phone number you want to test with
4. Complete the verification process (Twilio will call or SMS you a code)

### Configure Environment Variables (Sandbox)

Add these to your `frontdesk-backend/.env` file:

```bash
# Twilio SMS Configuration (SANDBOX MODE)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+15551234567  # Your sandbox number
TWILIO_TEST_MODE=true              # IMPORTANT: Set to true for sandbox
```

---

## Production Setup

For production use, you'll need a **real Twilio phone number**.

### Step 1: Purchase a Phone Number

1. Go to **Phone Numbers** → **Manage** → **Buy a number**
2. Select your country
3. Filter by capabilities: Check **SMS**
4. Choose a number and click **Buy**
5. Confirm the purchase

### Step 2: Configure Environment Variables (Production)

Update your `frontdesk-backend/.env` file:

```bash
# Twilio SMS Configuration (PRODUCTION MODE)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+15551234567  # Your purchased number
TWILIO_TEST_MODE=false             # Set to false for production
```

---

## Environment Configuration

Your complete `.env` file should include:

```bash
# Twilio SMS Integration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+15551234567
TWILIO_TEST_MODE=true  # true for sandbox, false for production

# Other existing variables
PORT=3001
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key
OPENAI_API_KEY=your_openai_key
# ... etc
```

### Restart Your Backend

After updating `.env`:

```bash
cd frontdesk-backend
npm run dev
```

You should see:
```
✅ Twilio SMS: Configured (TEST mode)
📱 Twilio Phone: +15551234567
⚠️  Test Mode: Only works with verified numbers in Twilio sandbox
```

---

## Webhook Configuration

Twilio needs to know where to send incoming SMS messages.

### For Local Development: Use ngrok

1. **Install ngrok**: [https://ngrok.com/download](https://ngrok.com/download)

2. **Start ngrok tunnel**:
   ```bash
   ngrok http 3001
   ```

3. **Copy the HTTPS URL** (e.g., `https://abc123.ngrok.io`)

4. **Configure Twilio webhook**:
   - Go to **Phone Numbers** → **Manage** → **Active numbers**
   - Click your phone number
   - Scroll to **Messaging Configuration**
   - Under **A MESSAGE COMES IN**, set:
     - **Webhook**: `https://abc123.ngrok.io/api/twilio/sms/inbound`
     - **HTTP**: `POST`
   - Click **Save**

### For Production: Use Your Domain

Set the webhook to your production URL:
```
https://your-domain.com/api/twilio/sms/inbound
```

---

## Testing

### Test Inbound SMS

1. **Send a text message** from a verified phone number to your Twilio number:
   ```
   Hi, I need help with my plumbing issue
   ```

2. **Check backend logs** - you should see:
   ```
   📱 Incoming SMS: from: +15551234567, body: Hi, I need help...
   ✅ SMS sent successfully: SMxxxxxxxxxxxxxxxx
   ```

3. **Check the dashboard**:
   - Go to http://localhost:3000/dashboard/leads
   - You should see a new lead with an **SMS badge**
   - The lead should have the customer's message

4. **You should receive an AI response** from Desk.ai

### Test Outbound SMS (Coming Soon)

The outbound SMS API is ready at:
```
POST http://localhost:3001/api/twilio/sms/outbound
Content-Type: application/json

{
  "leadId": 123,
  "phoneNumber": "+15551234567",
  "message": "Thanks for reaching out! When works best for you?"
}
```

---

## Webhook Endpoints

### Available Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/twilio/status` | GET | Get Twilio configuration status |
| `/api/twilio/sms/inbound` | POST | Receive incoming SMS from Twilio |
| `/api/twilio/sms/outbound` | POST | Send outbound SMS |
| `/api/leads/:leadId/sms` | GET | Get SMS history for a lead |
| `/api/twilio/sms/status` | POST | Receive SMS delivery status updates |

### Webhook Security

Twilio webhooks are **validated using signature verification** to prevent spoofing:

```javascript
const twilioSignature = req.headers['x-twilio-signature'];
const isValid = twilioService.validateWebhookSignature(
  twilioSignature, 
  webhookUrl, 
  requestBody
);
```

This ensures requests actually come from Twilio.

---

## Database Schema

The SMS integration uses these tables:

### `messages` table
```sql
- id (serial primary key)
- lead_id (integer, references leads)
- twilio_sid (varchar, unique)
- direction (inbound/outbound)
- from_number, to_number (varchar)
- body (text)
- status (sent/delivered/failed)
- sent_at, delivered_at (timestamps)
```

### `leads` table additions
```sql
- sms_enabled (boolean) - TRUE if lead has SMS history
- last_sms_at (timestamp) - Last SMS interaction time
- sms_opt_out (boolean) - TRUE if lead opted out
```

---

## Troubleshooting

### "Twilio SMS: Not configured"

**Problem**: Backend logs show Twilio is not configured.

**Solution**:
1. Check `.env` file has all three variables:
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_PHONE_NUMBER`
2. Restart the backend server
3. Verify credentials are correct in Twilio Console

---

### "Invalid webhook signature"

**Problem**: Inbound SMS webhook returns 403 Forbidden.

**Solution**:
1. Make sure you're using the **exact URL** configured in Twilio
2. Use HTTPS (required by Twilio)
3. Check ngrok is running if using local development

---

### "SMS not sending in sandbox mode"

**Problem**: You're getting errors when trying to send SMS.

**Solution**:
1. Verify `TWILIO_TEST_MODE=true` in `.env`
2. Ensure recipient phone number is **verified** in Twilio Console
3. Check you're using E.164 format: `+1555123456 7`

---

### "Lead created but no AI response"

**Problem**: Inbound SMS creates lead but doesn't send reply.

**Solution**:
1. Check `OPENAI_API_KEY` is configured
2. Verify backend logs for AI errors
3. Check Twilio webhook logs in Console for response delivery

---

### Checking Twilio Webhook Logs

1. Go to **Monitor** → **Logs** → **Messaging**
2. Find your recent messages
3. Click to view detailed logs and error codes

---

## Cost Considerations

### Twilio Pricing (as of 2025)

- **Free Trial**: $15 credit
- **SMS (US)**: ~$0.0075 per message sent
- **Phone Number (US)**: ~$1.15/month
- **Inbound SMS**: Free

### Sandbox Limitations

- Only send to **verified numbers**
- Messages may have sandbox prefix
- Good for development, not production

---

## Next Steps

Once Twilio is configured:

1. ✅ Check Settings page: http://localhost:3000/dashboard/settings
2. ✅ Verify status shows "Configured"
3. ✅ Test sending an SMS to your Twilio number
4. ✅ Check lead appears with SMS badge
5. ✅ Monitor conversation in lead detail modal

---

## Support

- **Twilio Docs**: https://www.twilio.com/docs/sms
- **Twilio Console**: https://console.twilio.com
- **Desk.ai Issues**: Create a GitHub issue for problems

---

## Security Best Practices

1. **Never commit `.env` to git**
2. **Rotate credentials** if exposed
3. **Use webhook validation** (enabled by default)
4. **Monitor usage** in Twilio Console to prevent abuse
5. **Set usage alerts** in Twilio to avoid unexpected charges

---

## Summary

✅ **Sandbox Mode**: Free testing with verified numbers  
✅ **Production Mode**: Real phone number, unlimited recipients  
✅ **Webhooks**: ngrok for local dev, your domain for production  
✅ **Security**: Automatic signature validation  
✅ **Database**: Full SMS history and conversation tracking  

Happy texting! 📱
