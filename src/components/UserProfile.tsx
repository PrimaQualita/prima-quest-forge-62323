import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Upload, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export const UserProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{ full_name: string | null; avatar_url: string | null; job_title: string | null } | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchProfile();
    }
  }, [user?.id]);

  // Force refresh on component mount to clear cache
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user?.id) {
        fetchProfile();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user?.id]);

  const fetchProfile = async () => {
    if (!user?.id) return;

    try {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      // Verificar se é fornecedor
      const { data: supplierData } = await supabase
        .from('supplier_due_diligence')
        .select('company_name, status')
        .eq('user_id', user.id)
        .eq('status', 'approved')
        .maybeSingle();

      if (supplierData) {
        // É fornecedor - usar razão social
        setProfile({
          full_name: supplierData.company_name,
          avatar_url: profileData?.avatar_url || null,
          job_title: 'Fornecedor',
        });
        return;
      }

      // Buscar name e job_title do employee - force fresh data
      const { data: employeeData } = await supabase
        .from('employees')
        .select('name, job_title')
        .eq('user_id', user.id)
        .maybeSingle();

      console.log('Employee data fetched:', employeeData);

      setProfile({
        full_name: employeeData?.name || null,
        avatar_url: profileData?.avatar_url || null,
        job_title: employeeData?.job_title || null,
      });
    } catch (error) {
      console.error('Error in fetchProfile:', error);
    }
  };

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${user?.id}-${Math.random()}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('compliance-documents')
        .upload(`avatars/${filePath}`, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('compliance-documents')
        .getPublicUrl(`avatars/${filePath}`);

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user?.id);

      if (updateError) {
        throw updateError;
      }

      setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : null);
      
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

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name[0].toUpperCase();
  };

  const formatJobTitle = (title: string | null) => {
    if (!title) return "";
    const prepositions = ['de', 'da', 'do', 'dos', 'das', 'e', 'a', 'o', 'as', 'os'];
    const romanNumerals = /^(I|II|III|IV|V|VI|VII|VIII|IX|X)$/i;
    
    return title
      .toLowerCase()
      .split(' ')
      .map((word, index) => {
        // Algarismos romanos mantém maiúsculas
        if (romanNumerals.test(word)) {
          return word.toUpperCase();
        }
        // Primeira palavra sempre maiúscula
        if (index === 0) {
          return word.charAt(0).toUpperCase() + word.slice(1);
        }
        // Preposições em minúsculo
        if (prepositions.includes(word)) {
          return word;
        }
        // Outras palavras com primeira letra maiúscula
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(' ');
  };

  return (
    <button 
      onClick={() => navigate('/profile')}
      className="flex items-center gap-3 p-4 border-t border-sidebar-border hover:bg-sidebar-accent/50 transition-colors w-full text-left"
    >
      <div className="relative">
        <Avatar className="h-10 w-10">
          <AvatarImage src={profile?.avatar_url || undefined} />
          <AvatarFallback className="bg-primary text-primary-foreground">
            {getInitials(profile?.full_name)}
          </AvatarFallback>
        </Avatar>
        <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full p-1">
          <Settings className="h-3 w-3" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-sidebar-foreground truncate">
          {profile?.full_name || "Usuário"}
        </p>
        {profile?.job_title && (
          <p className="text-xs text-muted-foreground truncate">
            {formatJobTitle(profile.job_title)}
          </p>
        )}
      </div>
    </button>
  );
};
