import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { QueryClient, useQueryClient } from "@tanstack/react-query";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Function to clear all cached data when user changes
const clearUserCache = (queryClient: QueryClient) => {
  queryClient.clear();
  localStorage.removeItem('isAdmin');
  localStorage.removeItem('gamification-storage');
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  // Initialize isAdmin from localStorage for instant display on page load
  const [isAdmin, setIsAdmin] = useState(() => localStorage.getItem('isAdmin') === 'true');
  const previousUserIdRef = useRef<string | null>(null);
  const mountedRef = useRef(true);

  const checkAdminStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();

      if (!mountedRef.current) return;

      if (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
        localStorage.setItem('isAdmin', 'false');
        return;
      }

      const adminStatus = !!data;
      setIsAdmin(adminStatus);
      localStorage.setItem('isAdmin', String(adminStatus));
    } catch (error) {
      console.error("Error in checkAdminStatus:", error);
      if (mountedRef.current) {
        setIsAdmin(false);
        localStorage.setItem('isAdmin', 'false');
      }
    }
  };

  useEffect(() => {
    mountedRef.current = true;

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      if (!mountedRef.current) return;

      const newUserId = currentSession?.user?.id ?? null;
      const previousUserId = previousUserIdRef.current;

      // Detect user change (including logout and login as different user)
      if (previousUserId !== null && previousUserId !== newUserId) {
        console.log('[Auth] User changed, clearing cache');
        clearUserCache(queryClient);
        setIsAdmin(false);
      }

      previousUserIdRef.current = newUserId;
      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      // Check admin status with setTimeout to avoid React queue issues
      if (currentSession?.user) {
        setTimeout(() => {
          if (mountedRef.current) {
            checkAdminStatus(currentSession.user.id);
          }
        }, 0);
      } else {
        setIsAdmin(false);
        localStorage.removeItem('isAdmin');
      }
    });

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session: initialSession } }) => {
      if (!mountedRef.current) return;

      // Check if session should persist (remember me was checked or session is still active)
      const rememberSession = localStorage.getItem('rememberSession') === 'true';
      const sessionActive = sessionStorage.getItem('sessionActive') === 'true';

      if (initialSession && !rememberSession && !sessionActive) {
        // User didn't check "remember me" and browser was closed (sessionStorage cleared)
        console.log('[Auth] Session expired (browser was closed without remember me)');
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
        setLoading(false);
        return;
      }

      previousUserIdRef.current = initialSession?.user?.id ?? null;
      setSession(initialSession);
      setUser(initialSession?.user ?? null);

      if (initialSession?.user) {
        checkAdminStatus(initialSession.user.id);
      }
      setLoading(false);
    });

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [queryClient]);

  const signOut = async () => {
    clearUserCache(queryClient);
    localStorage.removeItem('rememberSession');
    sessionStorage.removeItem('sessionActive');
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsAdmin(false);
    previousUserIdRef.current = null;
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isAdmin, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
