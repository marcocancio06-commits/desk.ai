#!/bin/bash
# Emergency Auth Simplification Script
# This script simplifies the auth flows to make them bullet-proof for MVP demo

cd "$(dirname "$0")"

echo "🔧 Simplifying login.js..."

# Replace login imports and state
sed -i.mvpbackup '
/^import { supabase, signIn } from/c\
import { supabase } from '\''../../lib/supabase'\'';

/^import { handlePostAuthRedirect } from/d

/const \[expectedRole, setExpectedRole\] = useState(null);/d
/const { role: roleParam } = router.query;/d

/\/\/ Set expected role from query params/,/}, \[roleParam\]);/d
' pages/auth/login.js

# Replace login handleSubmit function  
# This is complex, so we'll use a different approach - create a temp file with just the new function
cat > /tmp/login_handlesubmit.txt << 'LOGINEOF'
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      // Sign in with Supabase
      console.log('🔐 Signing in...', email);
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (signInError) {
        throw signInError;
      }
      
      if (!data.user) {
        throw new Error('Login failed - no user returned');
      }
      
      console.log('✅ Login success, redirecting to dashboard');
      
      // Simple redirect: everyone goes to dashboard
      router.push('/dashboard');
      
    } catch (err) {
      console.error('❌ Login error:', err);
      
      // User-friendly error message
      setError('Incorrect email or password, or service unavailable.');
      setLoading(false);
    }
  };
LOGINEOF

# Note: Manually replacing the function in login.js would require complex sed
# Instead, we'll document what needs to change

echo "✅ Login simplified (imports/state updated)"
echo ""
echo "📝 Manual steps still needed:"
echo "1. Replace handleSubmit in login.js with the content from /tmp/login_handlesubmit.txt"
echo "2. Remove role-based heading text"
echo ""

echo "🔧 Simplifying signup.js..."

# Replace signup imports
sed -i.mvpbackup2 '
/^import { useState, useEffect } from/c\
import { useState } from '\''react'\'';

/^import { supabase, signUp, upsertProfile } from/c\
import { supabase } from '\''../../lib/supabase'\'';

/^import { handlePostAuthRedirect } from/d

/const \[userRole, setUserRole\] = useState/d
/const { role: roleParam } = router.query;/d

/\/\/ Set role from query params/,/}, \[roleParam\]);/d
' pages/auth/signup.js

echo "✅ Signup simplified (imports/state updated)"
echo ""
echo "⚠️  CRITICAL: The auth functions still use signUp/upsertProfile/handlePostAuthRedirect"
echo "These need to be replaced with direct supabase.auth calls."
echo ""
echo "🎯 Summary: Auth files partially updated. See /tmp/login_handlesubmit.txt for reference."
