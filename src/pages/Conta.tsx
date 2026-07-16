import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User, Settings, HelpCircle, LogOut, ChevronRight, ArrowLeft, Camera, Save, Shield, MapPin, Handshake, Clock, CheckCircle, Package, MessageSquare, Image, Send } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AvatarCropDialog from "@/components/AvatarCropDialog";

type View = "main" | "settings" | "help" | "partner-request" | "support";

const ContaPage = () => {
  const navigate = useNavigate();
  const { user, profile, signOut, refreshProfile } = useAuth();
  const [view, setView] = useState<View>("main");
  const [newName, setNewName] = useState(profile?.display_name || "");
  const [endereco, setEndereco] = useState(profile?.endereco || "");
  const [cep, setCep] = useState(profile?.cep || "");
  const [cidade, setCidade] = useState(profile?.cidade || "");
  const [pontoReferencia, setPontoReferencia] = useState(profile?.ponto_referencia || "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [subscriptionLabel, setSubscriptionLabel] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);

  // Partner request
  const [partnerRequestStatus, setPartnerRequestStatus] = useState<string | null>(null);
  const [prNome, setPrNome] = useState("");
  const [prWhatsapp, setPrWhatsapp] = useState("");
  const [prCidade, setPrCidade] = useState("");
  const [prEndereco, setPrEndereco] = useState("");
  const [prCep, setPrCep] = useState("");
  const [prQuantidade, setPrQuantidade] = useState("");
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .then(({ data }) => setIsAdmin(!!data && data.length > 0));

    supabase
      .from("user_subscriptions")
      .select("subscription_type, active")
      .eq("user_id", user.id)
      .eq("active", true)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setSubscriptionLabel(data.subscription_type === "semanal" ? "Entrega Semanal" : "Entrega Quinzenal");
        } else {
          setSubscriptionLabel(null);
        }
      });

    supabase
      .from("partner_requests")
      .select("status")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setPartnerRequestStatus(data[0].status);
        }
      });
  }, [user]);

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const handleSaveName = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: newName, endereco, cep, cidade, ponto_referencia: pontoReferencia })
      .eq("user_id", user.id);
    if (error) {
      toast.error("Erro ao salvar.");
    } else {
      toast.success("Dados atualizados!");
      await refreshProfile();
    }
    setSaving(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const reader = new FileReader();
    reader.onload = () => setCropImageSrc(reader.result as string);
    reader.readAsDataURL(file);
    // Reset input so same file can be selected again
    e.target.value = "";
  };

  const handleCroppedAvatar = async (blob: Blob) => {
    if (!user) return;
    setCropImageSrc(null);
    setUploading(true);
    const path = `${user.id}/avatar.jpg`;
    const file = new File([blob], "avatar.jpg", { type: "image/jpeg" });
    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (uploadError) { toast.error("Erro ao enviar foto."); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    await supabase.from("profiles").update({ avatar_url: urlData.publicUrl + "?t=" + Date.now() }).eq("user_id", user.id);
    toast.success("Foto atualizada!");
    await refreshProfile();
    setUploading(false);
  };

  // CEP auto-fill for settings
  const handleCepChange = async (value: string) => {
    setCep(value);
    const cleanCep = value.replace(/\D/g, "");
    if (cleanCep.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await res.json();
        if (!data.erro && data.localidade) {
          setCidade(data.localidade);
        }
      } catch {}
    }
  };

  const handleSubmitPartnerRequest = async () => {
    if (!user) return;
    if (!prNome.trim() || !prWhatsapp.trim() || !prCidade.trim() || !prQuantidade.trim() || !prEndereco.trim() || !prCep.trim()) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }
    setSubmittingRequest(true);
    const { error } = await supabase.from("partner_requests").insert({
      user_id: user.id,
      nome_completo: prNome,
      whatsapp: prWhatsapp,
      cidade: prCidade,
      endereco: prEndereco,
      cep: prCep,
      quantidade_media: prQuantidade,
      finalidade: "revenda",
    });
    if (error) {
      toast.error("Erro ao enviar solicitação.");
    } else {
      setPartnerRequestStatus("pendente");
      setShowSuccessDialog(true);
      setPrNome(""); setPrWhatsapp(""); setPrCidade(""); setPrQuantidade(""); setPrEndereco(""); setPrCep("");
    }
    setSubmittingRequest(false);
  };

  const handleRevertToClient = async () => {
    if (!user) return;
    const { error } = await supabase.from("profiles").update({ user_type: "cliente" }).eq("user_id", user.id);
    if (error) {
      toast.error("Erro ao alterar tipo de conta.");
    } else {
      toast.success("Modo cliente ativado.");
      await refreshProfile();
    }
  };

  // ── Partner Request Form ──
  if (view === "partner-request") {
    return (
      <div className="min-h-screen bg-background pb-20">
        <Header />
        <main className="max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto px-3 py-4">
          <button onClick={() => setView("main")} className="flex items-center gap-2 text-primary mb-4">
            <ArrowLeft size={18} /> <span className="font-semibold text-sm">Voltar</span>
          </button>
          <h2 className="font-display text-xl font-bold text-foreground mb-4">🤝 Tornar-se Parceiro</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Preencha o formulário abaixo para solicitar acesso como parceiro revendedor e ter condições especiais de compra.
          </p>

          <div className="gradient-card border-warm rounded-xl p-4 space-y-3">
            <Input placeholder="Nome completo *" value={prNome} onChange={(e) => setPrNome(e.target.value)} className="bg-secondary border-border" />
            <Input placeholder="WhatsApp (com DDD) *" value={prWhatsapp} onChange={(e) => setPrWhatsapp(e.target.value)} className="bg-secondary border-border" type="tel" />
            <Input placeholder="Endereço completo *" value={prEndereco} onChange={(e) => setPrEndereco(e.target.value)} className="bg-secondary border-border" />
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="CEP *" value={prCep} onChange={(e) => setPrCep(e.target.value)} className="bg-secondary border-border" />
              <Input placeholder="Cidade *" value={prCidade} onChange={(e) => setPrCidade(e.target.value)} className="bg-secondary border-border" />
            </div>
            <Select value={prQuantidade} onValueChange={setPrQuantidade}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Qtd. de cartelas por semana *" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1 cartela (30 ovos)">1 cartela (30 ovos)</SelectItem>
                <SelectItem value="2 cartelas (60 ovos)">2 cartelas (60 ovos)</SelectItem>
                <SelectItem value="3 cartelas (90 ovos)">3 cartelas (90 ovos)</SelectItem>
                <SelectItem value="4 cartelas (120 ovos)">4 cartelas (120 ovos)</SelectItem>
                <SelectItem value="5 cartelas (150 ovos)">5 cartelas (150 ovos)</SelectItem>
                <SelectItem value="6-10 cartelas">6 a 10 cartelas</SelectItem>
                <SelectItem value="10+ cartelas">Mais de 10 cartelas</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSubmitPartnerRequest} disabled={submittingRequest} className="w-full gradient-gold text-primary-foreground font-bold rounded-xl h-12">
              {submittingRequest ? "Enviando..." : "Enviar Solicitação"}
            </Button>
          </div>
        </main>
        <BottomNav />

        <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-center">✅ Solicitação Enviada!</DialogTitle>
              <DialogDescription className="text-center">
                Recebemos sua solicitação para se tornar parceiro. Em breve entraremos em contato pelo WhatsApp para análise e aprovação.
              </DialogDescription>
            </DialogHeader>
            <Button onClick={() => { setShowSuccessDialog(false); setView("main"); }} className="gradient-gold text-primary-foreground font-bold rounded-xl">
              Entendi
            </Button>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  if (view === "settings") {
    return (
      <div className="min-h-screen bg-background pb-20">
        <Header />
        <main className="max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto px-3 py-4">
          <button onClick={() => setView("main")} className="flex items-center gap-2 text-primary mb-4">
            <ArrowLeft size={18} /> <span className="font-semibold text-sm">Voltar</span>
          </button>
          <h2 className="font-display text-xl font-bold text-foreground mb-4">⚙️ Configurações</h2>
          <div className="gradient-card border-warm rounded-xl p-6 text-center mb-4">
            <div className="relative inline-block">
              <Avatar className="w-20 h-20 mx-auto">
                <AvatarImage src={profile?.avatar_url || ""} />
                <AvatarFallback className="bg-secondary text-primary text-2xl font-bold">
                  {(profile?.display_name || "U")[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <button onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1.5" disabled={uploading}>
                <Camera size={14} />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </div>
            {uploading && <p className="text-primary text-xs mt-2">Enviando foto...</p>}
          </div>
          <div className="gradient-card border-warm rounded-xl p-4 space-y-3">
            <label className="text-foreground text-sm font-semibold">Nome</label>
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} className="bg-secondary border-border" placeholder="Seu nome" />
            <label className="text-foreground text-sm font-semibold flex items-center gap-1 mt-2">
              <MapPin size={14} className="text-primary" /> Endereço de Entrega
            </label>
            <Input value={endereco} onChange={(e) => setEndereco(e.target.value)} className="bg-secondary border-border" placeholder="Endereço completo" />
            <div className="grid grid-cols-2 gap-2">
              <Input value={cep} onChange={(e) => handleCepChange(e.target.value)} className="bg-secondary border-border" placeholder="CEP" />
              <Input value={cidade} onChange={(e) => setCidade(e.target.value)} className="bg-secondary border-border" placeholder="Cidade" />
            </div>
            <Input value={pontoReferencia} onChange={(e) => setPontoReferencia(e.target.value)} className="bg-secondary border-border" placeholder="Ponto de referência" />
            <Button onClick={handleSaveName} disabled={saving} className="w-full gradient-gold text-primary-foreground font-bold rounded-xl">
              <Save size={16} className="mr-2" />
              {saving ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </main>
        <BottomNav />
        {cropImageSrc && (
          <AvatarCropDialog
            open={!!cropImageSrc}
            imageSrc={cropImageSrc}
            onClose={() => setCropImageSrc(null)}
            onCropComplete={handleCroppedAvatar}
          />
        )}
      </div>
    );
  }

  if (view === "support") {
    return <SupportView user={user} onBack={() => setView("help")} />;
  }

  if (view === "help") {
    return (
      <div className="min-h-screen bg-background pb-20">
        <Header />
        <main className="max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto px-3 py-4">
          <button onClick={() => setView("main")} className="flex items-center gap-2 text-primary mb-4">
            <ArrowLeft size={18} /> <span className="font-semibold text-sm">Voltar</span>
          </button>
          <h2 className="font-display text-xl font-bold text-foreground mb-4">❓ Ajuda e Suporte</h2>
          <div className="space-y-4">
            <button
              onClick={() => setView("support")}
              className="w-full gradient-card border-warm rounded-xl p-4 flex items-center gap-3 text-left hover:bg-secondary/50 transition-colors"
            >
              <div className="bg-primary/20 rounded-full p-2">
                <MessageSquare size={20} className="text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-foreground font-semibold text-sm">💬 Falar com o Suporte</h3>
                <p className="text-muted-foreground text-xs">Envie sua sugestão, reclamação ou dúvida</p>
              </div>
              <ChevronRight size={16} className="text-muted-foreground" />
            </button>
            <div className="gradient-card border-warm rounded-xl p-4">
              <h3 className="text-foreground font-semibold text-sm mb-2">🛒 Como fazer uma compra</h3>
              <p className="text-muted-foreground text-xs leading-relaxed">
                1. Navegue pelos produtos no menu principal ou na aba "Produtos".<br />
                2. Selecione o produto desejado e clique em "Adicionar".<br />
                3. Acesse seu carrinho e revise os itens.<br />
                4. Clique em "Finalizar Pedido" e escolha a forma de pagamento.<br />
                5. Confirme e aguarde a entrega.
              </p>
            </div>
            <div className="gradient-card border-warm rounded-xl p-4">
              <h3 className="text-foreground font-semibold text-sm mb-2">💳 Pagamento com Cartão</h3>
              <p className="text-muted-foreground text-xs leading-relaxed">
                Aceitamos cartões de crédito das principais bandeiras (Visa, Mastercard, Elo, American Express).
              </p>
            </div>
            <div className="gradient-card border-warm rounded-xl p-4">
              <h3 className="text-foreground font-semibold text-sm mb-2">📱 Contato</h3>
              <p className="text-muted-foreground text-xs leading-relaxed mb-3">
                Envie uma mensagem com foto para sugestões, reclamações ou dúvidas. 🌿
              </p>
              <Button
                onClick={() => setView("support")}
                className="w-full gradient-gold text-primary-foreground font-bold rounded-xl h-10 text-sm"
              >
                <MessageSquare size={16} className="mr-2" />
                Enviar Mensagem com Foto
              </Button>
            </div>
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  const userType = profile?.user_type || "cliente";
  const isParceiro = userType === "parceiro";
  const isApproved = partnerRequestStatus === "aprovado" || isParceiro;

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <main className="max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto px-3 py-4">
        <div className="gradient-card border-warm rounded-xl p-6 mb-6">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16 flex-shrink-0">
              <AvatarImage src={profile?.avatar_url || ""} />
              <AvatarFallback className="bg-secondary text-primary text-xl font-bold">
                {(profile?.display_name || user?.email?.[0] || "U").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h2 className="font-display text-xl font-bold text-foreground truncate">
                {profile?.display_name || "Usuário"}
              </h2>
              <p className="text-muted-foreground text-sm truncate">{user?.email || ""}</p>
              <div className="flex items-center gap-2 mt-1">
                {subscriptionLabel && (
                  <span className="inline-block bg-primary/20 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">
                    📅 {subscriptionLabel}
                  </span>
                )}
                <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${isParceiro ? "bg-green-500/20 text-green-400" : "bg-secondary text-muted-foreground"}`}>
                  {isParceiro ? "🤝 Parceiro" : "👤 Cliente"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {/* PARTNER / CLIENT MODE TOGGLE BLOCK */}
          <div className="w-full gradient-card border-warm rounded-xl overflow-hidden">
            {isParceiro ? (
              <div className="flex h-16">
                <Link
                  to="/parceiro-produtos"
                  className="flex-1 flex items-center justify-center gap-2 bg-green-500/15 border-r border-border text-green-400 font-bold text-sm transition-all duration-300 hover:bg-green-500/25 relative"
                >
                  <Package size={18} />
                  <span>Área Parceiro</span>
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-500 animate-fade-in" />
                </Link>
                <button
                  onClick={handleRevertToClient}
                  className="flex-1 flex items-center justify-center gap-2 text-muted-foreground font-semibold text-sm transition-all duration-300 hover:bg-secondary/80 hover:text-foreground"
                >
                  <User size={18} />
                  <span>Modo Cliente</span>
                </button>
              </div>
            ) : isApproved ? (
              <div className="flex h-16">
                <button
                  onClick={async () => {
                    if (!user) return;
                    const { error } = await supabase.from("profiles").update({ user_type: "parceiro" }).eq("user_id", user.id);
                    if (error) { toast.error("Erro ao ativar modo parceiro."); return; }
                    toast.success("Modo parceiro ativado!");
                    await refreshProfile();
                  }}
                  className="flex-1 flex items-center justify-center gap-2 text-green-400 font-semibold text-sm transition-all duration-300 hover:bg-green-500/15"
                >
                  <Handshake size={18} />
                  <span>Sou Parceiro</span>
                </button>
                <div className="flex-1 flex items-center justify-center gap-2 bg-secondary/50 border-l border-border text-foreground font-bold text-sm relative">
                  <User size={18} className="text-primary" />
                  <span>Modo Cliente</span>
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary animate-fade-in" />
                </div>
              </div>
            ) : partnerRequestStatus === "pendente" ? (
              <div className="flex h-16">
                <div className="flex-1 flex items-center justify-center gap-2 text-yellow-400 font-semibold text-sm">
                  <Clock size={18} className="animate-pulse" />
                  <span>Solicitação em análise</span>
                </div>
                <div className="flex-1 flex items-center justify-center gap-2 bg-secondary/50 border-l border-border text-foreground font-bold text-sm relative">
                  <User size={18} className="text-primary" />
                  <span>Modo Cliente</span>
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                </div>
              </div>
            ) : (
              <div className="flex h-16">
                <button
                  onClick={() => setView("partner-request")}
                  className="flex-1 flex flex-col items-center justify-center gap-0.5 text-primary font-semibold text-sm transition-all duration-300 hover:bg-primary/10"
                >
                  <div className="flex items-center gap-2">
                    <Handshake size={18} />
                    <span>Tornar Parceiro</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-normal">Valores para revenda</span>
                </button>
                <div className="flex-1 flex items-center justify-center gap-2 bg-secondary/50 border-l border-border text-foreground font-bold text-sm relative">
                  <User size={18} className="text-primary" />
                  <span>Modo Cliente</span>
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => {
              setNewName(profile?.display_name || "");
              setEndereco(profile?.endereco || "");
              setCep(profile?.cep || "");
              setCidade(profile?.cidade || "");
              setPontoReferencia(profile?.ponto_referencia || "");
              setView("settings");
            }}
            className="w-full gradient-card border-warm rounded-xl p-4 flex items-center gap-3 text-foreground hover:border-primary/30 transition-colors"
          >
            <Settings size={20} className="text-primary" />
            <span className="font-semibold text-sm flex-1 text-left">Configurações</span>
            <ChevronRight size={16} className="text-muted-foreground" />
          </button>

          <button
            onClick={() => setView("help")}
            className="w-full gradient-card border-warm rounded-xl p-4 flex items-center gap-3 text-foreground hover:border-primary/30 transition-colors"
          >
            <HelpCircle size={20} className="text-primary" />
            <span className="font-semibold text-sm flex-1 text-left">Ajuda e Suporte</span>
            <ChevronRight size={16} className="text-muted-foreground" />
          </button>

          {isAdmin && (
            <Link
              to="/admin"
              className="w-full gradient-card border-warm rounded-xl p-4 flex items-center gap-3 text-foreground hover:border-primary/30 transition-colors"
            >
              <Shield size={20} className="text-primary" />
              <span className="font-semibold text-sm flex-1 text-left">Painel Admin</span>
              <ChevronRight size={16} className="text-muted-foreground" />
            </Link>
          )}

          <button
            onClick={handleLogout}
            className="w-full gradient-card border-warm rounded-xl p-4 flex items-center gap-3 text-foreground hover:border-primary/30 transition-colors"
          >
            <LogOut size={20} className="text-destructive" />
            <span className="font-semibold text-sm text-destructive">Sair</span>
          </button>
        </div>
      </main>
      <BottomNav />
    </div>
  );
};

// Support View Component
const SupportView = ({ user, onBack }: { user: any; onBack: () => void }) => {
  const [subject, setSubject] = useState("");
  const [msg, setMsg] = useState("");
  const [ticketType, setTicketType] = useState("sugestao");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [myTickets, setMyTickets] = useState<any[]>([]);
  const imgRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("support_tickets").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).then(({ data }) => {
      setMyTickets(data || []);
    });
  }, [user]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSend = async () => {
    if (!subject.trim() || !msg.trim()) { toast.error("Preencha assunto e mensagem."); return; }
    setSending(true);
    let imageUrl: string | null = null;
    try {
      if (imageFile) {
        const ext = imageFile.name.split(".").pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("support-images").upload(path, imageFile);
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage.from("support-images").getPublicUrl(path);
        imageUrl = urlData.publicUrl;
      }
      const { error } = await supabase.from("support_tickets").insert({
        user_id: user.id,
        type: ticketType,
        subject,
        message: msg,
        image_url: imageUrl,
      });
      if (error) throw error;
      toast.success("Mensagem enviada com sucesso!");
      setSubject(""); setMsg(""); setImageFile(null); setImagePreview(null);
      const { data } = await supabase.from("support_tickets").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      setMyTickets(data || []);
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar.");
    } finally { setSending(false); }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <main className="max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto px-3 py-4">
        <button onClick={onBack} className="flex items-center gap-2 text-primary mb-4">
          <ArrowLeft size={18} /> <span className="font-semibold text-sm">Voltar</span>
        </button>
        <h2 className="font-display text-xl font-bold text-foreground mb-4">💬 Falar com o Suporte</h2>

        <div className="gradient-card border-warm rounded-xl p-4 space-y-3 mb-6">
          <Select value={ticketType} onValueChange={setTicketType}>
            <SelectTrigger className="bg-secondary border-border">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sugestao">💡 Sugestão</SelectItem>
              <SelectItem value="reclamacao">⚠️ Reclamação</SelectItem>
              <SelectItem value="duvida">❓ Dúvida</SelectItem>
            </SelectContent>
          </Select>
          <Input placeholder="Assunto *" value={subject} onChange={(e) => setSubject(e.target.value)} className="bg-secondary border-border" />
          <Textarea placeholder="Escreva sua mensagem... *" value={msg} onChange={(e) => setMsg(e.target.value)} className="bg-secondary border-border min-h-[100px]" />

          <div>
            <input ref={imgRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
            <button onClick={() => imgRef.current?.click()} className="flex items-center gap-2 text-sm text-primary hover:underline">
              <Image size={16} /> {imageFile ? "Trocar foto" : "Anexar foto (opcional)"}
            </button>
            {imagePreview && (
              <div className="mt-2 relative inline-block">
                <img src={imagePreview} alt="Preview" className="w-24 h-24 rounded-lg object-cover border border-border" />
                <button onClick={() => { setImageFile(null); setImagePreview(null); }} className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">✕</button>
              </div>
            )}
          </div>

          <Button onClick={handleSend} disabled={sending} className="w-full gradient-gold text-primary-foreground font-bold rounded-xl h-12">
            <Send size={16} className="mr-2" />
            {sending ? "Enviando..." : "Enviar Mensagem"}
          </Button>
        </div>

        {myTickets.length > 0 && (
          <div>
            <h3 className="text-foreground font-semibold text-sm mb-3">📋 Minhas Mensagens</h3>
            <div className="space-y-2">
              {myTickets.map((t: any) => (
                <div key={t.id} className="gradient-card border-warm rounded-xl p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-foreground text-sm font-semibold">{t.subject}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${t.status === "aberto" ? "bg-primary/20 text-primary" : t.status === "respondido" ? "bg-green-500/20 text-green-400" : "bg-secondary text-muted-foreground"}`}>
                      {t.status === "aberto" ? "Aberto" : t.status === "respondido" ? "Respondido" : "Fechado"}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-xs">{t.message}</p>
                  {t.image_url && <img src={t.image_url} alt="" className="w-16 h-16 rounded-lg object-cover mt-1" />}
                  {t.admin_response && (
                    <div className="bg-primary/10 rounded-lg p-2 mt-1">
                      <p className="text-xs text-primary font-semibold">Resposta do suporte:</p>
                      <p className="text-xs text-foreground">{t.admin_response}</p>
                    </div>
                  )}
                  <p className="text-[10px] text-muted-foreground">{new Date(t.created_at).toLocaleDateString("pt-BR")}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
};

export default ContaPage;
