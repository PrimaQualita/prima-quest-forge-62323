import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import SupplierPortal from "./SupplierPortal";
import Profile from "./Profile";
import { Loader2 } from "lucide-react";

const ProfilePage = () => {
  const { user } = useAuth();

  const { data: isSupplier, isLoading } = useQuery({
    queryKey: ['is-supplier', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      
      const { data } = await supabase
        .from('supplier_due_diligence')
        .select('status')
        .eq('user_id', user.id)
        .eq('status', 'approved')
        .maybeSingle();
      
      return !!data;
    },
    enabled: !!user?.id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Se for fornecedor, mostra o portal do fornecedor
  // Senão, mostra o perfil normal do colaborador
  return isSupplier ? <SupplierPortal /> : <Profile />;
};

export default ProfilePage;
