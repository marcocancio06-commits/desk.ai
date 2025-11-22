# Desk.ai Reliability Systems - Environment Configuration

This document describes the environment variables needed for Desk.ai's reliability and monitoring systems.

## Required Environment Variables

### Email Alerts

For the alert system to send email notifications about critical failures, you need to configure Gmail SMTP:

```bash
# Gmail account for sending alert emails
ALERT_EMAIL_USER=your-gmail@gmail.com

# Gmail app password (NOT your regular password)
# Generate at: https://myaccount.google.com/apppasswords
ALERT_EMAIL_PASS=your-16-char-app-password
```

**Important Notes:**
- You must use a Gmail **App Password**, not your regular Gmail password
- To generate an App Password:
  1. Go to your Google Account settings
  2. Navigate to Security → 2-Step Verification (must be enabled)
  3. Scroll to "App passwords" and generate a new one
  4. Select "Mail" as the app and "Other" as the device
  5. Copy the 16-character password

**Alert Recipients:**
- All critical failure alerts are sent to: `growzone.ai@gmail.com`
- This is hardcoded in `frontdesk-backend/alertSystem.js`

---

## Reliability Systems Overview

### 1. Logger (`logger.js`)
- **Purpose**: Centralized logging with file rotation
- **Log Files**: 
  - `app.log` - All log levels
  - `error.log` - Errors and critical issues only
- **Rotation**: Automatically rotates when files exceed 10MB
- **Levels**: DEBUG (0), INFO (1), WARN (2), ERROR (3), CRITICAL (4)

### 2. Retry Logic (`retryUtils.js`)
- **Purpose**: Exponential backoff retry for transient failures
- **AI Operations**: 3 retries with 2-15 second delays
- **API Operations**: 2 retries with 1-5 second delays
- **Retry Conditions**: Network errors, timeouts, rate limits, 5xx errors

### 3. Alert System (`alertSystem.js`)
- **Purpose**: Email notifications for critical failures
- **Cooldown**: 15 minutes per alert type (prevents spam)
- **Alert Types**:
  - Database failures
  - AI service failures (after all retries exhausted)
  - Repeated errors
  - Resource issues

### 4. SMS Queue (`smsQueue.js`)
- **Purpose**: Rate-limited SMS sending to prevent Twilio violations
- **Rate Limit**: 1 message/second, burst of 5
- **Retry**: 3 attempts with delays (2s, 5s, 10s)
- **Status Tracking**: pending, sent, failed

---

## Monitoring Endpoints

### Admin Logs API
```
GET /api/admin/logs?lines=100&errorOnly=false
```
Returns recent system logs in JSON format.

**Query Parameters:**
- `lines` - Number of log entries to return (default: 100)
- `errorOnly` - Set to "true" to only return errors (default: false)

**Response:**
```json
{
  "ok": true,
  "logs": [
    {
      "timestamp": "2024-01-01T12:00:00.000Z",
      "level": "INFO",
      "message": "Request processed successfully",
      "metadata": { "path": "/api/leads", "duration": "45ms" }
    }
  ],
  "count": 100,
  "errorOnly": false
}
```

### SMS Queue Status API
```
GET /api/admin/sms-queue
```
Returns current SMS queue statistics.

**Response:**
```json
{
  "ok": true,
  "pending": 2,
  "sent": 145,
  "failed": 3,
  "total": 150
}
```

---

## Frontend Monitoring

### System Logs Viewer
**URL**: `/dashboard/logs`

Features:
- Real-time log viewing with auto-refresh
- Filter by log level (errors only)
- Search across messages and metadata
- Adjustable number of logs (100-5000)
- Export to CSV
- SMS queue status dashboard

Access via Settings → System Monitoring → View Logs

---

## Testing the Alert System

To test if email alerts are working:

1. Make sure environment variables are set in `.env`:
```bash
ALERT_EMAIL_USER=your-gmail@gmail.com
ALERT_EMAIL_PASS=your-app-password
```

2. Restart the backend server to load new env vars:
```bash
cd frontdesk-backend
npm start
```

3. Trigger a test alert by causing an AI failure (or manually call from Node console):
```javascript
const alertSystem = require('./alertSystem');
await alertSystem.alertAIFailure({ context: 'test' }, new Error('Test error'), 3);
```

4. Check `growzone.ai@gmail.com` inbox for the alert email

---

## Log Files Location

All logs are stored in the backend directory:
```
frontdesk-backend/
├── app.log           # All log levels
├── app.log.1         # Rotated logs
├── app.log.2
├── error.log         # Errors only
└── error.log.1       # Rotated error logs
```

**Note**: Add `*.log*` to `.gitignore` to avoid committing log files.

---

## Health Check Endpoint

The backend already includes a health check endpoint:

```
GET /health
```

Returns server status and uptime information.

---

## Troubleshooting

### Email Alerts Not Sending

**Problem**: Critical errors occur but no emails are received

**Solutions**:
1. Verify `ALERT_EMAIL_USER` and `ALERT_EMAIL_PASS` are set correctly
2. Ensure you're using a Gmail App Password, not regular password
3. Check if alerts are on cooldown (15 min between same alert type)
4. Look for error messages in `error.log` containing "Failed to send alert"
5. Verify 2-Step Verification is enabled on your Google account

### Logs Not Appearing

**Problem**: No logs in the logs viewer

**Solutions**:
1. Check if backend is running
2. Verify log files exist in `frontdesk-backend/` directory
3. Try refreshing the page
4. Check browser console for fetch errors
5. Verify authentication (must be logged in)

### SMS Queue Issues

**Problem**: Messages stuck in pending or failing

**Solutions**:
1. Check Twilio configuration (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
2. Review error logs for Twilio API errors
3. Verify phone number format (E.164 format: +1234567890)
4. Check SMS queue status at `/api/admin/sms-queue`
5. Look for rate limit violations in logs

---

## Production Recommendations

1. **Log Retention**: Set up log archival/deletion policy (keep last 30 days)
2. **Alert Recipients**: Update `alertSystem.js` to send to ops team email
3. **Monitoring**: Integrate with monitoring service (Datadog, New Relic)
4. **Log Storage**: Consider centralized logging (CloudWatch, Papertrail)
5. **SMS Queue**: Upgrade to Redis-backed queue for multi-instance deployments
6. **Backup Alerts**: Add Slack/PagerDuty integration for critical alerts

---

## Environment Variables Summary

```bash
# Required for Email Alerts
ALERT_EMAIL_USER=your-gmail@gmail.com
ALERT_EMAIL_PASS=your-16-char-app-password

# Already configured (from main setup)
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-key
ANTHROPIC_API_KEY=your-anthropic-key
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+1234567890
```

Add these to your `.env` file in the `frontdesk-backend` directory.
