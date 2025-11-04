import { Sidebar } from "@/components/Sidebar";
import { FloatingChatbot } from "@/components/FloatingChatbot";
import { useAuth } from "@/hooks/useAuth";

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const { isAdmin } = useAuth();
  
  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        {children}
      </main>
      {isAdmin && <FloatingChatbot />}
    </div>
  );
};
