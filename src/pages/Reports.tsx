import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, PieChart, TrendingUp, Users, Download, FileText, GraduationCap, UserX } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { ComplianceCharts } from "@/components/dashboard/ComplianceCharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { generateReportPDF } from "@/utils/generateReportPDF";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const Reports = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [inactiveCurrentPage, setInactiveCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [inactiveItemsPerPage, setInactiveItemsPerPage] = useState(10);
  const [employeeTab, setEmployeeTab] = useState("active");
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportFilter, setExportFilter] = useState<"all" | "active" | "inactive">("all");
  const { user } = useAuth();
  const [userName, setUserName] = useState("Usuário");

  // Fetch user name
  useEffect(() => {
    const fetchUserName = async () => {
      if (!user?.id) return;
      
      // Try to get from employees first
      const { data: employeeData } = await supabase
        .from('employees')
        .select('name')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (employeeData?.name) {
        setUserName(employeeData.name);
        return;
      }
      
      // Try profiles
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle();
      
      if (profileData?.full_name) {
        setUserName(profileData.full_name);
      }
    };
    
    fetchUserName();
  }, [user?.id]);

  const { data: stats } = useQuery({
    queryKey: ['compliance-stats-active'],
    queryFn: async () => {
      // Buscar IDs de colaboradores ativos
      let activeEmployeeIds: string[] = [];
      let from = 0;
      const pageSize = 1000;
      
      while (true) {
        const { data: batch } = await supabase
          .from('employees')
          .select('id')
          .eq('is_active', true)
          .range(from, from + pageSize - 1);
        
        if (!batch || batch.length === 0) break;
        activeEmployeeIds = [...activeEmployeeIds, ...batch.map(e => e.id)];
        if (batch.length < pageSize) break;
        from += pageSize;
      }

      const activeEmployeeIdsSet = new Set(activeEmployeeIds);

      const [documents, trainings, acknowledgments, participations, assessments] = await Promise.all([
        supabase.from('compliance_documents').select('*', { count: 'exact' }),
        supabase.from('trainings').select('*', { count: 'exact' }),
        supabase.from('document_acknowledgments').select('employee_id').eq('quiz_correct', true).not('employee_id', 'is', null),
        supabase.from('training_participations').select('employee_id, training_id').eq('completed', true).not('employee_id', 'is', null),
        supabase.from('training_assessments').select('employee_id, training_id').eq('passed', true).not('employee_id', 'is', null),
      ]);

      // Filtrar apenas aceites de colaboradores ativos
      const activeAcknowledgments = acknowledgments.data?.filter(a => activeEmployeeIdsSet.has(a.employee_id)) || [];

      // Combinar e deduplificar completions de treinamento APENAS de ativos
      const completedTrainingsSet = new Set<string>();
      participations.data?.forEach(p => {
        if (activeEmployeeIdsSet.has(p.employee_id)) {
          completedTrainingsSet.add(`${p.employee_id}-${p.training_id}`);
        }
      });
      assessments.data?.forEach(a => {
        if (activeEmployeeIdsSet.has(a.employee_id)) {
          completedTrainingsSet.add(`${a.employee_id}-${a.training_id}`);
        }
      });

      return {
        totalEmployees: activeEmployeeIds.length,
        totalDocuments: documents.count || 0,
        totalTrainings: trainings.count || 0,
        acknowledgedDocs: activeAcknowledgments.length,
        completedTrainings: completedTrainingsSet.size,
      };
    },
  });

  const { data: documentAcceptance } = useQuery({
    queryKey: ['document-acceptance-active'],
    queryFn: async () => {
      // Buscar IDs de colaboradores ativos
      let activeEmployeeIds: string[] = [];
      let from = 0;
      const pageSize = 1000;
      
      while (true) {
        const { data: batch } = await supabase
          .from('employees')
          .select('id')
          .eq('is_active', true)
          .range(from, from + pageSize - 1);
        
        if (!batch || batch.length === 0) break;
        activeEmployeeIds = [...activeEmployeeIds, ...batch.map(e => e.id)];
        if (batch.length < pageSize) break;
        from += pageSize;
      }

      const totalEmployees = activeEmployeeIds.length;
      const activeEmployeeIdsSet = new Set(activeEmployeeIds);

      const { data: documents } = await supabase.from('compliance_documents').select('id, title, category');
      
      if (!documents || totalEmployees === 0) return [];
      
      const docsWithAcceptance = await Promise.all(
        documents.map(async (doc) => {
          const { data: acks } = await supabase
            .from('document_acknowledgments')
            .select('employee_id')
            .eq('document_id', doc.id)
            .eq('quiz_correct', true)
            .not('employee_id', 'is', null);
          
          // Contar apenas aceites de colaboradores ativos
          const activeAcks = acks?.filter(a => activeEmployeeIdsSet.has(a.employee_id)) || [];
          const accepted = activeAcks.length;
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
    queryKey: ['training-completion-active'],
    queryFn: async () => {
      // Buscar IDs de colaboradores ativos
      let activeEmployeeIds: string[] = [];
      let from = 0;
      const pageSize = 1000;
      
      while (true) {
        const { data: batch } = await supabase
          .from('employees')
          .select('id')
          .eq('is_active', true)
          .range(from, from + pageSize - 1);
        
        if (!batch || batch.length === 0) break;
        activeEmployeeIds = [...activeEmployeeIds, ...batch.map(e => e.id)];
        if (batch.length < pageSize) break;
        from += pageSize;
      }

      const totalEmployees = activeEmployeeIds.length;
      const activeEmployeeIdsSet = new Set(activeEmployeeIds);

      const { data: trainings } = await supabase.from('trainings').select('id, title, category');
      
      if (!trainings || totalEmployees === 0) return [];
      
      const trainingsWithCompletion = await Promise.all(
        trainings.map(async (training) => {
          // Get completions from both sources
          const [{ data: participations }, { data: assessments }] = await Promise.all([
            supabase
              .from('training_participations')
              .select('employee_id')
              .eq('training_id', training.id)
              .eq('completed', true)
              .not('employee_id', 'is', null),
            supabase
              .from('training_assessments')
              .select('employee_id')
              .eq('training_id', training.id)
              .eq('passed', true)
              .not('employee_id', 'is', null)
          ]);
          
          // Combine and deduplicate employee IDs - APENAS ATIVOS
          const completedEmployees = new Set([
            ...(participations?.filter(p => activeEmployeeIdsSet.has(p.employee_id)).map(p => p.employee_id) || []),
            ...(assessments?.filter(a => activeEmployeeIdsSet.has(a.employee_id)).map(a => a.employee_id) || [])
          ]);
          
          const completed = completedEmployees.size;
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
    queryKey: ['employees-compliance-active'],
    queryFn: async () => {
      // Buscar todos os colaboradores ATIVOS com paginação
      let allEmployees: any[] = [];
      let from = 0;
      const pageSize = 1000;
      
      while (true) {
        const { data: batch } = await supabase
          .from('employees')
          .select('id, name')
          .eq('is_active', true)
          .order('name')
          .range(from, from + pageSize - 1);
        
        if (!batch || batch.length === 0) break;
        allEmployees = [...allEmployees, ...batch];
        if (batch.length < pageSize) break;
        from += pageSize;
      }

      // Buscar todos os outros dados de uma vez
      const [
        { data: documents },
        { data: trainings },
        { data: allAcknowledgments },
        { data: allParticipations },
        { data: allAssessments }
      ] = await Promise.all([
        supabase.from('compliance_documents').select('id'),
        supabase.from('trainings').select('id'),
        supabase.from('document_acknowledgments').select('employee_id, document_id').eq('quiz_correct', true).not('employee_id', 'is', null),
        supabase.from('training_participations').select('employee_id, training_id').eq('completed', true).not('employee_id', 'is', null),
        supabase.from('training_assessments').select('employee_id, training_id').eq('passed', true).not('employee_id', 'is', null)
      ]);

      if (!allEmployees || allEmployees.length === 0) return [];

      const totalDocuments = documents?.length || 0;
      const totalTrainings = trainings?.length || 0;

      // Processar dados em memória para cada employee
      const employeesWithCompliance = allEmployees.map((employee) => {
        // Contar documentos aceitos por este employee
        const docsAccepted = allAcknowledgments?.filter(
          ack => ack.employee_id === employee.id
        ).length || 0;
        
        const docsPending = totalDocuments - docsAccepted;

        // Combinar e deduplificar trainings completados por este employee
        const completedTrainingsSet = new Set<string>();
        
        allParticipations?.forEach(p => {
          if (p.employee_id === employee.id) {
            completedTrainingsSet.add(p.training_id);
          }
        });
        
        allAssessments?.forEach(a => {
          if (a.employee_id === employee.id) {
            completedTrainingsSet.add(a.training_id);
          }
        });

        const trainingsCompleted = completedTrainingsSet.size;
        const trainingsPending = totalTrainings - trainingsCompleted;

        return {
          ...employee,
          docsAccepted,
          docsPending,
          trainingsCompleted,
          trainingsPending,
        };
      });

      return employeesWithCompliance;
    },
  });

  // Query para colaboradores INATIVOS
  const { data: inactiveEmployeesCompliance } = useQuery({
    queryKey: ['inactive-employees-compliance'],
    queryFn: async () => {
      // Buscar todos os colaboradores inativos com paginação
      let allEmployees: any[] = [];
      let from = 0;
      const pageSize = 1000;
      
      while (true) {
        const { data: batch } = await supabase
          .from('employees')
          .select('id, name')
          .eq('is_active', false)
          .order('name')
          .range(from, from + pageSize - 1);
        
        if (!batch || batch.length === 0) break;
        allEmployees = [...allEmployees, ...batch];
        if (batch.length < pageSize) break;
        from += pageSize;
      }

      // Buscar todos os outros dados de uma vez
      const [
        { data: documents },
        { data: trainings },
        { data: allAcknowledgments },
        { data: allParticipations },
        { data: allAssessments }
      ] = await Promise.all([
        supabase.from('compliance_documents').select('id'),
        supabase.from('trainings').select('id'),
        supabase.from('document_acknowledgments').select('employee_id, document_id').eq('quiz_correct', true).not('employee_id', 'is', null),
        supabase.from('training_participations').select('employee_id, training_id').eq('completed', true).not('employee_id', 'is', null),
        supabase.from('training_assessments').select('employee_id, training_id').eq('passed', true).not('employee_id', 'is', null)
      ]);

      if (!allEmployees || allEmployees.length === 0) return [];

      const totalDocuments = documents?.length || 0;
      const totalTrainings = trainings?.length || 0;

      // Processar dados em memória para cada employee
      const employeesWithCompliance = allEmployees.map((employee) => {
        // Contar documentos aceitos por este employee
        const docsAccepted = allAcknowledgments?.filter(
          ack => ack.employee_id === employee.id
        ).length || 0;
        
        const docsPending = totalDocuments - docsAccepted;

        // Combinar e deduplificar trainings completados por este employee
        const completedTrainingsSet = new Set<string>();
        
        allParticipations?.forEach(p => {
          if (p.employee_id === employee.id) {
            completedTrainingsSet.add(p.training_id);
          }
        });
        
        allAssessments?.forEach(a => {
          if (a.employee_id === employee.id) {
            completedTrainingsSet.add(a.training_id);
          }
        });

        const trainingsCompleted = completedTrainingsSet.size;
        const trainingsPending = totalTrainings - trainingsCompleted;

        return {
          ...employee,
          docsAccepted,
          docsPending,
          trainingsCompleted,
          trainingsPending,
        };
      });

      return employeesWithCompliance;
    },
  });

  // Calcular paginação ATIVOS
  const totalEmployees = employeesCompliance?.length || 0;
  const totalPages = Math.ceil(totalEmployees / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedEmployees = employeesCompliance?.slice(startIndex, endIndex) || [];

  // Calcular paginação INATIVOS
  const totalInactiveEmployees = inactiveEmployeesCompliance?.length || 0;
  const totalInactivePages = Math.ceil(totalInactiveEmployees / inactiveItemsPerPage);
  const inactiveStartIndex = (inactiveCurrentPage - 1) * inactiveItemsPerPage;
  const inactiveEndIndex = inactiveStartIndex + inactiveItemsPerPage;
  const paginatedInactiveEmployees = inactiveEmployeesCompliance?.slice(inactiveStartIndex, inactiveEndIndex) || [];

  // Reset para página 1 quando mudar items per page
  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };

  const handleInactiveItemsPerPageChange = (value: string) => {
    setInactiveItemsPerPage(Number(value));
    setInactiveCurrentPage(1);
  };

  const handleExportPDF = async () => {
    let dataToExport: typeof employeesCompliance = [];
    let statsToExport = stats;
    
    if (exportFilter === "all") {
      // Combinar ativos e inativos
      dataToExport = [...(employeesCompliance || []), ...(inactiveEmployeesCompliance || [])];
      // Recalcular stats para todos
      if (stats && inactiveEmployeesCompliance) {
        const inactiveStats = {
          totalEmployees: (stats.totalEmployees || 0) + (inactiveEmployeesCompliance.length || 0),
          totalDocuments: stats.totalDocuments,
          totalTrainings: stats.totalTrainings,
          acknowledgedDocs: (stats.acknowledgedDocs || 0) + inactiveEmployeesCompliance.reduce((sum, e) => sum + e.docsAccepted, 0),
          completedTrainings: (stats.completedTrainings || 0) + inactiveEmployeesCompliance.reduce((sum, e) => sum + e.trainingsCompleted, 0),
        };
        statsToExport = inactiveStats;
      }
    } else if (exportFilter === "active") {
      dataToExport = employeesCompliance || [];
      statsToExport = stats;
    } else if (exportFilter === "inactive") {
      dataToExport = inactiveEmployeesCompliance || [];
      if (inactiveEmployeesCompliance && stats) {
        statsToExport = {
          totalEmployees: inactiveEmployeesCompliance.length,
          totalDocuments: stats.totalDocuments,
          totalTrainings: stats.totalTrainings,
          acknowledgedDocs: inactiveEmployeesCompliance.reduce((sum, e) => sum + e.docsAccepted, 0),
          completedTrainings: inactiveEmployeesCompliance.reduce((sum, e) => sum + e.trainingsCompleted, 0),
        };
      }
    }
    
    if (!dataToExport || dataToExport.length === 0 || !statsToExport) {
      toast.error("Aguarde o carregamento dos dados");
      return;
    }
    
    setExportDialogOpen(false);
    toast.loading("Gerando PDF...", { id: "pdf-loading" });
    try {
      const protocol = await generateReportPDF(dataToExport, statsToExport, {
        userName,
        baseUrl: window.location.origin
      });
      toast.success(`PDF gerado! Protocolo: ${protocol}`, { id: "pdf-loading" });
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Erro ao gerar PDF", { id: "pdf-loading" });
    }
  };

  // Calcular colaboradores 100% compliant
  const fullyCompliantEmployees = employeesCompliance?.filter(
    e => e.docsPending === 0 && e.trainingsPending === 0
  ).length || 0;

  const docFullyCompliantEmployees = employeesCompliance?.filter(
    e => e.docsPending === 0
  ).length || 0;

  const trainingFullyCompliantEmployees = employeesCompliance?.filter(
    e => e.trainingsPending === 0
  ).length || 0;

  return (
    <div className="space-y-6 pt-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-foreground uppercase">RELATÓRIOS DE COMPLIANCE</h1>
          <p className="text-muted-foreground mt-1">Análise detalhada de indicadores de conformidade</p>
        </div>
        <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Download className="h-4 w-4" />
              Exportar PDF
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Exportar Relatório PDF</DialogTitle>
              <DialogDescription>
                Selecione quais colaboradores deseja incluir no relatório
              </DialogDescription>
            </DialogHeader>
            <RadioGroup value={exportFilter} onValueChange={(v) => setExportFilter(v as "all" | "active" | "inactive")} className="space-y-3 py-4">
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="all" id="all" />
                <Label htmlFor="all" className="cursor-pointer">
                  Todos os colaboradores ({totalEmployees + totalInactiveEmployees})
                </Label>
              </div>
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="active" id="active" />
                <Label htmlFor="active" className="cursor-pointer">
                  Apenas colaboradores ativos ({totalEmployees})
                </Label>
              </div>
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="inactive" id="inactive" />
                <Label htmlFor="inactive" className="cursor-pointer">
                  Apenas colaboradores inativos ({totalInactiveEmployees})
                </Label>
              </div>
            </RadioGroup>
            <DialogFooter>
              <Button variant="outline" onClick={() => setExportDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleExportPDF} className="gap-2">
                <Download className="h-4 w-4" />
                Gerar PDF
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
              <FileText className="w-5 h-5 text-primary" />
              Regulamentos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-950/30">
                <p className="text-3xl font-bold text-green-600">{docFullyCompliantEmployees}</p>
                <p className="text-sm text-muted-foreground mt-1">Colaboradores com TODOS os regulamentos aceitos</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-orange-50 dark:bg-orange-950/30">
                <p className="text-3xl font-bold text-orange-600">{(stats?.totalEmployees || 0) - docFullyCompliantEmployees}</p>
                <p className="text-sm text-muted-foreground mt-1">Colaboradores com regulamentos pendentes</p>
              </div>
            </div>
            <div className="space-y-3 pt-2 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total de Colaboradores</span>
                <span className="font-semibold">{stats?.totalEmployees || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Regulamentos Disponíveis</span>
                <span className="font-semibold">{stats?.totalDocuments || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total de Aceites Registrados</span>
                <span className="font-semibold">{stats?.acknowledgedDocs || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Aceites Necessários (100%)</span>
                <span className="font-semibold">{(stats?.totalEmployees || 0) * (stats?.totalDocuments || 0)}</span>
              </div>
              <div className="pt-2">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Progresso Geral</span>
                  <span className="text-sm font-bold text-primary">{String(documentComplianceRate).replace('.', ',')}%</span>
                </div>
                <Progress value={parseFloat(String(documentComplianceRate))} className="h-3" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-secondary" />
              Treinamentos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-950/30">
                <p className="text-3xl font-bold text-green-600">{trainingFullyCompliantEmployees}</p>
                <p className="text-sm text-muted-foreground mt-1">Colaboradores com TODOS os treinamentos concluídos</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-orange-50 dark:bg-orange-950/30">
                <p className="text-3xl font-bold text-orange-600">{(stats?.totalEmployees || 0) - trainingFullyCompliantEmployees}</p>
                <p className="text-sm text-muted-foreground mt-1">Colaboradores com treinamentos pendentes</p>
              </div>
            </div>
            <div className="space-y-3 pt-2 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total de Colaboradores</span>
                <span className="font-semibold">{stats?.totalEmployees || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Treinamentos Disponíveis</span>
                <span className="font-semibold">{stats?.totalTrainings || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total de Conclusões Registradas</span>
                <span className="font-semibold">{stats?.completedTrainings || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Conclusões Necessárias (100%)</span>
                <span className="font-semibold">{(stats?.totalEmployees || 0) * (stats?.totalTrainings || 0)}</span>
              </div>
              <div className="pt-2">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Progresso Geral</span>
                  <span className="text-sm font-bold text-secondary">{String(trainingComplianceRate).replace('.', ',')}%</span>
                </div>
                <Progress value={parseFloat(String(trainingComplianceRate))} className="h-3" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-accent" />
            Resumo de Compliance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
              <p className="text-4xl font-bold text-green-600">{fullyCompliantEmployees}</p>
              <p className="text-sm text-muted-foreground mt-2">Colaboradores 100% em Dia</p>
              <p className="text-xs text-green-600 mt-1">
                ({stats?.totalEmployees ? ((fullyCompliantEmployees / stats.totalEmployees) * 100).toFixed(1).replace('.', ',') : 0}% do total)
              </p>
            </div>
            <div className="text-center p-4 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-4xl font-bold text-primary">
                {String(documentComplianceRate).replace('.', ',')}%
              </p>
              <p className="text-sm text-muted-foreground mt-2">Aceites de Regulamentos</p>
              <p className="text-xs text-primary mt-1">
                {stats?.acknowledgedDocs || 0} de {(stats?.totalEmployees || 0) * (stats?.totalDocuments || 0)}
              </p>
            </div>
            <div className="text-center p-4 rounded-lg bg-secondary/5 border border-secondary/20">
              <p className="text-4xl font-bold text-secondary">
                {String(trainingComplianceRate).replace('.', ',')}%
              </p>
              <p className="text-sm text-muted-foreground mt-2">Conclusões de Treinamentos</p>
              <p className="text-xs text-secondary mt-1">
                {stats?.completedTrainings || 0} de {(stats?.totalEmployees || 0) * (stats?.totalTrainings || 0)}
              </p>
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
        <CardContent className="space-y-4">
          <Tabs value={employeeTab} onValueChange={setEmployeeTab}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="active" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Ativos ({totalEmployees})
              </TabsTrigger>
              <TabsTrigger value="inactive" className="flex items-center gap-2">
                <UserX className="w-4 h-4" />
                Inativos ({totalInactiveEmployees})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Mostrar</span>
                  <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                      <SelectItem value="500">500</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-muted-foreground">por página</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Mostrando {startIndex + 1} a {Math.min(endIndex, totalEmployees)} de {totalEmployees} colaboradores
                </div>
              </div>

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
                    {paginatedEmployees.map((employee) => (
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

              <div className="flex items-center justify-between pt-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Página {currentPage} de {totalPages}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="inactive" className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Mostrar</span>
                  <Select value={inactiveItemsPerPage.toString()} onValueChange={handleInactiveItemsPerPageChange}>
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                      <SelectItem value="500">500</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-muted-foreground">por página</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Mostrando {inactiveStartIndex + 1} a {Math.min(inactiveEndIndex, totalInactiveEmployees)} de {totalInactiveEmployees} colaboradores
                </div>
              </div>

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
                    {paginatedInactiveEmployees.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          Nenhum colaborador inativo encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedInactiveEmployees.map((employee) => (
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
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {totalInactiveEmployees > 0 && (
                <div className="flex items-center justify-between pt-4">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setInactiveCurrentPage(1)}
                      disabled={inactiveCurrentPage === 1}
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setInactiveCurrentPage(inactiveCurrentPage - 1)}
                      disabled={inactiveCurrentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Página {inactiveCurrentPage} de {totalInactivePages}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setInactiveCurrentPage(inactiveCurrentPage + 1)}
                      disabled={inactiveCurrentPage === totalInactivePages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setInactiveCurrentPage(totalInactivePages)}
                      disabled={inactiveCurrentPage === totalInactivePages}
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
