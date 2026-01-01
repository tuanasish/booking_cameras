'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';

interface AuthContextType {
  user: User | null;
  userRole: 'admin' | 'employee' | null;
  userName: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userRole: null,
  userName: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<'admin' | 'employee' | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for admin session in localStorage
    const adminData = localStorage.getItem('user');
    if (adminData) {
      try {
        const parsed = JSON.parse(adminData);
        if (parsed.role === 'admin') {
          setUserRole('admin');
          setUserName(parsed.name);
          setLoading(false);
          return;
        }
      } catch (e) {
        // Invalid data
      }
    }

    // Check Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        // Check if user is employee
        supabase
          .from('employees')
          .select('name, is_active')
          .eq('email', session.user.email!)
          .eq('is_active', true)
          .single()
          .then(({ data }) => {
            if (data) {
              setUserRole('employee');
              setUserName(data.name);
            }
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        supabase
          .from('employees')
          .select('name, is_active')
          .eq('email', session.user.email!)
          .eq('is_active', true)
          .single()
          .then(({ data }) => {
            if (data) {
              setUserRole('employee');
              setUserName(data.name);
            }
          });
      } else {
        setUserRole(null);
        setUserName(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    localStorage.removeItem('user');
    localStorage.removeItem('pendingEmployee');
    await supabase.auth.signOut();
    setUser(null);
    setUserRole(null);
    setUserName(null);
  };

  return (
    <AuthContext.Provider value={{ user, userRole, userName, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);


