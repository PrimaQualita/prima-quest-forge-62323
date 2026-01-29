import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, UserCheck, Eye, FileText, GraduationCap, Calendar, UserX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const InactiveEmployees = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize] = useState(50);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [isReactivateDialogOpen, setIsReactivateDialogOpen] = useState(false);
  const [employeeToReactivate, setEmployeeToReactivate] = useState<{ id: string; name: string } | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedEmployeeDetails, setSelectedEmployeeDetails] = useState<any>(null);

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
            <Button 
              onClick={() => bulkReactivateMutation.mutate(selectedEmployees)}
              disabled={bulkReactivateMutation.isPending}
            >
              <UserCheck className="w-4 h-4 mr-2" />
              Reativar {selectedEmployees.length} Selecionado(s)
            </Button>
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
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(employee)}
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
                        >
                          <UserCheck className="w-4 h-4 mr-1" />
                          Reativar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Página {page + 1} de {totalPages}
                  </p>
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
                </div>
              )}
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
