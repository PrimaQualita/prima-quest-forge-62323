import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, PieChart, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const Reports = () => {
  const { data: stats } = useQuery({
    queryKey: ['compliance-stats'],
    queryFn: async () => {
      const [employees, documents, trainings, acknowledgments, participations] = await Promise.all([
        supabase.from('employees').select('*', { count: 'exact' }),
        supabase.from('compliance_documents').select('*', { count: 'exact' }),
        supabase.from('trainings').select('*', { count: 'exact' }),
        supabase.from('document_acknowledgments').select('*').eq('quiz_correct', true),
        supabase.from('training_participations').select('*').eq('completed', true),
      ]);

      return {
        totalEmployees: employees.count || 0,
        totalDocuments: documents.count || 0,
        totalTrainings: trainings.count || 0,
        acknowledgedDocs: acknowledgments.data?.length || 0,
        completedTrainings: participations.data?.length || 0,
      };
    },
  });

  const documentComplianceRate = stats
    ? Math.round((stats.acknowledgedDocs / (stats.totalEmployees * stats.totalDocuments || 1)) * 100)
    : 0;

  const trainingComplianceRate = stats
    ? Math.round((stats.completedTrainings / (stats.totalEmployees * stats.totalTrainings || 1)) * 100)
    : 0;

  return (
    <div className="space-y-6 pt-6">
      <div>
        <h1 className="text-4xl font-bold text-foreground uppercase">RELATÓRIOS DE COMPLIANCE</h1>
        <p className="text-muted-foreground mt-1">Análise detalhada de indicadores de conformidade</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-primary" />
              Taxa de Conformidade - Documentos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-5xl font-bold text-primary">{documentComplianceRate}%</p>
              <p className="text-sm text-muted-foreground mt-2">Documentos aceitos com sucesso</p>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Total de Colaboradores</span>
                  <span className="font-medium">{stats?.totalEmployees || 0}</span>
                </div>
                <Progress value={100} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Documentos Disponíveis</span>
                  <span className="font-medium">{stats?.totalDocuments || 0}</span>
                </div>
                <Progress value={100} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Aceites Completos</span>
                  <span className="font-medium">{stats?.acknowledgedDocs || 0}</span>
                </div>
                <Progress value={documentComplianceRate} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-secondary" />
              Taxa de Conclusão - Treinamentos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-5xl font-bold text-secondary">{trainingComplianceRate}%</p>
              <p className="text-sm text-muted-foreground mt-2">Treinamentos concluídos</p>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Total de Colaboradores</span>
                  <span className="font-medium">{stats?.totalEmployees || 0}</span>
                </div>
                <Progress value={100} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Treinamentos Disponíveis</span>
                  <span className="font-medium">{stats?.totalTrainings || 0}</span>
                </div>
                <Progress value={100} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Conclusões Registradas</span>
                  <span className="font-medium">{stats?.completedTrainings || 0}</span>
                </div>
                <Progress value={trainingComplianceRate} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-accent" />
            Indicadores Chave de Compliance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 rounded-lg bg-primary/5">
              <p className="text-3xl font-bold text-primary">
                {stats ? Math.round((stats.acknowledgedDocs / (stats.totalEmployees || 1)) * 100) : 0}%
              </p>
              <p className="text-sm text-muted-foreground mt-2">Média de Aceite por Colaborador</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-secondary/5">
              <p className="text-3xl font-bold text-secondary">
                {stats ? Math.round((stats.completedTrainings / (stats.totalEmployees || 1)) * 100) : 0}%
              </p>
              <p className="text-sm text-muted-foreground mt-2">Média de Treinamento por Colaborador</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-accent/5">
              <p className="text-3xl font-bold text-accent">
                {Math.round((documentComplianceRate + trainingComplianceRate) / 2)}%
              </p>
              <p className="text-sm text-muted-foreground mt-2">Taxa Geral de Compliance</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
