# Google Calendar OAuth Setup Guide

This guide walks you through setting up Google Calendar OAuth integration for Desk.ai.

## Prerequisites

- Google Cloud Console account
- Desk.ai backend and frontend running locally or deployed

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Name it something like "Desk.ai Calendar Sync"

## Step 2: Enable Google Calendar API

1. In your project, go to **APIs & Services** → **Library**
2. Search for "Google Calendar API"
3. Click on it and press **Enable**

## Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Select **External** user type (or Internal if using Google Workspace)
3. Fill in the required fields:
   - **App name**: Desk.ai
   - **User support email**: Your email
   - **Developer contact**: Your email
4. Click **Save and Continue**
5. On the **Scopes** page, click **Add or Remove Scopes**
6. Add these scopes:
   - `.../auth/calendar` (See, edit, share, and permanently delete all calendars)
   - `.../auth/calendar.events` (View and edit events on all calendars)
7. Click **Save and Continue**
8. Skip **Test users** for now, click **Save and Continue**

## Step 4: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth 2.0 Client ID**
3. Select **Application type**: Web application
4. Name it: "Desk.ai OAuth Client"
5. Under **Authorized redirect URIs**, add:
   - For local development: `http://localhost:3001/api/google/callback`
   - For production: `https://your-domain.com/api/google/callback`
6. Click **Create**
7. You'll see a dialog with your **Client ID** and **Client Secret** - copy these!

## Step 5: Update Backend Environment Variables

1. Open your `frontdesk-backend/.env` file
2. Add the following variables:

```bash
# Google Calendar OAuth
GOOGLE_OAUTH_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=your-client-secret
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:3001/api/google/callback
FRONTEND_URL=http://localhost:3000
```

3. For production, update `GOOGLE_OAUTH_REDIRECT_URI` and `FRONTEND_URL` to your deployed URLs

## Step 6: Run Database Migration

Execute the SQL migration to create the necessary tables:

```bash
# Connect to your Supabase/Neon database and run:
psql -h your-db-host -U your-db-user -d your-db-name -f migrations/add_google_calendar_oauth.sql
```

Or run it directly in your database SQL editor (Supabase SQL Editor, Neon Console, etc.)

## Step 7: Restart Backend

```bash
cd frontdesk-backend
npm run dev
```

You should see:
```
✅ Auto-sync enabled (every 5 minutes)
```

## Step 8: Connect Google Calendar (Frontend)

1. Open http://localhost:3000/dashboard/settings
2. Find the **Google Calendar Integration** section
3. Click **Connect Google Calendar**
4. You'll be redirected to Google's consent screen
5. Sign in with your Google account
6. Grant calendar permissions
7. You'll be redirected back to Settings with a success message
8. The status badge should show **Connected** with your email

## Features After Connection

Once connected, the following features are active:

### ✅ Automatic Push (Every 5 Minutes)
- New Desk.ai appointments are pushed to Google Calendar
- Updates to appointments are synced automatically
- Color-coded by urgency (Red = Emergency, Orange = High, Blue = Normal)

### ✅ Conflict Detection
- System pulls events from Google Calendar every 5 minutes
- Detects overlapping events
- Shows warning banner on appointments with conflicts
- Calendar view displays conflicted appointments with yellow dashed border

### ✅ Manual Sync
- Click **Sync Now** button in Settings to trigger immediate sync
- Shows results: events pushed, events pulled, conflicts detected

### ✅ Status Indicator
- Green **Connected** badge in Settings
- Displays connected email address
- Lists active features

## Disconnecting

To disconnect Google Calendar:

1. Go to Settings
2. Click **Disconnect** button
3. Confirm the action
4. Connection will be deactivated (tokens remain in database but are marked inactive)

## Troubleshooting

### "Failed to connect Google Calendar"

- Check that `GOOGLE_OAUTH_CLIENT_ID` and `GOOGLE_OAUTH_CLIENT_SECRET` are correct
- Verify redirect URI in Google Cloud Console matches your `.env` file
- Ensure Google Calendar API is enabled

### "No active calendar connections found"

- Database migration may not have run successfully
- Check backend logs for database errors
- Verify Supabase/Neon connection is working

### Conflicts not showing

- Make sure you have overlapping events in Google Calendar
- Trigger a manual sync from Settings
- Check that appointments have `scheduled_date` and `scheduled_time` set

### Auto-sync not working

- Check backend logs for cron job errors
- Verify tokens haven't expired (system auto-refreshes them)
- Ensure backend is running continuously (not stopped/restarted frequently)

## Security Notes

- OAuth tokens are stored encrypted in the database
- Refresh tokens allow the system to get new access tokens automatically
- Users can revoke access at any time via Google Account settings
- Desk.ai only requests calendar read/write permissions (no access to other Google data)

## Production Deployment

When deploying to production:

1. Update OAuth redirect URI in Google Cloud Console:
   - Add: `https://your-domain.com/api/google/callback`
2. Update `.env` variables:
   ```bash
   GOOGLE_OAUTH_REDIRECT_URI=https://your-domain.com/api/google/callback
   FRONTEND_URL=https://your-frontend-domain.com
   ```
3. Consider publishing your OAuth app (remove "Testing" mode) in Google Cloud Console
4. Add additional users to the OAuth consent screen if needed

## Support

For issues or questions:
- Check backend logs for detailed error messages
- Review Google Calendar API quotas in Cloud Console
- Ensure database tables were created correctly

---

**Note**: The legacy service account method is still supported but OAuth is recommended for individual user calendar access.
