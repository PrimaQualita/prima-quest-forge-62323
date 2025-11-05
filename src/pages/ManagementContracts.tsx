import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, FileText, Upload, Edit2, Calendar, RotateCw, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ContractCandlestickChart } from "@/components/contracts/ContractCandlestickChart";

const ManagementContracts = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isRenewalDialogOpen, setIsRenewalDialogOpen] = useState(false);
  const [isEditRenewalDialogOpen, setIsEditRenewalDialogOpen] = useState(false);
  const [renewalToDelete, setRenewalToDelete] = useState<any>(null);
  const [renewalToEdit, setRenewalToEdit] = useState<any>(null);
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [newContract, setNewContract] = useState({ name: "", description: "" });
  const [editContract, setEditContract] = useState<any>(null);
  const [renewalData, setRenewalData] = useState({ 
    renewal_start_date: "", 
    renewal_end_date: "", 
    notes: "" 
  });

  const { data: contracts } = useQuery({
    queryKey: ['management_contracts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('management_contracts')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: documents } = useQuery({
    queryKey: ['contract_documents', selectedContract?.id, selectedYear, selectedMonth],
    queryFn: async () => {
      if (!selectedContract) return [];
      const { data, error } = await supabase
        .from('contract_documents')
        .select('*')
        .eq('contract_id', selectedContract.id)
        .eq('year', selectedYear)
        .eq('month', selectedMonth)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedContract,
  });

  const { data: renewals } = useQuery({
    queryKey: ['contract_renewals', editContract?.id],
    queryFn: async () => {
      if (!editContract?.id) return [];
      const { data, error } = await supabase
        .from('contract_renewals')
        .select('*')
        .eq('contract_id', editContract.id)
        .order('renewal_end_date', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!editContract?.id,
  });

  const addContractMutation = useMutation({
    mutationFn: async (contract: typeof newContract) => {
      const { data, error } = await supabase
        .from('management_contracts')
        .insert([contract])
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['management_contracts'] });
      toast({ title: "Contrato criado com sucesso!" });
      setIsAddDialogOpen(false);
      setNewContract({ name: "", description: "" });
    },
  });

  const updateContractMutation = useMutation({
    mutationFn: async (contract: any) => {
      const { data, error } = await supabase
        .from('management_contracts')
        .update({
          name: contract.name,
          description: contract.description,
          start_date: contract.start_date,
          end_date: contract.end_date,
          is_active: contract.is_active,
        })
        .eq('id', contract.id)
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['management_contracts'] });
      toast({ title: "Contrato atualizado com sucesso!" });
      setIsEditDialogOpen(false);
      setEditContract(null);
    },
  });

  const addRenewalMutation = useMutation({
    mutationFn: async (renewal: { 
      contract_id: string; 
      renewal_start_date: string; 
      renewal_end_date: string; 
      notes: string 
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('contract_renewals')
        .insert([{
          contract_id: renewal.contract_id,
          renewal_start_date: renewal.renewal_start_date,
          renewal_end_date: renewal.renewal_end_date,
          notes: renewal.notes,
          created_by: user?.id
        }])
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract_renewals'] });
      queryClient.invalidateQueries({ queryKey: ['management_contracts'] });
      toast({ title: "Renovação adicionada com sucesso!" });
      setIsRenewalDialogOpen(false);
      setRenewalData({ 
        renewal_start_date: "", 
        renewal_end_date: "", 
        notes: "" 
      });
    },
  });

  const updateRenewalMutation = useMutation({
    mutationFn: async (renewal: { 
      id: string;
      renewal_start_date: string; 
      renewal_end_date: string; 
      notes: string 
    }) => {
      const { data, error } = await supabase
        .from('contract_renewals')
        .update({
          renewal_start_date: renewal.renewal_start_date,
          renewal_end_date: renewal.renewal_end_date,
          notes: renewal.notes,
        })
        .eq('id', renewal.id)
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract_renewals'] });
      queryClient.invalidateQueries({ queryKey: ['management_contracts'] });
      toast({ title: "Renovação atualizada com sucesso!" });
      setIsEditRenewalDialogOpen(false);
      setRenewalToEdit(null);
    },
  });

  const deleteRenewalMutation = useMutation({
    mutationFn: async (renewalId: string) => {
      const { error } = await supabase
        .from('contract_renewals')
        .delete()
        .eq('id', renewalId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract_renewals'] });
      queryClient.invalidateQueries({ queryKey: ['management_contracts'] });
      toast({ title: "Renovação removida com sucesso!" });
      setRenewalToDelete(null);
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedContract) return;
    
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Aqui você implementaria o upload para storage
      // Por enquanto, apenas simulando o registro no banco
      const { error } = await supabase
        .from('contract_documents')
        .insert({
          contract_id: selectedContract.id,
          file_name: file.name,
          file_path: `contracts/${selectedContract.id}/${selectedYear}/${selectedMonth}/${file.name}`,
          year: selectedYear,
          month: selectedMonth,
          uploaded_by: user?.id,
        });

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['contract_documents'] });
      toast({ title: "Documento enviado com sucesso!" });
    } catch (error: any) {
      toast({
        title: "Erro ao enviar documento",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const years = [2024, 2025, 2026, 2027, 2028];

  return (
    <div className="space-y-6 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground uppercase">Contratos de Gestão</h1>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Novo Contrato
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Novo Contrato</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Contrato</Label>
                <Input
                  id="name"
                  value={newContract.name}
                  onChange={(e) => setNewContract({ ...newContract, name: e.target.value })}
                  placeholder="Ex: Contrato Hospital Municipal"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={newContract.description}
                  onChange={(e) => setNewContract({ ...newContract, description: e.target.value })}
                  placeholder="Descrição do contrato..."
                  rows={4}
                />
              </div>
              <Button 
                onClick={() => addContractMutation.mutate(newContract)}
                className="w-full"
                disabled={addContractMutation.isPending}
              >
                Adicionar Contrato
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Contrato</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nome do Contrato</Label>
                <Input
                  id="edit-name"
                  value={editContract?.name || ""}
                  onChange={(e) => setEditContract({ ...editContract, name: e.target.value })}
                  placeholder="Ex: Contrato Hospital Municipal"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Descrição</Label>
                <Textarea
                  id="edit-description"
                  value={editContract?.description || ""}
                  onChange={(e) => setEditContract({ ...editContract, description: e.target.value })}
                  placeholder="Descrição do contrato..."
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-start-date">Data de Início da Vigência (Opcional)</Label>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <Input
                    id="edit-start-date"
                    type="date"
                    value={editContract?.start_date || ""}
                    onChange={(e) => setEditContract({ 
                      ...editContract, 
                      start_date: e.target.value
                    })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-end-date">
                  Data de Vigência 
                  {renewals && renewals.length > 0 && (
                    <span className="text-xs text-muted-foreground ml-2">(Calculada automaticamente)</span>
                  )}
                </Label>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <Input
                    id="edit-end-date"
                    type="date"
                    value={editContract?.end_date || ""}
                    onChange={(e) => setEditContract({ 
                      ...editContract, 
                      end_date: e.target.value,
                      is_active: e.target.value ? new Date(e.target.value) > new Date() : true
                    })}
                    disabled={renewals && renewals.length > 0}
                  />
                </div>
                {editContract?.end_date && (
                  <p className="text-sm text-muted-foreground">
                    Status: {new Date(editContract.end_date) > new Date() ? (
                      <span className="text-green-600 font-medium">Ativo</span>
                    ) : (
                      <span className="text-red-600 font-medium">Encerrado</span>
                    )}
                  </p>
                )}
                {renewals && renewals.length > 0 && (
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    💡 A data de vigência é atualizada automaticamente com base na última renovação
                  </p>
                )}
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <Label>Renovações do Contrato</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsRenewalDialogOpen(true)}
                  >
                    <RotateCw className="w-4 h-4 mr-2" />
                    Adicionar Renovação
                  </Button>
                </div>
                
                {renewals && renewals.length > 0 && (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {renewals.map((renewal: any) => (
                      <div key={renewal.id} className="p-3 border rounded-lg bg-muted/50 group hover:bg-muted transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              Registrada em {new Date(renewal.created_at).toLocaleDateString('pt-BR')}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0"
                                onClick={() => {
                                  setRenewalToEdit(renewal);
                                  setIsEditRenewalDialogOpen(true);
                                }}
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                onClick={() => setRenewalToDelete(renewal)}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div>
                            <span className="font-medium">Início da vigência:</span> {renewal.renewal_start_date.split('T')[0].split('-').reverse().join('/')}
                          </div>
                          <div>
                            <span className="font-medium">Fim da vigência:</span> {renewal.renewal_end_date.split('T')[0].split('-').reverse().join('/')}
                          </div>
                        </div>
                        {renewal.notes && (
                          <p className="text-sm text-muted-foreground mt-2 italic">{renewal.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                {(!renewals || renewals.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhuma renovação registrada
                  </p>
                )}
              </div>

              <Button 
                onClick={() => updateContractMutation.mutate(editContract)}
                className="w-full"
                disabled={updateContractMutation.isPending}
              >
                Salvar Alterações
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isRenewalDialogOpen} onOpenChange={setIsRenewalDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Renovação</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="renewal-start-date">Data de Início do Período Renovado</Label>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <Input
                    id="renewal-start-date"
                    type="date"
                    value={renewalData.renewal_start_date}
                    onChange={(e) => setRenewalData({ ...renewalData, renewal_start_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="renewal-end-date">Data de Fim do Período Renovado</Label>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <Input
                    id="renewal-end-date"
                    type="date"
                    value={renewalData.renewal_end_date}
                    onChange={(e) => setRenewalData({ ...renewalData, renewal_end_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="renewal-notes">Observações (Opcional)</Label>
                <Textarea
                  id="renewal-notes"
                  value={renewalData.notes}
                  onChange={(e) => setRenewalData({ ...renewalData, notes: e.target.value })}
                  placeholder="Adicione observações sobre esta renovação..."
                  rows={3}
                />
              </div>
              <Button 
                onClick={() => {
                  if (editContract?.id && renewalData.renewal_start_date && renewalData.renewal_end_date) {
                    addRenewalMutation.mutate({
                      contract_id: editContract.id,
                      renewal_start_date: renewalData.renewal_start_date,
                      renewal_end_date: renewalData.renewal_end_date,
                      notes: renewalData.notes
                    });
                  }
                }}
                className="w-full"
                disabled={!renewalData.renewal_start_date || !renewalData.renewal_end_date || addRenewalMutation.isPending}
              >
                Adicionar Renovação
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog de Editar Renovação */}
        <Dialog open={isEditRenewalDialogOpen} onOpenChange={setIsEditRenewalDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Renovação</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-renewal-start-date">Data de Início do Período Renovado</Label>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <Input
                    id="edit-renewal-start-date"
                    type="date"
                    value={renewalToEdit?.renewal_start_date || ""}
                    onChange={(e) => setRenewalToEdit({ ...renewalToEdit, renewal_start_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-renewal-end-date">Data de Fim do Período Renovado</Label>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <Input
                    id="edit-renewal-end-date"
                    type="date"
                    value={renewalToEdit?.renewal_end_date || ""}
                    onChange={(e) => setRenewalToEdit({ ...renewalToEdit, renewal_end_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-renewal-notes">Observações (Opcional)</Label>
                <Textarea
                  id="edit-renewal-notes"
                  value={renewalToEdit?.notes || ""}
                  onChange={(e) => setRenewalToEdit({ ...renewalToEdit, notes: e.target.value })}
                  placeholder="Adicione observações sobre esta renovação..."
                  rows={3}
                />
              </div>
              <Button 
                onClick={() => {
                  if (renewalToEdit?.id && renewalToEdit.renewal_start_date && renewalToEdit.renewal_end_date) {
                    updateRenewalMutation.mutate({
                      id: renewalToEdit.id,
                      renewal_start_date: renewalToEdit.renewal_start_date,
                      renewal_end_date: renewalToEdit.renewal_end_date,
                      notes: renewalToEdit.notes || ""
                    });
                  }
                }}
                className="w-full"
                disabled={!renewalToEdit?.renewal_start_date || !renewalToEdit?.renewal_end_date || updateRenewalMutation.isPending}
              >
                Salvar Alterações
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Alert Dialog de Confirmar Exclusão */}
        <AlertDialog open={!!renewalToDelete} onOpenChange={(open) => !open && setRenewalToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remover Renovação</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja remover esta renovação? A data de vigência do contrato será recalculada automaticamente com base nas renovações restantes.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (renewalToDelete?.id) {
                    deleteRenewalMutation.mutate(renewalToDelete.id);
                  }
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Remover
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Seção de Gráficos - Todos os Contratos */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">Análises de Processos de Compras</h2>
          <Tabs defaultValue={selectedYear.toString()} onValueChange={(v) => setSelectedYear(Number(v))}>
            <TabsList>
              {years.map((year) => (
                <TabsTrigger key={year} value={year.toString()}>
                  {year}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {contracts?.map((contract) => (
            <ContractCandlestickChart 
              key={contract.id}
              contractId={contract.id}
              contractName={contract.name}
              year={selectedYear}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Contratos de Gestão</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {contracts?.map((contract) => (
                <div 
                  key={contract.id} 
                  className={`flex items-center gap-2 p-2 rounded-lg transition-all ${
                    !contract.is_active 
                      ? 'bg-red-50/50 dark:bg-red-950/20 shadow-[0_0_15px_rgba(239,68,68,0.15)]' 
                      : 'bg-green-50/50 dark:bg-green-950/20 shadow-[0_0_15px_rgba(34,197,94,0.15)]'
                  }`}
                >
                  <Button
                    variant={selectedContract?.id === contract.id ? "default" : "outline"}
                    className="flex-1 justify-start"
                    onClick={() => setSelectedContract(contract)}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    {contract.name}
                    {contract.is_active ? (
                      <Badge variant="default" className="ml-2 bg-green-600 hover:bg-green-700">Vigente</Badge>
                    ) : (
                      <Badge variant="destructive" className="ml-2">Encerrado</Badge>
                    )}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setEditContract(contract);
                      setIsEditDialogOpen(true);
                    }}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {selectedContract && (
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{selectedContract.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{selectedContract.description}</p>
              </CardHeader>
              <CardContent>
              <Tabs defaultValue={selectedYear.toString()} onValueChange={(v) => setSelectedYear(Number(v))}>
                <TabsList className="grid grid-cols-5 mb-4">
                  {years.map((year) => (
                    <TabsTrigger key={year} value={year.toString()}>
                      {year}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {years.map((year) => (
                  <TabsContent key={year} value={year.toString()} className="space-y-4">
                    <div className="grid grid-cols-4 gap-2">
                      {months.map((month, index) => (
                        <Button
                          key={month}
                          variant={selectedMonth === index + 1 ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedMonth(index + 1)}
                        >
                          {month}
                        </Button>
                      ))}
                    </div>

                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-medium">
                          Documentos - {months[selectedMonth - 1]}/{selectedYear}
                        </h3>
                        <Button size="sm" asChild>
                          <label className="cursor-pointer">
                            <Upload className="w-4 h-4 mr-2" />
                            Upload
                            <input
                              type="file"
                              className="hidden"
                              onChange={handleFileUpload}
                              accept=".pdf,.doc,.docx"
                            />
                          </label>
                        </Button>
                      </div>

                      <div className="space-y-2">
                        {documents?.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-8">
                            Nenhum documento enviado para este período
                          </p>
                        ) : (
                          documents?.map((doc) => (
                            <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm">{doc.file_name}</span>
                              </div>
                              <Badge variant="outline">
                                {new Date(doc.created_at).toLocaleDateString('pt-BR')}
                              </Badge>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagementContracts;
