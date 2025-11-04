import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
    
    // Validar que todas as perguntas foram respondidas
    if (questions && questions.length > 0) {
      const allAnswered = questions.every(q => formData.responses[q.id]);
      if (!allAnswered) {
        toast({
          title: "Respostas incompletas",
          description: "Por favor, responda todas as perguntas",
          variant: "destructive",
        });
        return;
      }
    }
    
    submitMutation.mutate(formData);
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 5) return `${numbers.slice(0, 2)}.${numbers.slice(2)}`;
    if (numbers.length <= 8) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5)}`;
    if (numbers.length <= 12) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8)}`;
    return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8, 12)}-${numbers.slice(12, 14)}`;
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
              Obrigado por preencher o formulário de due diligence. Entraremos em contato em breve com a avaliação do seu cadastro.
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
            <CardTitle className="text-3xl">Cadastro de Fornecedores</CardTitle>
            <CardDescription>
              Prima Qualitá Saúde - Formulário de Due Diligence
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
                    onChange={(e) => setFormData({ ...formData, cnpj: formatCNPJ(e.target.value) })}
                    placeholder="00.000.000/0000-00"
                    maxLength={18}
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
                    <Label htmlFor="phone">Telefone (DDD + Número) *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                      placeholder="(00) 00000-0000"
                      maxLength={15}
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
                  <Input
                    id="partners"
                    value={formData.partners}
                    onChange={(e) => setFormData({ ...formData, partners: e.target.value })}
                    placeholder="Liste os sócios cotistas (opcional)"
                  />
                </div>
              </div>

              {questions && questions.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Questionário de Due Diligence</h3>
                  {questions.map((question, index) => (
                    <div key={question.id} className="space-y-3 p-4 border rounded-lg">
                      <Label className="text-base">
                        {index + 1}. {question.question} *
                      </Label>
                      <RadioGroup
                        value={formData.responses[question.id] || ""}
                        onValueChange={(value) => setFormData({
                          ...formData,
                          responses: {
                            ...formData.responses,
                            [question.id]: value
                          }
                        })}
                        required
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="sim" id={`${question.id}-sim`} />
                          <Label htmlFor={`${question.id}-sim`} className="font-normal cursor-pointer">
                            SIM
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="nao" id={`${question.id}-nao`} />
                          <Label htmlFor={`${question.id}-nao`} className="font-normal cursor-pointer">
                            NÃO
                          </Label>
                        </div>
                      </RadioGroup>
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
