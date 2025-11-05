import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StatCard } from "@/components/StatCard";
import { Users, FileCheck, GraduationCap, Building2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ComplianceCharts } from "./ComplianceCharts";

const DashboardManager = () => {
  const { data: stats } = useQuery({
    queryKey: ['manager-stats'],
    queryFn: async () => {
      const [employees, documents, trainings, suppliers] = await Promise.all([
        supabase.from('employees').select('*', { count: 'exact', head: true }),
        supabase.from('compliance_documents').select('*', { count: 'exact', head: true }),
        supabase.from('trainings').select('*', { count: 'exact', head: true }),
        supabase.from('supplier_due_diligence').select('*', { count: 'exact', head: true })
      ]);

      return {
        totalEmployees: employees.count || 0,
        totalDocuments: documents.count || 0,
        totalTrainings: trainings.count || 0,
        totalSuppliers: suppliers.count || 0
      };
    },
  });

  const { data: documentAcceptance } = useQuery({
    queryKey: ['document-acceptance'],
    queryFn: async () => {
      const { data: documents } = await supabase
        .from('compliance_documents')
        .select('id, title, category');
      
      // Fetch all employees (bypass 1000 limit)
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
            ? Math.round((accepted / totalEmployees) * 10000) / 100  // Duas casas decimais
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
      
      // Fetch all employees (bypass 1000 limit)
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
            ? Math.round((completed / totalEmployees) * 10000) / 100  // Duas casas decimais
            : 0;
          
          return { ...training, completed, pending, percentage };
        })
      );
      
      return trainingsWithCompletion;
    },
  });

  const { data: employeePendencies } = useQuery({
    queryKey: ['employee-pendencies'],
    queryFn: async () => {
      // Fetch all employees in alphabetical order (bypass 1000 limit)
      let allEmployees: any[] = [];
      let from = 0;
      const batchSize = 1000;
      
      while (true) {
        const { data: batch } = await supabase
          .from('employees')
          .select('id, name, is_manager')
          .order('name', { ascending: true })
          .range(from, from + batchSize - 1);
        
        if (!batch || batch.length === 0) break;
        allEmployees = [...allEmployees, ...batch];
        if (batch.length < batchSize) break;
        from += batchSize;
      }
      
      // Get total counts using count only (faster)
      const { count: totalDocs } = await supabase
        .from('compliance_documents')
        .select('*', { count: 'exact', head: true });
      
      const { count: totalTrainings } = await supabase
        .from('trainings')
        .select('*', { count: 'exact', head: true });
      
      const docsCount = totalDocs || 0;
      const trainingsCount = totalTrainings || 0;
      
      // Fetch all acknowledgments and participations in one go
      const { data: allAcknowledgments } = await supabase
        .from('document_acknowledgments')
        .select('employee_id')
        .eq('quiz_correct', true);
      
      const { data: allParticipations } = await supabase
        .from('training_participations')
        .select('employee_id')
        .eq('completed', true);
      
      // Count by employee
      const docsByEmployee = new Map<string, number>();
      const trainingsByEmployee = new Map<string, number>();
      
      allAcknowledgments?.forEach(ack => {
        docsByEmployee.set(ack.employee_id, (docsByEmployee.get(ack.employee_id) || 0) + 1);
      });
      
      allParticipations?.forEach(part => {
        trainingsByEmployee.set(part.employee_id, (trainingsByEmployee.get(part.employee_id) || 0) + 1);
      });
      
      // Calculate pendencies
      const employeesWithPendencies = allEmployees.map(employee => {
        const acceptedDocs = docsByEmployee.get(employee.id) || 0;
        const completedTrainings = trainingsByEmployee.get(employee.id) || 0;
        const pendingDocs = docsCount - acceptedDocs;
        const pendingTrainings = trainingsCount - completedTrainings;
        
        return {
          ...employee,
          pendingDocs,
          pendingTrainings,
          totalPending: pendingDocs + pendingTrainings
        };
      });
      
      // Sort by total pending (desc), then by name (asc)
      return employeesWithPendencies.sort((a, b) => {
        if (b.totalPending !== a.totalPending) {
          return b.totalPending - a.totalPending;
        }
        return a.name.localeCompare(b.name);
      });
    },
  });

  return (
    <div className="space-y-8 pt-6">
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2 uppercase">DASHBOARD</h1>
        <p className="text-muted-foreground">Controle total de pendências e compliance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Colaboradores"
          value={stats?.totalEmployees || 0}
          icon={Users}
          trend="Total cadastrado"
          variant="primary"
        />
        <StatCard
          title="Documentos"
          value={stats?.totalDocuments || 0}
          icon={FileCheck}
          trend="Políticas ativas"
          variant="secondary"
        />
        <StatCard
          title="Treinamentos"
          value={stats?.totalTrainings || 0}
          icon={GraduationCap}
          trend="Programas disponíveis"
          variant="accent"
        />
        <StatCard
          title="Fornecedores"
          value={stats?.totalSuppliers || 0}
          icon={Building2}
          trend="Cadastros recebidos"
          variant="primary"
        />
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
              <FileCheck className="w-5 h-5" />
              Aceite de Regulamentos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 max-h-96 overflow-y-auto">
            {documentAcceptance?.map((doc) => (
              <div key={doc.id}>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">{doc.title}</span>
                  <span className="text-sm text-muted-foreground">
                    {doc.accepted}/{stats?.totalEmployees || 0} ({doc.percentage}%)
                  </span>
                </div>
                <Progress value={doc.percentage} className="h-2" />
                {doc.pending > 0 && (
                  <p className="text-xs text-destructive mt-1">
                    {doc.pending} colaborador(es) pendente(s)
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5" />
              Conclusão de Treinamentos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 max-h-96 overflow-y-auto">
            {trainingCompletion?.map((training) => (
              <div key={training.id}>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">{training.title}</span>
                  <span className="text-sm text-muted-foreground">
                    {training.completed}/{stats?.totalEmployees || 0} ({training.percentage}%)
                  </span>
                </div>
                <Progress value={training.percentage} className="h-2" />
                {training.pending > 0 && (
                  <p className="text-xs text-destructive mt-1">
                    {training.pending} colaborador(es) pendente(s)
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Pendências por Colaborador
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Função</TableHead>
                <TableHead className="text-center">Documentos Pendentes</TableHead>
                <TableHead className="text-center">Treinamentos Pendentes</TableHead>
                <TableHead className="text-center">Total Pendente</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employeePendencies?.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell className="font-medium">{employee.name}</TableCell>
                  <TableCell>
                    {employee.is_manager ? 'Gestor' : 'Colaborador'}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={employee.pendingDocs > 0 ? "text-destructive font-medium" : ""}>
                      {employee.pendingDocs}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={employee.pendingTrainings > 0 ? "text-destructive font-medium" : ""}>
                      {employee.pendingTrainings}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={employee.totalPending > 0 ? "text-destructive font-bold" : "text-green-600 font-medium"}>
                      {employee.totalPending === 0 ? "✓ Em dia" : employee.totalPending}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardManager;
