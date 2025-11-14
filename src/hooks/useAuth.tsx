import { useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  // Inicializa com cache do localStorage para evitar delay visual
  const [isAdmin, setIsAdmin] = useState(() => {
    const cached = localStorage.getItem('isAdmin');
    return cached === 'true';
  });

  useEffect(() => {
    // Set up auth state listener FIRST
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      // Check if user is admin after state is set
      if (session?.user) {
        setTimeout(() => {
          checkAdminStatus(session.user.id);
        }, 0);
      } else {
        setIsAdmin(false);
      }
    });

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        checkAdminStatus(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

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
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsAdmin(false);
    // Limpa o cache ao fazer logout
    localStorage.removeItem('isAdmin');
  };

  return {
    user,
    session,
    loading,
    isAdmin,
    signOut,
  };
};
