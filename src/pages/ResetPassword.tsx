import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logoRecantoDasFlores from "@/assets/logo-recantodasflores.png";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setIsRecovery(true);
    }

    // Parse error if present in hash
    if (hash) {
      const params = new URLSearchParams(hash.substring(1));
      const error = params.get("error");
      const errorCode = params.get("error_code");
      const errorDesc = params.get("error_description");
      
      if (error || errorCode) {
        console.error("Recovery link error:", error, errorCode, errorDesc);
        if (errorCode === "otp_expired" || errorDesc?.includes("invalid") || errorDesc?.includes("expired")) {
          setErrorMessage("O link de recuperação de senha expirou ou já foi utilizado. Por favor, solicite um novo link de recuperação.");
        } else {
          setErrorMessage(errorDesc || "Erro ao validar o link de recuperação.");
        }
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }
    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast.error("Erro ao redefinir senha. Tente novamente.");
    } else {
      toast.success("Senha redefinida com sucesso!");
      navigate("/");
    }
    setLoading(false);
  };

  if (!isRecovery) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <img src={logoRecantoDasFlores} alt="Recanto das Flores" className="w-24 h-24 object-contain mb-4" />
        <p className="text-muted-foreground text-sm text-center max-w-sm leading-relaxed">
          {errorMessage || "Link inválido ou expirado. Solicite uma nova recuperação de senha."}
        </p>
        <Button onClick={() => navigate("/")} className="mt-4 gradient-gold text-primary-foreground rounded-xl">
          Voltar ao Login
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <img src={logoRecantoDasFlores} alt="Recanto das Flores" className="w-24 h-24 object-contain mb-4" />
      <h1 className="text-xl font-display text-gold-gradient mb-2">Redefinir Senha</h1>
      <p className="text-muted-foreground text-sm mb-6">Digite sua nova senha</p>

      <form onSubmit={handleReset} className="w-full max-w-sm space-y-4">
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input 
            type={showPassword ? "text" : "password"} 
            placeholder="Nova senha" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            className="pl-10 pr-10 bg-secondary border-border" 
            required 
            minLength={6} 
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input 
            type={showConfirmPassword ? "text" : "password"} 
            placeholder="Confirmar senha" 
            value={confirmPassword} 
            onChange={(e) => setConfirmPassword(e.target.value)} 
            className="pl-10 pr-10 bg-secondary border-border" 
            required 
            minLength={6} 
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        <Button type="submit" disabled={loading} className="w-full gradient-gold text-primary-foreground font-bold h-12 rounded-xl">
          {loading ? "Salvando..." : "Redefinir Senha"}
        </Button>
      </form>
    </div>
  );
};

export default ResetPassword;
