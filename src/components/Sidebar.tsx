import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  GraduationCap, 
  MessageSquare,
  BarChart3,
  FileCheck,
  Briefcase,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { UserProfile } from "@/components/UserProfile";

interface SidebarProps {
  onNavigate?: () => void;
}

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/", adminOnly: false },
  { icon: FileText, label: "Regulamentos", path: "/documents", adminOnly: false },
  { icon: GraduationCap, label: "Treinamentos", path: "/trainings", adminOnly: false },
  { icon: Briefcase, label: "Contratos de Gestão", path: "/contracts", adminOnly: true },
  { icon: BarChart3, label: "Relatórios", path: "/reports", adminOnly: true },
  { icon: Users, label: "Colaboradores", path: "/employees", adminOnly: true },
  { icon: FileCheck, label: "Due Diligence", path: "/due-diligence", adminOnly: true },
];

export const Sidebar = ({ onNavigate }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin, user } = useAuth();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
    onNavigate?.();
  };

  const handleNavClick = () => {
    onNavigate?.();
  };

  const visibleMenuItems = menuItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border overflow-y-auto">
      <div className="flex flex-col h-full">
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <img 
              src="/logo-prima-qualita.png" 
              alt="Prima Qualitá" 
              className="h-10 w-10 object-contain" 
            />
            <div>
              <h1 className="text-lg font-bold text-sidebar-foreground">
                Prima Qualitá
              </h1>
              <p className="text-xs text-sidebar-foreground/70">Compliance</p>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={handleNavClick}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div>
          <UserProfile />
          
          <div className="p-4 border-t border-sidebar-border">
            <div className="mb-3 px-2">
              <p className="text-xs text-sidebar-foreground/60 mb-1">Tipo de Usuário</p>
              <p className="text-sm text-sidebar-foreground font-medium">
                {isAdmin ? "Gestor" : "Colaborador"}
              </p>
            </div>
            <Button
              variant="outline"
              className="w-full justify-start gap-2 border-sidebar-border hover:bg-sidebar-accent/50"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
              Sair
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
};
