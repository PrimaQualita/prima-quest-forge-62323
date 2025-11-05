import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardEmployee from "@/components/dashboard/DashboardEmployee";
import { Loader2 } from "lucide-react";

const Dashboard = () => {
  const { user, isAdmin } = useAuth();

  const { data: employeeData, isLoading } = useQuery({
    queryKey: ['employee-data', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data } = await supabase
        .from('employees')
        .select('id, is_manager')
        .eq('user_id', user.id)
        .maybeSingle();
      
      return data;
    },
    enabled: !!user?.id
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!employeeData) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Não foi possível carregar os dados do dashboard.</p>
      </div>
    );
  }

  // Gestores também veem suas próprias pendências como colaboradores
  return <DashboardEmployee employeeId={employeeData.id} />;
};

export default Dashboard;
