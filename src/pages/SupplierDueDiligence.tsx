import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Building2, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const SupplierDueDiligence = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");

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
    mutationFn: async (question: string) => {
      const maxOrder = questions?.length || 0;
      const { data, error } = await supabase
        .from('due_diligence_questions')
        .insert([{ question, question_order: maxOrder + 1 }])
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['due_diligence_questions'] });
      toast({ title: "Pergunta adicionada com sucesso!" });
      setIsQuestionDialogOpen(false);
      setNewQuestion("");
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Due Diligence de Fornecedores</h1>
          <p className="text-muted-foreground mt-1">Gerencie perguntas e respostas de fornecedores</p>
        </div>
        <Dialog open={isQuestionDialogOpen} onOpenChange={setIsQuestionDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nova Pergunta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Nova Pergunta</DialogTitle>
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
              <Button 
                onClick={() => addQuestionMutation.mutate(newQuestion)}
                className="w-full"
                disabled={addQuestionMutation.isPending || !newQuestion.trim()}
              >
                Adicionar Pergunta
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
                  <div key={question.id} className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
                      {index + 1}
                    </div>
                    <p className="text-sm flex-1">{question.question}</p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fornecedores Cadastrados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {suppliers?.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhum fornecedor cadastrado
                </p>
              ) : (
                suppliers?.map((supplier) => (
                  <div key={supplier.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <Building2 className="w-5 h-5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="font-medium">{supplier.company_name}</p>
                      <p className="text-sm text-muted-foreground">{supplier.cnpj}</p>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Link para Formulário Público</CardTitle>
        </CardHeader>
        <CardContent>
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
              Copiar Link
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Compartilhe este link com fornecedores para que eles preencham o formulário de due diligence
          </p>
        </CardContent>
      </Card>

      {suppliers && suppliers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Todos os Fornecedores</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Proprietário</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell className="font-medium">{supplier.company_name}</TableCell>
                    <TableCell>{supplier.cnpj}</TableCell>
                    <TableCell>{supplier.email}</TableCell>
                    <TableCell>{supplier.phone}</TableCell>
                    <TableCell>{supplier.owner}</TableCell>
                    <TableCell>{new Date(supplier.created_at).toLocaleDateString('pt-BR')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SupplierDueDiligence;
