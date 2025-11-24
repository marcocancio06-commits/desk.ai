# API Security Reference - Quick Guide

**Version:** 1.0  
**Date:** November 22, 2025

---

## Authentication Headers

All protected endpoints require:

```
Authorization: Bearer <SUPABASE_ACCESS_TOKEN>
```

Get token from Supabase Auth:
```javascript
const { data: { session } } = await supabase.auth.getSession();
const accessToken = session?.access_token;
```

---

## Required Parameters

### business_id Rules

| Endpoint Type | business_id Source | Required? |
|---------------|-------------------|-----------|
| Public chat | Request body | ✅ Yes |
| Protected GET | Query parameter `?businessId=<id>` | ✅ Yes |
| Protected POST/PATCH | Request body or URL param | ✅ Yes |
| Lead/Appointment operations | Derived from resource | ❌ No (verified from DB) |

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "business_id required",
  "code": "BUSINESS_ID_REQUIRED"
}
```

### 401 Unauthorized
```json
{
  "ok": false,
  "error": "Authentication required",
  "code": "UNAUTHORIZED"
}
```

### 403 Forbidden
```json
{
  "ok": false,
  "error": "Access denied - you do not have permission to access this business",
  "code": "FORBIDDEN"
}
```

### 404 Not Found
```json
{
  "error": "Business not found or inactive",
  "code": "BUSINESS_NOT_FOUND"
}
```

---

## Endpoint Reference

### Public Endpoints

#### POST /api/message
**Auth:** None  
**Required:** business_id, message  
**Returns:** AI response with lead info

```bash
curl -X POST http://localhost:3001/api/message \
  -H "Content-Type: application/json" \
  -d '{
    "businessId": "uuid-here",
    "from": "+1-555-123-4567",
    "channel": "web_chat",
    "message": "I need help"
  }'
```

### Protected Endpoints

#### GET /api/leads
**Auth:** Required  
**Required:** businessId (query param)  
**Returns:** Leads array + stats

```bash
curl -X GET "http://localhost:3001/api/leads?businessId=<uuid>" \
  -H "Authorization: Bearer <token>"
```

#### PATCH /api/leads/:id
**Auth:** Required  
**Required:** Lead ID (URL), businessId (body)  
**Returns:** Updated lead

```bash
curl -X PATCH "http://localhost:3001/api/leads/<lead-id>" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "businessId": "<uuid>",
    "status": "contacted"
  }'
```

#### GET /api/appointments
**Auth:** Required  
**Required:** businessId (query param)  
**Returns:** Appointments array

```bash
curl -X GET "http://localhost:3001/api/appointments?businessId=<uuid>" \
  -H "Authorization: Bearer <token>"
```

#### GET /api/business/:businessId/team
**Auth:** Required  
**Required:** businessId (URL param)  
**Returns:** Team members array

```bash
curl -X GET "http://localhost:3001/api/business/<uuid>/team" \
  -H "Authorization: Bearer <token>"
```

#### POST /api/business/:businessId/invite
**Auth:** Required (owner/manager only)  
**Required:** businessId (URL), email, role (body)  
**Returns:** Success message with userId

```bash
curl -X POST "http://localhost:3001/api/business/<uuid>/invite" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newmember@example.com",
    "role": "staff"
  }'
```

---

## Security Checklist

Before calling any API endpoint:

1. **Check if auth required** - See endpoint list above
2. **Include Authorization header** - If protected endpoint
3. **Include business_id** - In query param or body
4. **Verify user owns business** - Or request will fail with 403
5. **Handle error responses** - Check for 400/401/403/404

---

## Frontend Integration

### React Hook Pattern

```javascript
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const { currentBusiness, getCurrentBusinessId } = useAuth();
  const businessId = getCurrentBusinessId();

  const fetchData = async () => {
    if (!businessId) {
      console.error('No business selected');
      return;
    }

    const res = await fetch(
      `${BACKEND_URL}/api/leads?businessId=${businessId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        }
      }
    );

    if (!res.ok) {
      if (res.status === 403) {
        alert('Access denied to this business');
      }
      return;
    }

    const data = await res.json();
    // Use data...
  };

  return <div>...</div>;
}
```

### Error Handling Pattern

```javascript
async function callProtectedAPI(endpoint, options = {}) {
  try {
    const res = await fetch(endpoint, {
      ...options,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    // Handle different error types
    if (res.status === 400) {
      const error = await res.json();
      throw new Error(error.error || 'Bad request');
    }

    if (res.status === 401) {
      // Redirect to login
      window.location.href = '/login';
      return;
    }

    if (res.status === 403) {
      throw new Error('Access denied to this resource');
    }

    if (res.status === 404) {
      throw new Error('Resource not found');
    }

    if (!res.ok) {
      throw new Error('Server error');
    }

    return await res.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}
```

---

## Testing Commands

### Test Missing business_id

```bash
# Should return 400
curl -X POST http://localhost:3001/api/message \
  -H "Content-Type: application/json" \
  -d '{"from": "+1-555-123-4567", "message": "test"}'
```

### Test Invalid business_id

```bash
# Should return 404
curl -X POST http://localhost:3001/api/message \
  -H "Content-Type: application/json" \
  -d '{"businessId": "invalid-uuid", "from": "+1", "message": "test"}'
```

### Test Cross-Tenant Access

```bash
# Owner1 tries to access Owner2's data - Should return 403
curl -X GET "http://localhost:3001/api/leads?businessId=<owner2-business-id>" \
  -H "Authorization: Bearer <owner1-token>"
```

### Test Unauthenticated Access

```bash
# Should return 401
curl -X GET "http://localhost:3001/api/leads?businessId=<uuid>"
```

---

## Migration Guide

### If Upgrading from Unsecured Version

1. **Update all API calls** to include businessId parameter
2. **Add Authorization header** to all protected endpoints
3. **Handle 403 errors** when user doesn't own business
4. **Test with multiple businesses** to verify isolation

### Breaking Changes

- All endpoints now require authentication (except /api/message)
- All endpoints require business_id parameter
- Cross-tenant access now returns 403 instead of 200
- Staff members cannot invite team members (403)

---

## Common Issues

### "business_id required" Error

**Cause:** Missing businessId in request  
**Fix:** Add `?businessId=<uuid>` to GET requests, or include in POST body

### "Access denied" Error

**Cause:** User doesn't own the business  
**Fix:** Verify user is linked to business in business_users table

### "Authentication required" Error

**Cause:** Missing or invalid Authorization header  
**Fix:** Include valid Supabase JWT token

### "Business not found" Error

**Cause:** Business doesn't exist or is_active=false  
**Fix:** Check business exists and is_active=true in database

---

## Support

See full documentation:
- `SECURITY_TESTING_GUIDE.md` - Complete test suite
- `SECURITY_IMPLEMENTATION_SUMMARY.md` - Detailed implementation
- GitHub Issues: https://github.com/desk-ai/backend/issues

**Last Updated:** November 22, 2025
