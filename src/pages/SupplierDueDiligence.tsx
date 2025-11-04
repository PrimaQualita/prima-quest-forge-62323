import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Building2, Check, X, Eye, Pencil, Download, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, addYears } from "date-fns";
import { ptBR } from "date-fns/locale";
import { generateSupplierPDF } from "@/utils/generateSupplierPDF";

const SupplierDueDiligence = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [yesPoints, setYesPoints] = useState<number>(0);
  const [noPoints, setNoPoints] = useState<number>(200);
  const [editingQuestion, setEditingQuestion] = useState<any>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [kpmgReportFile, setKpmgReportFile] = useState<File | null>(null);
  const [certificateExpiry, setCertificateExpiry] = useState<string>(
    format(addYears(new Date(), 1), "yyyy-MM-dd")
  );

  const { data: questions } = useQuery({
    queryKey: ['due_diligence_questions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('due_diligence_questions')
        .select('*')
        .eq('is_active', true)
        .order('question_order', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: suppliers } = useQuery({
    queryKey: ['supplier_due_diligence'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('supplier_due_diligence')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addQuestionMutation = useMutation({
    mutationFn: async ({ question, yes_points, no_points }: { question: string; yes_points: number; no_points: number }) => {
      const maxOrder = questions?.length || 0;
      const { data, error } = await supabase
        .from('due_diligence_questions')
        .insert([{ question, question_order: maxOrder + 1, yes_points, no_points }])
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['due_diligence_questions'] });
      toast({ title: "Pergunta adicionada com sucesso!" });
      setIsQuestionDialogOpen(false);
      setNewQuestion("");
      setYesPoints(0);
      setNoPoints(200);
      setEditingQuestion(null);
    },
  });

  const updateQuestionMutation = useMutation({
    mutationFn: async ({ id, question, yes_points, no_points }: { id: string; question: string; yes_points: number; no_points: number }) => {
      const { data, error } = await supabase
        .from('due_diligence_questions')
        .update({ question, yes_points, no_points })
        .eq('id', id)
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['due_diligence_questions'] });
      toast({ title: "Pergunta atualizada com sucesso!" });
      setIsQuestionDialogOpen(false);
      setNewQuestion("");
      setYesPoints(0);
      setNoPoints(200);
      setEditingQuestion(null);
    },
  });

  const reviewSupplierMutation = useMutation({
    mutationFn: async ({ 
      id, 
      status, 
      rejection_reason, 
      certificate_expires_at,
      certificate_file,
      kpmg_report_file
    }: { 
      id: string; 
      status: 'approved' | 'rejected'; 
      rejection_reason?: string;
      certificate_expires_at?: string;
      certificate_file?: File | null;
      kpmg_report_file?: File | null;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      let certificatePath = null;
      let kpmgReportPath = null;

      // Upload do certificado se fornecido
      if (certificate_file) {
        const fileExt = certificate_file.name.split('.').pop();
        const fileName = `${id}/certificate-${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('supplier-documents')
          .upload(fileName, certificate_file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('supplier-documents')
          .getPublicUrl(fileName);
        
        certificatePath = publicUrl;
      }

      // Upload do relatório KPMG se fornecido
      if (kpmg_report_file) {
        const fileExt = kpmg_report_file.name.split('.').pop();
        const fileName = `${id}/kpmg-report-${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('supplier-documents')
          .upload(fileName, kpmg_report_file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('supplier-documents')
          .getPublicUrl(fileName);
        
        kpmgReportPath = publicUrl;
      }
      
      const updateData: any = {
        status,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user?.id,
        rejection_reason: rejection_reason || null,
        certificate_expires_at: certificate_expires_at || null,
      };

      if (certificatePath) {
        updateData.certificate_file_path = certificatePath;
      }

      if (kpmgReportPath) {
        updateData.kpmg_report_file_path = kpmgReportPath;
      }

      const { error } = await supabase
        .from('supplier_due_diligence')
        .update(updateData)
        .eq('id', id);
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier_due_diligence'] });
      toast({ title: "Fornecedor avaliado com sucesso!" });
      setIsReviewDialogOpen(false);
      setSelectedSupplier(null);
      setRejectionReason("");
      setCertificateFile(null);
      setKpmgReportFile(null);
    },
  });

  const handleApprove = () => {
    if (selectedSupplier) {
      reviewSupplierMutation.mutate({
        id: selectedSupplier.id,
        status: 'approved',
        certificate_expires_at: certificateExpiry,
        certificate_file: certificateFile,
        kpmg_report_file: kpmgReportFile,
      });
    }
  };

  const handleReject = () => {
    if (selectedSupplier && rejectionReason.trim()) {
      reviewSupplierMutation.mutate({
        id: selectedSupplier.id,
        status: 'rejected',
        rejection_reason: rejectionReason,
      });
    } else {
      toast({
        title: "Motivo obrigatório",
        description: "Por favor, informe o motivo da rejeição",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500">Aprovado</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejeitado</Badge>;
      default:
        return <Badge variant="outline">Pendente</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Due Diligence de Fornecedores</h1>
          <p className="text-muted-foreground mt-1">Gerencie perguntas e avalie fornecedores</p>
        </div>
        <Dialog open={isQuestionDialogOpen} onOpenChange={(open) => {
          setIsQuestionDialogOpen(open);
          if (!open) {
            setNewQuestion("");
            setYesPoints(0);
            setNoPoints(200);
            setEditingQuestion(null);
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nova Pergunta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingQuestion ? "Editar Pergunta" : "Adicionar Nova Pergunta"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="question">Pergunta</Label>
                <Textarea
                  id="question"
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  placeholder="Digite a pergunta para due diligence..."
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="yes-points">Pontos para "SIM"</Label>
                  <select
                    id="yes-points"
                    value={yesPoints}
                    onChange={(e) => setYesPoints(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value={0}>0 (Aprovado)</option>
                    <option value={200}>200 (Reprovado)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="no-points">Pontos para "NÃO"</Label>
                  <select
                    id="no-points"
                    value={noPoints}
                    onChange={(e) => setNoPoints(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value={0}>0 (Aprovado)</option>
                    <option value={200}>200 (Reprovado)</option>
                  </select>
                </div>
              </div>
              <Button 
                onClick={() => {
                  if (editingQuestion) {
                    updateQuestionMutation.mutate({
                      id: editingQuestion.id,
                      question: newQuestion,
                      yes_points: yesPoints,
                      no_points: noPoints
                    });
                  } else {
                    addQuestionMutation.mutate({
                      question: newQuestion,
                      yes_points: yesPoints,
                      no_points: noPoints
                    });
                  }
                }}
                className="w-full"
                disabled={addQuestionMutation.isPending || updateQuestionMutation.isPending || !newQuestion.trim()}
              >
                {editingQuestion ? "Atualizar Pergunta" : "Adicionar Pergunta"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Perguntas Ativas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {questions?.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhuma pergunta cadastrada
                </p>
              ) : (
                questions?.map((question, index) => (
                  <div key={question.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm mb-2">{question.question}</p>
                      <div className="flex gap-2 text-xs">
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          SIM: {question.yes_points === 0 ? "0 pts (✓)" : "200 pts (✗)"}
                        </Badge>
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                          NÃO: {question.no_points === 0 ? "0 pts (✓)" : "200 pts (✗)"}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingQuestion(question);
                        setNewQuestion(question.question);
                        setYesPoints(question.yes_points);
                        setNoPoints(question.no_points);
                        setIsQuestionDialogOpen(true);
                      }}
                      className="flex-shrink-0"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Link para Formulário</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Input
                  value={`${window.location.origin}/supplier-form`}
                  readOnly
                  className="flex-1"
                />
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/supplier-form`);
                    toast({ title: "Link copiado!" });
                  }}
                >
                  Copiar
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Compartilhe este link com fornecedores para preenchimento do formulário
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {suppliers && suppliers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Fornecedores Cadastrados</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Data Cadastro</TableHead>
                  <TableHead>Validade</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell>{getStatusBadge(supplier.status)}</TableCell>
                    <TableCell className="font-medium">{supplier.company_name}</TableCell>
                    <TableCell>{supplier.cnpj}</TableCell>
                    <TableCell>{supplier.email}</TableCell>
                    <TableCell>
                      <Badge variant={supplier.total_score >= 200 ? "destructive" : "default"}>
                        {supplier.total_score} pts
                      </Badge>
                    </TableCell>
                    <TableCell>{format(new Date(supplier.created_at), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                    <TableCell>
                      {supplier.certificate_expires_at 
                        ? format(new Date(supplier.certificate_expires_at), "dd/MM/yyyy", { locale: ptBR })
                        : "-"
                      }
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedSupplier(supplier);
                            setIsReviewDialogOpen(true);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Avaliar
                        </Button>
                        {supplier.status !== 'pending' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => generateSupplierPDF(supplier, questions || [])}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            PDF
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Avaliar Fornecedor</DialogTitle>
          </DialogHeader>
          {selectedSupplier && (
            <div className="space-y-6 py-4">
              <div className="space-y-4">
                <h3 className="font-semibold">Informações da Empresa</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Razão Social</p>
                    <p className="font-medium">{selectedSupplier.company_name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">CNPJ</p>
                    <p className="font-medium">{selectedSupplier.cnpj}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedSupplier.email}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Telefone</p>
                    <p className="font-medium">{selectedSupplier.phone}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Proprietário</p>
                    <p className="font-medium">{selectedSupplier.owner}</p>
                  </div>
                  {selectedSupplier.partners && (
                    <div>
                      <p className="text-muted-foreground">Sócios</p>
                      <p className="font-medium">{selectedSupplier.partners}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-muted-foreground">Score Total</p>
                    <Badge variant={selectedSupplier.total_score >= 200 ? "destructive" : "default"} className="text-base">
                      {selectedSupplier.total_score} pontos
                    </Badge>
                  </div>
                </div>
              </div>

              {selectedSupplier.certificate_file_path && (
                <div className="space-y-2">
                  <h3 className="font-semibold">Certificado</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(selectedSupplier.certificate_file_path, '_blank')}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Baixar Certificado
                  </Button>
                </div>
              )}

              {selectedSupplier.kpmg_report_file_path && (
                <div className="space-y-2">
                  <h3 className="font-semibold">Relatório KPMG</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(selectedSupplier.kpmg_report_file_path, '_blank')}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Baixar Relatório KPMG
                  </Button>
                </div>
              )}

              {selectedSupplier.responses && Object.keys(selectedSupplier.responses).length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold">Respostas do Questionário</h3>
                  {questions?.map((question, index) => (
                    <div key={question.id} className="p-3 border rounded-lg">
                      <p className="text-sm font-medium mb-2">
                        {index + 1}. {question.question}
                      </p>
                      <Badge variant={selectedSupplier.responses[question.id] === 'sim' ? 'default' : 'secondary'}>
                        {selectedSupplier.responses[question.id]?.toUpperCase() || 'NÃO RESPONDIDA'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}

              {selectedSupplier.status === 'pending' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="certificate-expiry">Data de Validade do Certificado</Label>
                    <Input
                      id="certificate-expiry"
                      type="date"
                      value={certificateExpiry}
                      onChange={(e) => setCertificateExpiry(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="certificate-upload">Certificado do Fornecedor (PDF - Opcional)</Label>
                    <Input
                      id="certificate-upload"
                      type="file"
                      accept=".pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file && file.size > 10 * 1024 * 1024) {
                          toast({
                            title: "Arquivo muito grande",
                            description: "O arquivo deve ter no máximo 10MB",
                            variant: "destructive"
                          });
                          e.target.value = '';
                          return;
                        }
                        setCertificateFile(file || null);
                      }}
                    />
                    {certificateFile && (
                      <p className="text-sm text-muted-foreground">
                        Arquivo selecionado: {certificateFile.name} ({(certificateFile.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="kpmg-report">Relatório KPMG (PDF - Opcional)</Label>
                    <Input
                      id="kpmg-report"
                      type="file"
                      accept=".pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file && file.size > 10 * 1024 * 1024) {
                          toast({
                            title: "Arquivo muito grande",
                            description: "O arquivo deve ter no máximo 10MB",
                            variant: "destructive"
                          });
                          e.target.value = '';
                          return;
                        }
                        setKpmgReportFile(file || null);
                      }}
                    />
                    {kpmgReportFile && (
                      <p className="text-sm text-muted-foreground">
                        Arquivo selecionado: {kpmgReportFile.name} ({(kpmgReportFile.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rejection-reason">Motivo da Rejeição (opcional)</Label>
                    <Textarea
                      id="rejection-reason"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Descreva o motivo caso vá rejeitar..."
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={handleApprove}
                      disabled={reviewSupplierMutation.isPending}
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Aprovar
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={handleReject}
                      disabled={reviewSupplierMutation.isPending}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Rejeitar
                    </Button>
                  </div>
                </>
              )}

              {selectedSupplier.status !== 'pending' && (
                <>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm">
                      <strong>Status:</strong> {getStatusBadge(selectedSupplier.status)}
                    </p>
                    {selectedSupplier.reviewed_at && (
                      <p className="text-sm mt-2">
                        <strong>Avaliado em:</strong>{" "}
                        {format(new Date(selectedSupplier.reviewed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    )}
                    {selectedSupplier.rejection_reason && (
                      <p className="text-sm mt-2">
                        <strong>Motivo:</strong> {selectedSupplier.rejection_reason}
                      </p>
                    )}
                  </div>
                  
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => generateSupplierPDF(selectedSupplier, questions || [])}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Gerar Relatório em PDF
                  </Button>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SupplierDueDiligence;
