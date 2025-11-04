import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [cpf, setCpf] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    // Check if already logged in
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
      // Clean CPF (remove formatting)
      const cleanCpf = cpf.replace(/[.-\s]/g, "");
      
      // Clean password (remove spaces)
      const cleanPassword = password.replace(/\s/g, "");

      if (cleanCpf.length !== 11) {
        toast({
          title: "CPF inválido",
          description: "O CPF deve conter 11 dígitos",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      console.log("Attempting login with CPF:", cleanCpf);

      // The auth email is cpf@primaqualita.local
      const authEmail = `${cleanCpf}@primaqualita.local`;

      // Try to sign in
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: cleanPassword,
      });

      if (signInError) {
        console.error("Login error:", signInError);
        toast({
          title: "Erro ao fazer login",
          description: "CPF ou senha incorretos",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      console.log("Login successful");

      // Check if this is first login
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
      console.error("Login error:", error);
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
                Primeiro acesso: use sua data de nascimento (Ex: 07011990)
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Entrar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
