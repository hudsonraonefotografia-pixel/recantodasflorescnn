import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock, Mail, User, Gift, Shield, Eye, EyeOff, Phone } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import logoRecantoDasFlores from "@/assets/logo-recantodasflores.png";
import flowerBranch from "@/assets/flower_branch.png";
import { supabase } from "@/integrations/supabase/client";

type LoginMode = "select" | "cliente" | "admin";
type AdminSubMode = "login" | "signup";

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn, signUp, user } = useAuth();
  const [logoReady, setLogoReady] = useState(false);
  const [mode, setMode] = useState<LoginMode>("select");
  const [adminSubMode, setAdminSubMode] = useState<AdminSubMode>("login");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showAdminPendingPopup, setShowAdminPendingPopup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [adminName, setAdminName] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [referralCode, setReferralCode] = useState("");

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      setReferralCode(ref.toUpperCase());
      setIsSignUp(true);
      setMode("cliente");
    }
  }, [searchParams]);

  useEffect(() => {
    const timer = setTimeout(() => setLogoReady(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const hash = window.location.hash;
    
    if (hash) {
      const params = new URLSearchParams(hash.substring(1));
      const error = params.get("error");
      const errorCode = params.get("error_code");
      
      if (error || errorCode) {
        console.log("Auth error in hash redirecting to reset-password:", error, errorCode);
        navigate("/reset-password" + hash);
        return;
      }
      
      if (hash.includes("type=recovery")) {
        console.log("Auth recovery in hash redirecting to reset-password");
        navigate("/reset-password" + hash);
        return;
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        console.log("PASSWORD_RECOVERY event detected, redirecting to /reset-password");
        navigate("/reset-password");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isSignUp) {
      if (!whatsapp) {
        toast.error("Por favor, informe seu WhatsApp.");
        setLoading(false);
        return;
      }
      const { error } = await signUp(email, password, displayName, whatsapp);
      if (error) {
        toast.error(error.message);
      } else {
        if (referralCode.trim()) {
          try {
            const { data: referrerProfile } = await supabase
              .from("profiles")
              .select("user_id")
              .eq("referral_code", referralCode.trim())
              .single();
            if (referrerProfile) {
              localStorage.setItem("pending_referral", JSON.stringify({
                referrer_id: referrerProfile.user_id,
                referral_code: referralCode.trim(),
                email,
              }));
            }
          } catch {}
        }
        toast.success("Conta criada! Verifique seu email para confirmar.");
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        toast.error("Email ou senha incorretos.");
      } else {
        const pendingRef = localStorage.getItem("pending_referral");
        if (pendingRef) {
          try {
            const ref = JSON.parse(pendingRef);
            await supabase.from("referrals").insert({
              referrer_id: ref.referrer_id,
              referral_code: ref.referral_code,
              referred_email: ref.email,
              status: "registered",
              points_awarded: 1000,
            });
            const { data: existing } = await supabase
              .from("profiles")
              .select("total_points")
              .eq("user_id", ref.referrer_id)
              .single();
            if (existing) {
              await supabase
                .from("profiles")
                .update({ total_points: (existing.total_points || 0) + 1000 })
                .eq("user_id", ref.referrer_id);
            }
            localStorage.removeItem("pending_referral");
          } catch {}
        }
        navigate("/home");
      }
    }
    setLoading(false);
  };

  const handleAdminSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Try to sign in first (user may already have an account as client)
    const { error: signInError } = await signIn(email, password);
    
    if (!signInError) {
      // User exists and credentials are correct - submit admin request directly
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        // Check if already has a pending/approved admin request
        const { data: existingReq } = await supabase
          .from("admin_requests")
          .select("status")
          .eq("user_id", currentUser.id)
          .order("created_at", { ascending: false })
          .limit(1);

        if (existingReq && existingReq.length > 0) {
          if (existingReq[0].status === "pendente") {
            toast.info("Você já possui uma solicitação em análise.");
            await supabase.auth.signOut();
            setLoading(false);
            return;
          }
          if (existingReq[0].status === "aprovado") {
            toast.info("Sua solicitação já foi aprovada. Faça login como admin.");
            await supabase.auth.signOut();
            setAdminSubMode("login");
            setLoading(false);
            return;
          }
        }

        const { error: insertError } = await supabase.from("admin_requests").insert({
          user_id: currentUser.id,
          display_name: adminName || currentUser.email?.split("@")[0] || "",
          email: email || currentUser.email || "",
          status: "pendente",
        });
        await supabase.auth.signOut();
        if (insertError) {
          toast.error("Erro ao enviar solicitação: " + insertError.message);
        } else {
          setShowAdminPendingPopup(true);
        }
        setLoading(false);
        return;
      }
    }

    // User doesn't exist - create new account
    if (!whatsapp) {
      toast.error("Por favor, informe seu WhatsApp.");
      setLoading(false);
      return;
    }
    const { error: signUpError } = await signUp(email, password, adminName, whatsapp);
    if (signUpError) {
      if (signUpError.message?.includes("already registered") || signUpError.message?.includes("already exists")) {
        toast.error("Email já cadastrado. Verifique sua senha e tente novamente.");
      } else {
        toast.error(signUpError.message);
      }
      setLoading(false);
      return;
    }
    // New user created - store pending admin request for after email confirmation
    localStorage.setItem("pending_admin_request", JSON.stringify({ name: adminName, email }));
    setShowAdminPendingPopup(true);
    setLoading(false);
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      toast.error("Email ou senha incorretos.");
      setLoading(false);
      return;
    }
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) {
      toast.error("Erro de autenticação.");
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }

    // Check for pending admin request to submit
    const pendingAdmin = localStorage.getItem("pending_admin_request");
    if (pendingAdmin) {
      try {
        const info = JSON.parse(pendingAdmin);
        const { error: insertError } = await supabase.from("admin_requests").insert({
          user_id: currentUser.id,
          display_name: info.name || currentUser.email?.split("@")[0] || "",
          email: info.email || currentUser.email || "",
          status: "pendente",
        });
        if (insertError) {
          console.error("Admin request insert error:", insertError);
          toast.error("Erro ao enviar solicitação: " + insertError.message);
        } else {
          localStorage.removeItem("pending_admin_request");
          setShowAdminPendingPopup(true);
          await supabase.auth.signOut();
          setLoading(false);
          return;
        }
      } catch (err: any) {
        console.error("Admin request error:", err);
        toast.error("Erro ao processar solicitação.");
      }
    }

    // Check if user has pending admin request
    const { data: pendingReq } = await supabase
      .from("admin_requests")
      .select("status")
      .eq("user_id", currentUser.id)
      .order("created_at", { ascending: false })
      .limit(1);

    if (pendingReq && pendingReq.length > 0) {
      if (pendingReq[0].status === "pendente") {
        toast.info("Sua solicitação de acesso admin ainda está em análise.");
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }
      if (pendingReq[0].status === "recusado") {
        toast.error("Sua solicitação de acesso admin foi recusada.");
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }
    }

    // Check if user has admin role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", currentUser.id)
      .eq("role", "admin");

    if (!roleData || roleData.length === 0) {
      toast.error("Acesso negado. Você não possui permissão de administrador.");
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }
    navigate("/admin");
    setLoading(false);
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error("Digite seu email primeiro.");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast.error("Erro ao enviar email de recuperação.");
    } else {
      toast.success("Email de recuperação enviado! Verifique sua caixa de entrada.");
    }
  };

  // ── Mode Selection Screen ──
  if (mode === "select") {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden flex flex-col items-center justify-center px-6">
        {/* Ribbon Background */}
        <div className="ribbon-container top-1/4 -left-1/4 rotate-[-15deg] bg-primary opacity-20">
          <div className="ribbon-text text-primary-foreground">
            RECANTO DAS FLORES • PRODUTOS DA NATUREZA • RECANTO DAS FLORES • PRODUTOS DA NATUREZA • RECANTO DAS FLORES • PRODUTOS DA NATUREZA • RECANTO DAS FLORES • PRODUTOS DA NATUREZA • 
          </div>
        </div>
        <div className="ribbon-container top-2/3 -right-1/4 rotate-[-15deg] bg-accent opacity-20">
          <div className="ribbon-text text-accent-foreground" style={{ animationDirection: 'reverse' }}>
            DIRETO DA GRANJA • FRESCOR GARANTIDO • DIRETO DA GRANJA • FRESCOR GARANTIDO • DIRETO DA GRANJA • FRESCOR GARANTIDO • DIRETO DA GRANJA • FRESCOR GARANTIDO • 
          </div>
        </div>
        
        {/* Flower Branch Background */}
        <img 
          src={flowerBranch} 
          alt="" 
          className="absolute -right-20 -bottom-20 w-96 h-auto opacity-30 pointer-events-none mix-blend-multiply drop-shadow-2xl z-0" 
        />

        <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
          <motion.img
          src={logoRecantoDasFlores}
          alt="Recanto das Flores"
          initial={{ scale: 1.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="w-full max-w-sm object-contain mb-6"
        />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={logoReady ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex flex-col items-center w-full"
        >
          <h1 className="text-2xl font-display text-gold-gradient mb-2">Bem-vindo ao Recanto das Flores</h1>
          <p className="text-muted-foreground text-sm mb-10">Direto da Granja para sua Mesa!</p>

          <div className="w-full max-w-sm space-y-4">
            <Button
              onClick={() => setMode("cliente")}
              className="w-full h-14 gradient-gold text-primary-foreground font-bold text-base rounded-xl flex items-center justify-center gap-3"
            >
              <User size={22} />
              Sou Cliente
            </Button>
            <Button
              onClick={() => setMode("admin")}
              variant="ghost"
              className="w-full h-12 text-muted-foreground font-semibold text-sm rounded-xl flex items-center justify-center gap-2 hover:text-primary hover:bg-primary/5"
            >
              <Shield size={18} />
              Administrador
            </Button>
          </div>
        </motion.div>
        </div>
      </div>
    );
  }

  // ── Admin Pending Popup ──
  if (showAdminPendingPopup) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="gradient-card border border-border rounded-2xl p-8 max-w-sm w-full text-center space-y-4"
        >
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Shield size={32} className="text-primary" />
          </div>
          <h2 className="text-xl font-display text-gold-gradient">Solicitação Enviada!</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Sua solicitação de acesso administrativo foi enviada com sucesso e está em análise. 
            Você receberá acesso assim que um administrador aprovar sua conta.
          </p>
          <p className="text-muted-foreground text-xs">
            ⏳ Tempo estimado: até 24 horas
          </p>
          <Button
            onClick={() => { setShowAdminPendingPopup(false); setAdminSubMode("login"); setMode("select"); }}
            className="w-full gradient-gold text-primary-foreground font-bold h-12 rounded-xl"
          >
            Entendido
          </Button>
        </motion.div>
      </div>
    );
  }

  // ── Admin Login/Signup ──
  if (mode === "admin") {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden flex flex-col items-center justify-center px-6">
        <div className="ribbon-container top-1/2 -left-1/4 rotate-[15deg] bg-primary opacity-10">
          <div className="ribbon-text text-primary-foreground">
            ÁREA ADMINISTRATIVA • ACESSO RESTRITO • ÁREA ADMINISTRATIVA • ACESSO RESTRITO • ÁREA ADMINISTRATIVA • ACESSO RESTRITO • 
          </div>
        </div>
        <img src={flowerBranch} alt="" className="absolute -left-20 top-10 w-80 h-auto opacity-20 pointer-events-none mix-blend-multiply z-0" />
        
        <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
          <button onClick={() => { setMode("select"); setAdminSubMode("login"); setEmail(""); setPassword(""); setAdminName(""); }} className="self-start text-primary text-sm font-semibold mb-4 w-full mx-auto">
            ← Voltar
          </button>
        <img src={logoRecantoDasFlores} alt="Recanto das Flores" className="w-full max-w-sm object-contain mb-4" />
        <div className="flex items-center gap-2 mb-2">
          <Shield size={20} className="text-primary" />
          <h1 className="text-xl font-display text-gold-gradient">
            {adminSubMode === "signup" ? "Solicitar Acesso Admin" : "Acesso Administrador"}
          </h1>
        </div>
        <p className="text-muted-foreground text-sm mb-6">
          {adminSubMode === "signup" ? "Crie sua conta e aguarde aprovação" : "Área restrita para gerenciamento"}
        </p>

        <form onSubmit={adminSubMode === "signup" ? handleAdminSignUp : handleAdminSubmit} className="w-full max-w-sm space-y-4">
          {adminSubMode === "signup" && (
            <>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input type="text" placeholder="Seu nome completo" value={adminName} onChange={(e) => setAdminName(e.target.value)} className="pl-10 bg-secondary/50 backdrop-blur-md border-border" required />
              </div>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input type="tel" placeholder="Seu WhatsApp" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="pl-10 bg-secondary/50 backdrop-blur-md border-border" required />
              </div>
            </>
          )}
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 bg-secondary/50 backdrop-blur-md border-border" required />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input 
              type={showPassword ? "text" : "password"} 
              placeholder="Senha" 
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
          <Button type="submit" disabled={loading} className="w-full gradient-gold text-primary-foreground font-bold text-base h-12 rounded-xl">
            {loading ? "Aguarde..." : adminSubMode === "signup" ? "Solicitar Acesso" : "Entrar como Admin"}
          </Button>
        </form>
        <div className="mt-4 flex flex-col items-center gap-2">
          {adminSubMode === "login" && (
            <button onClick={handleForgotPassword} className="text-xs text-muted-foreground hover:text-primary hover:underline">
              Esqueci a senha
            </button>
          )}
          <button onClick={() => setAdminSubMode(adminSubMode === "login" ? "signup" : "login")} className="text-sm text-primary hover:underline font-semibold">
            {adminSubMode === "login" ? "Solicitar conta admin" : "Já tenho conta admin"}
          </button>
        </div>
        </div>
      </div>
    );
  }

  // ── Client Login/Signup ──
  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col items-center justify-center px-6">
      <div className="ribbon-container top-1/3 -left-1/4 rotate-[-25deg] bg-primary opacity-15">
        <div className="ribbon-text text-primary-foreground">
          RECANTO DAS FLORES • PRODUTOS DA NATUREZA • RECANTO DAS FLORES • PRODUTOS DA NATUREZA • RECANTO DAS FLORES • 
        </div>
      </div>
      <img src={flowerBranch} alt="" className="absolute -right-20 -bottom-10 w-96 h-auto opacity-30 pointer-events-none mix-blend-multiply z-0" />
      
      <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
        <button onClick={() => { setMode("select"); setIsSignUp(false); setEmail(""); setPassword(""); }} className="self-start text-primary text-sm font-semibold mb-4 w-full mx-auto">
          ← Voltar
        </button>
      <img src={logoRecantoDasFlores} alt="Recanto das Flores" className="w-full max-w-sm object-contain mb-6" />
      <h1 className="text-2xl font-display text-gold-gradient mb-2">
        {isSignUp ? "Criar Conta" : "Acesso Cliente"}
      </h1>
      <p className="text-muted-foreground text-sm mb-8">Direto da Granja para sua Mesa!</p>

      <form onSubmit={handleClientSubmit} className="w-full max-w-sm space-y-4">
        {isSignUp && (
          <>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input type="text" placeholder="Seu nome" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="pl-10 bg-secondary/50 backdrop-blur-md border-border" required />
            </div>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input type="tel" placeholder="Seu WhatsApp" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="pl-10 bg-secondary/50 backdrop-blur-md border-border" required />
            </div>
            <div className="relative">
              <Gift className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input type="text" placeholder="Código de indicação (opcional)" value={referralCode} onChange={(e) => setReferralCode(e.target.value.toUpperCase())} className="pl-10 bg-secondary/50 backdrop-blur-md border-border uppercase tracking-wider" maxLength={8} />
            </div>
          </>
        )}
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 bg-secondary border-border" required />
        </div>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input 
            type={showPassword ? "text" : "password"} 
            placeholder="Senha" 
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

        <Button type="submit" disabled={loading} className="w-full gradient-gold text-primary-foreground font-bold text-base h-12 rounded-xl">
          {loading ? "Aguarde..." : isSignUp ? "Criar Conta" : "Entrar"}
        </Button>
      </form>

      <div className="mt-4 flex flex-col items-center gap-2">
        {!isSignUp && (
          <button onClick={handleForgotPassword} className="text-xs text-muted-foreground hover:text-primary hover:underline">
            Esqueci a senha
          </button>
        )}
        <button onClick={() => setIsSignUp(!isSignUp)} className="text-sm text-primary hover:underline font-semibold">
          {isSignUp ? "Já tenho conta" : "Criar conta"}
        </button>
      </div>
      </div>
    </div>
  );
};

export default Login;
