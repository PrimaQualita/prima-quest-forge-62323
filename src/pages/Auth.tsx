import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isSupplierLogin, setIsSupplierLogin] = useState(false);
  const [showForgotPasswordAlert, setShowForgotPasswordAlert] = useState(false);
  const [cpf, setCpf] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/");
      }
    });
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let authEmail: string;
      const cleanPassword = password.replace(/\s/g, "");

      if (isSupplierLogin) {
        // Login de fornecedor com email
        authEmail = email.trim();
      } else {
        // Login de colaborador com CPF
        const cleanCpf = cpf.replace(/[.-\s]/g, "");
        
        if (cleanCpf.length !== 11) {
          toast({
            title: "CPF inválido",
            description: "O CPF deve conter 11 dígitos",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        
        authEmail = `${cleanCpf}@primaqualita.local`;
      }

      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: cleanPassword,
      });

      if (signInError) {
        toast({
          title: "Erro ao fazer login",
          description: isSupplierLogin ? "E-mail ou senha incorretos" : "CPF ou senha incorretos",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Verificar se é fornecedor
      const { data: supplierData } = await supabase
        .from("supplier_due_diligence")
        .select("status")
        .eq("user_id", signInData.user.id)
        .maybeSingle();

      if (supplierData) {
        if (supplierData.status !== 'approved') {
          await supabase.auth.signOut();
          toast({
            title: "Cadastro pendente",
            description: "Seu cadastro ainda está em análise. Você será notificado quando for aprovado.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        navigate("/supplier-portal");
        return;
      }

      // Se não é fornecedor, verificar se é colaborador
      const { data: profile } = await supabase
        .from("profiles")
        .select("first_login")
        .eq("id", signInData.user.id)
        .maybeSingle();

      if (profile?.first_login) {
        navigate("/change-password");
      } else {
        navigate("/");
      }
    } catch (error: any) {
      toast({
        title: "Erro ao fazer login",
        description: error.message || "Ocorreu um erro inesperado",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-secondary/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
            <img src="/logo-prima-qualita.png" alt="Prima Qualitá" className="h-16 w-16 object-contain" />
          </div>
          <CardTitle className="text-2xl">Sistema de Compliance</CardTitle>
          <CardDescription>Prima Qualitá Saúde</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Button
              type="button"
              variant={!isSupplierLogin ? "default" : "outline"}
              className="flex-1"
              onClick={() => setIsSupplierLogin(false)}
            >
              Colaborador
            </Button>
            <Button
              type="button"
              variant={isSupplierLogin ? "default" : "outline"}
              className="flex-1"
              onClick={() => setIsSupplierLogin(true)}
            >
              Fornecedor
            </Button>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {!isSupplierLogin ? (
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  type="text"
                  placeholder="00000000000"
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value)}
                  maxLength={14}
                  required
                />
                <p className="text-xs text-muted-foreground">Digite apenas números</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {!isSupplierLogin && (
                <p className="text-xs text-muted-foreground">
                  Primeiro acesso: use sua data de nascimento (Ex: 07011990)
                </p>
              )}
            </div>
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Entrar
            </Button>
          </form>

          <div className="mt-4">
            <Button 
              type="button" 
              variant="link" 
              className="w-full text-xs"
              onClick={() => setShowForgotPasswordAlert(!showForgotPasswordAlert)}
            >
              Esqueci minha senha
            </Button>
          </div>

          {showForgotPasswordAlert && (
            <Alert className="mt-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800 dark:text-yellow-200 text-sm">
                Caso tenha esquecido sua senha, entre em contato com o departamento de Compliance através do e-mail:{" "}
                <a 
                  href="mailto:compliance@primaqualitasaude.org" 
                  className="font-semibold underline hover:text-yellow-900 dark:hover:text-yellow-100"
                >
                  compliance@primaqualitasaude.org
                </a>
                {" "}informando seu <strong>nome completo</strong> e <strong>CPF</strong> e solicitando uma nova senha provisória.
              </AlertDescription>
            </Alert>
          )}

          <div className="mt-6 pt-6 border-t text-center">
            <p className="text-sm text-muted-foreground mb-2">É um fornecedor?</p>
            <Link to="/supplier-form">
              <Button variant="outline" className="w-full">
                Cadastrar como Fornecedor
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
