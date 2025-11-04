import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardManager from "@/components/dashboard/DashboardManager";
import DashboardEmployee from "@/components/dashboard/DashboardEmployee";
import { Loader2 } from "lucide-react";

const Dashboard = () => {
  const { user } = useAuth();

  const { data: employeeData, isLoading } = useQuery({
    queryKey: ['employee-data', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data } = await supabase
        .from('employees')
        .select('id, is_manager')
        .eq('user_id', user.id)
        .single();
      
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

  return employeeData.is_manager ? (
    <DashboardManager />
  ) : (
    <DashboardEmployee employeeId={employeeData.id} />
  );
};

export default Dashboard;
