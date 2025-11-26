# Emergency Auth Simplification - Status Update

## ✅ COMPLETED: login.js is simplified!

### Changes made to `/pages/auth/login.js`:

1. **Removed imports:**
   - ❌ `signIn` wrapper function
   - ❌ `handlePostAuthRedirect` centralized routing
   
2. **Removed state:**
   - ❌ `expectedRole` - no more role detection
   - ❌ `roleParam` from router.query

3. **Simplified handleSubmit:**
   ```javascript
   // OLD: const { user } = await signIn(email, password);
   // NEW: const { data, error } = await supabase.auth.signInWithPassword({...});
   
   // OLD: await handlePostAuthRedirect({...});
   // NEW: router.push('/dashboard');
   ```

4. **Error handling:**
   - Single, clear error message: "Incorrect email or password, or service unavailable."
   - No more stuck spinners - setLoading(false) always called on error

5. **Result:**
   - ✅ Login always redirects to `/dashboard`
   - ✅ No role-based logic
   - ✅ Simple, reliable flow

---

## ⚠️ TODO: signup.js still needs simplification

### Current state:
- Still uses `signUp` wrapper function
- Still uses `upsertProfile` wrapper function
- Still calls `handlePostAuthRedirect`
- Still has role logic (`userRole`, `roleParam`)

### What needs to change:

1. **Replace signUp wrapper:**
   ```javascript
   // REPLACE THIS:
   const authData = await signUp(email, password, { role: userRole });
   
   // WITH THIS:
   const { data, error: signUpError } = await supabase.auth.signUp({
     email,
     password,
     options: {
       data: {
         role: 'owner' // Default to owner for MVP
       }
     }
   });
   
   if (signUpError) {
     throw signUpError;
   }
   ```

2. **Replace upsertProfile wrapper:**
   ```javascript
   // REPLACE THIS:
   await upsertProfile(userId, {
     full_name: email.split('@')[0],
     email: email,
     role: userRole
   });
   
   // WITH THIS:
   const { error: profileError } = await supabase
     .from('profiles')
     .upsert({
       id: userId,
       email: email,
       full_name: email.split('@')[0],
       role: 'owner'
     }, {
       onConflict: 'id'
     });
   
   if (profileError) {
     console.error('Profile creation failed (non-blocking):', profileError);
   }
   ```

3. **Replace handlePostAuthRedirect:**
   ```javascript
   // REPLACE THIS:
   await handlePostAuthRedirect({ router, explicitRoleFromQuery: userRole });
   
   // WITH THIS:
   router.push('/onboarding');
   ```

4. **Remove imports/state:**
   - Remove `useEffect` from React imports
   - Remove `signUp, upsertProfile` from supabase imports
   - Remove `handlePostAuthRedirect` import
   - Remove `userRole` state
   - Remove `roleParam` from router.query
   - Remove the entire useEffect that sets role from query params

---

## Testing Checklist (once signup.js is fixed):

- [ ] Sign up with brand-new email → redirected to `/onboarding`
- [ ] Complete onboarding wizard → redirected to `/dashboard`
- [ ] Refresh dashboard → still logged in
- [ ] Log out → redirected to home
- [ ] Log in with credentials → redirected to `/dashboard`
- [ ] Try wrong password → error shown, NO infinite spinner
- [ ] Check console logs → clean emoji logging (🔐 ✅ ❌)

---

## Files Changed:

### ✅ Completed:
- `frontend/pages/auth/login.js` - Fully simplified

### ⚠️ In Progress:
- `frontend/pages/auth/signup.js` - Needs manual fixes (see above)

### 📦 Backups Created:
- `frontend/pages/auth/login.js.roleversion` - Original role-based version
- `frontend/pages/auth/signup.js.roleversion` - Original role-based version

---

## Why This Approach?

The role-based routing (`handlePostAuthRedirect`, profiles table checks, etc.) was causing:
- Infinite loading spinners
- Unpredictable redirects
- Complex debugging

For MVP demo, we need:
- **Boring reliability over clever routing**
- Everyone is an owner (for now)
- Login → Dashboard, Signup → Onboarding
- No role switching until client flows are properly built out

---

## Next Steps:

1. Manually edit `signup.js` with the changes listed above
2. Test signup flow end-to-end
3. Test login flow end-to-end  
4. Commit both files
5. Deploy for client demo

The login page is ready to go! 🎉
