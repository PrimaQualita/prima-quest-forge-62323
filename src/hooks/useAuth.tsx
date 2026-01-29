import { useState, useEffect, useRef } from "react";
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
  const clearUserCache = () => {
    // Clear React Query cache
    queryClient.clear();
    // Clear localStorage items related to user session
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('gamification-storage');
    // Reset admin state
    setIsAdmin(false);
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const newUserId = session?.user?.id ?? null;
      const previousUserId = previousUserIdRef.current;

      // Detect user change (including logout and login as different user)
      if (previousUserId !== null && previousUserId !== newUserId) {
        console.log('[Auth] User changed, clearing cache');
        clearUserCache();
      }

      // Update previous user ID reference
      previousUserIdRef.current = newUserId;

      setSession(session);
      setUser(session?.user ?? null);

      // Check if user is admin after state is set
      if (session?.user) {
        setTimeout(() => {
          checkAdminStatus(session.user.id);
        }, 0);
      } else {
        setIsAdmin(false);
        localStorage.removeItem('isAdmin');
      }
    });

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      previousUserIdRef.current = session?.user?.id ?? null;
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        checkAdminStatus(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [queryClient]);

  const checkAdminStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();

      if (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
        localStorage.setItem('isAdmin', 'false');
        return;
      }

      const adminStatus = !!data;
      setIsAdmin(adminStatus);
      // Salva no cache para próximas visitas
      localStorage.setItem('isAdmin', String(adminStatus));
    } catch (error) {
      console.error("Error in checkAdminStatus:", error);
      setIsAdmin(false);
      localStorage.setItem('isAdmin', 'false');
    }
  };

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
