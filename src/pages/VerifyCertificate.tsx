import { useState } from "react";
import { Search, CheckCircle2, XCircle, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CertificateData {
  verification_code: string;
  employee_name: string;
  training_title: string;
  completion_date: string;
  score: number;
  issued_at: string;
}

export default function VerifyCertificate() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [certificate, setCertificate] = useState<CertificateData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const { toast } = useToast();

  const handleVerify = async () => {
    if (!code.trim()) {
      toast({
        title: "Digite um código",
        description: "Por favor, insira o código de verificação do certificado.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setNotFound(false);
    setCertificate(null);

    try {
      const { data, error } = await supabase
        .from("certificates")
        .select("*")
        .eq("verification_code", code.toUpperCase().trim())
        .single();

      if (error || !data) {
        setNotFound(true);
      } else {
        setCertificate(data);
      }
    } catch (error) {
      console.error("Erro ao verificar certificado:", error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleVerify();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-primary/10 rounded-full">
              <Award className="w-16 h-16 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Verificação de Certificado
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Digite o código de verificação do certificado para confirmar sua autenticidade
          </p>
        </div>

        {/* Search Box */}
        <Card className="max-w-2xl mx-auto mb-8 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Digite o Código de Verificação
            </CardTitle>
            <CardDescription>
              O código está localizado na parte inferior do certificado (formato: XXXX-XXXX-XXXX)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Input
                placeholder="Ex: A1B2-C3D4-E5F6"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                onKeyPress={handleKeyPress}
                className="text-lg tracking-wider"
                maxLength={14}
              />
              <Button
                onClick={handleVerify}
                disabled={loading}
                size="lg"
                className="min-w-[120px]"
              >
                {loading ? "Verificando..." : "Verificar"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {certificate && (
          <Card className="max-w-3xl mx-auto shadow-xl border-2 border-primary/20 bg-gradient-to-br from-card to-primary/5">
            <CardHeader className="text-center border-b border-primary/10 pb-6">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-green-500/10 rounded-full">
                  <CheckCircle2 className="w-12 h-12 text-green-500" />
                </div>
              </div>
              <CardTitle className="text-2xl text-green-600 dark:text-green-400">
                Certificado Autêntico
              </CardTitle>
              <CardDescription className="text-base">
                Este certificado foi emitido pela Prima Qualitá e é válido
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-8 space-y-6">
              <div className="grid gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Nome do Colaborador
                  </label>
                  <p className="text-2xl font-bold text-foreground">
                    {certificate.employee_name}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Treinamento
                  </label>
                  <p className="text-xl text-foreground">
                    {certificate.training_title}
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      Aproveitamento
                    </label>
                    <p className="text-2xl font-bold text-primary">
                      {certificate.score}%
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      Data de Conclusão
                    </label>
                    <p className="text-lg text-foreground">
                      {new Date(certificate.completion_date).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      Data de Emissão
                    </label>
                    <p className="text-lg text-foreground">
                      {new Date(certificate.issued_at).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground text-center">
                    <span className="font-semibold">Código de Verificação:</span>{" "}
                    <span className="font-mono tracking-wider">{certificate.verification_code}</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {notFound && (
          <Card className="max-w-2xl mx-auto shadow-xl border-2 border-destructive/20">
            <CardContent className="pt-12 pb-12 text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-destructive/10 rounded-full">
                  <XCircle className="w-12 h-12 text-destructive" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-destructive mb-3">
                Certificado Não Encontrado
              </h3>
              <p className="text-muted-foreground mb-6">
                O código informado não corresponde a nenhum certificado em nossa base de dados.
                Verifique se o código foi digitado corretamente.
              </p>
              <Button variant="outline" onClick={() => setNotFound(false)}>
                Tentar Novamente
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Info Box */}
        <div className="max-w-2xl mx-auto mt-12">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                Sobre a Verificação
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Todos os certificados emitidos pela Prima Qualitá possuem um código único de
                verificação. Este sistema permite confirmar a autenticidade e validade do
                documento. Em caso de dúvidas, entre em contato com nossa Coordenação de Compliance.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
