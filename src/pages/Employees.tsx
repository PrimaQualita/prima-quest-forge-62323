import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, UserPlus, Search, Trash2, AlertTriangle, FileText, Users, Pencil } from "lucide-react";
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
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCleanupDialogOpen, setIsCleanupDialogOpen] = useState(false);
  const [isAnalysisDialogOpen, setIsAnalysisDialogOpen] = useState(false);
  const [selectedForDeletion, setSelectedForDeletion] = useState<string[]>([]);
  const [csvAnalysis, setCsvAnalysis] = useState<any>(null);
  const [pendingCsvText, setPendingCsvText] = useState<string>("");
  const [page, setPage] = useState(0);
  const [pageSize] = useState(50);
  const [isProcessingUsers, setIsProcessingUsers] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);
  const [isValidatingCPFs, setIsValidatingCPFs] = useState(false);
  const [validationResults, setValidationResults] = useState<any>(null);
  const [isValidationDialogOpen, setIsValidationDialogOpen] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    name: "",
    cpf: "",
    birth_date: "",
    phone: "",
    email: "",
    is_manager: false,
    department: "",
    management_contract_id: null as string | null,
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

  // Query para buscar colaboradores sem user_id (buscar TODOS sem limite)
  const { data: employeesWithoutUsers } = useQuery({
    queryKey: ['employees-without-users'],
    queryFn: async () => {
      const allEmployees = [];
      let from = 0;
      const batchSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from('employees')
          .select('id, name, cpf, birth_date, is_manager, email')
          .is('user_id', null)
          .not('cpf', 'is', null)
          .not('birth_date', 'is', null)
          .range(from, from + batchSize - 1)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          allEmployees.push(...data);
          from += batchSize;
          hasMore = data.length === batchSize;
        } else {
          hasMore = false;
        }
      }
      
      return allEmployees;
    },
  });

  // Processar colaboradores sem usuário automaticamente em lote
  const processEmployeesWithoutUsers = async () => {
    if (!employeesWithoutUsers || employeesWithoutUsers.length === 0) return;
    
    setIsProcessingUsers(true);

    try {
      const { data, error } = await supabase.functions.invoke('link-existing-users', {
        body: { employees: employeesWithoutUsers }
      });
      
      if (error) throw error;

      const results = data.results;
      const linked = results.success.filter((r: any) => r.action === 'linked').length;
      const created = results.success.filter((r: any) => r.action === 'created').length;
      
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employees-without-users'] });

      if (results.errors.length === 0) {
        toast({
          title: "Usuários processados com sucesso!",
          description: `${linked} usuário(s) vinculado(s), ${created} criado(s). Login: CPF | Senha: DDMMAAAA`
        });
      } else {
        toast({
          title: "Processamento concluído",
          description: `${linked} vinculados, ${created} criados, ${results.errors.length} erro(s).`,
          variant: results.success.length > 0 ? "default" : "destructive"
        });
      }
    } catch (err) {
      console.error('Falha ao criar usuários:', err);
      toast({
        title: "Erro ao processar usuários",
        description: "Ocorreu um erro ao criar os usuários. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsProcessingUsers(false);
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
      // Usar edge function com service role para deletar completamente
      const { data, error } = await supabase.functions.invoke('delete-employee', {
        body: { employeeIds }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      return data;
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

  const editEmployeeMutation = useMutation({
    mutationFn: async (employee: any) => {
      // Normalize email to lowercase
      const updateData = {
        name: employee.name,
        phone: employee.phone,
        email: employee.email ? employee.email.toLowerCase().trim() : null,
        department: employee.department,
        job_title: employee.job_title,
        management_contract_id: employee.management_contract_id || null,
        // Explicitamente NÃO incluir user_id, cpf, birth_date
      };

      const { data, error } = await supabase
        .from('employees')
        .update(updateData)
        .eq('id', employee.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast({ 
        title: "Colaborador atualizado com sucesso!", 
        description: "As informações foram salvas."
      });
      setIsEditDialogOpen(false);
      setEditingEmployee(null);
    },
    onError: (error: any) => {
      toast({ 
        title: "Erro ao atualizar colaborador", 
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

      // Validar CPF junto à Receita Federal
      toast({
        title: "Validando CPF...",
        description: "Verificando CPF junto à Receita Federal"
      });

      const { data: validationData, error: validationError } = await supabase.functions.invoke('validate-cpf', {
        body: { 
          cpfs: [{ 
            cpf: cpfNumbers, 
            birthDate: employee.birth_date,
            name: employee.name 
          }] 
        }
      });

      if (validationError) {
        console.error('Erro na validação:', validationError);
        throw new Error('Erro ao validar CPF. Tente novamente.');
      }

      const validation = validationData.results[0];
      if (!validation.isValid) {
        throw new Error(validation.error || 'CPF inválido ou dados inconsistentes');
      }

      if (validation.birthDateMatches === false) {
        throw new Error('Data de nascimento não confere com o CPF informado');
      }

      // Normalize email to lowercase and ensure UUID fields are null if empty
      const normalizedEmployee = {
        ...employee,
        cpf: cpfNumbers,
        email: employee.email ? employee.email.toLowerCase().trim() : null,
        management_contract_id: employee.management_contract_id || null
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
        body: { employees: [data] }
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
        management_contract_id: null,
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

  const validateAllExistingEmployees = async () => {
    setIsValidatingCPFs(true);
    
    try {
      // Buscar TODOS os colaboradores usando paginação
      const allEmployees = [];
      let from = 0;
      const fetchBatchSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from('employees')
          .select('id, cpf, birth_date, name')
          .not('cpf', 'is', null)
          .not('birth_date', 'is', null)
          .range(from, from + fetchBatchSize - 1)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          allEmployees.push(...data);
          from += fetchBatchSize;
          hasMore = data.length === fetchBatchSize;
        } else {
          hasMore = false;
        }
      }

      if (allEmployees.length === 0) {
        toast({
          title: "Nenhum colaborador para validar",
          description: "Não há colaboradores cadastrados no sistema."
        });
        setIsValidatingCPFs(false);
        return;
      }

      toast({
        title: "Validação iniciada",
        description: `Validando ${allEmployees.length} colaborador(es). Isso pode levar alguns minutos...`
      });

      // Validar em lotes de 10 para não sobrecarregar a API
      const batchSize = 10;
      const allResults = [];

      for (let i = 0; i < allEmployees.length; i += batchSize) {
        const batch = allEmployees.slice(i, i + batchSize);
        
        const { data: validationData, error: validationError } = await supabase.functions.invoke('validate-cpf', {
          body: { 
            cpfs: batch.map(emp => ({
              cpf: emp.cpf,
              birthDate: emp.birth_date,
              name: emp.name
            }))
          }
        });

        if (validationError) {
          console.error('Erro na validação do lote:', validationError);
          continue;
        }

        // Adicionar ID do colaborador aos resultados
        validationData.results.forEach((result: any, index: number) => {
          allResults.push({
            ...result,
            employeeId: batch[index].id,
            employeeName: batch[index].name
          });
        });

        // Aguardar um pouco entre lotes
        if (i + batchSize < allEmployees.length) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      setValidationResults(allResults);
      setIsValidationDialogOpen(true);

      const invalidCount = allResults.filter((r: any) => !r.isValid).length;
      toast({
        title: "Validação concluída!",
        description: `${allResults.length - invalidCount} CPFs válidos, ${invalidCount} com problemas.`,
        variant: invalidCount > 0 ? "destructive" : "default"
      });

    } catch (error: any) {
      console.error('Erro na validação:', error);
      toast({
        title: "Erro ao validar CPFs",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsValidatingCPFs(false);
    }
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

      // Validar CPFs junto à Receita Federal antes de importar
      toast({
        title: "Validando CPFs...",
        description: `Verificando ${employeesData.length} CPF(s) junto à Receita Federal. Isso pode levar alguns minutos...`
      });

      const { data: validationData, error: validationError } = await supabase.functions.invoke('validate-cpf', {
        body: { 
          cpfs: employeesData.map(emp => ({
            cpf: emp.cpf,
            birthDate: emp.birth_date,
            name: emp.name
          }))
        }
      });

      if (validationError) {
        console.error('Erro na validação:', validationError);
        throw new Error('Erro ao validar CPFs. Tente novamente.');
      }

      // Filtrar apenas colaboradores com CPF válido
      const validCpfs = new Set(
        validationData.results
          .filter((r: any) => r.isValid)
          .map((r: any) => r.cpf)
      );

      const invalidResults = validationData.results.filter((r: any) => !r.isValid);
      
      if (invalidResults.length > 0) {
        console.warn(`${invalidResults.length} CPF(s) inválido(s) encontrado(s):`, invalidResults);
        toast({
          title: "CPFs Inválidos Detectados",
          description: `${invalidResults.length} CPF(s) com problemas foram ignorados. ${validCpfs.size} serão importados.`,
          variant: "destructive"
        });
      }

      const validEmployeesData = employeesData.filter(emp => validCpfs.has(emp.cpf));

      if (validEmployeesData.length === 0) {
        throw new Error('Nenhum colaborador com CPF válido para importar');
      }

      // Get existing employees to preserve their is_manager status
      const { data: existingEmployees } = await supabase
        .from('employees')
        .select('cpf, is_manager, user_id')
        .in('cpf', validEmployeesData.map(e => e.cpf));

      // Create a map of existing employees to preserve is_manager
      const existingMap = new Map(
        existingEmployees?.map(emp => [emp.cpf, { is_manager: emp.is_manager, user_id: emp.user_id }]) || []
      );

      // Add is_manager and user_id to data, preserving existing values
      const employeesWithPermissions = validEmployeesData.map(emp => ({
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
          description: `${validEmployeesData.length} colaborador(es) importado(s) com CPF válido. ${usersCreated} novos usuários criados. Login: CPF | Senha: DDMMAAAA`
        });
      } else {
        toast({ 
          title: "Importação parcialmente concluída", 
          description: `${validEmployeesData.length} colaborador(es) importado(s). ${usersCreated} usuários criados, ${userCreationErrors} erro(s).`,
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
      <div className="space-y-4">
        <div className="flex items-start justify-between">
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
            <Button 
              variant="outline" 
              onClick={validateAllExistingEmployees}
              disabled={isValidatingCPFs}
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              {isValidatingCPFs ? "Validando..." : "Validar CPFs"}
            </Button>
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
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Novo Colaborador
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Adicionar Novo Colaborador</DialogTitle>
                  <DialogDescription>
                    Preencha os dados do colaborador. Um usuário será criado automaticamente.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome Completo *</Label>
                    <Input
                      id="name"
                      value={newEmployee.name}
                      onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                      placeholder="Nome completo"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF *</Label>
                    <Input
                      id="cpf"
                      value={newEmployee.cpf}
                      onChange={(e) => setNewEmployee({ ...newEmployee, cpf: e.target.value })}
                      placeholder="000.000.000-00"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="birth-date">Data de Nascimento *</Label>
                    <Input
                      id="birth-date"
                      type="date"
                      value={newEmployee.birth_date}
                      onChange={(e) => setNewEmployee({ ...newEmployee, birth_date: e.target.value })}
                      required
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
                    <Label htmlFor="job-title">Cargo/Função</Label>
                    <Input
                      id="job-title"
                      value={newEmployee.job_title}
                      onChange={(e) => setNewEmployee({ ...newEmployee, job_title: e.target.value })}
                      placeholder="Ex: Analista de Compliance"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contract">Contrato de Gestão (opcional)</Label>
                    <Select
                      value={newEmployee.management_contract_id || undefined}
                      onValueChange={(value) => setNewEmployee({ ...newEmployee, management_contract_id: value || null })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Nenhum contrato selecionado" />
                      </SelectTrigger>
                      <SelectContent>
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
                      id="is-manager"
                      checked={newEmployee.is_manager}
                      onCheckedChange={(checked) => 
                        setNewEmployee({ ...newEmployee, is_manager: checked as boolean })
                      }
                    />
                    <Label htmlFor="is-manager" className="font-normal cursor-pointer">
                      Este colaborador é um gestor
                    </Label>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <p className="text-sm text-blue-900 dark:text-blue-100 font-medium mb-2">
                      ℹ️ Credenciais de Acesso
                    </p>
                    <p className="text-xs text-blue-800 dark:text-blue-200">
                      <strong>Login:</strong> CPF do colaborador<br />
                      <strong>Senha:</strong> Data de nascimento (formato DDMMAAAA)
                    </p>
                  </div>
                  <Button
                    onClick={() => addEmployeeMutation.mutate(newEmployee)}
                    className="w-full"
                    disabled={addEmployeeMutation.isPending || !newEmployee.name || !newEmployee.cpf || !newEmployee.birth_date}
                  >
                    {addEmployeeMutation.isPending ? "Adicionando..." : "Adicionar Colaborador"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
      
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

      {/* Edit Employee Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Colaborador</DialogTitle>
            <DialogDescription>
              Atualize as informações do colaborador. CPF, data de nascimento e credenciais de acesso não podem ser alterados.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome Completo *</Label>
              <Input
                id="edit-name"
                value={editingEmployee?.name || ""}
                onChange={(e) => setEditingEmployee({ ...editingEmployee, name: e.target.value })}
                placeholder="Nome completo"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-cpf">CPF *</Label>
              <Input
                id="edit-cpf"
                value={editingEmployee?.cpf || ""}
                disabled
                className="bg-muted cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground">CPF não pode ser alterado</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-birth-date">Data de Nascimento *</Label>
              <Input
                id="edit-birth-date"
                type="date"
                value={editingEmployee?.birth_date || ""}
                disabled
                className="bg-muted cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground">Data de nascimento não pode ser alterada</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Telefone</Label>
              <Input
                id="edit-phone"
                value={editingEmployee?.phone || ""}
                onChange={(e) => setEditingEmployee({ ...editingEmployee, phone: e.target.value })}
                placeholder="(11) 99999-9999"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">E-mail</Label>
              <Input
                id="edit-email"
                type="email"
                value={editingEmployee?.email || ""}
                onChange={(e) => setEditingEmployee({ ...editingEmployee, email: e.target.value })}
                placeholder="joao@primaqualita.com.br"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-department">Departamento</Label>
              <Input
                id="edit-department"
                value={editingEmployee?.department || ""}
                onChange={(e) => setEditingEmployee({ ...editingEmployee, department: e.target.value })}
                placeholder="Ex: Recursos Humanos"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-job-title">Cargo/Função</Label>
              <Input
                id="edit-job-title"
                value={editingEmployee?.job_title || ""}
                onChange={(e) => setEditingEmployee({ ...editingEmployee, job_title: e.target.value })}
                placeholder="Ex: Analista de Compliance"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-contract">Contrato de Gestão (opcional)</Label>
              <Select
                value={editingEmployee?.management_contract_id || undefined}
                onValueChange={(value) => setEditingEmployee({ ...editingEmployee, management_contract_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Nenhum contrato selecionado" />
                </SelectTrigger>
                <SelectContent>
                  {contracts?.map((contract) => (
                    <SelectItem key={contract.id} value={contract.id}>
                      {contract.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-900 dark:text-blue-100 font-medium mb-2">
                ℹ️ Informações de Acesso
              </p>
              <p className="text-xs text-blue-800 dark:text-blue-200">
                Para alterar o status de gestor, use o switch na tabela de colaboradores.
                Usuário e senha não podem ser alterados por segurança.
              </p>
            </div>
            <Button
              onClick={() => editEmployeeMutation.mutate(editingEmployee)}
              className="w-full"
              disabled={editEmployeeMutation.isPending || !editingEmployee?.name}
            >
              {editEmployeeMutation.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Validation Results Dialog */}
      <Dialog open={isValidationDialogOpen} onOpenChange={setIsValidationDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Resultados da Validação de CPFs</DialogTitle>
            <DialogDescription>
              Resultado da verificação junto à Receita Federal
            </DialogDescription>
          </DialogHeader>
          {validationResults && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-green-600">
                      {validationResults.filter((r: any) => r.isValid).length}
                    </div>
                    <p className="text-sm text-muted-foreground">CPFs Válidos</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-destructive">
                      {validationResults.filter((r: any) => !r.isValid).length}
                    </div>
                    <p className="text-sm text-muted-foreground">CPFs Inválidos</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{validationResults.length}</div>
                    <p className="text-sm text-muted-foreground">Total Validado</p>
                  </CardContent>
                </Card>
              </div>

              {validationResults.filter((r: any) => !r.isValid).length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>CPFs com Problemas Encontrados</AlertTitle>
                  <AlertDescription>
                    Alguns colaboradores possuem CPFs inválidos ou com dados inconsistentes.
                    Revise os dados abaixo.
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <h4 className="font-semibold">Detalhes da Validação:</h4>
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {validationResults
                    .filter((r: any) => !r.isValid)
                    .map((result: any, index: number) => (
                      <div key={index} className="p-3 border rounded-lg bg-destructive/5">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <span className="font-semibold">{result.employeeName}</span>
                            <span className="font-mono text-sm ml-2">{result.cpf}</span>
                          </div>
                          <Badge variant="destructive">Inválido</Badge>
                        </div>
                        <div className="text-sm space-y-1">
                          {result.error && (
                            <div className="text-destructive">
                              ❌ {result.error}
                            </div>
                          )}
                          {!result.cpfFormatValid && (
                            <div className="text-muted-foreground">
                              • Formato ou dígitos verificadores inválidos
                            </div>
                          )}
                          {result.birthDateMatches === false && (
                            <div className="text-muted-foreground">
                              • Data de nascimento não confere com CPF
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  {validationResults.filter((r: any) => r.isValid).length > 0 && (
                    <div className="p-3 border rounded-lg bg-green-50 dark:bg-green-950/20">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-600">✓</Badge>
                        <span className="text-sm font-medium">
                          {validationResults.filter((r: any) => r.isValid).length} colaborador(es) 
                          com CPF válido e verificado
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Button
                variant="outline"
                onClick={() => setIsValidationDialogOpen(false)}
                className="w-full"
              >
                Fechar
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {employeesWithoutUsers && employeesWithoutUsers.length > 0 && (
        <Alert className="border-orange-500/50 bg-orange-500/10">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertTitle className="text-orange-900 dark:text-orange-100">Colaboradores sem acesso ao sistema</AlertTitle>
          <AlertDescription className="text-orange-800 dark:text-orange-200">
            Existem {employeesWithoutUsers.length} colaborador(es) sem usuário criado. 
            Clique no botão "Criar {employeesWithoutUsers.length} Usuário(s)" acima para criar automaticamente os acessos.
            <br />
            <span className="text-sm mt-1 block opacity-80">
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
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              // Buscar dados completos do colaborador
                              const { data } = await supabase
                                .from('employees')
                                .select('*')
                                .eq('id', employee.id)
                                .single();
                              
                              if (data) {
                                setEditingEmployee(data);
                                setIsEditDialogOpen(true);
                              }
                            }}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteEmployeesMutation.mutate([employee.id])}
                            disabled={deleteEmployeesMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
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
