import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import Documents from "./pages/Documents";
import Trainings from "./pages/Trainings";
import Chatbot from "./pages/Chatbot";
import Reports from "./pages/Reports";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import ChangePassword from "./pages/ChangePassword";
import ManagementContracts from "./pages/ManagementContracts";
import SupplierDueDiligence from "./pages/SupplierDueDiligence";
import SupplierForm from "./pages/SupplierForm";

const queryClient = new QueryClient();

const ProtectedRoute = ({ 
  children, 
  adminOnly = false 
}: { 
  children: React.ReactNode;
  adminOnly?: boolean;
}) => {
  const { session, loading, isAdmin } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/supplier-form" element={<SupplierForm />} />
          <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
          
          {/* Rotas acessíveis a todos os usuários autenticados */}
          <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
          <Route path="/documents" element={<ProtectedRoute><Layout><Documents /></Layout></ProtectedRoute>} />
          <Route path="/trainings" element={<ProtectedRoute><Layout><Trainings /></Layout></ProtectedRoute>} />
          
          {/* Rotas apenas para gestores/admins */}
          <Route path="/employees" element={<ProtectedRoute adminOnly><Layout><Employees /></Layout></ProtectedRoute>} />
          <Route path="/chatbot" element={<ProtectedRoute adminOnly><Layout><Chatbot /></Layout></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute adminOnly><Layout><Reports /></Layout></ProtectedRoute>} />
          <Route path="/contracts" element={<ProtectedRoute adminOnly><Layout><ManagementContracts /></Layout></ProtectedRoute>} />
          <Route path="/due-diligence" element={<ProtectedRoute adminOnly><Layout><SupplierDueDiligence /></Layout></ProtectedRoute>} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
