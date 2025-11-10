import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';

interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
  hasActiveSubscription?: boolean;
  subscriptionPlan?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    name?: string;
    phone?: string;
    countryCode?: string;
    phoneCountryPrefix?: string;
    affiliateCode?: string;
    affiliateSource?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

// Cache keys
const USER_CACHE_KEY = 'auth_user_cache';
const SESSION_CHECK_KEY = 'auth_session_valid';

// Helper to get cached user synchronously
const getCachedUser = (): User | null => {
  try {
    const cached = localStorage.getItem(USER_CACHE_KEY);
    const sessionValid = localStorage.getItem(SESSION_CHECK_KEY);

    if (cached && sessionValid === 'true') {
      return JSON.parse(cached);
    }
  } catch (e) {
    console.warn('Failed to read user cache:', e);
  }
  return null;
};

// Helper to cache user
const cacheUser = (user: User | null) => {
  try {
    if (user) {
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
      localStorage.setItem(SESSION_CHECK_KEY, 'true');
    } else {
      localStorage.removeItem(USER_CACHE_KEY);
      localStorage.removeItem(SESSION_CHECK_KEY);
    }
  } catch (e) {
    console.warn('Failed to cache user:', e);
  }
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Initialize with cached user to prevent flash
  const [user, setUser] = useState<User | null>(getCachedUser());
  const [loading, setLoading] = useState(true);
  const isInitializing = useRef(true);
  const isProcessingAuth = useRef(false);

  const getUserWithRole = useCallback(async (authUser: SupabaseUser): Promise<User> => {
    try {
      // Add timeout to RPC call - fail fast if it takes too long
      const timeoutPromise = new Promise<null>((_, reject) => {
        setTimeout(() => reject(new Error('RPC timeout')), 5000);
      });

      const rpcPromise = supabase.rpc('get_user_role_and_subscription', {
        user_uuid: authUser.id
      });

      const { data: rpcData, error: rpcError } = await Promise.race([
        rpcPromise,
        timeoutPromise
      ]) as any;

      if (!rpcError && rpcData && Array.isArray(rpcData) && rpcData.length > 0) {
        const info = rpcData[0];
        const userData = {
          id: authUser.id,
          email: authUser.email!,
          name: authUser.user_metadata?.name,
          role: info.role || 'user',
          hasActiveSubscription: info.has_active_subscription || false,
          subscriptionPlan: info.subscription_plan
        };
        // Cache the user data
        cacheUser(userData);
        return userData;
      }
    } catch (err) {
      console.warn('RPC failed or timed out, using default role:', err);
    }

    // Fallback to default user
    const userData = {
      id: authUser.id,
      email: authUser.email!,
      name: authUser.user_metadata?.name,
      role: 'user',
      hasActiveSubscription: false
    };
    cacheUser(userData);
    return userData;
  }, []);

  const ensureCustomerExists = useCallback(async (authUser: SupabaseUser) => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/ensure-customer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          user_id: authUser.id,
          email: authUser.email!,
          phone: authUser.user_metadata?.phone || null,
          country_code: authUser.user_metadata?.country_code || null,
          phone_country_prefix: authUser.user_metadata?.phone_country_prefix || null
        })
      });

      if (!response.ok) {
        console.warn('ensureCustomerExists returned non-OK status');
      }
    } catch (error) {
      console.warn('ensureCustomerExists failed (non-critical):', error);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (mounted && session?.user) {
          try {
            await ensureCustomerExists(session.user);
            const userWithRole = await getUserWithRole(session.user);
            if (mounted) {
              setUser(userWithRole);
            }
          } catch (error) {
            if (mounted) {
              const fallbackUser = {
                id: session.user.id,
                email: session.user.email!,
                name: session.user.user_metadata?.name,
                role: 'user'
              };
              setUser(fallbackUser);
              cacheUser(fallbackUser);
            }
          }
        } else if (mounted && !session) {
          // No session - clear cache
          cacheUser(null);
          setUser(null);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        if (mounted) {
          setLoading(false);
          isInitializing.current = false;
        }
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted || isInitializing.current || isProcessingAuth.current) {
        return;
      }

      if (event === 'SIGNED_IN' && session?.user) {
        try {
          await ensureCustomerExists(session.user);
          const userWithRole = await getUserWithRole(session.user);
          if (mounted) {
            setUser(userWithRole);
          }
        } catch (error) {
          if (mounted) {
            setUser({
              id: session.user.id,
              email: session.user.email!,
              name: session.user.user_metadata?.name,
              role: 'user'
            });
          }
        }
      } else if (event === 'SIGNED_OUT') {
        if (mounted) {
          cacheUser(null);
          setUser(null);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [getUserWithRole, ensureCustomerExists]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      isProcessingAuth.current = true;

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      if (data.user) {
        // Set user immediately with basic info for fast login
        setUser({
          id: data.user.id,
          email: data.user.email!,
          name: data.user.user_metadata?.name,
          role: 'user', // Will be updated in background
          hasActiveSubscription: false
        });

        // Fetch full role info in background (non-blocking)
        getUserWithRole(data.user).then(userWithRole => {
          setUser(userWithRole);
        }).catch(err => {
          console.warn('Failed to fetch user role in background:', err);
        });

        // Ensure customer exists in background (non-blocking)
        ensureCustomerExists(data.user).catch(console.error);
      }
    } finally {
      isProcessingAuth.current = false;
    }
  }, [getUserWithRole, ensureCustomerExists]);

  const register = useCallback(async (data: {
    email: string;
    password: string;
    name?: string;
    phone?: string;
    countryCode?: string;
    phoneCountryPrefix?: string;
    affiliateCode?: string;
    affiliateSource?: string;
  }) => {
    try {
      isProcessingAuth.current = true;

      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
            phone: data.phone,
            country_code: data.countryCode,
            phone_country_prefix: data.phoneCountryPrefix
          }
        }
      });

      if (error) throw error;

      if (authData.user) {
        await ensureCustomerExists(authData.user);

        // Process affiliate attribution if code exists
        if (data.affiliateCode) {
          try {
            const { data: sessionData } = await supabase.auth.getSession();
            if (sessionData?.session?.access_token) {
              await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/affiliate-track`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${sessionData.session.access_token}`,
                  'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
                },
                body: JSON.stringify({
                  affiliate_code: data.affiliateCode,
                  source: data.affiliateSource || 'direct'
                })
              });

              // Clear the ref cookie after successful attribution
              document.cookie = 'ref=; Path=/; Max-Age=0';
            }
          } catch (trackingError) {
            console.error('Error tracking affiliate:', trackingError);
            // Don't block registration if tracking fails
          }
        }

        const userWithRole = await getUserWithRole(authData.user);
        setUser(userWithRole);
      }
    } finally {
      isProcessingAuth.current = false;
    }
  }, [getUserWithRole, ensureCustomerExists]);

  const logout = useCallback(async () => {
    try {
      isProcessingAuth.current = true;

      // Clear user state immediately
      setUser(null);

      // Sign out from Supabase
      await supabase.auth.signOut({ scope: 'local' });

      // Clear any local storage items except navigation state
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && !key.startsWith('sb-')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));

      sessionStorage.clear();
    } catch (error) {
      console.error('Logout failed:', error);

      // Even if there's an error, force clear state
      setUser(null);
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && !key.startsWith('sb-')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      sessionStorage.clear();
    } finally {
      isProcessingAuth.current = false;
    }
  }, []);

  const value: AuthContextType = useMemo(() => ({
    user,
    loading,
    login,
    register,
    logout
  }), [user, loading, login, register, logout]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
