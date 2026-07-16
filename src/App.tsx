import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { InstallPWA } from "@/components/InstallPWA";
import { Analytics } from "@vercel/analytics/react";
import Index from "./pages/Index";
import Login from "./pages/Login";
import OvosCaipira from "./pages/OvosCaipira";
import Frango from "./pages/Frango";
import Polpas from "./pages/Polpas";
import Produtos from "./pages/Produtos";
import Cart from "./pages/Cart";
import Payment from "./pages/Payment";
import Cashback from "./pages/Cashback";
import Scan from "./pages/Scan";
import Entregas from "./pages/Entregas";
import Conta from "./pages/Conta";
import Admin from "./pages/Admin";
import Historico from "./pages/Historico";
import ParceiroProdutos from "./pages/ParceiroProdutos";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-background" />;
  if (!user) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CartProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <InstallPWA />
          <Analytics />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/home" element={<ProtectedRoute><Index /></ProtectedRoute>} />
              <Route path="/ovos-caipira" element={<ProtectedRoute><OvosCaipira /></ProtectedRoute>} />
              <Route path="/frango" element={<ProtectedRoute><Frango /></ProtectedRoute>} />
              <Route path="/polpas" element={<ProtectedRoute><Polpas /></ProtectedRoute>} />
              <Route path="/produtos" element={<ProtectedRoute><Produtos /></ProtectedRoute>} />
              <Route path="/carrinho" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
              <Route path="/pagamento" element={<ProtectedRoute><Payment /></ProtectedRoute>} />
              <Route path="/cashback" element={<ProtectedRoute><Cashback /></ProtectedRoute>} />
              <Route path="/escanear" element={<ProtectedRoute><Scan /></ProtectedRoute>} />
              <Route path="/entregas" element={<ProtectedRoute><Entregas /></ProtectedRoute>} />
              <Route path="/conta" element={<ProtectedRoute><Conta /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
              <Route path="/parceiro-produtos" element={<ProtectedRoute><ParceiroProdutos /></ProtectedRoute>} />
              <Route path="/historico" element={<ProtectedRoute><Historico /></ProtectedRoute>} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
