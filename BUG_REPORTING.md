# Bug Reporting Feature - Setup Guide

## Overview
The Desk.ai demo chat page now includes a bug reporting feature that allows users to submit feedback directly from the demo. Bug reports can be sent via email using SMTP or logged to the console if email is not configured.

## Features
- **Report a Bug** button in demo chat header
- Modal form with message (required) and optional email
- Automatic context capture (page, timestamp, user agent)
- Email delivery via configurable SMTP
- Graceful fallback to console logging
- Success/error user feedback

## SMTP Configuration

### 1. Copy the example environment file
```bash
cd frontdesk-backend
cp .env.example .env
```

### 2. Configure your SMTP settings in `.env`

#### Option A: Gmail (Recommended for testing)
```env
BUG_REPORT_EMAIL=growzone.ai@gmail.com
BUG_REPORT_FROM=your-email@gmail.com
BUG_REPORT_SMTP_HOST=smtp.gmail.com
BUG_REPORT_SMTP_PORT=587
BUG_REPORT_SMTP_USER=your-email@gmail.com
BUG_REPORT_SMTP_PASS=your-app-specific-password
```

**To get a Gmail App Password:**
1. Go to your Google Account settings
2. Navigate to Security → 2-Step Verification
3. At the bottom, click "App passwords"
4. Select "Mail" and "Other (Custom name)"
5. Copy the 16-character password

#### Option B: SendGrid
```env
BUG_REPORT_EMAIL=growzone.ai@gmail.com
BUG_REPORT_FROM=noreply@yourdomain.com
BUG_REPORT_SMTP_HOST=smtp.sendgrid.net
BUG_REPORT_SMTP_PORT=587
BUG_REPORT_SMTP_USER=apikey
BUG_REPORT_SMTP_PASS=your-sendgrid-api-key
```

#### Option C: No Email (Development)
If you don't configure SMTP settings, bug reports will be logged to the server console instead:
```bash
=== BUG REPORT (SMTP not configured) ===
From: user@example.com
Message: The chat doesn't load properly
Context: { "page": "demo-chat", "timestamp": "..." }
=====================================
```

### 3. Restart the backend server
```bash
cd frontdesk-backend
node index.js
```

## API Endpoint

**POST** `/api/report-bug`

**Request Body:**
```json
{
  "message": "Description of the bug (required)",
  "userEmail": "user@example.com (optional)",
  "context": {
    "page": "demo-chat",
    "timestamp": "2024-01-01T12:00:00.000Z",
    "userAgent": "Mozilla/5.0..."
  }
}
```

**Response (Success):**
```json
{
  "ok": true,
  "message": "Bug report sent successfully"
}
```

**Response (Error):**
```json
{
  "ok": false,
  "error": "Failed to send bug report"
}
```

## Email Format

Bug reports are sent with the following format:

**Subject:** `[Desk.ai] Bug Report - 11/17/2024`

**Body:**
```
Bug Report from Desk.ai Demo

From: user@example.com (or "Anonymous user")
Time: 2024-11-17T21:30:00.000Z

Issue Description:
The chat window doesn't scroll properly when I send multiple messages.

Context:
• Page: demo-chat
• User Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)...
• Timestamp: 2024-11-17T21:30:00.000Z
```

## Security Notes

- SMTP credentials are stored in `.env` file (NOT committed to git)
- `.env.example` contains placeholders only
- Error messages don't expose SMTP credentials
- Failed emails don't reveal configuration details

## Troubleshooting

**"Bug report logged (email not configured)"**
→ SMTP settings are missing. This is normal in development.

**"Failed to send bug report"**
→ Check your SMTP credentials, host, and port settings
→ Verify that your email provider allows SMTP access
→ Check the server console for detailed error messages

**Gmail "Less secure app" error**
→ Use an App Password instead of your regular password
→ Ensure 2-Step Verification is enabled on your Google account

## Production Recommendations

1. Use a dedicated email service (SendGrid, Postmark, AWS SES)
2. Set up a dedicated "bugs@" or "support@" email address
3. Consider adding rate limiting to prevent abuse
4. Add email templates for professional formatting
5. Store bug reports in a database for tracking

## Contact

For questions or issues with this feature, contact: growzone.ai@gmail.com
