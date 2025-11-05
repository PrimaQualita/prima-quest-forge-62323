import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { FloatingChatbot } from "@/components/FloatingChatbot";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Desktop Sidebar - visible on md and up */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Mobile Header - visible only on mobile */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-background border-b border-sidebar-border flex items-center px-4">
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <Sidebar onNavigate={() => setIsMobileMenuOpen(false)} />
          </SheetContent>
        </Sheet>
        
        <div className="flex items-center gap-2 ml-4">
          <img 
            src="/logo-prima-qualita.png" 
            alt="Prima Qualitá" 
            className="h-7 w-7 object-contain" 
          />
          <div>
            <h1 className="text-sm font-bold">Prima Qualitá</h1>
            <p className="text-xs text-muted-foreground">Compliance</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 pt-14 md:pt-0 p-4 md:p-8">
        {children}
      </main>
      
      <FloatingChatbot />
    </div>
  );
};
