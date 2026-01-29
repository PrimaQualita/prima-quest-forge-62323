import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, UserCheck, Eye, FileText, GraduationCap, Calendar, UserX, Trash2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const InactiveEmployees = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [isReactivateDialogOpen, setIsReactivateDialogOpen] = useState(false);
  const [employeeToReactivate, setEmployeeToReactivate] = useState<{ id: string; name: string } | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedEmployeeDetails, setSelectedEmployeeDetails] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState<{ current: number; total: number } | null>(null);

  // Query for inactive employees
  const { data: inactiveEmployees, isLoading } = useQuery({
    queryKey: ['inactive-employees', searchTerm, page],
    queryFn: async () => {
      let query = supabase
        .from('employees')
        .select('id, name, cpf, email, department, job_title, deactivated_at, management_contract_id', { count: 'exact' })
        .eq('is_active', false);
      
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,cpf.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }
      
      const from = page * pageSize;
      const to = from + pageSize - 1;
      
      const { data, error, count } = await query
        .order('deactivated_at', { ascending: false })
        .range(from, to);
      
      if (error) throw error;
      return { data, count };
    },
  });

  const totalInactive = inactiveEmployees?.count || 0;
  const totalPages = Math.ceil(totalInactive / pageSize);

  // Query for employee history details
  const fetchEmployeeDetails = async (employeeId: string) => {
    const [trainingsResult, documentsResult, certificatesResult] = await Promise.all([
      supabase
        .from('training_participations')
        .select(`
          id,
          completed,
          completion_date,
          trainings:training_id (title)
        `)
        .eq('employee_id', employeeId),
      supabase
        .from('document_acknowledgments')
        .select(`
          id,
          acknowledged_at,
          quiz_correct,
          compliance_documents:document_id (title)
        `)
        .eq('employee_id', employeeId),
      supabase
        .from('certificates')
        .select('*')
    ]);

    // Get employee info to filter certificates by name
    const { data: employee } = await supabase
      .from('employees')
      .select('name')
      .eq('id', employeeId)
      .single();

    const certificates = certificatesResult.data?.filter(c => 
      c.employee_name === employee?.name
    ) || [];

    return {
      trainings: trainingsResult.data || [],
      documents: documentsResult.data || [],
      certificates
    };
  };

  const handleViewDetails = async (employee: any) => {
    try {
      const details = await fetchEmployeeDetails(employee.id);
      setSelectedEmployeeDetails({ ...employee, ...details });
      setIsDetailsDialogOpen(true);
    } catch (error) {
      toast({
        title: "Erro ao carregar detalhes",
        description: "Não foi possível carregar o histórico do colaborador.",
        variant: "destructive"
      });
    }
  };

  // Mutation to reactivate employee
  const reactivateMutation = useMutation({
    mutationFn: async (employeeId: string) => {
      const { error } = await supabase
        .from('employees')
        .update({ 
          is_active: true, 
          deactivated_at: null 
        })
        .eq('id', employeeId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inactive-employees'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast({
        title: "Colaborador reativado!",
        description: "O colaborador foi reativado com sucesso e manteve todo o histórico."
      });
      setIsReactivateDialogOpen(false);
      setEmployeeToReactivate(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao reativar",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Bulk reactivation
  const bulkReactivateMutation = useMutation({
    mutationFn: async (employeeIds: string[]) => {
      const { error } = await supabase
        .from('employees')
        .update({ 
          is_active: true, 
          deactivated_at: null 
        })
        .in('id', employeeIds);
      
      if (error) throw error;
    },
    onSuccess: (_, employeeIds) => {
      queryClient.invalidateQueries({ queryKey: ['inactive-employees'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast({
        title: "Colaboradores reativados!",
        description: `${employeeIds.length} colaborador(es) foram reativados com sucesso.`
      });
      setSelectedEmployees([]);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao reativar",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Delete employee completely (cascade delete all related data)
  const deleteEmployeeCompletely = async (employeeId: string, employeeName: string) => {
    console.log(`Starting complete deletion for employee: ${employeeName} (${employeeId})`);
    
    // 1. Delete video_progress
    const { error: videoError } = await supabase
      .from('video_progress')
      .delete()
      .eq('employee_id', employeeId);
    if (videoError) console.error('Error deleting video_progress:', videoError);

    // 2. Delete training_assessments
    const { error: assessmentError } = await supabase
      .from('training_assessments')
      .delete()
      .eq('employee_id', employeeId);
    if (assessmentError) console.error('Error deleting training_assessments:', assessmentError);

    // 3. Delete training_participations
    const { error: participationError } = await supabase
      .from('training_participations')
      .delete()
      .eq('employee_id', employeeId);
    if (participationError) console.error('Error deleting training_participations:', participationError);

    // 4. Delete document_acknowledgments
    const { error: ackError } = await supabase
      .from('document_acknowledgments')
      .delete()
      .eq('employee_id', employeeId);
    if (ackError) console.error('Error deleting document_acknowledgments:', ackError);

    // 5. Delete chat_messages (via conversations)
    const { data: conversations } = await supabase
      .from('chat_conversations')
      .select('id')
      .eq('employee_id', employeeId);
    
    if (conversations && conversations.length > 0) {
      const conversationIds = conversations.map(c => c.id);
      const { error: msgError } = await supabase
        .from('chat_messages')
        .delete()
        .in('conversation_id', conversationIds);
      if (msgError) console.error('Error deleting chat_messages:', msgError);
      
      // 6. Delete chat_conversations
      const { error: convError } = await supabase
        .from('chat_conversations')
        .delete()
        .eq('employee_id', employeeId);
      if (convError) console.error('Error deleting chat_conversations:', convError);
    }

    // 7. Delete certificates by employee name
    const { error: certError } = await supabase
      .from('certificates')
      .delete()
      .eq('employee_name', employeeName);
    if (certError) console.error('Error deleting certificates:', certError);

    // 8. Delete gamification_progress (if user_id exists)
    const { data: employee } = await supabase
      .from('employees')
      .select('user_id')
      .eq('id', employeeId)
      .single();
    
    if (employee?.user_id) {
      const { error: gameError } = await supabase
        .from('gamification_progress')
        .delete()
        .eq('user_id', employee.user_id);
      if (gameError) console.error('Error deleting gamification_progress:', gameError);
    }

    // 9. Finally, delete the employee record
    const { error: empError } = await supabase
      .from('employees')
      .delete()
      .eq('id', employeeId);
    
    if (empError) throw empError;
    
    console.log(`Successfully deleted employee: ${employeeName}`);
  };

  // Single delete mutation
  const deleteMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      await deleteEmployeeCompletely(id, name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inactive-employees'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast({
        title: "Colaborador excluído!",
        description: "O colaborador e todos os seus dados foram removidos permanentemente."
      });
      setIsDeleteDialogOpen(false);
      setEmployeeToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (employees: Array<{ id: string; name: string }>) => {
      setDeleteProgress({ current: 0, total: employees.length });
      
      for (let i = 0; i < employees.length; i++) {
        await deleteEmployeeCompletely(employees[i].id, employees[i].name);
        setDeleteProgress({ current: i + 1, total: employees.length });
      }
    },
    onSuccess: (_, employees) => {
      queryClient.invalidateQueries({ queryKey: ['inactive-employees'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast({
        title: "Colaboradores excluídos!",
        description: `${employees.length} colaborador(es) e todos os seus dados foram removidos permanentemente.`
      });
      setSelectedEmployees([]);
      setIsBulkDeleteDialogOpen(false);
      setDeleteProgress(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive"
      });
      setDeleteProgress(null);
    }
  });

  const toggleSelectAll = () => {
    if (selectedEmployees.length === (inactiveEmployees?.data?.length || 0)) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(inactiveEmployees?.data?.map(e => e.id) || []);
    }
  };

  const toggleSelect = (employeeId: string) => {
    setSelectedEmployees(prev => 
      prev.includes(employeeId) 
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return format(new Date(date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  const filteredEmployees = inactiveEmployees?.data || [];

  const getSelectedEmployeesData = () => {
    return filteredEmployees
      .filter(e => selectedEmployees.includes(e.id))
      .map(e => ({ id: e.id, name: e.name }));
  };

  return (
    <div className="space-y-6 pt-6">
      <div className="space-y-4">
        <div>
          <h1 className="text-4xl font-bold text-foreground uppercase flex items-center gap-3">
            <UserX className="w-10 h-10" />
            COLABORADORES INATIVOS
          </h1>
          <p className="text-muted-foreground mt-1">
            Colaboradores desativados que não estão mais na carga de importação • {totalInactive.toLocaleString()} total
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {selectedEmployees.length > 0 && (
            <>
              <Button 
                onClick={() => bulkReactivateMutation.mutate(selectedEmployees)}
                disabled={bulkReactivateMutation.isPending || bulkDeleteMutation.isPending}
              >
                <UserCheck className="w-4 h-4 mr-2" />
                Reativar {selectedEmployees.length} Selecionado(s)
              </Button>
              <Button 
                variant="destructive"
                onClick={() => setIsBulkDeleteDialogOpen(true)}
                disabled={bulkReactivateMutation.isPending || bulkDeleteMutation.isPending}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir {selectedEmployees.length} Selecionado(s)
              </Button>
            </>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Lista de Colaboradores Inativos</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar por nome, CPF..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(0);
                }}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : filteredEmployees.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <UserCheck className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum colaborador inativo encontrado</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedEmployees.length === filteredEmployees.length && filteredEmployees.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>CPF</TableHead>
                    <TableHead>Departamento</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Desativado em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedEmployees.includes(employee.id)}
                          onCheckedChange={() => toggleSelect(employee.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{employee.name}</TableCell>
                      <TableCell className="font-mono text-sm">{employee.cpf}</TableCell>
                      <TableCell>{employee.department || "-"}</TableCell>
                      <TableCell>{employee.job_title || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-normal">
                          <Calendar className="w-3 h-3 mr-1" />
                          {formatDate(employee.deactivated_at)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(employee)}
                          title="Ver detalhes"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEmployeeToReactivate({ id: employee.id, name: employee.name });
                            setIsReactivateDialogOpen(true);
                          }}
                          title="Reativar colaborador"
                        >
                          <UserCheck className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setEmployeeToDelete({ id: employee.id, name: employee.name });
                            setIsDeleteDialogOpen(true);
                          }}
                          title="Excluir permanentemente"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-4 gap-4">
                <div className="flex items-center gap-4">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {page * pageSize + 1} - {Math.min((page + 1) * pageSize, totalInactive)} de {totalInactive.toLocaleString()}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Por página:</span>
                    <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(0); }}>
                      <SelectTrigger className="w-20 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                        <SelectItem value="500">500</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {totalPages > 1 && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(0, p - 1))}
                      disabled={page === 0}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                      disabled={page >= totalPages - 1}
                    >
                      Próxima
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Reactivate Confirmation Dialog */}
      <AlertDialog open={isReactivateDialogOpen} onOpenChange={setIsReactivateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reativar Colaborador</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja reativar <strong>{employeeToReactivate?.name}</strong>?
              <br /><br />
              O colaborador voltará a aparecer na lista de ativos e manterá todo o histórico de treinamentos e documentos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => employeeToReactivate && reactivateMutation.mutate(employeeToReactivate.id)}
              disabled={reactivateMutation.isPending}
            >
              {reactivateMutation.isPending ? "Reativando..." : "Reativar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Excluir Colaborador Permanentemente
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>
                  Você está prestes a excluir permanentemente o colaborador:
                </p>
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="font-semibold text-foreground">{employeeToDelete?.name}</p>
                </div>
                <div className="text-sm space-y-2">
                  <p className="font-medium text-foreground">Esta ação irá remover:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Todos os treinamentos e avaliações</li>
                    <li>Todos os documentos aceitos</li>
                    <li>Todo o progresso de vídeos</li>
                    <li>Todas as conversas do chatbot</li>
                    <li>Todos os certificados emitidos</li>
                    <li>Todo o progresso de gamificação</li>
                  </ul>
                </div>
                <p className="text-destructive font-medium">
                  ⚠️ Esta ação é IRREVERSÍVEL e não pode ser desfeita!
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => employeeToDelete && deleteMutation.mutate(employeeToDelete)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Excluindo..." : "Excluir Permanentemente"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={isBulkDeleteDialogOpen} onOpenChange={(open) => {
        if (!bulkDeleteMutation.isPending) setIsBulkDeleteDialogOpen(open);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Excluir {selectedEmployees.length} Colaborador(es) Permanentemente
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                {deleteProgress ? (
                  <div className="space-y-3">
                    <p>Excluindo colaboradores...</p>
                    <div className="w-full bg-muted rounded-full h-3">
                      <div 
                        className="bg-destructive h-3 rounded-full transition-all duration-300"
                        style={{ width: `${(deleteProgress.current / deleteProgress.total) * 100}%` }}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground text-center">
                      {deleteProgress.current} de {deleteProgress.total} excluídos
                    </p>
                  </div>
                ) : (
                  <>
                    <p>
                      Você está prestes a excluir permanentemente <strong>{selectedEmployees.length}</strong> colaborador(es).
                    </p>
                    <div className="text-sm space-y-2">
                      <p className="font-medium text-foreground">Para cada colaborador, será removido:</p>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        <li>Todos os treinamentos e avaliações</li>
                        <li>Todos os documentos aceitos</li>
                        <li>Todo o progresso de vídeos</li>
                        <li>Todas as conversas do chatbot</li>
                        <li>Todos os certificados emitidos</li>
                        <li>Todo o progresso de gamificação</li>
                      </ul>
                    </div>
                    <p className="text-destructive font-medium">
                      ⚠️ Esta ação é IRREVERSÍVEL e não pode ser desfeita!
                    </p>
                  </>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkDeleteMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => bulkDeleteMutation.mutate(getSelectedEmployeesData())}
              disabled={bulkDeleteMutation.isPending}
            >
              {bulkDeleteMutation.isPending ? "Excluindo..." : `Excluir ${selectedEmployees.length} Colaborador(es)`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Employee Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserX className="w-5 h-5" />
              Histórico de {selectedEmployeeDetails?.name}
            </DialogTitle>
            <DialogDescription>
              Visualize o histórico completo do colaborador inativo
            </DialogDescription>
          </DialogHeader>
          
          {selectedEmployeeDetails && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">CPF</p>
                  <p className="font-mono">{selectedEmployeeDetails.cpf}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Desativado em</p>
                  <p>{formatDate(selectedEmployeeDetails.deactivated_at)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Departamento</p>
                  <p>{selectedEmployeeDetails.department || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cargo</p>
                  <p>{selectedEmployeeDetails.job_title || "-"}</p>
                </div>
              </div>

              {/* Trainings */}
              <div>
                <h4 className="font-semibold flex items-center gap-2 mb-3">
                  <GraduationCap className="w-4 h-4" />
                  Treinamentos ({selectedEmployeeDetails.trainings?.length || 0})
                </h4>
                {selectedEmployeeDetails.trainings?.length > 0 ? (
                  <div className="space-y-2">
                    {selectedEmployeeDetails.trainings.map((t: any) => (
                      <div key={t.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <span>{t.trainings?.title || "Treinamento"}</span>
                        <Badge variant={t.completed ? "default" : "secondary"}>
                          {t.completed ? "Concluído" : "Em andamento"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">Nenhum treinamento registrado</p>
                )}
              </div>

              {/* Documents */}
              <div>
                <h4 className="font-semibold flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4" />
                  Documentos Aceitos ({selectedEmployeeDetails.documents?.length || 0})
                </h4>
                {selectedEmployeeDetails.documents?.length > 0 ? (
                  <div className="space-y-2">
                    {selectedEmployeeDetails.documents.map((d: any) => (
                      <div key={d.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <span>{d.compliance_documents?.title || "Documento"}</span>
                        <div className="flex items-center gap-2">
                          {d.quiz_correct !== null && (
                            <Badge variant={d.quiz_correct ? "default" : "destructive"}>
                              Quiz: {d.quiz_correct ? "Correto" : "Incorreto"}
                            </Badge>
                          )}
                          <span className="text-sm text-muted-foreground">
                            {formatDate(d.acknowledged_at)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">Nenhum documento aceito</p>
                )}
              </div>

              {/* Certificates */}
              <div>
                <h4 className="font-semibold flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4" />
                  Certificados ({selectedEmployeeDetails.certificates?.length || 0})
                </h4>
                {selectedEmployeeDetails.certificates?.length > 0 ? (
                  <div className="space-y-2">
                    {selectedEmployeeDetails.certificates.map((c: any) => (
                      <div key={c.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <span>{c.training_title}</span>
                        <div className="flex items-center gap-2">
                          <Badge>Nota: {c.score}%</Badge>
                          <span className="text-sm text-muted-foreground">
                            {formatDate(c.issued_at)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">Nenhum certificado emitido</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InactiveEmployees;
