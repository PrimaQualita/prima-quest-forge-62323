import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import Documents from "./pages/Documents";
import Trainings from "./pages/Trainings";
import TrainingView from "./pages/TrainingView";
import TrainingEdit from "./pages/TrainingEdit";
import Chatbot from "./pages/Chatbot";
import Reports from "./pages/Reports";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import ChangePassword from "./pages/ChangePassword";
import ManagementContracts from "./pages/ManagementContracts";
import SupplierDueDiligence from "./pages/SupplierDueDiligence";
import SupplierForm from "./pages/SupplierForm";
import SupplierPortal from "./pages/SupplierPortal";
import Profile from "./pages/Profile";
import VerifyCertificate from "./pages/VerifyCertificate";

const queryClient = new QueryClient();

const ProtectedRoute = ({ 
  children, 
  adminOnly = false,
  allowSupplier = false
}: { 
  children: React.ReactNode;
  adminOnly?: boolean;
  allowSupplier?: boolean;
}) => {
  const { session, loading, isAdmin, user } = useAuth();
  const location = useLocation();
  const [checkingFirstLogin, setCheckingFirstLogin] = useState(true);
  const [needsPasswordChange, setNeedsPasswordChange] = useState(false);
  const [isSupplier, setIsSupplier] = useState(false);
  const [checkingSupplier, setCheckingSupplier] = useState(true);

  useEffect(() => {
    const checkFirstLoginAndSupplier = async () => {
      if (user?.id && location.pathname !== '/change-password') {
        const [profileResult, supplierResult] = await Promise.all([
          supabase
            .from('profiles')
            .select('first_login')
            .eq('id', user.id)
            .maybeSingle(),
          supabase
            .from('supplier_due_diligence')
            .select('status')
            .eq('user_id', user.id)
            .eq('status', 'approved')
            .maybeSingle()
        ]);

        if (profileResult.data?.first_login === true) {
          setNeedsPasswordChange(true);
        }

        if (supplierResult.data) {
          setIsSupplier(true);
        }
      }
      setCheckingFirstLogin(false);
      setCheckingSupplier(false);
    };

    if (!loading && user) {
      checkFirstLoginAndSupplier();
    } else if (!loading) {
      setCheckingFirstLogin(false);
      setCheckingSupplier(false);
    }
  }, [user, loading, location.pathname]);

  if (loading || checkingFirstLogin || checkingSupplier) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  // Redirect to change password if needed (except if already on that page)
  if (needsPasswordChange && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  if (adminOnly && !isAdmin && !isSupplier) {
    return <Navigate to="/" replace />;
  }

  // Allow suppliers if the route permits it
  if (allowSupplier && isSupplier) {
    return <>{children}</>;
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
          <Route path="/supplier-portal" element={<SupplierPortal />} />
          <Route path="/verificar-certificado" element={<VerifyCertificate />} />
          <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
          
          {/* Rotas acessíveis a todos os usuários autenticados e fornecedores */}
          <Route path="/" element={<ProtectedRoute allowSupplier><Layout><Dashboard /></Layout></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Layout><Profile /></Layout></ProtectedRoute>} />
          <Route path="/documents" element={<ProtectedRoute allowSupplier><Layout><Documents /></Layout></ProtectedRoute>} />
          <Route path="/trainings" element={<ProtectedRoute allowSupplier><Layout><Trainings /></Layout></ProtectedRoute>} />
          <Route path="/trainings/:id" element={<ProtectedRoute allowSupplier><Layout><TrainingView /></Layout></ProtectedRoute>} />
          <Route path="/trainings/:id/edit" element={<ProtectedRoute adminOnly><Layout><TrainingEdit /></Layout></ProtectedRoute>} />
          <Route path="/supplier-home" element={<ProtectedRoute allowSupplier><Layout><SupplierPortal /></Layout></ProtectedRoute>} />
          
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
