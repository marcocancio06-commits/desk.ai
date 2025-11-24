import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase, getSession, getCurrentUser, onAuthStateChange } from '../lib/supabase';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [businesses, setBusinesses] = useState([]);
  const [currentBusiness, setCurrentBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [businessLoading, setBusinessLoading] = useState(false);

  useEffect(() => {
    // Get initial session
    getSession().then(async (session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await loadUserBusinesses(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const unsubscribe = onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (event === 'SIGNED_IN' && session?.user) {
        await loadUserBusinesses(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setBusinesses([]);
        setCurrentBusiness(null);
        setBusinessLoading(false);
      }
      
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  async function loadUserBusinesses(userId) {
    setBusinessLoading(true);
    
    // Set a timeout to stop showing loading state after 3 seconds
    const timeoutId = setTimeout(() => {
      console.warn('Business loading timeout - stopping loading indicator');
      setBusinessLoading(false);
    }, 3000);
    
    try {
      console.log('Loading businesses for user:', userId);
      
      // Query business_users joined with businesses
      const { data, error } = await supabase
        .from('business_users')
        .select(`
          role,
          is_default,
          businesses:business_id (
            id,
            slug,
            name,
            phone,
            industry,
            service_zip_codes,
            is_active,
            subscription_tier
          )
        `)
        .eq('user_id', userId);
      
      if (error) {
        console.error('Error loading businesses:', error);
        clearTimeout(timeoutId);
        setBusinessLoading(false);
        return;
      }
      
      if (!data || data.length === 0) {
        console.warn('No businesses found for user');
        setBusinesses([]);
        setCurrentBusiness(null);
        localStorage.removeItem('currentBusinessId');
        clearTimeout(timeoutId);
        setBusinessLoading(false);
        return;
      }
      
      // Flatten the data structure
      const userBusinesses = data.map(item => ({
        ...item.businesses,
        role: item.role,
        is_default: item.is_default
      }));
      
      console.log('Loaded businesses:', userBusinesses);
      setBusinesses(userBusinesses);
      
      // Try to restore from localStorage first
      const savedBusinessId = localStorage.getItem('currentBusinessId');
      let selectedBusiness = null;
      
      if (savedBusinessId) {
        selectedBusiness = userBusinesses.find(b => b.id === savedBusinessId);
      }
      
      // Fallback to default or first business
      if (!selectedBusiness) {
        const defaultBusiness = userBusinesses.find(b => b.is_default);
        selectedBusiness = defaultBusiness || userBusinesses[0];
      }
      
      setCurrentBusiness(selectedBusiness);
      if (selectedBusiness) {
        localStorage.setItem('currentBusinessId', selectedBusiness.id);
      }
      
      clearTimeout(timeoutId);
      setBusinessLoading(false);
      
    } catch (error) {
      console.error('Error in loadUserBusinesses:', error);
      clearTimeout(timeoutId);
      setBusinessLoading(false);
    }
  }

  async function switchBusiness(businessId) {
    const business = businesses.find(b => b.id === businessId);
    if (business) {
      console.log('Switching to business:', business.name);
      setCurrentBusiness(business);
      
      // Persist to localStorage
      localStorage.setItem('currentBusinessId', businessId);
      
      // Update is_default in database
      try {
        await supabase
          .from('business_users')
          .update({ is_default: false })
          .eq('user_id', user.id);
        
        await supabase
          .from('business_users')
          .update({ is_default: true })
          .eq('user_id', user.id)
          .eq('business_id', businessId);
      } catch (error) {
        console.warn('Failed to update default business:', error);
      }
    }
  }

  async function refetchBusinesses() {
    if (user) {
      await loadUserBusinesses(user.id);
    }
  }

  // Helper function to get current business ID
  function getCurrentBusinessId() {
    return currentBusiness?.id || null;
  }

  const value = {
    user,
    session,
    businesses,
    currentBusiness,
    loading,
    businessLoading,
    switchBusiness,
    refetchBusinesses,
    getCurrentBusinessId,
    signOut: async () => {
      await supabase?.auth.signOut();
      setUser(null);
      setSession(null);
      setBusinesses([]);
      setCurrentBusiness(null);
      setBusinessLoading(false);
      localStorage.removeItem('currentBusinessId');
      router.push('/auth/login');
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * Higher-order component to protect routes
 * Redirects to /auth/login if not authenticated
 */
export function withAuth(Component) {
  return function ProtectedRoute(props) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading && !user) {
        // Not logged in, redirect to login
        router.push('/auth/login');
      }
    }, [user, loading, router]);

    // Show loading state while checking auth
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      );
    }

    // Not authenticated
    if (!user) {
      return null;
    }

    // Authenticated, render the component
    return <Component {...props} />;
  };
}
