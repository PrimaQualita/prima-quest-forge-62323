import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, UserPlus, Search, Trash2, AlertTriangle, FileText, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { analyzeCsvDuplicates } from "@/utils/analyzeDuplicates";

const Employees = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isCleanupDialogOpen, setIsCleanupDialogOpen] = useState(false);
  const [isAnalysisDialogOpen, setIsAnalysisDialogOpen] = useState(false);
  const [selectedForDeletion, setSelectedForDeletion] = useState<string[]>([]);
  const [csvAnalysis, setCsvAnalysis] = useState<any>(null);
  const [pendingCsvText, setPendingCsvText] = useState<string>("");
  const [page, setPage] = useState(0);
  const [pageSize] = useState(50);
  const [isProcessingUsers, setIsProcessingUsers] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    name: "",
    cpf: "",
    birth_date: "",
    phone: "",
    email: "",
    is_manager: false,
    department: "",
    management_contract_id: "",
    job_title: "",
  });

  const { data: employees, isLoading } = useQuery({
    queryKey: ['employees', searchTerm, page],
    queryFn: async () => {
      let query = supabase
        .from('employees')
        .select('id, name, cpf, email, is_manager', { count: 'exact' });
      
      // Apply search filter
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,cpf.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }
      
      // Apply pagination
      const from = page * pageSize;
      const to = from + pageSize - 1;
      
      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);
      
      if (error) throw error;
      return { data, count };
    },
  });

  const totalEmployees = employees?.count || 0;
  const totalPages = Math.ceil(totalEmployees / pageSize);

  const { data: contracts } = useQuery({
    queryKey: ['management_contracts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('management_contracts')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  // Query para buscar colaboradores sem user_id
  const { data: employeesWithoutUsers } = useQuery({
    queryKey: ['employees-without-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('id, name, cpf, birth_date')
        .is('user_id', null)
        .not('cpf', 'is', null)
        .not('birth_date', 'is', null);
      
      if (error) throw error;
      return data || [];
    },
  });

  // Processar colaboradores sem usuário automaticamente
  const processEmployeesWithoutUsers = async () => {
    if (!employeesWithoutUsers || employeesWithoutUsers.length === 0) return;
    
    setIsProcessingUsers(true);
    let successCount = 0;
    let errorCount = 0;

    for (const employee of employeesWithoutUsers) {
      try {
        const { error } = await supabase.functions.invoke('create-employee-user', {
          body: { employee }
        });
        
        if (error) {
          console.error(`Erro ao criar usuário para ${employee.name}:`, error);
          errorCount++;
        } else {
          successCount++;
        }
      } catch (err) {
        console.error(`Falha ao criar usuário para ${employee.name}:`, err);
        errorCount++;
      }
    }

    setIsProcessingUsers(false);
    queryClient.invalidateQueries({ queryKey: ['employees'] });
    queryClient.invalidateQueries({ queryKey: ['employees-without-users'] });

    if (errorCount === 0) {
      toast({
        title: "Usuários criados com sucesso!",
        description: `${successCount} usuário(s) foram criados automaticamente. Login: CPF | Senha: DDMMAAAA`
      });
    } else {
      toast({
        title: "Processamento concluído com erros",
        description: `${successCount} usuários criados, ${errorCount} erro(s) encontrado(s).`,
        variant: "destructive"
      });
    }
  };

  const toggleManagerStatus = useMutation({
    mutationFn: async ({ employeeId, isManager }: { employeeId: string; isManager: boolean }) => {
      const { error } = await supabase
        .from('employees')
        .update({ is_manager: isManager })
        .eq('id', employeeId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast({ 
        title: "Status atualizado!", 
        description: "O tipo de colaborador foi alterado com sucesso."
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Erro ao atualizar", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const deleteEmployeesMutation = useMutation({
    mutationFn: async (employeeIds: string[]) => {
      const { error } = await supabase
        .from('employees')
        .delete()
        .in('id', employeeIds);

      if (error) throw error;
    },
    onSuccess: (_, employeeIds) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast({ 
        title: "Colaboradores removidos!", 
        description: `${employeeIds.length} colaborador(es) foram removidos com sucesso.`
      });
      setSelectedForDeletion([]);
      setIsCleanupDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ 
        title: "Erro ao remover colaboradores", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const addEmployeeMutation = useMutation({
    mutationFn: async (employee: typeof newEmployee) => {
      // Validate CPF format (only numbers, 11 digits)
      const cpfNumbers = employee.cpf.replace(/\D/g, '');
      if (cpfNumbers.length !== 11) {
        throw new Error('CPF deve conter 11 dígitos');
      }

      // Check if CPF already exists
      const { data: existingEmployee } = await supabase
        .from('employees')
        .select('cpf')
        .eq('cpf', cpfNumbers)
        .single();

      if (existingEmployee) {
        throw new Error('Este CPF já está cadastrado no sistema');
      }

      // Normalize email to lowercase
      const normalizedEmployee = {
        ...employee,
        cpf: cpfNumbers,
        email: employee.email ? employee.email.toLowerCase().trim() : null
      };

      // Insert employee with cleaned data
      const { data, error } = await supabase
        .from('employees')
        .insert([normalizedEmployee])
        .select()
        .single();
      
      if (error) throw error;
      
      // Create user account via edge function
      const { error: userError } = await supabase.functions.invoke('create-employee-user', {
        body: { employee: data }
      });
      
      if (userError) {
        console.error('Error creating user account:', userError);
        throw new Error('Colaborador criado, mas houve erro ao criar conta de acesso');
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast({ 
        title: "Colaborador criado com sucesso!", 
        description: "Login: CPF | Senha: Data de nascimento (DDMMAAAA)"
      });
      setIsAddDialogOpen(false);
      setNewEmployee({ 
        name: "", 
        cpf: "", 
        birth_date: "", 
        phone: "", 
        email: "", 
        is_manager: false,
        department: "",
        management_contract_id: "",
        job_title: ""
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Erro ao adicionar colaborador", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const handleDownloadTemplate = () => {
    const headers = ['Nome', 'CPF', 'Data de Nascimento (AAAA-MM-DD)', 'Telefone', 'E-mail', 'Departamento', 'Cargo/Função', 'ID do Contrato de Gestão'];
    const csv = headers.join(';') + '\n';
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_colaboradores.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        
        // Analyze the CSV for duplicates
        const analysis = analyzeCsvDuplicates(text);
        setCsvAnalysis(analysis);
        setPendingCsvText(text);
        
        // Show analysis dialog
        setIsAnalysisDialogOpen(true);
      } catch (error: any) {
        toast({ 
          title: "Erro ao analisar planilha", 
          description: error.message,
          variant: "destructive" 
        });
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = async () => {
    try {
      const text = pendingCsvText;
      const rows = text.split('\n').slice(1); // Skip header
      
      // Fetch all contracts to map names to IDs
      const { data: contracts } = await supabase
        .from('management_contracts')
        .select('id, name');
      
      const contractMap = new Map(contracts?.map(c => [c.name, c.id]) || []);
      
      // Track CPFs we've seen to skip duplicates within file
      const seenCpfs = new Set<string>();
      
      const employeesData = rows
        .filter(row => row.trim())
        .map(row => {
          const [name, cpf, birth_date, phone, email, department, job_title, contract_name] = row.split(';').map(s => s?.trim() || '');
          
          // Clean CPF (remove non-numeric characters)
          const cleanedCpf = cpf.replace(/\D/g, '');
          
          // Validate and normalize email to lowercase
          const cleanedEmail = email && email.includes('@') ? email.toLowerCase().trim() : null;
          
          // Look up contract ID by name, or set to null if not found
          const management_contract_id = contract_name && contractMap.has(contract_name) 
            ? contractMap.get(contract_name) 
            : null;
          
          return { 
            name: name || 'Nome não informado', 
            cpf: cleanedCpf, 
            birth_date: birth_date || '2000-01-01', 
            phone: phone || null, 
            email: cleanedEmail,
            department: department || null,
            job_title: job_title || null,
            management_contract_id
          };
        })
        .filter(emp => {
          // Skip if CPF is invalid or empty
          if (!emp.cpf || emp.cpf.length !== 11) {
            return false;
          }
          
          // Skip duplicates within the file (keep only first occurrence)
          if (seenCpfs.has(emp.cpf)) {
            return false;
          }
          seenCpfs.add(emp.cpf);
          return true;
        });

      if (employeesData.length === 0) {
        throw new Error('Nenhum registro válido encontrado na planilha');
      }

      // Get existing employees to preserve their is_manager status
      const { data: existingEmployees } = await supabase
        .from('employees')
        .select('cpf, is_manager, user_id')
        .in('cpf', employeesData.map(e => e.cpf));

      // Create a map of existing employees to preserve is_manager
      const existingMap = new Map(
        existingEmployees?.map(emp => [emp.cpf, { is_manager: emp.is_manager, user_id: emp.user_id }]) || []
      );

      // Add is_manager and user_id to data, preserving existing values
      const employeesWithPermissions = employeesData.map(emp => ({
        ...emp,
        is_manager: existingMap.has(emp.cpf) ? existingMap.get(emp.cpf)!.is_manager : false,
        user_id: existingMap.has(emp.cpf) ? existingMap.get(emp.cpf)!.user_id : null
      }));

      // Use upsert to insert or update based on CPF
      const { data: upsertedEmployees, error } = await supabase
        .from('employees')
        .upsert(employeesWithPermissions, { 
          onConflict: 'cpf',
          ignoreDuplicates: false
        })
        .select();

      if (error) throw error;

      // Create user accounts only for employees without user_id
      let userCreationErrors = 0;
      let usersCreated = 0;
      for (const employee of upsertedEmployees || []) {
        // Skip if employee already has a user_id
        if (employee.user_id) {
          console.log(`Skipping user creation for ${employee.name} - already has user`);
          continue;
        }

        try {
          const { error: userError } = await supabase.functions.invoke('create-employee-user', {
            body: { employee }
          });
          
          if (userError) {
            console.error(`Error creating user for ${employee.name}:`, userError);
            userCreationErrors++;
          } else {
            usersCreated++;
          }
        } catch (err) {
          console.error(`Failed to create user for ${employee.name}:`, err);
          userCreationErrors++;
        }
      }

      queryClient.invalidateQueries({ queryKey: ['employees'] });
      
      if (userCreationErrors === 0) {
        toast({ 
          title: "Importação concluída com sucesso!", 
          description: `${employeesData.length} colaborador(es) importado(s). ${usersCreated} novos usuários criados. Login: CPF | Senha: DD/MM/AAAA`
        });
      } else {
        toast({ 
          title: "Importação parcialmente concluída", 
          description: `${employeesData.length} colaborador(es) importado(s). ${usersCreated} usuários criados, ${userCreationErrors} erro(s).`,
          variant: "destructive"
        });
      }
      
      setIsAnalysisDialogOpen(false);
      setCsvAnalysis(null);
      setPendingCsvText("");
    } catch (error: any) {
      toast({ 
        title: "Erro ao importar planilha", 
        description: error.message,
        variant: "destructive" 
      });
    }
  };

  const filteredEmployees = employees?.data || [];

  return (
    <div className="space-y-6 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground uppercase">GESTÃO DE COLABORADORES</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os colaboradores e suas informações • {totalEmployees.toLocaleString()} total
          </p>
        </div>
        <div className="flex gap-2">
          {employeesWithoutUsers && employeesWithoutUsers.length > 0 && (
            <Button 
              variant="secondary" 
              onClick={processEmployeesWithoutUsers}
              disabled={isProcessingUsers}
            >
              <Users className="w-4 h-4 mr-2" />
              {isProcessingUsers 
                ? "Processando..." 
                : `Criar ${employeesWithoutUsers.length} Usuário(s)`}
            </Button>
          )}
          <Button variant="outline" onClick={handleDownloadTemplate}>
            <Upload className="w-4 h-4 mr-2" />
            Baixar Template CSV
          </Button>
          <Button variant="outline" asChild>
            <label className="cursor-pointer">
              <Upload className="w-4 h-4 mr-2" />
              Importar CSV
              <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
            </label>
          </Button>
          
          {/* CSV Analysis Dialog */}
          <Dialog open={isAnalysisDialogOpen} onOpenChange={setIsAnalysisDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Análise da Planilha</DialogTitle>
                <DialogDescription>
                  Verifique as informações antes de importar
                </DialogDescription>
              </DialogHeader>
              {csvAnalysis && (
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold">{csvAnalysis.totalRows}</div>
                        <p className="text-sm text-muted-foreground">Total de linhas</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold">{csvAnalysis.uniqueCpfs}</div>
                        <p className="text-sm text-muted-foreground">CPFs únicos</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-destructive">{csvAnalysis.duplicates.length}</div>
                        <p className="text-sm text-muted-foreground">CPFs duplicados</p>
                      </CardContent>
                    </Card>
                  </div>

                  {csvAnalysis.duplicates.length > 0 && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>CPFs Duplicados Encontrados</AlertTitle>
                      <AlertDescription>
                        A planilha contém {csvAnalysis.duplicates.length} CPF(s) duplicado(s). 
                        Apenas a primeira ocorrência de cada CPF será importada.
                      </AlertDescription>
                    </Alert>
                  )}

                  {csvAnalysis.duplicates.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-semibold">Detalhes dos CPFs Duplicados:</h4>
                      <div className="max-h-60 overflow-y-auto space-y-2">
                        {csvAnalysis.duplicates.slice(0, 20).map((dup: any, index: number) => (
                          <div key={index} className="p-3 border rounded-lg bg-destructive/5">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-mono font-bold">CPF: {dup.cpf}</span>
                              <Badge variant="destructive">{dup.count}x duplicado</Badge>
                            </div>
                            <div className="text-sm space-y-1">
                              {dup.names.map((name: string, i: number) => (
                                <div key={i} className="text-muted-foreground">
                                  • Linha {dup.lines[i]}: {name}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                        {csvAnalysis.duplicates.length > 20 && (
                          <p className="text-sm text-muted-foreground text-center py-2">
                            ... e mais {csvAnalysis.duplicates.length - 20} CPF(s) duplicado(s)
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsAnalysisDialogOpen(false);
                        setCsvAnalysis(null);
                        setPendingCsvText("");
                      }}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleConfirmImport}
                      className="flex-1"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {csvAnalysis.duplicates.length > 0 
                        ? `Importar ${csvAnalysis.uniqueCpfs} CPFs Únicos` 
                        : 'Confirmar Importação'}
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="w-4 h-4 mr-2" />
                Novo Colaborador
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Novo Colaborador</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input
                    id="name"
                    value={newEmployee.name}
                    onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                    placeholder="João Silva"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    value={newEmployee.cpf}
                    onChange={(e) => setNewEmployee({ ...newEmployee, cpf: e.target.value })}
                    placeholder="000.000.000-00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birth_date">Data de Nascimento</Label>
                  <Input
                    id="birth_date"
                    type="date"
                    value={newEmployee.birth_date}
                    onChange={(e) => setNewEmployee({ ...newEmployee, birth_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={newEmployee.phone}
                    onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newEmployee.email}
                    onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                    placeholder="joao@primaqualita.com.br"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Departamento</Label>
                  <Input
                    id="department"
                    value={newEmployee.department}
                    onChange={(e) => setNewEmployee({ ...newEmployee, department: e.target.value })}
                    placeholder="Ex: Recursos Humanos"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="job_title">Cargo/Função</Label>
                  <Input
                    id="job_title"
                    value={newEmployee.job_title}
                    onChange={(e) => setNewEmployee({ ...newEmployee, job_title: e.target.value })}
                    placeholder="Ex: Analista de Compliance"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contract">Contrato de Gestão</Label>
                  <Select
                    value={newEmployee.management_contract_id}
                    onValueChange={(value) => setNewEmployee({ ...newEmployee, management_contract_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um contrato" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nenhum</SelectItem>
                      {contracts?.map((contract) => (
                        <SelectItem key={contract.id} value={contract.id}>
                          {contract.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_manager"
                    checked={newEmployee.is_manager}
                    onCheckedChange={(checked) => 
                      setNewEmployee({ ...newEmployee, is_manager: checked as boolean })
                    }
                  />
                  <Label
                    htmlFor="is_manager"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Gestor (acesso completo ao sistema)
                  </Label>
                </div>
                <Button
                  onClick={() => addEmployeeMutation.mutate(newEmployee)}
                  className="w-full"
                  disabled={addEmployeeMutation.isPending}
                >
                  Adicionar Colaborador
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {employeesWithoutUsers && employeesWithoutUsers.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Colaboradores sem acesso ao sistema</AlertTitle>
          <AlertDescription>
            Existem {employeesWithoutUsers.length} colaborador(es) sem usuário criado. 
            Clique no botão "Criar Usuários" acima para criar automaticamente os acessos.
            <br />
            <span className="text-sm text-muted-foreground mt-1 block">
              Login: CPF do colaborador | Senha: Data de nascimento (DDMMAAAA)
            </span>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar por nome, CPF ou e-mail..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(0); // Reset to first page on search
                }}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center py-8 text-muted-foreground">Carregando...</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>CPF</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Gestor</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees?.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">{employee.name}</TableCell>
                      <TableCell>{employee.cpf}</TableCell>
                      <TableCell>{employee.email || '-'}</TableCell>
                      <TableCell>
                        {employee.is_manager ? (
                          <Badge variant="default">Gestor</Badge>
                        ) : (
                          <Badge variant="secondary">Colaborador</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={employee.is_manager || false}
                            onCheckedChange={(checked) => 
                              toggleManagerStatus.mutate({ 
                                employeeId: employee.id, 
                                isManager: checked 
                              })
                            }
                            disabled={toggleManagerStatus.isPending}
                          />
                          <span className="text-sm text-muted-foreground">
                            {employee.is_manager ? "Sim" : "Não"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteEmployeesMutation.mutate([employee.id])}
                          disabled={deleteEmployeesMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Mostrando {page * pageSize + 1} - {Math.min((page + 1) * pageSize, totalEmployees)} de {totalEmployees.toLocaleString()}
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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Employees;
