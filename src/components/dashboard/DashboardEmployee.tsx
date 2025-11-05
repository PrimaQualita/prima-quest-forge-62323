import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StatCard } from "@/components/StatCard";
import { FileCheck, GraduationCap, CheckCircle, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import DOMPurify from "dompurify";

interface DashboardEmployeeProps {
  employeeId: string;
}

const DashboardEmployee = ({ employeeId }: DashboardEmployeeProps) => {
  const navigate = useNavigate();

  const { data: stats } = useQuery({
    queryKey: ['employee-stats', employeeId],
    queryFn: async () => {
      const [allDocs, allTrainings, acceptedDocs, completedTrainings] = await Promise.all([
        supabase.from('compliance_documents').select('*', { count: 'exact', head: true }),
        supabase.from('trainings').select('*', { count: 'exact', head: true }),
        supabase
          .from('document_acknowledgments')
          .select('*', { count: 'exact', head: true })
          .eq('employee_id', employeeId)
          .eq('quiz_correct', true),
        supabase
          .from('training_participations')
          .select('*', { count: 'exact', head: true })
          .eq('employee_id', employeeId)
          .eq('completed', true)
      ]);

      const totalDocs = allDocs.count || 0;
      const totalTrainings = allTrainings.count || 0;
      const accepted = acceptedDocs.count || 0;
      const completed = completedTrainings.count || 0;

      return {
        totalDocs,
        totalTrainings,
        acceptedDocs: accepted,
        completedTrainings: completed,
        pendingDocs: totalDocs - accepted,
        pendingTrainings: totalTrainings - completed,
        complianceRate: totalDocs + totalTrainings > 0 
          ? Math.round(((accepted + completed) / (totalDocs + totalTrainings)) * 100)
          : 0
      };
    },
  });

  const { data: pendingDocuments } = useQuery({
    queryKey: ['pending-documents', employeeId],
    queryFn: async () => {
      const { data: allDocs } = await supabase
        .from('compliance_documents')
        .select('*');
      
      const { data: acceptedDocs } = await supabase
        .from('document_acknowledgments')
        .select('document_id')
        .eq('employee_id', employeeId)
        .eq('quiz_correct', true);
      
      const acceptedIds = acceptedDocs?.map(d => d.document_id) || [];
      return allDocs?.filter(doc => !acceptedIds.includes(doc.id)) || [];
    },
  });

  const { data: pendingTrainings } = useQuery({
    queryKey: ['pending-trainings', employeeId],
    queryFn: async () => {
      const { data: allTrainings } = await supabase
        .from('trainings')
        .select('*');
      
      const { data: completedTrainings } = await supabase
        .from('training_participations')
        .select('training_id')
        .eq('employee_id', employeeId)
        .eq('completed', true);
      
      const completedIds = completedTrainings?.map(t => t.training_id) || [];
      return allTrainings?.filter(training => !completedIds.includes(training.id)) || [];
    },
  });

  const totalPending = (stats?.pendingDocs || 0) + (stats?.pendingTrainings || 0);

  return (
    <div className="space-y-6 md:space-y-8">
      <div>
        <h1 className="text-2xl md:text-4xl font-bold text-foreground mb-2 uppercase">DASHBOARD</h1>
        <p className="text-sm md:text-base text-muted-foreground">Acompanhe suas pendências e progresso</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard
          title="Documentos Pendentes"
          value={stats?.pendingDocs || 0}
          icon={FileCheck}
          trend={`${stats?.acceptedDocs || 0} de ${stats?.totalDocs || 0} aceitos`}
          variant="secondary"
        />
        <StatCard
          title="Treinamentos Pendentes"
          value={stats?.pendingTrainings || 0}
          icon={GraduationCap}
          trend={`${stats?.completedTrainings || 0} de ${stats?.totalTrainings || 0} concluídos`}
          variant="accent"
        />
        <StatCard
          title="Total de Pendências"
          value={totalPending}
          icon={AlertTriangle}
          trend={totalPending === 0 ? "Você está em dia!" : "Itens a resolver"}
          variant={totalPending === 0 ? "primary" : "secondary"}
        />
        <StatCard
          title="Taxa de Conformidade"
          value={`${stats?.complianceRate || 0}%`}
          icon={CheckCircle}
          trend="Seu progresso"
          variant="primary"
        />
      </div>

      {totalPending > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Atenção: Você tem {totalPending} pendência(s)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Complete os documentos e treinamentos pendentes para manter sua conformidade em dia.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-col md:flex-row md:items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-base md:text-lg">
                <FileCheck className="w-4 h-4 md:w-5 md:h-5" />
                Documentos Pendentes
              </span>
              <Badge variant={pendingDocuments && pendingDocuments.length > 0 ? "destructive" : "default"}>
                {pendingDocuments?.length || 0}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingDocuments && pendingDocuments.length > 0 ? (
              <>
                {pendingDocuments.map((doc) => (
                  <div key={doc.id} className="p-3 md:p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2 mb-2">
                      <h4 className="font-medium text-sm md:text-base">{doc.title}</h4>
                      <Badge variant="outline" className="self-start">{doc.category}</Badge>
                    </div>
                    <div 
                      className="text-xs md:text-sm text-muted-foreground mb-3 prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(doc.description || "") }}
                    />
                    <Button 
                      size="sm" 
                      onClick={() => navigate('/documents')}
                      className="w-full text-xs md:text-sm"
                    >
                      Ler e Aceitar
                    </Button>
                  </div>
                ))}
              </>
            ) : (
              <div className="text-center py-6 md:py-8 text-muted-foreground">
                <CheckCircle className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-2 text-green-600" />
                <p className="text-sm">Todos os documentos foram aceitos!</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex flex-col md:flex-row md:items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-base md:text-lg">
                <GraduationCap className="w-4 h-4 md:w-5 md:h-5" />
                Treinamentos Pendentes
              </span>
              <Badge variant={pendingTrainings && pendingTrainings.length > 0 ? "destructive" : "default"}>
                {pendingTrainings?.length || 0}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingTrainings && pendingTrainings.length > 0 ? (
              <>
                {pendingTrainings.map((training) => (
                  <div key={training.id} className="p-3 md:p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2 mb-2">
                      <h4 className="font-medium text-sm md:text-base">{training.title}</h4>
                      <Badge variant="outline" className="self-start">{training.category}</Badge>
                    </div>
                    <p className="text-xs md:text-sm text-muted-foreground mb-3">{training.description}</p>
                    <Button 
                      size="sm" 
                      onClick={() => navigate('/trainings')}
                      className="w-full text-xs md:text-sm"
                    >
                      Iniciar Treinamento
                    </Button>
                  </div>
                ))}
              </>
            ) : (
              <div className="text-center py-6 md:py-8 text-muted-foreground">
                <CheckCircle className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-2 text-green-600" />
                <p className="text-sm">Todos os treinamentos foram concluídos!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardEmployee;
