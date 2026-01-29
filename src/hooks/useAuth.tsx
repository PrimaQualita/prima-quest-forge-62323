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

  // Function to clear all cached data when user changes
  const clearUserCache = useCallback(() => {
    // Clear React Query cache
    queryClient.clear();
    // Clear localStorage items related to user session
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('gamification-storage');
    // Reset admin state
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

  useEffect(() => {
    let mounted = true;

    // Set up auth state listener FIRST
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      const newUserId = session?.user?.id ?? null;
      const previousUserId = previousUserIdRef.current;

      // Detect user change (including logout and login as different user)
      if (previousUserId !== null && previousUserId !== newUserId) {
        console.log('[Auth] User changed, clearing cache');
        clearUserCache();
      }

      // Update previous user ID reference
      previousUserIdRef.current = newUserId;

      // If user is logging in, check admin status BEFORE updating state
      if (session?.user) {
        const adminStatus = await checkAdminStatus(session.user.id);
        if (!mounted) return;
        
        setIsAdmin(adminStatus);
        localStorage.setItem('isAdmin', String(adminStatus));
      } else {
        setIsAdmin(false);
        localStorage.removeItem('isAdmin');
      }

      setSession(session);
      setUser(session?.user ?? null);
    });

    // THEN check for existing session
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;

      previousUserIdRef.current = session?.user?.id ?? null;
      
      if (session?.user) {
        // Check admin status before setting loading to false
        const adminStatus = await checkAdminStatus(session.user.id);
        if (!mounted) return;
        
        setIsAdmin(adminStatus);
        localStorage.setItem('isAdmin', String(adminStatus));
      }

      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    };

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [queryClient, clearUserCache, checkAdminStatus]);

  const signOut = async () => {
    // Clear all cached data before signing out
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
