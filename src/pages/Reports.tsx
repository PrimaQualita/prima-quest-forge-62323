import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, PieChart, TrendingUp, Users } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { ComplianceCharts } from "@/components/dashboard/ComplianceCharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const Reports = () => {
  const { data: stats } = useQuery({
    queryKey: ['compliance-stats'],
    queryFn: async () => {
      const [employees, documents, trainings, acknowledgments, participations] = await Promise.all([
        supabase.from('employees').select('*', { count: 'exact' }),
        supabase.from('compliance_documents').select('*', { count: 'exact' }),
        supabase.from('trainings').select('*', { count: 'exact' }),
        supabase.from('document_acknowledgments').select('*').eq('quiz_correct', true).not('employee_id', 'is', null),
        supabase.from('training_participations').select('*').eq('completed', true).not('employee_id', 'is', null),
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

  const { data: documentAcceptance } = useQuery({
    queryKey: ['document-acceptance'],
    queryFn: async () => {
      const { data: documents } = await supabase
        .from('compliance_documents')
        .select('id, title, category');
      
      let allEmployees: any[] = [];
      let from = 0;
      const batchSize = 1000;
      
      while (true) {
        const { data: batch } = await supabase
          .from('employees')
          .select('id')
          .range(from, from + batchSize - 1);
        
        if (!batch || batch.length === 0) break;
        allEmployees = [...allEmployees, ...batch];
        if (batch.length < batchSize) break;
        from += batchSize;
      }
      
      const totalEmployees = allEmployees.length;
      
      const docsWithAcceptance = await Promise.all(
        (documents || []).map(async (doc) => {
          const { count } = await supabase
            .from('document_acknowledgments')
            .select('*', { count: 'exact', head: true })
            .eq('document_id', doc.id)
            .eq('quiz_correct', true);
          
          const accepted = count || 0;
          const pending = totalEmployees - accepted;
          const percentage = totalEmployees > 0 
            ? Math.round((accepted / totalEmployees) * 10000) / 100
            : 0;
          
          return { ...doc, accepted, pending, percentage };
        })
      );
      
      return docsWithAcceptance;
    },
  });

  const { data: trainingCompletion } = useQuery({
    queryKey: ['training-completion'],
    queryFn: async () => {
      const { data: trainings } = await supabase
        .from('trainings')
        .select('id, title, category');
      
      let allEmployees: any[] = [];
      let from = 0;
      const batchSize = 1000;
      
      while (true) {
        const { data: batch } = await supabase
          .from('employees')
          .select('id')
          .range(from, from + batchSize - 1);
        
        if (!batch || batch.length === 0) break;
        allEmployees = [...allEmployees, ...batch];
        if (batch.length < batchSize) break;
        from += batchSize;
      }
      
      const totalEmployees = allEmployees.length;
      
      const trainingsWithCompletion = await Promise.all(
        (trainings || []).map(async (training) => {
          const { count } = await supabase
            .from('training_participations')
            .select('*', { count: 'exact', head: true })
            .eq('training_id', training.id)
            .eq('completed', true);
          
          const completed = count || 0;
          const pending = totalEmployees - completed;
          const percentage = totalEmployees > 0 
            ? Math.round((completed / totalEmployees) * 10000) / 100
            : 0;
          
          return { ...training, completed, pending, percentage };
        })
      );
      
      return trainingsWithCompletion;
    },
  });

  const documentComplianceRate = stats
    ? ((stats.acknowledgedDocs / (stats.totalEmployees * stats.totalDocuments || 1)) * 100).toFixed(2)
    : "0,00";

  const trainingComplianceRate = stats
    ? ((stats.completedTrainings / (stats.totalEmployees * stats.totalTrainings || 1)) * 100).toFixed(2)
    : "0,00";

  const avgDocPerEmployee = stats && stats.totalDocuments > 0
    ? ((stats.acknowledgedDocs / (stats.totalEmployees * stats.totalDocuments || 1)) * 100).toFixed(2)
    : "0,00";

  const avgTrainingPerEmployee = stats && stats.totalTrainings > 0
    ? ((stats.completedTrainings / (stats.totalEmployees * stats.totalTrainings || 1)) * 100).toFixed(2)
    : "0,00";

  const overallCompliance = ((parseFloat(String(documentComplianceRate).replace(',', '.')) + parseFloat(String(trainingComplianceRate).replace(',', '.'))) / 2).toFixed(2);

  const { data: employeesCompliance } = useQuery({
    queryKey: ['employees-compliance'],
    queryFn: async () => {
      const { data: employees } = await supabase
        .from('employees')
        .select('id, name')
        .order('name');

      if (!employees) return [];

      const employeesWithCompliance = await Promise.all(
        employees.map(async (employee) => {
          const [docsAccepted, docsPending, trainingsCompleted, trainingsPending] = await Promise.all([
            supabase
              .from('document_acknowledgments')
              .select('*', { count: 'exact', head: true })
              .eq('employee_id', employee.id)
              .eq('quiz_correct', true),
            supabase
              .from('compliance_documents')
              .select('id')
              .then(async (docs) => {
                const { count: acceptedCount } = await supabase
                  .from('document_acknowledgments')
                  .select('*', { count: 'exact', head: true })
                  .eq('employee_id', employee.id)
                  .eq('quiz_correct', true);
                return (docs.data?.length || 0) - (acceptedCount || 0);
              }),
            supabase
              .from('training_participations')
              .select('*', { count: 'exact', head: true })
              .eq('employee_id', employee.id)
              .eq('completed', true),
            supabase
              .from('trainings')
              .select('id')
              .then(async (trainings) => {
                const { count: completedCount } = await supabase
                  .from('training_participations')
                  .select('*', { count: 'exact', head: true })
                  .eq('employee_id', employee.id)
                  .eq('completed', true);
                return (trainings.data?.length || 0) - (completedCount || 0);
              }),
          ]);

          return {
            ...employee,
            docsAccepted: docsAccepted.count || 0,
            docsPending: docsPending,
            trainingsCompleted: trainingsCompleted.count || 0,
            trainingsPending: trainingsPending,
          };
        })
      );

      return employeesWithCompliance;
    },
  });

  return (
    <div className="space-y-6 pt-6">
      <div>
        <h1 className="text-4xl font-bold text-foreground uppercase">RELATÓRIOS DE COMPLIANCE</h1>
        <p className="text-muted-foreground mt-1">Análise detalhada de indicadores de conformidade</p>
      </div>

      <ComplianceCharts 
        documentAcceptance={documentAcceptance}
        trainingCompletion={trainingCompletion}
        totalEmployees={stats?.totalEmployees || 0}
      />

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
              <p className="text-5xl font-bold text-primary">{String(documentComplianceRate).replace('.', ',')}%</p>
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
                <Progress value={parseFloat(String(documentComplianceRate))} className="h-2" />
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
              <p className="text-5xl font-bold text-secondary">{String(trainingComplianceRate).replace('.', ',')}%</p>
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
                <Progress value={parseFloat(String(trainingComplianceRate))} className="h-2" />
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
                {String(avgDocPerEmployee).replace('.', ',')}%
              </p>
              <p className="text-sm text-muted-foreground mt-2">Média de Aceite por Colaborador</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-secondary/5">
              <p className="text-3xl font-bold text-secondary">
                {String(avgTrainingPerEmployee).replace('.', ',')}%
              </p>
              <p className="text-sm text-muted-foreground mt-2">Média de Treinamento por Colaborador</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-accent/5">
              <p className="text-3xl font-bold text-accent">
                {String(overallCompliance).replace('.', ',')}%
              </p>
              <p className="text-sm text-muted-foreground mt-2">Taxa Geral de Compliance</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Status por Colaborador
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Colaborador</TableHead>
                  <TableHead className="text-center">Regulamentos Aceitos</TableHead>
                  <TableHead className="text-center">Regulamentos Pendentes</TableHead>
                  <TableHead className="text-center">Treinamentos Concluídos</TableHead>
                  <TableHead className="text-center">Treinamentos Pendentes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employeesCompliance?.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium">{employee.name}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        {employee.docsAccepted}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                        {employee.docsPending}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        {employee.trainingsCompleted}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                        {employee.trainingsPending}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
