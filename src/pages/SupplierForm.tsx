import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle } from "lucide-react";

const SupplierForm = () => {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    company_name: "",
    cnpj: "",
    email: "",
    phone: "",
    owner: "",
    partners: "",
    responses: {} as Record<string, string>,
  });

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

  const submitMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase
        .from('supplier_due_diligence')
        .insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      setSubmitted(true);
      toast({ title: "Formulário enviado com sucesso!" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao enviar formulário",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitMutation.mutate(formData);
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-secondary/20 p-4">
        <Card className="w-full max-w-2xl text-center">
          <CardHeader>
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-secondary/10 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-secondary" />
            </div>
            <CardTitle className="text-2xl">Formulário Enviado!</CardTitle>
            <CardDescription>
              Obrigado por preencher o formulário de due diligence. Entraremos em contato em breve.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-secondary/20 p-4">
      <div className="max-w-4xl mx-auto py-8">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
              <img src="/logo-prima-qualita.png" alt="Prima Qualitá" className="h-16 w-16 object-contain" />
            </div>
            <CardTitle className="text-3xl">Formulário de Due Diligence</CardTitle>
            <CardDescription>
              Prima Qualitá Saúde - Cadastro de Fornecedores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Informações da Empresa</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="company_name">Razão Social *</Label>
                  <Input
                    id="company_name"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ *</Label>
                  <Input
                    id="cnpj"
                    value={formData.cnpj}
                    onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                    placeholder="00.000.000/0000-00"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="(00) 00000-0000"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="owner">Sócio Proprietário *</Label>
                  <Input
                    id="owner"
                    value={formData.owner}
                    onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="partners">Sócios Cotistas</Label>
                  <Textarea
                    id="partners"
                    value={formData.partners}
                    onChange={(e) => setFormData({ ...formData, partners: e.target.value })}
                    placeholder="Liste os sócios cotistas..."
                    rows={3}
                  />
                </div>
              </div>

              {questions && questions.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Questionário de Due Diligence</h3>
                  {questions.map((question, index) => (
                    <div key={question.id} className="space-y-2">
                      <Label htmlFor={`question-${question.id}`}>
                        {index + 1}. {question.question} *
                      </Label>
                      <Textarea
                        id={`question-${question.id}`}
                        value={formData.responses[question.id] || ""}
                        onChange={(e) => setFormData({
                          ...formData,
                          responses: {
                            ...formData.responses,
                            [question.id]: e.target.value
                          }
                        })}
                        placeholder="Digite sua resposta..."
                        rows={4}
                        required
                      />
                    </div>
                  ))}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={submitMutation.isPending}>
                {submitMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enviar Formulário
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SupplierForm;
