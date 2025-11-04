import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Calendar, AlertCircle, CheckCircle, Clock, LogOut, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { generateSupplierPDF } from "@/utils/generateSupplierPDF";

const SupplierPortal = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Verificar autenticação
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Acesso negado",
          description: "Você precisa fazer login para acessar esta página",
          variant: "destructive",
        });
        navigate('/auth');
        return;
      }
      
      setUserId(session.user.id);
    };
    
    checkAuth();
  }, [navigate, toast]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const { data: supplierData, isLoading } = useQuery({
    queryKey: ['supplier_data', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from('supplier_due_diligence')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-secondary/20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!supplierData || supplierData.status !== 'approved') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-secondary/20 p-4">
        <Card className="w-full max-w-2xl text-center">
          <CardHeader>
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-muted flex items-center justify-center">
              <Clock className="h-10 w-10 text-muted-foreground" />
            </div>
            <CardTitle className="text-2xl">
              {supplierData?.status === 'rejected' ? 'Cadastro Rejeitado' : 'Cadastro em Análise'}
            </CardTitle>
            <CardDescription>
              {supplierData?.status === 'rejected' 
                ? `Seu cadastro foi rejeitado. Motivo: ${supplierData.rejection_reason}` 
                : 'Seu cadastro está sendo analisado pela nossa equipe. Você receberá um e-mail assim que for aprovado.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleLogout} variant="outline">
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const expiresAt = supplierData.certificate_expires_at ? new Date(supplierData.certificate_expires_at) : null;
  const daysUntilExpiry = expiresAt ? differenceInDays(expiresAt, new Date()) : null;
  const needsRenewal = daysUntilExpiry !== null && daysUntilExpiry <= 30;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-secondary/20 p-4">
      <div className="max-w-4xl mx-auto py-8 space-y-6">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <img src="/logo-prima-qualita.png" alt="Prima Qualitá" className="h-16 w-16 object-contain" />
                </div>
                <CardTitle className="text-3xl">Portal do Fornecedor</CardTitle>
                <CardDescription>Prima Qualitá Saúde</CardDescription>
              </div>
              <Button onClick={handleLogout} variant="outline" size="sm">
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Status do Cadastro</CardTitle>
                <CardDescription>Informações sobre seu cadastro</CardDescription>
              </div>
              <Badge className="bg-green-500 text-white">
                <CheckCircle className="w-4 h-4 mr-1" />
                Aprovado
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Razão Social</p>
              <p className="text-lg font-semibold">{supplierData.company_name}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">CNPJ</p>
                <p className="font-medium">{supplierData.cnpj}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">E-mail</p>
                <p className="font-medium">{supplierData.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {expiresAt && (
          <Card className={needsRenewal ? "border-destructive" : ""}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Status do Cadastro</CardTitle>
                  <CardDescription>Informações sobre validade</CardDescription>
                </div>
                <Calendar className="w-6 h-6 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Válido até</p>
                  <p className="text-lg font-semibold">
                    {format(expiresAt, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                  {daysUntilExpiry !== null && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {daysUntilExpiry > 0 ? `${daysUntilExpiry} dias restantes` : 'Expirado'}
                    </p>
                  )}
                </div>
              </div>

              {needsRenewal && (
                <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive rounded-lg">
                  <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-destructive">Renovação Necessária</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Seu certificado vence em {daysUntilExpiry} dias. Entre em contato para renovar seu cadastro.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Documentos e Relatórios</CardTitle>
            <CardDescription>Baixe seus documentos de due diligence</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => supplierData && generateSupplierPDF(supplierData, questions || [])}
            >
              <FileText className="w-4 h-4 mr-2" />
              Relatório de Due Diligence (PDF)
            </Button>

            {supplierData.certificate_file_path && (
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => window.open(supplierData.certificate_file_path, '_blank')}
              >
                <Download className="w-4 h-4 mr-2" />
                Certificado do Fornecedor
              </Button>
            )}

            {supplierData.kpmg_report_file_path && (
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => window.open(supplierData.kpmg_report_file_path, '_blank')}
              >
                <Download className="w-4 h-4 mr-2" />
                Relatório KPMG
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informações de Contato</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-2">
              Em caso de dúvidas ou para renovação do cadastro, entre em contato:
            </p>
            <p className="font-medium">compliance@primaqualita.com.br</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SupplierPortal;
