import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showForgotPasswordAlert, setShowForgotPasswordAlert] = useState(false);
  const [cpf, setCpf] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

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
      const cleanPassword = password.replace(/\s/g, "");
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
      
      const authEmail = `${cleanCpf}@primaqualita.local`;

      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: cleanPassword,
      });

      if (signInError) {
        toast({
          title: "Erro ao fazer login",
          description: "CPF ou senha incorretos",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Store session persistence preference
      if (rememberMe) {
        localStorage.setItem('rememberSession', 'true');
      } else {
        sessionStorage.setItem('sessionActive', 'true');
        localStorage.removeItem('rememberSession');
      }

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
          <form onSubmit={handleLogin} className="space-y-4">
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
              <p className="text-xs text-muted-foreground">
                Primeiro acesso? Contate o departamento de Compliance para sua senha inicial.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="rememberMe" 
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked === true)}
              />
              <Label 
                htmlFor="rememberMe" 
                className="text-sm font-normal cursor-pointer"
              >
                Permanecer conectado
              </Label>
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
              <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0" />
              <AlertDescription className="text-yellow-800 dark:text-yellow-200 text-sm text-justify">
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
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
