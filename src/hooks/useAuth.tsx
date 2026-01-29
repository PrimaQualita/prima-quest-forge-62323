import { useState, useEffect, useRef, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

export const useAuth = () => {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  // Track previous user ID to detect user changes
  const previousUserIdRef = useRef<string | null>(null);
  const mountedRef = useRef(true);

  // Function to clear all cached data when user changes
  const clearUserCache = useCallback(() => {
    queryClient.clear();
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('gamification-storage');
    setIsAdmin(false);
  }, [queryClient]);

  const checkAdminStatus = useCallback(async (userId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();

      if (error) {
        console.error("Error checking admin status:", error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error("Error in checkAdminStatus:", error);
      return false;
    }
  }, []);

  // Separate function to handle auth state changes asynchronously
  const handleAuthChange = useCallback(async (newSession: Session | null) => {
    if (!mountedRef.current) return;

    const newUserId = newSession?.user?.id ?? null;
    const previousUserId = previousUserIdRef.current;

    // Detect user change
    if (previousUserId !== null && previousUserId !== newUserId) {
      console.log('[Auth] User changed, clearing cache');
      clearUserCache();
    }

    previousUserIdRef.current = newUserId;

    if (newSession?.user) {
      const adminStatus = await checkAdminStatus(newSession.user.id);
      if (!mountedRef.current) return;
      
      setIsAdmin(adminStatus);
      localStorage.setItem('isAdmin', String(adminStatus));
    } else {
      setIsAdmin(false);
      localStorage.removeItem('isAdmin');
    }

    if (!mountedRef.current) return;
    setSession(newSession);
    setUser(newSession?.user ?? null);
  }, [clearUserCache, checkAdminStatus]);

  useEffect(() => {
    mountedRef.current = true;

    // Set up auth state listener - keep callback synchronous
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Trigger async handling without awaiting
      handleAuthChange(session);
    });

    // Check for existing session
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mountedRef.current) return;

      previousUserIdRef.current = session?.user?.id ?? null;
      
      if (session?.user) {
        const adminStatus = await checkAdminStatus(session.user.id);
        if (!mountedRef.current) return;
        
        setIsAdmin(adminStatus);
        localStorage.setItem('isAdmin', String(adminStatus));
      }

      if (!mountedRef.current) return;
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    };

    initializeAuth();

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [handleAuthChange, checkAdminStatus]);

  const signOut = async () => {
    clearUserCache();
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsAdmin(false);
    previousUserIdRef.current = null;
  };

  return {
    user,
    session,
    loading,
    isAdmin,
    signOut,
  };
};
