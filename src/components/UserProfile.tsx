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

  const fetchProfile = async () => {
    if (!user?.id) return;

    const { data: profileData, error } = await supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
      return;
    }

    // Buscar job_title do employee
    const { data: employeeData } = await supabase
      .from('employees')
      .select('job_title')
      .eq('user_id', user.id)
      .maybeSingle();

    setProfile({
      full_name: profileData?.full_name || null,
      avatar_url: profileData?.avatar_url || null,
      job_title: employeeData?.job_title || null,
    });
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
            {profile.job_title}
          </p>
        )}
      </div>
    </button>
  );
};
