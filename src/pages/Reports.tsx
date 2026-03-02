import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Download, FileText, GraduationCap, UserX, ShieldCheck, BarChart3, Activity, Target, TrendingUp, CheckCircle2, AlertTriangle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { generateReportPDF } from "@/utils/generateReportPDF";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { BIKpiCard } from "@/components/reports/BIKpiCard";
import { BIGaugeChart } from "@/components/reports/BIGaugeChart";
import { BIBarChart } from "@/components/reports/BIBarChart";
import { BIComplianceHeatmap } from "@/components/reports/BIComplianceHeatmap";
import { BIDepartmentChart } from "@/components/reports/BIDepartmentChart";

const Reports = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [inactiveCurrentPage, setInactiveCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [inactiveItemsPerPage, setInactiveItemsPerPage] = useState(10);
  const [employeeTab, setEmployeeTab] = useState("active");
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportFilter, setExportFilter] = useState<"all" | "active" | "inactive">("all");
  const [exportContract, setExportContract] = useState<string>("all");
  const [exportDepartment, setExportDepartment] = useState<string>("all");
  const [activeSearch, setActiveSearch] = useState("");
  const [inactiveSearch, setInactiveSearch] = useState("");
  const { user } = useAuth();
  const [userName, setUserName] = useState("Usuário");

  // Fetch user name
  useEffect(() => {
    const fetchUserName = async () => {
      if (!user?.id) return;
      const { data: employeeData } = await supabase
        .from('employees')
        .select('name')
        .eq('user_id', user.id)
        .maybeSingle();
      if (employeeData?.name) { setUserName(employeeData.name); return; }
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle();
      if (profileData?.full_name) setUserName(profileData.full_name);
    };
    fetchUserName();
  }, [user?.id]);

  const { data: stats } = useQuery({
    queryKey: ['compliance-stats-active'],
    queryFn: async () => {
      let activeEmployeeIds: string[] = [];
      let from = 0;
      const pageSize = 1000;
      while (true) {
        const { data: batch } = await supabase.from('employees').select('id').eq('is_active', true).range(from, from + pageSize - 1);
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
      const activeAcknowledgments = acknowledgments.data?.filter(a => activeEmployeeIdsSet.has(a.employee_id)) || [];
      const completedTrainingsSet = new Set<string>();
      participations.data?.forEach(p => { if (activeEmployeeIdsSet.has(p.employee_id)) completedTrainingsSet.add(`${p.employee_id}-${p.training_id}`); });
      assessments.data?.forEach(a => { if (activeEmployeeIdsSet.has(a.employee_id)) completedTrainingsSet.add(`${a.employee_id}-${a.training_id}`); });
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
      let activeEmployeeIds: string[] = [];
      let from = 0;
      const pageSize = 1000;
      while (true) {
        const { data: batch } = await supabase.from('employees').select('id').eq('is_active', true).range(from, from + pageSize - 1);
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
          const { data: acks } = await supabase.from('document_acknowledgments').select('employee_id').eq('document_id', doc.id).eq('quiz_correct', true).not('employee_id', 'is', null);
          const activeAcks = acks?.filter(a => activeEmployeeIdsSet.has(a.employee_id)) || [];
          const accepted = activeAcks.length;
          const pending = totalEmployees - accepted;
          const percentage = totalEmployees > 0 ? Math.round((accepted / totalEmployees) * 10000) / 100 : 0;
          return { ...doc, accepted, pending, percentage, completed: accepted, name: doc.title };
        })
      );
      return docsWithAcceptance;
    },
  });

  const { data: trainingCompletion } = useQuery({
    queryKey: ['training-completion-active'],
    queryFn: async () => {
      let activeEmployeeIds: string[] = [];
      let from = 0;
      const pageSize = 1000;
      while (true) {
        const { data: batch } = await supabase.from('employees').select('id').eq('is_active', true).range(from, from + pageSize - 1);
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
          const [{ data: participations }, { data: assessments }] = await Promise.all([
            supabase.from('training_participations').select('employee_id').eq('training_id', training.id).eq('completed', true).not('employee_id', 'is', null),
            supabase.from('training_assessments').select('employee_id').eq('training_id', training.id).eq('passed', true).not('employee_id', 'is', null)
          ]);
          const completedEmployees = new Set([
            ...(participations?.filter(p => activeEmployeeIdsSet.has(p.employee_id)).map(p => p.employee_id) || []),
            ...(assessments?.filter(a => activeEmployeeIdsSet.has(a.employee_id)).map(a => a.employee_id) || [])
          ]);
          const completed = completedEmployees.size;
          const pending = totalEmployees - completed;
          const percentage = totalEmployees > 0 ? Math.round((completed / totalEmployees) * 10000) / 100 : 0;
          return { ...training, completed, pending, percentage, name: training.title };
        })
      );
      return trainingsWithCompletion;
    },
  });

  const documentComplianceRate = stats
    ? ((stats.acknowledgedDocs / (stats.totalEmployees * stats.totalDocuments || 1)) * 100)
    : 0;

  const trainingComplianceRate = stats
    ? ((stats.completedTrainings / (stats.totalEmployees * stats.totalTrainings || 1)) * 100)
    : 0;

  const overallCompliance = (documentComplianceRate + trainingComplianceRate) / 2;

  // Fetch management contracts for filter
  const { data: managementContracts } = useQuery({
    queryKey: ['management-contracts-list'],
    queryFn: async () => {
      const { data } = await supabase.from('management_contracts').select('id, name').order('name');
      return data || [];
    },
  });

  const { data: employeesCompliance } = useQuery({
    queryKey: ['employees-compliance-active'],
    queryFn: async () => {
      let allEmployees: any[] = [];
      let from = 0;
      const pageSize = 1000;
      while (true) {
        const { data: batch } = await supabase.from('employees').select('id, name, department, management_contract_id').eq('is_active', true).order('name').range(from, from + pageSize - 1);
        if (!batch || batch.length === 0) break;
        allEmployees = [...allEmployees, ...batch];
        if (batch.length < pageSize) break;
        from += pageSize;
      }
      const [{ data: documents }, { data: trainings }, { data: allAcknowledgments }, { data: allParticipations }, { data: allAssessments }] = await Promise.all([
        supabase.from('compliance_documents').select('id'),
        supabase.from('trainings').select('id'),
        supabase.from('document_acknowledgments').select('employee_id, document_id').eq('quiz_correct', true).not('employee_id', 'is', null),
        supabase.from('training_participations').select('employee_id, training_id').eq('completed', true).not('employee_id', 'is', null),
        supabase.from('training_assessments').select('employee_id, training_id').eq('passed', true).not('employee_id', 'is', null)
      ]);
      if (!allEmployees || allEmployees.length === 0) return [];
      const totalDocuments = documents?.length || 0;
      const totalTrainings = trainings?.length || 0;
      return allEmployees.map((employee) => {
        const docsAccepted = allAcknowledgments?.filter(ack => ack.employee_id === employee.id).length || 0;
        const docsPending = totalDocuments - docsAccepted;
        const completedTrainingsSet = new Set<string>();
        allParticipations?.forEach(p => { if (p.employee_id === employee.id) completedTrainingsSet.add(p.training_id); });
        allAssessments?.forEach(a => { if (a.employee_id === employee.id) completedTrainingsSet.add(a.training_id); });
        const trainingsCompleted = completedTrainingsSet.size;
        const trainingsPending = totalTrainings - trainingsCompleted;
        return { ...employee, docsAccepted, docsPending, trainingsCompleted, trainingsPending };
      });
    },
  });

  const { data: inactiveEmployeesCompliance } = useQuery({
    queryKey: ['inactive-employees-compliance'],
    queryFn: async () => {
      let allEmployees: any[] = [];
      let from = 0;
      const pageSize = 1000;
      while (true) {
        const { data: batch } = await supabase.from('employees').select('id, name, department, management_contract_id').eq('is_active', false).order('name').range(from, from + pageSize - 1);
        if (!batch || batch.length === 0) break;
        allEmployees = [...allEmployees, ...batch];
        if (batch.length < pageSize) break;
        from += pageSize;
      }
      const [{ data: documents }, { data: trainings }, { data: allAcknowledgments }, { data: allParticipations }, { data: allAssessments }] = await Promise.all([
        supabase.from('compliance_documents').select('id'),
        supabase.from('trainings').select('id'),
        supabase.from('document_acknowledgments').select('employee_id, document_id').eq('quiz_correct', true).not('employee_id', 'is', null),
        supabase.from('training_participations').select('employee_id, training_id').eq('completed', true).not('employee_id', 'is', null),
        supabase.from('training_assessments').select('employee_id, training_id').eq('passed', true).not('employee_id', 'is', null)
      ]);
      if (!allEmployees || allEmployees.length === 0) return [];
      const totalDocuments = documents?.length || 0;
      const totalTrainings = trainings?.length || 0;
      return allEmployees.map((employee) => {
        const docsAccepted = allAcknowledgments?.filter(ack => ack.employee_id === employee.id).length || 0;
        const docsPending = totalDocuments - docsAccepted;
        const completedTrainingsSet = new Set<string>();
        allParticipations?.forEach(p => { if (p.employee_id === employee.id) completedTrainingsSet.add(p.training_id); });
        allAssessments?.forEach(a => { if (a.employee_id === employee.id) completedTrainingsSet.add(a.training_id); });
        const trainingsCompleted = completedTrainingsSet.size;
        const trainingsPending = totalTrainings - trainingsCompleted;
        return { ...employee, docsAccepted, docsPending, trainingsCompleted, trainingsPending };
      });
    },
  });

  const totalActiveCount = employeesCompliance?.length || 0;
  const totalInactiveCount = inactiveEmployeesCompliance?.length || 0;

  const filteredActiveEmployees = useMemo(() => {
    if (!employeesCompliance) return [];
    if (!activeSearch.trim()) return employeesCompliance;
    const search = activeSearch.toLowerCase().trim();
    return employeesCompliance.filter(e => e.name.toLowerCase().includes(search));
  }, [employeesCompliance, activeSearch]);

  const filteredInactiveEmployees = useMemo(() => {
    if (!inactiveEmployeesCompliance) return [];
    if (!inactiveSearch.trim()) return inactiveEmployeesCompliance;
    const search = inactiveSearch.toLowerCase().trim();
    return inactiveEmployeesCompliance.filter(e => e.name.toLowerCase().includes(search));
  }, [inactiveEmployeesCompliance, inactiveSearch]);

  const totalEmployees = filteredActiveEmployees.length;
  const totalPages = Math.ceil(totalEmployees / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedEmployees = filteredActiveEmployees.slice(startIndex, endIndex);

  const totalInactiveEmployees = filteredInactiveEmployees.length;
  const totalInactivePages = Math.ceil(totalInactiveEmployees / inactiveItemsPerPage);
  const inactiveStartIndex = (inactiveCurrentPage - 1) * inactiveItemsPerPage;
  const inactiveEndIndex = inactiveStartIndex + inactiveItemsPerPage;
  const paginatedInactiveEmployees = filteredInactiveEmployees.slice(inactiveStartIndex, inactiveEndIndex);

  const handleItemsPerPageChange = (value: string) => { setItemsPerPage(Number(value)); setCurrentPage(1); };
  const handleInactiveItemsPerPageChange = (value: string) => { setInactiveItemsPerPage(Number(value)); setInactiveCurrentPage(1); };
  useEffect(() => { setCurrentPage(1); }, [activeSearch]);
  useEffect(() => { setInactiveCurrentPage(1); }, [inactiveSearch]);

  // Fix broken encoding in department names
  const fixEncoding = (text: string) => {
    return text
      .replace(/\uFFFD\uFFFD/g, 'ÇÃ') // common double replacement for ÇÃ
      .replace(/\uFFFD/g, 'Ç'); // single replacement character fallback
  };

  // Get unique departments filtered by selected contract
  const availableDepartments = useMemo(() => {
    const allEmployees = [...(employeesCompliance || []), ...(inactiveEmployeesCompliance || [])];
    const filtered = exportContract !== "all" 
      ? allEmployees.filter(e => e.management_contract_id === exportContract)
      : allEmployees;
    const depts = new Set<string>();
    filtered.forEach(e => { if (e.department) depts.add(e.department); });
    return Array.from(depts).sort((a, b) => fixEncoding(a).localeCompare(fixEncoding(b), 'pt-BR'));
  }, [employeesCompliance, inactiveEmployeesCompliance, exportContract]);

  // Reset department when contract changes and selected dept is no longer available
  useEffect(() => {
    if (exportDepartment !== "all" && !availableDepartments.includes(exportDepartment)) {
      setExportDepartment("all");
    }
  }, [availableDepartments, exportDepartment]);

  const handleExportPDF = async () => {
    let dataToExport: typeof employeesCompliance = [];
    let statsToExport = stats;
    if (exportFilter === "all") {
      dataToExport = [...(employeesCompliance || []), ...(inactiveEmployeesCompliance || [])];
      if (stats && inactiveEmployeesCompliance) {
        statsToExport = {
          totalEmployees: (stats.totalEmployees || 0) + (inactiveEmployeesCompliance.length || 0),
          totalDocuments: stats.totalDocuments, totalTrainings: stats.totalTrainings,
          acknowledgedDocs: (stats.acknowledgedDocs || 0) + inactiveEmployeesCompliance.reduce((sum, e) => sum + e.docsAccepted, 0),
          completedTrainings: (stats.completedTrainings || 0) + inactiveEmployeesCompliance.reduce((sum, e) => sum + e.trainingsCompleted, 0),
        };
      }
    } else if (exportFilter === "active") {
      dataToExport = employeesCompliance || [];
    } else {
      dataToExport = inactiveEmployeesCompliance || [];
      if (inactiveEmployeesCompliance && stats) {
        statsToExport = {
          totalEmployees: inactiveEmployeesCompliance.length, totalDocuments: stats.totalDocuments, totalTrainings: stats.totalTrainings,
          acknowledgedDocs: inactiveEmployeesCompliance.reduce((sum, e) => sum + e.docsAccepted, 0),
          completedTrainings: inactiveEmployeesCompliance.reduce((sum, e) => sum + e.trainingsCompleted, 0),
        };
      }
    }

    // Filter by contract
    const selectedContractName = exportContract !== "all" 
      ? managementContracts?.find(c => c.id === exportContract)?.name || null 
      : null;
    if (exportContract !== "all") {
      dataToExport = (dataToExport || []).filter(e => e.management_contract_id === exportContract);
    }

    // Filter by department
    if (exportDepartment !== "all") {
      dataToExport = (dataToExport || []).filter(e => e.department === exportDepartment);
    }

    // Recalculate stats after filtering
    if (exportContract !== "all" || exportDepartment !== "all") {
      const filteredCount = dataToExport?.length || 0;
      const filteredDocsAccepted = dataToExport?.reduce((sum, e) => sum + e.docsAccepted, 0) || 0;
      const filteredTrainingsCompleted = dataToExport?.reduce((sum, e) => sum + e.trainingsCompleted, 0) || 0;
      statsToExport = {
        totalEmployees: filteredCount,
        totalDocuments: stats?.totalDocuments || 0,
        totalTrainings: stats?.totalTrainings || 0,
        acknowledgedDocs: filteredDocsAccepted,
        completedTrainings: filteredTrainingsCompleted,
      };
    }

    if (!dataToExport || dataToExport.length === 0 || !statsToExport) { toast.error("Nenhum colaborador encontrado com os filtros selecionados"); return; }
    setExportDialogOpen(false);
    toast.loading("Gerando PDF...", { id: "pdf-loading" });
    try {
      const filterLabel = exportFilter === "all" ? "Todos" : exportFilter === "active" ? "Ativos" : "Inativos";
      const protocol = await generateReportPDF(dataToExport, statsToExport, { 
        userName, 
        baseUrl: window.location.origin,
        contractName: selectedContractName || undefined,
        departmentName: exportDepartment !== "all" ? fixEncoding(exportDepartment) : undefined,
        filterLabel,
      });
      toast.success(`PDF gerado! Protocolo: ${protocol}`, { id: "pdf-loading" });
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Erro ao gerar PDF", { id: "pdf-loading" });
    }
  };

  const fullyCompliantEmployees = employeesCompliance?.filter(e => e.docsPending === 0 && e.trainingsPending === 0).length || 0;
  const docFullyCompliantEmployees = employeesCompliance?.filter(e => e.docsPending === 0).length || 0;
  const trainingFullyCompliantEmployees = employeesCompliance?.filter(e => e.trainingsPending === 0).length || 0;
  const nonCompliantEmployees = (stats?.totalEmployees || 0) - fullyCompliantEmployees;

  // Bar chart data for documents
  const docBarData = useMemo(() => {
    return (documentAcceptance || []).map(d => ({
      name: d.title || d.name,
      completed: d.accepted ?? d.completed ?? 0,
      pending: d.pending ?? 0,
      percentage: d.percentage ?? 0,
    }));
  }, [documentAcceptance]);

  // Bar chart data for trainings
  const trainingBarData = useMemo(() => {
    return (trainingCompletion || []).map(t => ({
      name: t.title || t.name,
      completed: t.completed ?? 0,
      pending: t.pending ?? 0,
      percentage: t.percentage ?? 0,
    }));
  }, [trainingCompletion]);

  // Department compliance data
  const departmentData = useMemo(() => {
    if (!employeesCompliance || !stats) return [];
    const totalDocs = stats.totalDocuments;
    const totalTrainings = stats.totalTrainings;
    const deptMap = new Map<string, { total: number; docsAccepted: number; trainingsCompleted: number }>();
    employeesCompliance.forEach(emp => {
      const dept = emp.department || 'Sem departamento';
      const cur = deptMap.get(dept) || { total: 0, docsAccepted: 0, trainingsCompleted: 0 };
      cur.total++;
      cur.docsAccepted += emp.docsAccepted;
      cur.trainingsCompleted += emp.trainingsCompleted;
      deptMap.set(dept, cur);
    });
    return Array.from(deptMap.entries()).map(([department, d]) => {
      const maxDocs = d.total * totalDocs;
      const maxTrainings = d.total * totalTrainings;
      const docsRate = maxDocs > 0 ? (d.docsAccepted / maxDocs) * 100 : 0;
      const trainingRate = maxTrainings > 0 ? (d.trainingsCompleted / maxTrainings) * 100 : 0;
      return { department, total: d.total, docsRate, trainingRate, overallRate: (docsRate + trainingRate) / 2 };
    });
  }, [employeesCompliance, stats]);

  const renderPaginationControls = (
    current: number,
    total: number,
    setCurrent: (n: number) => void
  ) => (
    <div className="flex items-center justify-between pt-4">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => setCurrent(1)} disabled={current === 1}><ChevronsLeft className="h-4 w-4" /></Button>
        <Button variant="outline" size="sm" onClick={() => setCurrent(current - 1)} disabled={current === 1}><ChevronLeft className="h-4 w-4" /></Button>
      </div>
      <span className="text-sm text-muted-foreground">Página {current} de {total}</span>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => setCurrent(current + 1)} disabled={current === total}><ChevronRight className="h-4 w-4" /></Button>
        <Button variant="outline" size="sm" onClick={() => setCurrent(total)} disabled={current === total}><ChevronsRight className="h-4 w-4" /></Button>
      </div>
    </div>
  );

  const renderEmployeeTable = (
    employees: any[],
    searchValue: string,
    setSearch: (v: string) => void,
    ipp: number,
    handleIppChange: (v: string) => void,
    si: number,
    ei: number,
    totalEmp: number,
    emptyMessage: string,
  ) => (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Pesquisar colaborador..." value={searchValue} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Mostrar</span>
          <Select value={ipp.toString()} onValueChange={handleIppChange}>
            <SelectTrigger className="w-[80px] h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[10, 50, 100, 500].map(v => <SelectItem key={v} value={v.toString()}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            | {si + 1}-{Math.min(ei, totalEmp)} de {totalEmp}
          </span>
        </div>
      </div>
      <div className="overflow-x-auto rounded-lg border border-border/50">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="font-semibold">Colaborador</TableHead>
              <TableHead className="text-center font-semibold">Reg. Aceitos</TableHead>
              <TableHead className="text-center font-semibold">Reg. Pendentes</TableHead>
              <TableHead className="text-center font-semibold">Trein. Concluídos</TableHead>
              <TableHead className="text-center font-semibold">Trein. Pendentes</TableHead>
              <TableHead className="text-center font-semibold">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">{emptyMessage}</TableCell></TableRow>
            ) : (
              employees.map((employee) => {
                const isFullCompliant = employee.docsPending === 0 && employee.trainingsPending === 0;
                return (
                  <TableRow key={employee.id} className={isFullCompliant ? "bg-secondary/5" : ""}>
                    <TableCell className="font-medium">{employee.name}</TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-full text-xs font-semibold bg-secondary/10 text-secondary">{employee.docsAccepted}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-full text-xs font-semibold ${employee.docsPending > 0 ? 'bg-destructive/10 text-destructive' : 'bg-secondary/10 text-secondary'}`}>{employee.docsPending}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-full text-xs font-semibold bg-secondary/10 text-secondary">{employee.trainingsCompleted}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-full text-xs font-semibold ${employee.trainingsPending > 0 ? 'bg-destructive/10 text-destructive' : 'bg-secondary/10 text-secondary'}`}>{employee.trainingsPending}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      {isFullCompliant ? (
                        <Badge className="bg-secondary/10 text-secondary border-secondary/20 gap-1"><CheckCircle2 className="w-3 h-3" /> Em dia</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 gap-1"><AlertTriangle className="w-3 h-3" /> Pendente</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 pt-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <BarChart3 className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Dashboard de Compliance</h1>
              <p className="text-sm text-muted-foreground">Business Intelligence · Indicadores em tempo real</p>
            </div>
          </div>
        </motion.div>
        <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" variant="outline">
              <Download className="h-4 w-4" />
              Exportar PDF
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Exportar Relatório PDF</DialogTitle>
              <DialogDescription>Configure os filtros do relatório</DialogDescription>
            </DialogHeader>
            <div className="space-y-5 py-2">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Escopo dos Colaboradores</Label>
                <RadioGroup value={exportFilter} onValueChange={(v) => setExportFilter(v as any)} className="space-y-2">
                  <div className="flex items-center space-x-3"><RadioGroupItem value="all" id="all" /><Label htmlFor="all" className="cursor-pointer">Todos ({totalActiveCount + totalInactiveCount})</Label></div>
                  <div className="flex items-center space-x-3"><RadioGroupItem value="active" id="active" /><Label htmlFor="active" className="cursor-pointer">Ativos ({totalActiveCount})</Label></div>
                  <div className="flex items-center space-x-3"><RadioGroupItem value="inactive" id="inactive" /><Label htmlFor="inactive" className="cursor-pointer">Inativos ({totalInactiveCount})</Label></div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Contrato de Gestão</Label>
                <Select value={exportContract} onValueChange={setExportContract}>
                  <SelectTrigger><SelectValue placeholder="Todos os contratos" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os contratos</SelectItem>
                    {managementContracts?.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Departamento</Label>
                <Select value={exportDepartment} onValueChange={setExportDepartment}>
                  <SelectTrigger><SelectValue placeholder="Todos os departamentos" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os departamentos</SelectItem>
                    {availableDepartments.map(d => (
                      <SelectItem key={d} value={d}>{fixEncoding(d)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setExportDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleExportPDF} className="gap-2"><Download className="h-4 w-4" />Gerar PDF</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <BIKpiCard
          title="Colaboradores Ativos"
          value={stats?.totalEmployees?.toLocaleString('pt-BR') || "0"}
          subtitle={`${totalInactiveCount} inativos`}
          icon={Users}
          color="primary"
          delay={0}
        />
        <BIKpiCard
          title="Compliance Geral"
          value={`${overallCompliance.toFixed(1).replace('.', ',')}%`}
          subtitle={`${fullyCompliantEmployees} 100% em dia`}
          icon={ShieldCheck}
          color="secondary"
          delay={0.1}
        />
        <BIKpiCard
          title="Regulamentos"
          value={`${documentComplianceRate.toFixed(1).replace('.', ',')}%`}
          subtitle={`${stats?.acknowledgedDocs || 0} de ${(stats?.totalEmployees || 0) * (stats?.totalDocuments || 0)} aceites`}
          icon={FileText}
          color="accent"
          delay={0.2}
        />
        <BIKpiCard
          title="Treinamentos"
          value={`${trainingComplianceRate.toFixed(1).replace('.', ',')}%`}
          subtitle={`${stats?.completedTrainings || 0} de ${(stats?.totalEmployees || 0) * (stats?.totalTrainings || 0)} concluídos`}
          icon={GraduationCap}
          color="primary"
          delay={0.3}
        />
      </div>

      {/* Gauge Charts + Heatmap Row */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <BIGaugeChart
          title="Regulamentos"
          value={documentComplianceRate}
          total={`${docFullyCompliantEmployees} colaboradores com 100%`}
          color="hsl(var(--primary))"
          icon={<FileText className="w-4 h-4 text-primary" />}
        />
        <BIGaugeChart
          title="Treinamentos"
          value={trainingComplianceRate}
          total={`${trainingFullyCompliantEmployees} colaboradores com 100%`}
          color="hsl(var(--secondary))"
          icon={<GraduationCap className="w-4 h-4 text-secondary" />}
        />
        <BIGaugeChart
          title="Compliance Geral"
          value={overallCompliance}
          total={`${fullyCompliantEmployees} totalmente em dia`}
          color={overallCompliance >= 70 ? "hsl(var(--secondary))" : overallCompliance >= 40 ? "hsl(45 100% 50%)" : "hsl(var(--destructive))"}
          icon={<Target className="w-4 h-4" />}
        />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <Card className="border-border/50 h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Activity className="w-4 h-4" /> Panorama Rápido
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Em dia</span>
                <span className="text-sm font-bold text-secondary">{fullyCompliantEmployees}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Pendentes</span>
                <span className="text-sm font-bold text-destructive">{nonCompliantEmployees}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Regulamentos</span>
                <span className="text-sm font-bold text-foreground">{stats?.totalDocuments || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Treinamentos</span>
                <span className="text-sm font-bold text-foreground">{stats?.totalTrainings || 0}</span>
              </div>
              <div className="pt-2 border-t border-border/50">
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-muted-foreground">Progresso geral</span>
                  <span className="text-xs font-bold text-primary">{overallCompliance.toFixed(1).replace('.', ',')}%</span>
                </div>
                <Progress value={overallCompliance} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Distribution Heatmap */}
      {employeesCompliance && stats && (
        <BIComplianceHeatmap
          data={employeesCompliance}
          totalDocs={stats.totalDocuments}
          totalTrainings={stats.totalTrainings}
        />
      )}

      {/* Department Compliance Chart */}
      {departmentData.length > 0 && (
        <BIDepartmentChart 
          data={departmentData} 
          employees={employeesCompliance}
          contracts={managementContracts}
          totalDocs={stats?.totalDocuments || 0}
          totalTrainings={stats?.totalTrainings || 0}
        />
      )}

      {/* Bar Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {docBarData.length > 0 && (
          <BIBarChart
            title="📄 Aceite de Regulamentos por Documento"
            data={docBarData}
            completedLabel="Aceitos"
            pendingLabel="Pendentes"
            completedColor="hsl(var(--primary))"
            pendingColor="hsl(var(--destructive) / 0.6)"
          />
        )}
        {trainingBarData.length > 0 && (
          <BIBarChart
            title="🎓 Conclusão de Treinamentos"
            data={trainingBarData}
            completedLabel="Concluídos"
            pendingLabel="Pendentes"
            completedColor="hsl(var(--secondary))"
            pendingColor="hsl(var(--destructive) / 0.6)"
          />
        )}
      </div>

      {/* Employee Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Status Individual por Colaborador
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={employeeTab} onValueChange={setEmployeeTab}>
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="active" className="flex items-center gap-2"><Users className="w-4 h-4" />Ativos ({totalActiveCount})</TabsTrigger>
                <TabsTrigger value="inactive" className="flex items-center gap-2"><UserX className="w-4 h-4" />Inativos ({totalInactiveCount})</TabsTrigger>
              </TabsList>

              <TabsContent value="active" className="space-y-4">
                {renderEmployeeTable(paginatedEmployees, activeSearch, setActiveSearch, itemsPerPage, handleItemsPerPageChange, startIndex, endIndex, totalEmployees, "Nenhum colaborador encontrado")}
                {renderPaginationControls(currentPage, totalPages, setCurrentPage)}
              </TabsContent>

              <TabsContent value="inactive" className="space-y-4">
                {renderEmployeeTable(paginatedInactiveEmployees, inactiveSearch, setInactiveSearch, inactiveItemsPerPage, handleInactiveItemsPerPageChange, inactiveStartIndex, inactiveEndIndex, totalInactiveEmployees, "Nenhum colaborador inativo encontrado")}
                {totalInactiveEmployees > 0 && renderPaginationControls(inactiveCurrentPage, totalInactivePages, setInactiveCurrentPage)}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Reports;
