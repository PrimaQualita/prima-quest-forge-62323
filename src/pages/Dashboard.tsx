import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StatCard } from "@/components/StatCard";
import { Users, FileCheck, GraduationCap, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const Dashboard = () => {
  const { data: employeesCount } = useQuery({
    queryKey: ['employees-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true });
      return count || 0;
    },
  });

  const { data: documentsCount } = useQuery({
    queryKey: ['documents-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('compliance_documents')
        .select('*', { count: 'exact', head: true });
      return count || 0;
    },
  });

  const { data: trainingsCount } = useQuery({
    queryKey: ['trainings-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('trainings')
        .select('*', { count: 'exact', head: true });
      return count || 0;
    },
  });

  const { data: acknowledgedCount } = useQuery({
    queryKey: ['acknowledged-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('document_acknowledgments')
        .select('*', { count: 'exact', head: true })
        .eq('quiz_correct', true);
      return count || 0;
    },
  });

  const complianceRate = employeesCount && documentsCount 
    ? Math.round((acknowledgedCount || 0) / (employeesCount * documentsCount) * 100)
    : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Dashboard de Compliance</h1>
        <p className="text-muted-foreground">Visão geral do sistema de gestão de compliance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Colaboradores"
          value={employeesCount || 0}
          icon={Users}
          trend="Total cadastrado"
          variant="primary"
        />
        <StatCard
          title="Documentos"
          value={documentsCount || 0}
          icon={FileCheck}
          trend="Políticas ativas"
          variant="secondary"
        />
        <StatCard
          title="Treinamentos"
          value={trainingsCount || 0}
          icon={GraduationCap}
          trend="Programas disponíveis"
          variant="accent"
        />
        <StatCard
          title="Taxa de Conformidade"
          value={`${complianceRate}%`}
          icon={TrendingUp}
          trend="Média geral"
          variant="primary"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Status de Aceite de Documentos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Código de Ética</span>
                <span className="text-sm text-muted-foreground">85%</span>
              </div>
              <Progress value={85} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Política de Integridade</span>
                <span className="text-sm text-muted-foreground">72%</span>
              </div>
              <Progress value={72} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Regulamentos Internos</span>
                <span className="text-sm text-muted-foreground">68%</span>
              </div>
              <Progress value={68} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Treinamentos Concluídos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">LGPD e Proteção de Dados</span>
                <span className="text-sm text-muted-foreground">92%</span>
              </div>
              <Progress value={92} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Ética Profissional</span>
                <span className="text-sm text-muted-foreground">78%</span>
              </div>
              <Progress value={78} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Combate à Corrupção</span>
                <span className="text-sm text-muted-foreground">65%</span>
              </div>
              <Progress value={65} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
