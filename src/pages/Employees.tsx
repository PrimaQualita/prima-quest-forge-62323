import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, UserPlus, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const Employees = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
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
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select(`
          *,
          management_contracts:management_contract_id (
            id,
            name
          )
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

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

      // Insert employee with cleaned CPF
      const { data, error } = await supabase
        .from('employees')
        .insert([{ ...employee, cpf: cpfNumbers }])
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
        const rows = text.split('\n').slice(1); // Skip header
        
        // Fetch all contracts to map names to IDs
        const { data: contracts } = await supabase
          .from('management_contracts')
          .select('id, name');
        
        const contractMap = new Map(contracts?.map(c => [c.name, c.id]) || []);
        
        const employeesData = rows
          .filter(row => row.trim())
          .map(row => {
            const [name, cpf, birth_date, phone, email, department, job_title, contract_name] = row.split(';').map(s => s.trim());
            
            // Look up contract ID by name, or set to null if not found
            const management_contract_id = contract_name && contractMap.has(contract_name) 
              ? contractMap.get(contract_name) 
              : null;
            
            return { 
              name, 
              cpf, 
              birth_date, 
              phone: phone || null, 
              email: email || null,
              department: department || null,
              job_title: job_title || null,
              management_contract_id
            };
          });

        const { error } = await supabase
          .from('employees')
          .insert(employeesData);

        if (error) throw error;

        queryClient.invalidateQueries({ queryKey: ['employees'] });
        toast({ title: "Planilha importada com sucesso!" });
      } catch (error: any) {
        toast({ 
          title: "Erro ao importar planilha", 
          description: error.message,
          variant: "destructive" 
        });
      }
    };
    reader.readAsText(file);
  };

  const filteredEmployees = employees?.filter(emp =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.cpf.includes(searchTerm) ||
    emp.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground uppercase">GESTÃO DE COLABORADORES</h1>
          <p className="text-muted-foreground mt-1">Gerencie os colaboradores e suas informações</p>
        </div>
        <div className="flex gap-2">
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

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar por nome, CPF ou e-mail..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center py-8 text-muted-foreground">Carregando...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Gestor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees?.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium">{employee.name}</TableCell>
                    <TableCell>{employee.cpf}</TableCell>
                    <TableCell>{employee.email}</TableCell>
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Employees;
