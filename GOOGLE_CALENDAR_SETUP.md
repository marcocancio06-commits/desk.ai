# Google Calendar Integration Setup Guide

This guide will help you configure Google Calendar OAuth integration for Desk.ai.

## Prerequisites

- A Google Cloud Platform account
- Access to Google Cloud Console
- The Desk.ai backend and frontend running locally

---

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **Select a project** → **New Project**
3. Name your project (e.g., "Desk.ai Calendar Integration")
4. Click **Create**

---

## Step 2: Enable Google Calendar API

1. In your project, go to **APIs & Services** → **Library**
2. Search for "Google Calendar API"
3. Click on it and press **Enable**

---

## Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Select **External** (unless you have a Google Workspace)
3. Click **Create**
4. Fill in the required fields:
   - **App name**: Desk.ai
   - **User support email**: Your email
   - **Developer contact email**: Your email
5. Click **Save and Continue**
6. On the **Scopes** page, click **Add or Remove Scopes**
7. Add these scopes:
   - `https://www.googleapis.com/auth/calendar`
   - `https://www.googleapis.com/auth/calendar.events`
8. Click **Update** → **Save and Continue**
9. Add yourself as a test user (your Gmail address)
10. Click **Save and Continue** → **Back to Dashboard**

---

## Step 4: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Select **Application type**: **Web application**
4. Name it: "Desk.ai OAuth Client"
5. Under **Authorized redirect URIs**, add:
   ```
   http://localhost:3001/api/google/callback
   ```
   
   **For production**, you'll add:
   ```
   https://your-production-domain.com/api/google/callback
   ```

6. Click **Create**
7. You'll see a modal with your **Client ID** and **Client Secret**
8. **Copy both values** - you'll need them in the next step

---

## Step 5: Configure Environment Variables

1. Open `/Users/marco/Desktop/agency-mvp/frontdesk-backend/.env`

2. Add these three lines (replace with your actual values):

```env
GOOGLE_OAUTH_CLIENT_ID=YOUR_CLIENT_ID_HERE.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=YOUR_CLIENT_SECRET_HERE
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:3001/api/google/callback
```

**Example:**
```env
GOOGLE_OAUTH_CLIENT_ID=123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=GOCSPX-AbCdEfGhIjKlMnOpQrStUvWxYz
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:3001/api/google/callback
```

3. Save the file

---

## Step 6: Restart the Backend Server

The backend needs to reload the new environment variables:

```bash
# Stop the backend if it's running
pkill -f "node.*index.js"

# Start it again from the backend directory
cd /Users/marco/Desktop/agency-mvp/frontdesk-backend
npm run dev
```

You should see in the logs:
```
✅ Google Calendar OAuth configured
   Client ID: 123456789012-abc...
   Redirect URI: http://localhost:3001/api/google/callback
```

---

## Step 7: Test the Connection

1. Open your browser to: http://localhost:3000/dashboard/settings

2. Scroll to the **Google Calendar Integration** section

3. Click **Connect Google Calendar**

4. You should be redirected to Google's OAuth consent screen

5. Select your Google account

6. Click **Continue** (you may see a warning since the app is in testing mode - that's normal)

7. Review the permissions and click **Allow**

8. You'll be redirected back to the Settings page with a success message

9. The page should now show:
   - ✅ **Connected** badge
   - Your Gmail address
   - **Disconnect** and **Sync Now** buttons

---

## Troubleshooting

### Error: "Google Calendar is not configured on the server"

**Cause**: Environment variables are missing or incorrect.

**Fix**:
1. Check that all three variables are set in `.env`:
   - `GOOGLE_OAUTH_CLIENT_ID`
   - `GOOGLE_OAUTH_CLIENT_SECRET`
   - `GOOGLE_OAUTH_REDIRECT_URI`
2. Restart the backend server
3. Check backend console logs for error details

---

### Error: "redirect_uri_mismatch"

**Cause**: The redirect URI in your Google Cloud Console doesn't match your `.env` file.

**Fix**:
1. Go to Google Cloud Console → Credentials
2. Edit your OAuth client
3. Make sure **Authorized redirect URIs** includes exactly:
   ```
   http://localhost:3001/api/google/callback
   ```
4. Click **Save**
5. Try connecting again

---

### Error: "Access blocked: This app's request is invalid"

**Cause**: OAuth consent screen not configured or missing scopes.

**Fix**:
1. Go to **OAuth consent screen** in Google Cloud Console
2. Make sure status is **In production** or **Testing**
3. Add yourself as a test user if in Testing mode
4. Verify both calendar scopes are added
5. Try again

---

### Backend logs show warnings about Google Calendar

If you see:
```
⚠️  Google Calendar OAuth not configured, skipping auto-sync
```

This is normal if you haven't set up OAuth yet. Once you add the env vars and restart, this warning will disappear.

---

## How It Works

### Connection Flow

1. User clicks "Connect Google Calendar" button
2. Frontend calls: `GET /api/google/connect?businessId=demo-business-001`
3. Backend generates OAuth URL with Google
4. User is redirected to Google's consent screen
5. User authorizes the app
6. Google redirects to: `http://localhost:3001/api/google/callback?code=...&state=demo-business-001`
7. Backend exchanges the `code` for access/refresh tokens
8. Tokens are saved in Supabase database
9. User is redirected back to Settings page with success message

### Sync Flow

Once connected, appointments are automatically synced:

- **Push**: When you create/update an appointment in Desk.ai → creates/updates Google Calendar event
- **Pull**: Every 5 minutes, the backend checks Google Calendar for external events
- **Conflicts**: If an external event conflicts with a Desk.ai appointment, it's marked with a warning

---

## Security Notes

- ✅ **Never commit** the `.env` file to git
- ✅ `.env` is already in `.gitignore`
- ✅ Access tokens are stored securely in Supabase
- ✅ Refresh tokens allow the app to reconnect without re-authorization
- ✅ Users can disconnect at any time (revokes access)

---

## Production Deployment

When deploying to production:

1. Create a new OAuth client in Google Cloud Console for production
2. Add your production redirect URI:
   ```
   https://your-domain.com/api/google/callback
   ```
3. Set environment variables on your hosting platform
4. Move the OAuth consent screen from "Testing" to "In production" (requires verification)

---

## Need Help?

Check the backend logs for detailed error messages:
```bash
cd /Users/marco/Desktop/agency-mvp/frontdesk-backend
npm run dev
```

Check the browser console (F12) for frontend errors.

All calendar-related errors will be logged with emojis:
- ✅ Success messages
- ❌ Error messages
- ⚠️  Warning messages
