import React, { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../integrations/supabase/client';
import { AuthContext } from './authContext';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session - with retry logic
    const loadSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
          // Don't set loading to false immediately - wait a bit and retry
          setTimeout(() => {
            setLoading(false);
          }, 1000);
          return;
        }
        console.log('🔑 Initial session loaded - User ID:', session?.user?.id);
        setUser(session?.user ?? null);
        setLoading(false);
      } catch (error) {
        console.error('Exception getting session:', error);
        setLoading(false);
      }
    };

    loadSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        console.log('🔑 User ID:', session?.user?.id);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('Sign in error:', error);
        // Provide more helpful error messages
        if (error.message.includes('Invalid login credentials')) {
          return { 
            error: { 
              ...error, 
              message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' 
            } 
          };
        }
        if (error.message.includes('Email not confirmed')) {
          return { 
            error: { 
              ...error, 
              message: 'يرجى تأكيد بريدك الإلكتروني أولاً' 
            } 
          };
        }
        return { error };
      }
      
      return { error: null };
    } catch (err) {
      console.error('Unexpected sign in error:', err);
      return { 
        error: { 
          message: 'حدث خطأ غير متوقع أثناء تسجيل الدخول',
          ...(err as any)
        } 
      };
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;


