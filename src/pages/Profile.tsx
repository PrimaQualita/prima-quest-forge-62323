import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Loader2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const profileSchema = z.object({
  full_name: z.string().trim().min(3, "Nome deve ter no mínimo 3 caracteres").max(100, "Nome deve ter no máximo 100 caracteres"),
  phone: z.string().trim().min(10, "Telefone inválido").max(20, "Telefone inválido").optional().or(z.literal("")),
});

const emailSchema = z.object({
  email: z.string().trim().email("Email inválido").max(255, "Email deve ter no máximo 255 caracteres"),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(6, "Senha atual deve ter no mínimo 6 caracteres"),
  newPassword: z.string().min(6, "Nova senha deve ter no mínimo 6 caracteres"),
  confirmPassword: z.string().min(6, "Confirmação deve ter no mínimo 6 caracteres"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

const Profile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [profile, setProfile] = useState({
    full_name: "",
    avatar_url: "",
    phone: "",
    cpf: "",
    birth_date: "",
  });

  const [email, setEmail] = useState("");
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user?.id) {
      fetchProfile();
    }
  }, [user?.id]);

  const fetchProfile = async () => {
    if (!user?.id) return;

    try {
      // Buscar dados do profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, cpf, birth_date')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      // Buscar dados do employee
      const { data: employeeData, error: employeeError } = await supabase
        .from('employees')
        .select('phone')
        .eq('user_id', user.id)
        .maybeSingle();

      if (employeeError && employeeError.code !== 'PGRST116') {
        console.error('Error fetching employee:', employeeError);
      }

      setProfile({
        full_name: profileData?.full_name || "",
        avatar_url: profileData?.avatar_url || "",
        phone: employeeData?.phone || "",
        cpf: profileData?.cpf || "",
        birth_date: profileData?.birth_date || "",
      });

      setEmail(user.email || "");
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados do perfil",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];
      
      // Validar tamanho (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Erro",
          description: "A imagem deve ter no máximo 5MB",
          variant: "destructive",
        });
        return;
      }

      const fileExt = file.name.split('.').pop();
      const filePath = `${user?.id}-${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('compliance-documents')
        .upload(`avatars/${filePath}`, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('compliance-documents')
        .getPublicUrl(`avatars/${filePath}`);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user?.id);

      if (updateError) throw updateError;

      setProfile(prev => ({ ...prev, avatar_url: publicUrl }));
      
      toast({
        title: "Sucesso",
        description: "Foto atualizada com sucesso!",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleProfileUpdate = async () => {
    try {
      setSaving(true);
      setErrors({});

      // Validar dados
      const validation = profileSchema.safeParse({
        full_name: profile.full_name,
        phone: profile.phone,
      });

      if (!validation.success) {
        const newErrors: Record<string, string> = {};
        validation.error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(newErrors);
        return;
      }

      // Atualizar profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: profile.full_name })
        .eq('id', user?.id);

      if (profileError) throw profileError;

      // Atualizar phone no employee se existir
      if (profile.phone) {
        const { error: employeeError } = await supabase
          .from('employees')
          .update({ phone: profile.phone })
          .eq('user_id', user?.id);

        if (employeeError && employeeError.code !== 'PGRST116') {
          console.error('Error updating employee:', employeeError);
        }
      }

      toast({
        title: "Sucesso",
        description: "Perfil atualizado com sucesso!",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEmailUpdate = async () => {
    try {
      setSaving(true);
      setErrors({});

      console.log('Atualizando email para:', email);

      // Verificar se o email é diferente do atual
      if (email === user?.email) {
        toast({
          title: "Atenção",
          description: "O novo email é igual ao email atual",
          variant: "destructive",
        });
        setSaving(false);
        return;
      }

      const validation = emailSchema.safeParse({ email });

      if (!validation.success) {
        const newErrors: Record<string, string> = {};
        validation.error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(newErrors);
        setSaving(false);
        return;
      }

      console.log('Chamando supabase.auth.updateUser...');
      const { data, error } = await supabase.auth.updateUser({ email });

      console.log('Resposta:', { data, error });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Email atualizado com sucesso! Verifique seu novo email para confirmar.",
      });
    } catch (error: any) {
      console.error('Erro ao atualizar email:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar o email",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordUpdate = async () => {
    try {
      setSaving(true);
      setErrors({});

      const validation = passwordSchema.safeParse(passwords);

      if (!validation.success) {
        const newErrors: Record<string, string> = {};
        validation.error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(newErrors);
        return;
      }

      // Verificar senha atual fazendo login
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || "",
        password: passwords.currentPassword,
      });

      if (signInError) {
        setErrors({ currentPassword: "Senha atual incorreta" });
        return;
      }

      // Atualizar para nova senha
      const { error } = await supabase.auth.updateUser({
        password: passwords.newPassword,
      });

      if (error) throw error;

      setPasswords({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      toast({
        title: "Sucesso",
        description: "Senha alterada com sucesso!",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "U";
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name[0].toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 mt-8">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Meu Perfil</h1>
          <p className="text-muted-foreground">Gerencie suas informações pessoais</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Foto de Perfil</CardTitle>
          <CardDescription>Atualize sua foto de perfil</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-6">
          <div className="relative">
            <Avatar className="h-24 w-24">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                {getInitials(profile.full_name)}
              </AvatarFallback>
            </Avatar>
            <label htmlFor="avatar-upload-page" className="absolute -bottom-2 -right-2 cursor-pointer">
              <div className="bg-primary text-primary-foreground rounded-full p-2 hover:bg-primary/90 transition-colors">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              </div>
              <input
                id="avatar-upload-page"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={uploadAvatar}
                disabled={uploading}
              />
            </label>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Clique no ícone para fazer upload de uma nova foto</p>
            <p className="text-xs text-muted-foreground mt-1">Formatos aceitos: JPG, PNG. Tamanho máximo: 5MB</p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="personal">Dados Pessoais</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="password">Senha</TabsTrigger>
        </TabsList>

        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
              <CardDescription>Atualize seus dados pessoais</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Nome Completo</Label>
                <Input
                  id="full_name"
                  value={profile.full_name}
                  onChange={(e) => setProfile(prev => ({ ...prev, full_name: e.target.value }))}
                  placeholder="Digite seu nome completo"
                />
                {errors.full_name && (
                  <p className="text-sm text-destructive">{errors.full_name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={profile.phone}
                  onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="(11) 99999-9999"
                />
                {errors.phone && (
                  <p className="text-sm text-destructive">{errors.phone}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  value={profile.cpf}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">CPF não pode ser alterado</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="birth_date">Data de Nascimento</Label>
                <Input
                  id="birth_date"
                  type="date"
                  value={profile.birth_date}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">Data de nascimento não pode ser alterada</p>
              </div>

              <Button onClick={handleProfileUpdate} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Alterações
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle>Alterar Email</CardTitle>
              <CardDescription>Atualize seu endereço de email</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Novo Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seuemail@exemplo.com"
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Você receberá um email de confirmação no novo endereço
                </p>
              </div>

              <Button onClick={handleEmailUpdate} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Atualizar Email
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="password">
          <Card>
            <CardHeader>
              <CardTitle>Alterar Senha</CardTitle>
              <CardDescription>Atualize sua senha de acesso</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Senha Atual</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwords.currentPassword}
                  onChange={(e) => setPasswords(prev => ({ ...prev, currentPassword: e.target.value }))}
                  placeholder="Digite sua senha atual"
                />
                {errors.currentPassword && (
                  <p className="text-sm text-destructive">{errors.currentPassword}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">Nova Senha</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords(prev => ({ ...prev, newPassword: e.target.value }))}
                  placeholder="Digite sua nova senha"
                />
                {errors.newPassword && (
                  <p className="text-sm text-destructive">{errors.newPassword}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwords.confirmPassword}
                  onChange={(e) => setPasswords(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="Confirme sua nova senha"
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                )}
              </div>

              <Button onClick={handlePasswordUpdate} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Alterar Senha
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Profile;
