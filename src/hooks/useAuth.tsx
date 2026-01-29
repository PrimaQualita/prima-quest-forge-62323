import { useState, useEffect, useRef } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

export const useAuth = () => {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(() => {
    // Initialize from localStorage for instant display
    return localStorage.getItem('isAdmin') === 'true';
  });
  const previousUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const clearUserCache = () => {
      queryClient.clear();
      localStorage.removeItem('isAdmin');
      localStorage.removeItem('gamification-storage');
      setIsAdmin(false);
    };

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
          return false;
        }
        return !!data;
      } catch (error) {
        console.error("Error in checkAdminStatus:", error);
        return false;
      }
    };

    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session: initialSession } }) => {
      if (!isMounted) return;

      previousUserIdRef.current = initialSession?.user?.id ?? null;
      setSession(initialSession);
      setUser(initialSession?.user ?? null);

      if (initialSession?.user) {
        const adminStatus = await checkAdminStatus(initialSession.user.id);
        if (isMounted) {
          setIsAdmin(adminStatus);
          localStorage.setItem('isAdmin', String(adminStatus));
        }
      } else {
        setIsAdmin(false);
        localStorage.removeItem('isAdmin');
      }

      if (isMounted) {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        if (!isMounted) return;

        const newUserId = newSession?.user?.id ?? null;
        const previousUserId = previousUserIdRef.current;

        // Detect user change
        if (previousUserId !== null && previousUserId !== newUserId) {
          console.log('[Auth] User changed, clearing cache');
          clearUserCache();
        }

        previousUserIdRef.current = newUserId;
        setSession(newSession);
        setUser(newSession?.user ?? null);

        // Check admin status asynchronously
        if (newSession?.user) {
          checkAdminStatus(newSession.user.id).then((adminStatus) => {
            if (isMounted) {
              setIsAdmin(adminStatus);
              localStorage.setItem('isAdmin', String(adminStatus));
            }
          });
        } else {
          setIsAdmin(false);
          localStorage.removeItem('isAdmin');
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [queryClient]);

  const signOut = async () => {
    queryClient.clear();
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('gamification-storage');
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
