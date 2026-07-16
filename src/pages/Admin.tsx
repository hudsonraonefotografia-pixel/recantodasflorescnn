import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Navigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Send, Users, User, Shield, ArrowLeft, Zap, Target, Plus, Package, Eye, Share2, Search, Bell, X, Edit2, Check, XCircle, Handshake, BarChart3, ShoppingCart, Egg, Trash2, Save, ChevronUp, ChevronDown, MessageSquare, UserCheck, TrendingUp, DollarSign } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface UserProfile {
  user_id: string;
  display_name: string | null;
  user_type: string;
  created_at: string;
  endereco: string | null;
  cidade: string | null;
  cep: string | null;
  ponto_referencia: string | null;
}

const Admin = () => {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [moreSubTab, setMoreSubTab] = useState("push");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [broadcast, setBroadcast] = useState(true);
  const [targetUserId, setTargetUserId] = useState("");
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [newUserCount, setNewUserCount] = useState(0);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Event form
  const [eventTitle, setEventTitle] = useState("");
  const [eventDesc, setEventDesc] = useState("");
  const [eventType, setEventType] = useState("double_points");
  const [eventBonus, setEventBonus] = useState("");
  const [eventTarget, setEventTarget] = useState("");
  const [eventStart, setEventStart] = useState("");
  const [eventEnd, setEventEnd] = useState("");
  const [savingEvent, setSavingEvent] = useState(false);

  // Mission form
  const [missionTitle, setMissionTitle] = useState("");
  const [missionDesc, setMissionDesc] = useState("");
  const [missionReward, setMissionReward] = useState("");
  const [missionType, setMissionType] = useState("spend_amount");
  const [savingMission, setSavingMission] = useState(false);

  // Product form
  const [prodNome, setProdNome] = useState("");
  const [prodPreco, setProdPreco] = useState("");
  const [prodPrecoParceiro, setProdPrecoParceiro] = useState("");
  const [prodCategoria, setProdCategoria] = useState("");
  const [prodDescricao, setProdDescricao] = useState("");
  const [prodEstoque, setProdEstoque] = useState("");
  const [prodLote, setProdLote] = useState("");
  const [prodValidade, setProdValidade] = useState("");
  const [prodUnitType, setProdUnitType] = useState("unidade");
  const [prodQuantidade, setProdQuantidade] = useState("");
  const [prodVisivelCliente, setProdVisivelCliente] = useState(true);
  const [prodVisivelParceiro, setProdVisivelParceiro] = useState(true);
  const [savingProduct, setSavingProduct] = useState(false);

  // Edit product
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [editProd, setEditProd] = useState<any>({});

  // Partner requests filter
  const [partnerFilter, setPartnerFilter] = useState("pendente");

  // Edit partner
  const [editingPartner, setEditingPartner] = useState<any | null>(null);
  const [editPartnerData, setEditPartnerData] = useState<any>({});

  useEffect(() => {
    if (!user) return;
    checkAdminRole();
  }, [user]);

  useEffect(() => {
    const channel = supabase
      .channel("admin-new-users")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "profiles" }, () => {
        queryClient.invalidateQueries({ queryKey: ["admin-users"] });
        setNewUserCount(prev => prev + 1);
        toast.info("🆕 Novo usuário cadastrado!", { duration: 5000 });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const checkAdminRole = async () => {
    if (!user) return;
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin");
    setIsAdmin(data && data.length > 0);
  };

  const { data: users = [] } = useQuery<UserProfile[]>({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("user_id, display_name, user_type, created_at, endereco, cidade, cep, ponto_referencia");
      return (data || []) as UserProfile[];
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data } = await supabase.from("produtos").select("*").order("categoria", { ascending: true }).order("sort_order", { ascending: true }).order("nome", { ascending: true });
      return data || [];
    },
  });

  const { data: partnerRequests = [] } = useQuery({
    queryKey: ["admin-partner-requests"],
    queryFn: async () => {
      const { data } = await supabase.from("partner_requests").select("*").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: purchaseHistory = [] } = useQuery({
    queryKey: ["admin-purchases"],
    queryFn: async () => {
      const { data } = await supabase.from("purchase_history").select("*").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: activeEvents } = useQuery({
    queryKey: ["admin-events"],
    queryFn: async () => {
      const { data } = await supabase.from("special_events").select("*").order("created_at", { ascending: false }).limit(20);
      return data || [];
    },
  });

  const { data: activeMissions } = useQuery({
    queryKey: ["admin-missions"],
    queryFn: async () => {
      const { data } = await supabase.from("weekly_missions").select("*").order("created_at", { ascending: false }).limit(20);
      return data || [];
    },
  });

  const { data: supportTickets = [] } = useQuery({
    queryKey: ["admin-support-tickets"],
    queryFn: async () => {
      const { data } = await supabase.from("support_tickets").select("*").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: adminRequests = [] } = useQuery({
    queryKey: ["admin-requests"],
    queryFn: async () => {
      const { data } = await supabase.from("admin_requests").select("*").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: adminRoles = [] } = useQuery({
    queryKey: ["admin-roles"],
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("user_id, role").eq("role", "admin");
      return data || [];
    },
  });

  const adminUserIds = new Set(adminRoles.map((r: any) => r.user_id));

  const [adminReqFilter, setAdminReqFilter] = useState("pendente");

  const [supportFilter, setSupportFilter] = useState("aberto");
  const [replyingTicket, setReplyingTicket] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const handleMarkUsersViewed = () => { setNewUserCount(0); };

  const filteredUsers = users.filter((u) => {
    if (u.user_id === user?.id) return false;
    const matchesSearch = !searchQuery || u.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) || u.user_id.includes(searchQuery);
    let matchesDate = true;
    if (dateFrom) matchesDate = new Date(u.created_at) >= new Date(dateFrom);
    if (dateTo && matchesDate) matchesDate = new Date(u.created_at) <= new Date(dateTo + "T23:59:59");
    return matchesSearch && matchesDate;
  });

  const filteredPartnerRequests = partnerRequests.filter((r: any) => r.status === partnerFilter);

  const handleShareResetLink = async (targetUser: UserProfile) => {
    const toastId = toast.loading("Gerando link de redefinição...");
    try {
      const { data, error } = await supabase.functions.invoke("generate-reset-link", {
        body: { user_id: targetUser.user_id },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message || "Erro");
      const name = data.display_name || "cliente";
      const msg = `Olá ${name}! 👋\n\nSeu acesso ao Recanto das Flores:\n📧 Email: ${data.email}\n🔑 Clique no link abaixo para redefinir sua senha:\n\n${data.reset_link}\n\nApós redefinir, acesse normalmente pelo app.\n\n🌿 Equipe Recanto das Flores`;
      toast.dismiss(toastId);
      if (navigator.share) {
        try { await navigator.share({ title: "Acesso Recanto das Flores", text: msg }); } catch { }
      } else {
        await navigator.clipboard.writeText(msg);
        toast.success("Link copiado!");
      }
    } catch (err: any) {
      toast.dismiss(toastId);
      toast.error(err.message || "Erro ao gerar link");
    }
  };

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) { toast.error("Preencha título e mensagem"); return; }
    if (!broadcast && !targetUserId) { toast.error("Selecione um usuário"); return; }
    setSending(true);
    try {
      const payload: any = { title, message };
      if (broadcast) payload.broadcast = true; else payload.user_id = targetUserId;
      const { data, error } = await supabase.functions.invoke("send-push", { body: payload });
      if (error) throw error;
      toast.success(`Notificação enviada! ${data.sent} push(es) enviado(s).`);
      setTitle(""); setMessage("");
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar");
    } finally { setSending(false); }
  };

  // Get quantity label based on unit type
  const getQuantityLabel = (unitType: string) => {
    switch (unitType) {
      case "kg": return "Peso (kg)";
      case "cartela": return "Qtd. Cartelas (30 ovos)";
      case "bandeja": return "Qtd. Bandejas";
      default: return "Quantidade (unidades)";
    }
  };

  const handleCreateProduct = async () => {
    if (!prodNome || !prodPreco) { toast.error("Nome e preço são obrigatórios"); return; }
    setSavingProduct(true);
    try {
      const { error } = await supabase.from("produtos").insert({
        nome: prodNome, preco: parseFloat(prodPreco),
        preco_parceiro: prodPrecoParceiro ? parseFloat(prodPrecoParceiro) : null,
        categoria: prodCategoria || null, descricao: prodDescricao || null,
        estoque: parseInt(prodEstoque) || 0, lote: prodLote || null,
        validade: prodValidade || null, unit_type: prodUnitType,
        visivel_cliente: prodVisivelCliente, visivel_parceiro: prodVisivelParceiro,
      });
      if (error) throw error;
      toast.success("Produto criado!");
      setProdNome(""); setProdPreco(""); setProdPrecoParceiro(""); setProdCategoria(""); setProdDescricao(""); setProdEstoque(""); setProdLote(""); setProdValidade(""); setProdUnitType("unidade"); setProdQuantidade(""); setProdVisivelCliente(true); setProdVisivelParceiro(true);
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    } catch (err: any) { toast.error(err.message); }
    finally { setSavingProduct(false); }
  };

  const handleEditProduct = (p: any) => {
    setEditingProduct(p);
    setEditProd({
      nome: p.nome, preco: p.preco, preco_parceiro: p.preco_parceiro || "",
      categoria: p.categoria || "", descricao: p.descricao || "",
      estoque: p.estoque, lote: p.lote || "", validade: p.validade || "",
      unit_type: p.unit_type || "unidade",
      visivel_cliente: p.visivel_cliente !== false,
      visivel_parceiro: p.visivel_parceiro !== false,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingProduct) return;
    const { error } = await supabase.from("produtos").update({
      nome: editProd.nome, preco: parseFloat(editProd.preco),
      preco_parceiro: editProd.preco_parceiro ? parseFloat(editProd.preco_parceiro) : null,
      categoria: editProd.categoria || null, descricao: editProd.descricao || null,
      estoque: parseInt(editProd.estoque) || 0, lote: editProd.lote || null,
      validade: editProd.validade || null, unit_type: editProd.unit_type || "unidade",
      visivel_cliente: editProd.visivel_cliente, visivel_parceiro: editProd.visivel_parceiro,
    }).eq("id", editingProduct.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Produto atualizado!");
    setEditingProduct(null);
    queryClient.invalidateQueries({ queryKey: ["admin-products"] });
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Deseja realmente remover este produto?")) return;
    const { error } = await supabase.from("produtos").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Produto removido"); queryClient.invalidateQueries({ queryKey: ["admin-products"] }); }
  };

  const handleApprovePartner = async (request: any) => {
    const { error: reqError } = await supabase.from("partner_requests").update({ status: "aprovado" }).eq("id", request.id);
    if (reqError) { toast.error(reqError.message); return; }
    const { error: profError } = await supabase.from("profiles").update({ user_type: "parceiro" }).eq("user_id", request.user_id);
    if (profError) { toast.error(profError.message); return; }
    toast.success("Parceiro aprovado!");
    queryClient.invalidateQueries({ queryKey: ["admin-partner-requests"] });
    queryClient.invalidateQueries({ queryKey: ["admin-users"] });
  };

  const handleRejectPartner = async (request: any) => {
    const { error } = await supabase.from("partner_requests").update({ status: "recusado" }).eq("id", request.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Solicitação recusada.");
    queryClient.invalidateQueries({ queryKey: ["admin-partner-requests"] });
  };

  const handleRevokePartner = async (request: any) => {
    if (!confirm("Deseja remover este parceiro? Ele perderá acesso aos preços especiais.")) return;
    // Revert profile to cliente
    await supabase.from("profiles").update({ user_type: "cliente" }).eq("user_id", request.user_id);
    // Delete the request
    await supabase.from("partner_requests").delete().eq("id", request.id);
    toast.success("Parceiro removido.");
    queryClient.invalidateQueries({ queryKey: ["admin-partner-requests"] });
    queryClient.invalidateQueries({ queryKey: ["admin-users"] });
  };

  const handleEditPartner = (r: any) => {
    setEditingPartner(r);
    setEditPartnerData({
      nome_completo: r.nome_completo,
      whatsapp: r.whatsapp,
      cidade: r.cidade,
      endereco: r.endereco || "",
      cep: r.cep || "",
      quantidade_media: r.quantidade_media,
    });
  };

  const handleSavePartnerEdit = async () => {
    if (!editingPartner) return;
    const { error } = await supabase.from("partner_requests").update(editPartnerData).eq("id", editingPartner.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Parceiro atualizado!");
    setEditingPartner(null);
    queryClient.invalidateQueries({ queryKey: ["admin-partner-requests"] });
  };

  const handleCreateEvent = async () => {
    if (!eventTitle || !eventDesc || !eventStart || !eventEnd) { toast.error("Preencha todos os campos"); return; }
    setSavingEvent(true);
    try {
      const { error } = await supabase.from("special_events").insert({
        title: eventTitle, description: eventDesc, event_type: eventType,
        bonus_points: parseInt(eventBonus) || 0, target_points: parseInt(eventTarget) || 0,
        start_date: new Date(eventStart).toISOString(), end_date: new Date(eventEnd).toISOString(),
        active: true, config: {},
      });
      if (error) throw error;
      toast.success("Evento criado!");
      setEventTitle(""); setEventDesc(""); setEventBonus(""); setEventTarget(""); setEventStart(""); setEventEnd("");
      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
    } catch (err: any) { toast.error(err.message); }
    finally { setSavingEvent(false); }
  };

  const handleToggleEvent = async (id: string, active: boolean) => {
    await supabase.from("special_events").update({ active: !active }).eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["admin-events"] });
  };

  const handleCreateMission = async () => {
    if (!missionTitle || !missionDesc || !missionReward) { toast.error("Preencha todos os campos"); return; }
    setSavingMission(true);
    const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
    const weekEnd = new Date(weekStart); weekEnd.setDate(weekEnd.getDate() + 6);
    try {
      const { error } = await supabase.from("weekly_missions").insert({
        title: missionTitle, description: missionDesc, reward_points: parseInt(missionReward) || 0,
        mission_type: missionType, target_value: {},
        week_start: weekStart.toISOString().split("T")[0], week_end: weekEnd.toISOString().split("T")[0], active: true,
      });
      if (error) throw error;
      toast.success("Missão criada!");
      setMissionTitle(""); setMissionDesc(""); setMissionReward("");
      queryClient.invalidateQueries({ queryKey: ["admin-missions"] });
    } catch (err: any) { toast.error(err.message); }
    finally { setSavingMission(false); }
  };

  const handleToggleMission = async (id: string, active: boolean) => {
    await supabase.from("weekly_missions").update({ active: !active }).eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["admin-missions"] });
  };

  const handleReplyTicket = async (ticketId: string) => {
    if (!replyText.trim()) { toast.error("Escreva uma resposta"); return; }
    const { error } = await supabase.from("support_tickets").update({ admin_response: replyText, status: "respondido" }).eq("id", ticketId);
    if (error) { toast.error(error.message); return; }
    toast.success("Resposta enviada!");
    setReplyingTicket(null); setReplyText("");
    queryClient.invalidateQueries({ queryKey: ["admin-support-tickets"] });
  };

  const handleCloseTicket = async (ticketId: string) => {
    const { error } = await supabase.from("support_tickets").update({ status: "fechado" }).eq("id", ticketId);
    if (error) { toast.error(error.message); return; }
    toast.success("Ticket fechado.");
    queryClient.invalidateQueries({ queryKey: ["admin-support-tickets"] });
  };

  const handleApproveAdminRequest = async (req: any) => {
    // Add admin role to user
    const { error: roleError } = await supabase.from("user_roles").insert({ user_id: req.user_id, role: "admin" as const });
    if (roleError) { toast.error("Erro ao adicionar role: " + roleError.message); return; }
    // Update request status
    await supabase.from("admin_requests").update({ status: "aprovado" }).eq("id", req.id);
    toast.success("Acesso admin aprovado para " + req.display_name + "!");
    queryClient.invalidateQueries({ queryKey: ["admin-requests"] });
  };

  const handleRejectAdminRequest = async (req: any) => {
    await supabase.from("admin_requests").update({ status: "recusado" }).eq("id", req.id);
    toast.success("Solicitação recusada.");
    queryClient.invalidateQueries({ queryKey: ["admin-requests"] });
  };

  const handleToggleAdmin = async (targetUserId: string, displayName: string | null) => {
    const isCurrentlyAdmin = adminUserIds.has(targetUserId);
    if (isCurrentlyAdmin) {
      if (!confirm(`Deseja revogar o acesso admin de ${displayName || "este usuário"}?`)) return;
      const { error } = await supabase.from("user_roles").delete().eq("user_id", targetUserId).eq("role", "admin" as const);
      if (error) { toast.error("Erro ao revogar: " + error.message); return; }
      toast.success("Acesso admin revogado!");
    } else {
      if (!confirm(`Deseja tornar ${displayName || "este usuário"} um administrador?`)) return;
      const { error } = await supabase.from("user_roles").insert({ user_id: targetUserId, role: "admin" as const });
      if (error) { toast.error("Erro ao promover: " + error.message); return; }
      toast.success(`${displayName || "Usuário"} agora é admin!`);
    }
    queryClient.invalidateQueries({ queryKey: ["admin-roles"] });
    queryClient.invalidateQueries({ queryKey: ["admin-requests"] });
  };

  const filteredAdminRequests = adminRequests.filter((r: any) => r.status === adminReqFilter);
  const pendingAdminRequests = adminRequests.filter((r: any) => r.status === "pendente").length;

  const filteredTickets = supportTickets.filter((t: any) => t.status === supportFilter);
  const openTicketsCount = supportTickets.filter((t: any) => t.status === "aberto").length;

  // Dashboard stats
  const totalClientes = users.filter(u => u.user_type === "cliente").length;
  const totalParceiros = partnerRequests.filter((r: any) => r.status === "aprovado").length;
  const pendingRequests = partnerRequests.filter((r: any) => r.status === "pendente").length;
  const today = new Date().toISOString().split("T")[0];
  const ordersToday = purchaseHistory.filter((p: any) => p.created_at?.startsWith(today)).length;
  const currentMonth = new Date().toISOString().slice(0, 7);
  const ordersMonth = purchaseHistory.filter((p: any) => p.created_at?.startsWith(currentMonth)).length;
  const totalSalesVolume = purchaseHistory.reduce((sum: number, p: any) => sum + Number(p.total || 0), 0);
  const salesByDay = (() => {
    const last7 = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      const label = d.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit" });
      const dayOrders = purchaseHistory.filter((p: any) => p.created_at?.startsWith(key));
      const total = dayOrders.reduce((s: number, p: any) => s + Number(p.total || 0), 0);
      last7.push({ name: label, vendas: total, pedidos: dayOrders.length });
    }
    return last7;
  })();

  const navigateTo = (tab: string, subTab?: string) => {
    setActiveTab(tab);
    if (subTab) setMoreSubTab(subTab);
    if (tab === "users") handleMarkUsersViewed();
  };

  const handleMoveProduct = async (product: any, direction: "up" | "down", categoryItems: any[]) => {
    const idx = categoryItems.findIndex((p: any) => p.id === product.id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= categoryItems.length) return;
    const other = categoryItems[swapIdx];
    const tempOrder = product.sort_order;
    await Promise.all([
      supabase.from("produtos").update({ sort_order: other.sort_order }).eq("id", product.id),
      supabase.from("produtos").update({ sort_order: tempOrder }).eq("id", other.id),
    ]);
    queryClient.invalidateQueries({ queryKey: ["admin-products"] });
  };

  // Group products by category
  const productsByCategory = products.reduce((acc: Record<string, any[]>, p: any) => {
    const cat = p.categoria || "Sem categoria";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});

  if (loading) return <div className="min-h-screen bg-background" />;
  if (!user) return <Navigate to="/" replace />;
  if (isAdmin === null) return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground">Verificando permissões...</p></div>;
  if (!isAdmin) return <Navigate to="/home" replace />;

  return (
    <div className="min-h-screen bg-background pb-8">
      <header className="sticky top-0 z-40 gradient-card border-b border-border px-4 py-3">
        <div className="flex items-center gap-3 max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto">
          <Link to="/home"><ArrowLeft size={20} className="text-foreground" /></Link>
          <Shield size={20} className="text-primary" />
          <h1 className="font-display text-foreground text-lg">Painel Admin</h1>
          <div className="ml-auto flex items-center gap-2">
            <div className="bg-secondary/80 rounded-full px-3 py-1 flex items-center gap-1.5">
              <Users size={14} className="text-primary" />
              <span className="text-xs font-bold text-foreground">{users.length}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); if (v === "users") handleMarkUsersViewed(); }}>
          <TabsList className="w-full grid grid-cols-4 bg-secondary/50 mb-2">
            <TabsTrigger value="dashboard" className="text-[10px]">📊 Painel</TabsTrigger>
            <TabsTrigger value="users" className="text-[10px] relative">
              👥 Usuários
              {newUserCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-bold">{newUserCount}</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="products" className="text-[10px]">📦 Produtos</TabsTrigger>
            <TabsTrigger value="more" className="text-[10px]">⚙️ Mais</TabsTrigger>
          </TabsList>

          {/* ACTIVE COUNTERS STRIP */}
          <div className="grid grid-cols-7 gap-1.5 mb-4">
            <button onClick={() => navigateTo("users")} className="bg-secondary/60 border border-border rounded-lg p-2 text-center hover:bg-secondary transition-colors">
              <p className="text-sm font-bold text-foreground">{users.length}</p>
              <p className="text-[8px] text-muted-foreground leading-tight">Cadastros</p>
            </button>
            <button onClick={() => navigateTo("users")} className="bg-secondary/60 border border-border rounded-lg p-2 text-center hover:bg-secondary transition-colors">
              <p className="text-sm font-bold text-foreground">{totalClientes}</p>
              <p className="text-[8px] text-muted-foreground leading-tight">Clientes</p>
            </button>
            <button onClick={() => { navigateTo("more", "partners"); setPartnerFilter("aprovado"); }} className="bg-secondary/60 border border-border rounded-lg p-2 text-center hover:bg-secondary transition-colors">
              <p className="text-sm font-bold text-foreground">{totalParceiros}</p>
              <p className="text-[8px] text-muted-foreground leading-tight">Parceiros</p>
            </button>
            <button onClick={() => navigateTo("dashboard")} className="bg-secondary/60 border border-border rounded-lg p-2 text-center hover:bg-secondary transition-colors">
              <p className="text-sm font-bold text-foreground">{purchaseHistory.length}</p>
              <p className="text-[8px] text-muted-foreground leading-tight">Pedidos</p>
            </button>
            <button onClick={() => navigateTo("dashboard")} className="bg-secondary/60 border border-border rounded-lg p-2 text-center hover:bg-secondary transition-colors">
              <p className="text-sm font-bold text-foreground">{ordersToday}</p>
              <p className="text-[8px] text-muted-foreground leading-tight">Hoje</p>
            </button>
            <button onClick={() => { navigateTo("more", "support"); }} className="bg-secondary/60 border border-border rounded-lg p-2 text-center hover:bg-secondary transition-colors">
              <p className="text-sm font-bold text-foreground">{openTicketsCount}</p>
              <p className="text-[8px] text-muted-foreground leading-tight">Suporte</p>
            </button>
            <button onClick={() => { navigateTo("more", "partners"); setPartnerFilter("pendente"); }} className="bg-secondary/60 border border-border rounded-lg p-2 text-center hover:bg-secondary transition-colors">
              <p className="text-sm font-bold text-foreground">{pendingRequests}</p>
              <p className="text-[8px] text-muted-foreground leading-tight">Pendentes</p>
            </button>
          </div>

          {/* DASHBOARD TAB */}
          <TabsContent value="dashboard" className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => navigateTo("users")} className="gradient-card border border-border rounded-xl p-4 text-center hover:border-primary/50 transition-colors">
                <Users size={20} className="text-primary mx-auto mb-1" />
                <p className="text-2xl font-bold text-foreground">{users.length}</p>
                <p className="text-[10px] text-muted-foreground">Total Cadastrados</p>
              </button>
              <button onClick={() => navigateTo("users")} className="gradient-card border border-border rounded-xl p-4 text-center hover:border-primary/50 transition-colors">
                <User size={20} className="text-primary mx-auto mb-1" />
                <p className="text-2xl font-bold text-foreground">{totalClientes}</p>
                <p className="text-[10px] text-muted-foreground">Clientes</p>
              </button>
              <button onClick={() => { navigateTo("more", "partners"); setPartnerFilter("aprovado"); }} className="gradient-card border border-border rounded-xl p-4 text-center hover:border-primary/50 transition-colors">
                <Handshake size={20} className="text-primary mx-auto mb-1" />
                <p className="text-2xl font-bold text-foreground">{totalParceiros}</p>
                <p className="text-[10px] text-muted-foreground">Parceiros Aprovados</p>
              </button>
              <button onClick={() => navigateTo("dashboard")} className="gradient-card border border-border rounded-xl p-4 text-center hover:border-primary/50 transition-colors">
                <ShoppingCart size={20} className="text-primary mx-auto mb-1" />
                <p className="text-2xl font-bold text-foreground">{purchaseHistory.length}</p>
                <p className="text-[10px] text-muted-foreground">Pedidos Totais</p>
              </button>
              <button onClick={() => navigateTo("dashboard")} className="gradient-card border border-border rounded-xl p-4 text-center hover:border-primary/50 transition-colors">
                <BarChart3 size={20} className="text-primary mx-auto mb-1" />
                <p className="text-2xl font-bold text-foreground">{ordersToday}</p>
                <p className="text-[10px] text-muted-foreground">Pedidos Hoje</p>
              </button>
              <button onClick={() => navigateTo("dashboard")} className="gradient-card border border-border rounded-xl p-4 text-center hover:border-primary/50 transition-colors">
                <BarChart3 size={20} className="text-primary mx-auto mb-1" />
                <p className="text-2xl font-bold text-foreground">{ordersMonth}</p>
                <p className="text-[10px] text-muted-foreground">Pedidos do Mês</p>
              </button>
              <button onClick={() => navigateTo("dashboard")} className="gradient-card border border-border rounded-xl p-4 text-center col-span-2 hover:border-primary/50 transition-colors">
                <DollarSign size={20} className="text-primary mx-auto mb-1" />
                <p className="text-2xl font-bold text-foreground">R$ {totalSalesVolume.toFixed(2)}</p>
                <p className="text-[10px] text-muted-foreground">Volume Total de Vendas</p>
              </button>
            </div>

            {/* SALES CHART */}
            <div className="gradient-card border border-border rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <TrendingUp size={18} className="text-primary" />
                <h3 className="font-display text-foreground text-sm">Volume de Vendas (7 dias)</h3>
              </div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesByDay}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `R$${v}`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
                      formatter={(value: number) => [`R$ ${value.toFixed(2)}`, "Vendas"]}
                    />
                    <Bar dataKey="vendas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {pendingRequests > 0 && (
              <button onClick={() => { navigateTo("more", "partners"); setPartnerFilter("pendente"); }} className="w-full gradient-card border border-primary/30 rounded-xl p-4 flex items-center gap-3 hover:border-primary/50 transition-colors">
                <Handshake size={20} className="text-primary" />
                <div className="flex-1 text-left">
                  <p className="text-foreground text-sm font-semibold">{pendingRequests} solicitação(ões) de parceiro pendente(s)</p>
                  <p className="text-muted-foreground text-xs">Clique para gerenciar</p>
                </div>
              </button>
            )}
            {pendingAdminRequests > 0 && (
              <button onClick={() => { navigateTo("more", "admin-req"); setAdminReqFilter("pendente"); }} className="w-full gradient-card border border-destructive/30 rounded-xl p-4 flex items-center gap-3 hover:border-destructive/50 transition-colors">
                <Shield size={20} className="text-destructive" />
                <div className="flex-1 text-left">
                  <p className="text-foreground text-sm font-semibold">{pendingAdminRequests} solicitação(ões) de admin pendente(s)</p>
                  <p className="text-muted-foreground text-xs">Clique para revisar</p>
                </div>
              </button>
            )}
          </TabsContent>

          {/* USERS TAB */}
          <TabsContent value="users" className="space-y-4">
            <div className="grid grid-cols-4 gap-2">
              <div className="bg-secondary/50 rounded-xl p-3 text-center border border-border">
                <p className="text-xl font-bold text-foreground">{users.length}</p>
                <p className="text-[10px] text-muted-foreground">Total</p>
              </div>
              <div className="bg-secondary/50 rounded-xl p-3 text-center border border-border">
                <p className="text-xl font-bold text-foreground">{totalClientes}</p>
                <p className="text-[10px] text-muted-foreground">Clientes</p>
              </div>
              <div className="bg-secondary/50 rounded-xl p-3 text-center border border-border">
                <p className="text-xl font-bold text-foreground">{totalParceiros}</p>
                <p className="text-[10px] text-muted-foreground">Parceiros</p>
              </div>
              <div className="bg-secondary/50 rounded-xl p-3 text-center border border-border">
                <p className="text-xl font-bold text-foreground">{adminUserIds.size}</p>
                <p className="text-[10px] text-muted-foreground">Admins</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <Input placeholder="Buscar por nome ou ID..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 bg-secondary border-border" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-muted-foreground">De</label>
                  <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="bg-secondary border-border text-xs" />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground">Até</label>
                  <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="bg-secondary border-border text-xs" />
                </div>
              </div>
              {(dateFrom || dateTo) && (
                <button onClick={() => { setDateFrom(""); setDateTo(""); }} className="text-xs text-primary hover:underline">Limpar filtros</button>
              )}
              <p className="text-xs text-muted-foreground">{filteredUsers.length} resultado(s)</p>
            </div>

            {/* ADMIN REQUESTS IN USERS TAB */}
            {adminRequests.length > 0 && (
              <div className="gradient-card border border-border rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Shield size={16} className="text-destructive" />
                  <h3 className="font-display text-foreground text-sm">Solicitações de Acesso Admin</h3>
                  {pendingAdminRequests > 0 && (
                    <Badge variant="destructive" className="text-[9px]">{pendingAdminRequests} pendente(s)</Badge>
                  )}
                </div>
                <div className="space-y-2">
                  {adminRequests.map((r: any) => (
                    <div key={r.id} className="bg-secondary/50 border border-border rounded-lg p-3 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0">
                        <Shield size={14} className="text-destructive" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-foreground text-sm font-semibold truncate">{r.display_name}</p>
                        <p className="text-muted-foreground text-[10px]">📧 {r.email}</p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {r.status === "pendente" && (
                          <>
                            <Button onClick={() => handleApproveAdminRequest(r)} size="sm" className="gradient-gold text-primary-foreground font-bold rounded-lg text-[10px] h-7 px-2">
                              <Check size={12} className="mr-0.5" /> Aprovar
                            </Button>
                            <Button onClick={() => handleRejectAdminRequest(r)} size="sm" variant="outline" className="rounded-lg text-[10px] h-7 px-2 text-destructive border-destructive/30">
                              <XCircle size={12} />
                            </Button>
                          </>
                        )}
                        {r.status === "aprovado" && (
                          <Badge className="bg-primary/20 text-primary text-[9px]">✅ Aprovado</Badge>
                        )}
                        {r.status === "recusado" && (
                          <Badge variant="destructive" className="text-[9px]">❌ Recusado</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {filteredUsers.map((u) => (
                <div key={u.user_id} className="gradient-card border border-border rounded-xl p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <User size={16} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground text-sm font-semibold truncate">{u.display_name || "Sem nome"}</p>
                    <div className="flex items-center gap-1.5">
                      <Badge variant={u.user_type === "parceiro" ? "default" : "secondary"} className="text-[9px] px-1.5 py-0">
                        {u.user_type === "parceiro" ? "Parceiro" : "Cliente"}
                      </Badge>
                      {adminUserIds.has(u.user_id) && (
                        <Badge variant="destructive" className="text-[9px] px-1.5 py-0">
                          Adm
                        </Badge>
                      )}
                      <span className="text-[10px] text-muted-foreground">{new Date(u.created_at).toLocaleDateString("pt-BR")}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleToggleAdmin(u.user_id, u.display_name)} className={`p-1.5 rounded-lg hover:bg-secondary transition-colors ${adminUserIds.has(u.user_id) ? '' : ''}`} title={adminUserIds.has(u.user_id) ? "Revogar admin" : "Tornar admin"}>
                      <Shield size={16} className={adminUserIds.has(u.user_id) ? "text-destructive" : "text-muted-foreground"} />
                    </button>
                    <button onClick={() => setSelectedUser(u)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors" title="Ver detalhes">
                      <Eye size={16} className="text-muted-foreground" />
                    </button>
                    <button onClick={() => handleShareResetLink(u)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors" title="Compartilhar acesso">
                      <Share2 size={16} className="text-primary" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {selectedUser && (
              <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setSelectedUser(null)}>
                <div className="bg-background border border-border rounded-2xl p-5 w-full max-w-sm space-y-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-foreground">Detalhes do Usuário</h3>
                    <button onClick={() => setSelectedUser(null)}><X size={18} className="text-muted-foreground" /></button>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-muted-foreground">Nome:</span> <span className="text-foreground">{selectedUser.display_name || "—"}</span></p>
                    <p><span className="text-muted-foreground">Tipo:</span> <Badge variant={selectedUser.user_type === "parceiro" ? "default" : "secondary"} className="text-xs ml-1">{selectedUser.user_type}</Badge>{adminUserIds.has(selectedUser.user_id) && <Badge variant="destructive" className="text-xs ml-1">Adm</Badge>}</p>
                    <p><span className="text-muted-foreground">Cadastro:</span> <span className="text-foreground">{new Date(selectedUser.created_at).toLocaleString("pt-BR")}</span></p>
                    <p><span className="text-muted-foreground">Endereço:</span> <span className="text-foreground">{selectedUser.endereco || "—"}</span></p>
                    <p><span className="text-muted-foreground">Cidade:</span> <span className="text-foreground">{selectedUser.cidade || "—"}</span></p>
                    <p><span className="text-muted-foreground">CEP:</span> <span className="text-foreground">{selectedUser.cep || "—"}</span></p>
                    <p><span className="text-muted-foreground">Ref.:</span> <span className="text-foreground">{selectedUser.ponto_referencia || "—"}</span></p>
                  </div>
                  <Button onClick={() => handleShareResetLink(selectedUser)} className="w-full gradient-gold text-primary-foreground font-bold rounded-xl h-10">
                    <Share2 size={14} className="mr-2" /> Compartilhar Acesso
                  </Button>
                  <Button
                    onClick={() => { handleToggleAdmin(selectedUser.user_id, selectedUser.display_name); }}
                    variant={adminUserIds.has(selectedUser.user_id) ? "destructive" : "outline"}
                    className="w-full rounded-xl h-10 font-bold"
                  >
                    <Shield size={14} className="mr-2" />
                    {adminUserIds.has(selectedUser.user_id) ? "Revogar Acesso Admin" : "Tornar Administrador"}
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* PRODUCTS TAB */}
          <TabsContent value="products" className="space-y-4">
            <div className="gradient-card rounded-2xl p-5 border border-border space-y-3">
              <h2 className="font-display text-foreground flex items-center gap-2">
                <Package size={18} className="text-primary" /> Adicionar Produto
              </h2>
              <Input placeholder="Nome do produto *" value={prodNome} onChange={(e) => setProdNome(e.target.value)} className="bg-secondary border-border" />
              <Textarea placeholder="Descrição" value={prodDescricao} onChange={(e) => setProdDescricao(e.target.value)} className="bg-secondary border-border min-h-[60px]" />
              <div className="grid grid-cols-2 gap-2">
                <Input type="number" placeholder="Preço cliente *" value={prodPreco} onChange={(e) => setProdPreco(e.target.value)} className="bg-secondary border-border" step="0.01" />
                <Input type="number" placeholder="Preço parceiro" value={prodPrecoParceiro} onChange={(e) => setProdPrecoParceiro(e.target.value)} className="bg-secondary border-border" step="0.01" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Select value={prodCategoria} onValueChange={setProdCategoria}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Categoria" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ovos Caipira">🥚 Ovos Caipira</SelectItem>
                    <SelectItem value="Frango Caipira">🍗 Frango Caipira</SelectItem>
                    <SelectItem value="Polpas">🍹 Polpas</SelectItem>
                    <SelectItem value="Produtos da Roça">🌾 Produtos da Roça</SelectItem>
                    <SelectItem value="Carne Bovina">🥩 Carne Bovina</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={prodUnitType} onValueChange={setProdUnitType}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Tipo de medida" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unidade">📦 Unidade</SelectItem>
                    <SelectItem value="kg">⚖️ Peso (kg)</SelectItem>
                    <SelectItem value="bandeja">🥚 Bandeja</SelectItem>
                    <SelectItem value="cartela">🥚 Cartela (30 ovos)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Input type="number" placeholder={getQuantityLabel(prodUnitType)} value={prodEstoque} onChange={(e) => setProdEstoque(e.target.value)} className="bg-secondary border-border" />
                <Input placeholder="Lote" value={prodLote} onChange={(e) => setProdLote(e.target.value)} className="bg-secondary border-border" />
                <Input type="date" placeholder="Validade" value={prodValidade} onChange={(e) => setProdValidade(e.target.value)} className="bg-secondary border-border" />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 flex-1 p-2 rounded-lg bg-secondary/50 border border-border">
                  <Switch checked={prodVisivelCliente} onCheckedChange={setProdVisivelCliente} />
                  <span className="text-xs text-foreground">Ativar no Cliente</span>
                </div>
                <div className="flex items-center gap-2 flex-1 p-2 rounded-lg bg-secondary/50 border border-border">
                  <Switch checked={prodVisivelParceiro} onCheckedChange={setProdVisivelParceiro} />
                  <span className="text-xs text-foreground">Ativar no Parceiro</span>
                </div>
              </div>
              <Button onClick={handleCreateProduct} disabled={savingProduct} className="w-full gradient-gold text-primary-foreground font-bold h-12 rounded-xl">
                <Plus size={16} className="mr-1" /> {savingProduct ? "Salvando..." : "Adicionar Produto"}
              </Button>
            </div>

            {/* Product list grouped by category */}
            {products.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-foreground font-semibold text-sm">Produtos cadastrados ({products.length})</h3>
                {Object.entries(productsByCategory).map(([cat, items]) => (
                  <div key={cat}>
                    <p className="text-foreground font-display font-semibold text-sm mb-2">{cat}</p>
                    <div className="space-y-2">
                    {(items as any[]).map((p: any, idx: number) => (
                        <div key={p.id} className="gradient-card border border-border rounded-xl p-3">
                          {editingProduct?.id === p.id ? (
                            <div className="space-y-2">
                              <Input value={editProd.nome} onChange={(e) => setEditProd({ ...editProd, nome: e.target.value })} className="bg-secondary border-border text-sm" />
                              <Textarea value={editProd.descricao} onChange={(e) => setEditProd({ ...editProd, descricao: e.target.value })} className="bg-secondary border-border text-sm min-h-[40px]" />
                              <div className="grid grid-cols-2 gap-2">
                                <Input type="number" value={editProd.preco} onChange={(e) => setEditProd({ ...editProd, preco: e.target.value })} className="bg-secondary border-border text-sm" placeholder="Preço" step="0.01" />
                                <Input type="number" value={editProd.preco_parceiro} onChange={(e) => setEditProd({ ...editProd, preco_parceiro: e.target.value })} className="bg-secondary border-border text-sm" placeholder="Preço parceiro" step="0.01" />
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <Select value={editProd.categoria} onValueChange={(v) => setEditProd({ ...editProd, categoria: v })}>
                                  <SelectTrigger className="bg-secondary border-border text-sm"><SelectValue placeholder="Categoria" /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Ovos Caipira">🥚 Ovos Caipira</SelectItem>
                                    <SelectItem value="Frango Caipira">🍗 Frango Caipira</SelectItem>
                                    <SelectItem value="Polpas">🍹 Polpas</SelectItem>
                                    <SelectItem value="Produtos da Roça">🌾 Produtos da Roça</SelectItem>
                                    <SelectItem value="Carne Bovina">🥩 Carne Bovina</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Select value={editProd.unit_type} onValueChange={(v) => setEditProd({ ...editProd, unit_type: v })}>
                                  <SelectTrigger className="bg-secondary border-border text-sm"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="unidade">📦 Unidade</SelectItem>
                                    <SelectItem value="kg">⚖️ Peso (kg)</SelectItem>
                                    <SelectItem value="bandeja">🥚 Bandeja</SelectItem>
                                    <SelectItem value="cartela">🥚 Cartela</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                <Input type="number" value={editProd.estoque} onChange={(e) => setEditProd({ ...editProd, estoque: e.target.value })} className="bg-secondary border-border text-sm" placeholder="Estoque" />
                                <Input value={editProd.lote} onChange={(e) => setEditProd({ ...editProd, lote: e.target.value })} className="bg-secondary border-border text-sm" placeholder="Lote" />
                                <Input type="date" value={editProd.validade} onChange={(e) => setEditProd({ ...editProd, validade: e.target.value })} className="bg-secondary border-border text-sm" />
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1.5">
                                  <Switch checked={editProd.visivel_cliente} onCheckedChange={(v) => setEditProd({ ...editProd, visivel_cliente: v })} />
                                  <span className="text-[10px] text-foreground">Cliente</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <Switch checked={editProd.visivel_parceiro} onCheckedChange={(v) => setEditProd({ ...editProd, visivel_parceiro: v })} />
                                  <span className="text-[10px] text-foreground">Parceiro</span>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button onClick={handleSaveEdit} className="flex-1 gradient-gold text-primary-foreground font-bold rounded-xl h-9 text-xs">
                                  <Check size={14} className="mr-1" /> Salvar
                                </Button>
                                <Button onClick={() => setEditingProduct(null)} variant="outline" className="rounded-xl h-9 text-xs">Cancelar</Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <p className="text-foreground text-sm font-semibold truncate">{p.nome}</p>
                                {p.descricao && <p className="text-muted-foreground text-[10px] truncate">{p.descricao}</p>}
                                <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap mt-0.5">
                                  <span className="text-foreground font-semibold">R$ {Number(p.preco).toFixed(2)}</span>
                                  {p.preco_parceiro && <span className="text-primary">Parc: R$ {Number(p.preco_parceiro).toFixed(2)}</span>}
                                  <span>Est: {p.estoque}</span>
                                  <Badge variant="outline" className="text-[9px] px-1">
                                    {p.unit_type === "kg" ? "kg" : p.unit_type === "cartela" ? "Cartela" : p.unit_type === "bandeja" ? "Bandeja" : "Un"}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-1.5 mt-1">
                                  {p.visivel_cliente !== false && <Badge className="text-[8px] px-1.5 py-0 bg-blue-500/20 text-blue-400 border-blue-500/30">Cliente</Badge>}
                                  {p.visivel_parceiro !== false && <Badge className="text-[8px] px-1.5 py-0 bg-green-500/20 text-green-400 border-green-500/30">Parceiro</Badge>}
                                  {p.visivel_cliente === false && p.visivel_parceiro === false && <Badge variant="outline" className="text-[8px] px-1.5 py-0 text-destructive">Inativo</Badge>}
                                </div>
                              </div>
                              <div className="flex items-center gap-1 ml-2">
                                <div className="flex flex-col gap-0.5 mr-1">
                                  <button
                                    onClick={() => handleMoveProduct(p, "up", items as any[])}
                                    disabled={idx === 0}
                                    className="p-1 rounded hover:bg-secondary transition-colors disabled:opacity-20"
                                  >
                                    <ChevronUp size={14} className="text-muted-foreground" />
                                  </button>
                                  <button
                                    onClick={() => handleMoveProduct(p, "down", items as any[])}
                                    disabled={idx === (items as any[]).length - 1}
                                    className="p-1 rounded hover:bg-secondary transition-colors disabled:opacity-20"
                                  >
                                    <ChevronDown size={14} className="text-muted-foreground" />
                                  </button>
                                </div>
                                <button onClick={() => handleEditProduct(p)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
                                  <Edit2 size={14} className="text-primary" />
                                </button>
                                <button onClick={() => handleDeleteProduct(p.id)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
                                  <Trash2 size={14} className="text-destructive" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* MORE TAB */}
          <TabsContent value="more" className="space-y-4">
            <Tabs value={moreSubTab} onValueChange={setMoreSubTab}>
              <TabsList className="w-full grid grid-cols-6 bg-secondary/50 mb-3">
                <TabsTrigger value="push" className="text-[9px]">📢 Push</TabsTrigger>
                <TabsTrigger value="partners" className="text-[9px] relative">
                  🤝 Parceiros
                  {pendingRequests > 0 && (
                    <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-bold">{pendingRequests}</span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="admin-req" className="text-[9px] relative">
                  🔐 Admins
                  {pendingAdminRequests > 0 && (
                    <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-bold">{pendingAdminRequests}</span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="support" className="text-[9px] relative">
                  💬 Suporte
                  {openTicketsCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-bold">{openTicketsCount}</span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="events" className="text-[9px]">⚡ Eventos</TabsTrigger>
                <TabsTrigger value="missions" className="text-[9px]">🎯 Missões</TabsTrigger>
              </TabsList>

              {/* PUSH */}
              <TabsContent value="push" className="space-y-4">
                <div className="gradient-card rounded-2xl p-5 border border-border space-y-4">
                  <h2 className="font-display text-foreground flex items-center gap-2">
                    <Send size={18} className="text-primary" /> Enviar Notificação
                  </h2>
                  <Input placeholder="Título" value={title} onChange={(e) => setTitle(e.target.value)} className="bg-secondary border-border" />
                  <Textarea placeholder="Mensagem" value={message} onChange={(e) => setMessage(e.target.value)} className="bg-secondary border-border min-h-[100px]" />
                  <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border">
                    <div className="flex items-center gap-2"><Users size={16} className="text-primary" /><span className="text-sm text-foreground">Enviar para todos</span></div>
                    <Switch checked={broadcast} onCheckedChange={setBroadcast} />
                  </div>
                  {!broadcast && (
                    <div className="space-y-2">
                      <Input placeholder="Buscar usuário..." className="bg-secondary border-border" onChange={(e) => setSearchQuery(e.target.value)} />
                      <div className="max-h-40 overflow-y-auto space-y-1">
                        {filteredUsers.map((u) => (
                          <button key={u.user_id} onClick={() => setTargetUserId(u.user_id)}
                            className={`w-full text-left p-2 rounded-lg text-sm flex items-center gap-2 transition-colors ${targetUserId === u.user_id ? "bg-primary/20 border border-primary/30 text-foreground" : "bg-secondary/50 text-muted-foreground hover:bg-secondary"}`}>
                            <User size={14} /><span>{u.display_name || "Sem nome"}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <Button onClick={handleSend} disabled={sending} className="w-full gradient-gold text-primary-foreground font-bold h-12 rounded-xl">
                    {sending ? "Enviando..." : broadcast ? "Enviar para Todos" : "Enviar para Usuário"}
                  </Button>
                </div>
              </TabsContent>

              {/* PARTNER REQUESTS */}
              <TabsContent value="partners" className="space-y-4">
                <div className="flex gap-2">
                  {["pendente", "aprovado", "recusado"].map((s) => (
                    <button key={s} onClick={() => setPartnerFilter(s)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${partnerFilter === s ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                      {s === "pendente" ? "Pendentes" : s === "aprovado" ? "Aprovados" : "Recusados"}
                      {s === "pendente" && pendingRequests > 0 && <span className="ml-1">({pendingRequests})</span>}
                    </button>
                  ))}
                </div>
                <div className="space-y-2">
                  {filteredPartnerRequests.length === 0 && (
                    <p className="text-muted-foreground text-sm text-center py-4">Nenhuma solicitação {partnerFilter}.</p>
                  )}
                  {filteredPartnerRequests.map((r: any) => (
                    <div key={r.id} className="gradient-card border border-border rounded-xl p-4 space-y-2">
                      {editingPartner?.id === r.id ? (
                        <div className="space-y-2">
                          <Input value={editPartnerData.nome_completo} onChange={(e) => setEditPartnerData({ ...editPartnerData, nome_completo: e.target.value })} className="bg-secondary border-border text-sm" placeholder="Nome" />
                          <Input value={editPartnerData.whatsapp} onChange={(e) => setEditPartnerData({ ...editPartnerData, whatsapp: e.target.value })} className="bg-secondary border-border text-sm" placeholder="WhatsApp" />
                          <Input value={editPartnerData.endereco} onChange={(e) => setEditPartnerData({ ...editPartnerData, endereco: e.target.value })} className="bg-secondary border-border text-sm" placeholder="Endereço" />
                          <div className="grid grid-cols-2 gap-2">
                            <Input value={editPartnerData.cep} onChange={(e) => setEditPartnerData({ ...editPartnerData, cep: e.target.value })} className="bg-secondary border-border text-sm" placeholder="CEP" />
                            <Input value={editPartnerData.cidade} onChange={(e) => setEditPartnerData({ ...editPartnerData, cidade: e.target.value })} className="bg-secondary border-border text-sm" placeholder="Cidade" />
                          </div>
                          <Input value={editPartnerData.quantidade_media} onChange={(e) => setEditPartnerData({ ...editPartnerData, quantidade_media: e.target.value })} className="bg-secondary border-border text-sm" placeholder="Qtd média" />
                          <div className="flex gap-2">
                            <Button onClick={handleSavePartnerEdit} className="flex-1 gradient-gold text-primary-foreground font-bold rounded-xl h-9 text-xs">
                              <Save size={14} className="mr-1" /> Salvar
                            </Button>
                            <Button onClick={() => setEditingPartner(null)} variant="outline" className="rounded-xl h-9 text-xs">Cancelar</Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between">
                            <p className="text-foreground text-sm font-semibold">{r.nome_completo}</p>
                            <span className="text-[10px] text-muted-foreground">{new Date(r.created_at).toLocaleDateString("pt-BR")}</span>
                          </div>
                          <div className="text-xs text-muted-foreground space-y-0.5">
                            <p>📱 {r.whatsapp}</p>
                            <p>📍 {r.cidade}</p>
                            {r.endereco && <p>🏠 {r.endereco}</p>}
                            {r.cep && <p>📮 CEP: {r.cep}</p>}
                            <p>📦 Qtd média: {r.quantidade_media}</p>
                          </div>
                          {r.status === "pendente" && (
                            <div className="flex gap-2 pt-1">
                              <Button onClick={() => handleApprovePartner(r)} size="sm" className="flex-1 gradient-gold text-primary-foreground font-bold rounded-xl text-xs h-8">
                                <Check size={14} className="mr-1" /> Aprovar
                              </Button>
                              <Button onClick={() => handleRejectPartner(r)} size="sm" variant="outline" className="flex-1 rounded-xl text-xs h-8 text-destructive border-destructive/30">
                                <XCircle size={14} className="mr-1" /> Recusar
                              </Button>
                            </div>
                          )}
                          {r.status === "aprovado" && (
                            <div className="flex gap-2 pt-1">
                              <Button onClick={() => handleEditPartner(r)} size="sm" variant="outline" className="flex-1 rounded-xl text-xs h-8">
                                <Edit2 size={14} className="mr-1" /> Editar
                              </Button>
                              <Button onClick={() => handleRevokePartner(r)} size="sm" variant="outline" className="flex-1 rounded-xl text-xs h-8 text-destructive border-destructive/30">
                                <Trash2 size={14} className="mr-1" /> Remover
                              </Button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* ADMIN REQUESTS */}
              <TabsContent value="admin-req" className="space-y-4">
                <div className="flex gap-2">
                  {["pendente", "aprovado", "recusado"].map((s) => (
                    <button key={s} onClick={() => setAdminReqFilter(s)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${adminReqFilter === s ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                      {s === "pendente" ? `Pendentes${pendingAdminRequests > 0 ? ` (${pendingAdminRequests})` : ""}` : s === "aprovado" ? "Aprovados" : "Recusados"}
                    </button>
                  ))}
                </div>
                <div className="space-y-2">
                  {filteredAdminRequests.length === 0 && (
                    <p className="text-muted-foreground text-sm text-center py-4">Nenhuma solicitação {adminReqFilter}.</p>
                  )}
                  {filteredAdminRequests.map((r: any) => (
                    <div key={r.id} className="gradient-card border border-border rounded-xl p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-foreground text-sm font-semibold">{r.display_name}</p>
                          <p className="text-muted-foreground text-[10px]">📧 {r.email}</p>
                        </div>
                        <span className="text-[10px] text-muted-foreground">{new Date(r.created_at).toLocaleDateString("pt-BR")}</span>
                      </div>
                      {r.status === "pendente" && (
                        <div className="flex gap-2 pt-1">
                          <Button onClick={() => handleApproveAdminRequest(r)} size="sm" className="flex-1 gradient-gold text-primary-foreground font-bold rounded-xl text-xs h-8">
                            <Check size={14} className="mr-1" /> Aprovar
                          </Button>
                          <Button onClick={() => handleRejectAdminRequest(r)} size="sm" variant="outline" className="flex-1 rounded-xl text-xs h-8 text-destructive border-destructive/30">
                            <XCircle size={14} className="mr-1" /> Recusar
                          </Button>
                        </div>
                      )}
                      {r.status === "aprovado" && (
                        <Badge className="bg-primary/20 text-primary text-[10px]">✅ Aprovado</Badge>
                      )}
                      {r.status === "recusado" && (
                        <Badge variant="destructive" className="text-[10px]">❌ Recusado</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="support" className="space-y-4">
                <div className="flex gap-2 flex-wrap">
                  {["aberto", "respondido", "fechado"].map((s) => (
                    <button key={s} onClick={() => setSupportFilter(s)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${supportFilter === s ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                      {s === "aberto" ? `Abertos${openTicketsCount > 0 ? ` (${openTicketsCount})` : ""}` : s === "respondido" ? "Respondidos" : "Fechados"}
                    </button>
                  ))}
                </div>
                <div className="space-y-2">
                  {filteredTickets.length === 0 && (
                    <p className="text-muted-foreground text-sm text-center py-4">Nenhum ticket {supportFilter}.</p>
                  )}
                  {filteredTickets.map((t: any) => {
                    const ticketUser = users.find(u => u.user_id === t.user_id);
                    return (
                      <div key={t.id} className="gradient-card border border-border rounded-xl p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-foreground text-sm font-semibold">{t.subject}</p>
                            <p className="text-muted-foreground text-[10px]">
                              {ticketUser?.display_name || "Usuário"} • {t.type === "sugestao" ? "💡 Sugestão" : t.type === "reclamacao" ? "⚠️ Reclamação" : "❓ Dúvida"}
                            </p>
                          </div>
                          <span className="text-[10px] text-muted-foreground">{new Date(t.created_at).toLocaleDateString("pt-BR")}</span>
                        </div>
                        <p className="text-foreground text-xs">{t.message}</p>
                        {t.image_url && (
                          <a href={t.image_url} target="_blank" rel="noopener noreferrer">
                            <img src={t.image_url} alt="Anexo" className="w-20 h-20 rounded-lg object-cover border border-border" />
                          </a>
                        )}
                        {t.admin_response && (
                          <div className="bg-primary/10 rounded-lg p-2">
                            <p className="text-xs text-primary font-semibold">Sua resposta:</p>
                            <p className="text-xs text-foreground">{t.admin_response}</p>
                          </div>
                        )}
                        {replyingTicket === t.id ? (
                          <div className="space-y-2">
                            <Textarea placeholder="Escreva a resposta..." value={replyText} onChange={(e) => setReplyText(e.target.value)} className="bg-secondary border-border text-sm min-h-[60px]" />
                            <div className="flex gap-2">
                              <Button onClick={() => handleReplyTicket(t.id)} size="sm" className="flex-1 gradient-gold text-primary-foreground font-bold rounded-xl h-8 text-xs">
                                <Send size={14} className="mr-1" /> Enviar
                              </Button>
                              <Button onClick={() => { setReplyingTicket(null); setReplyText(""); }} size="sm" variant="outline" className="rounded-xl h-8 text-xs">Cancelar</Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-2 pt-1">
                            {t.status !== "fechado" && (
                              <>
                                <Button onClick={() => { setReplyingTicket(t.id); setReplyText(t.admin_response || ""); }} size="sm" variant="outline" className="flex-1 rounded-xl text-xs h-8">
                                  <MessageSquare size={14} className="mr-1" /> Responder
                                </Button>
                                <Button onClick={() => handleCloseTicket(t.id)} size="sm" variant="outline" className="rounded-xl text-xs h-8 text-muted-foreground">
                                  <XCircle size={14} className="mr-1" /> Fechar
                                </Button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </TabsContent>

              {/* EVENTS */}
              <TabsContent value="events" className="space-y-4">
                <div className="gradient-card rounded-2xl p-5 border border-border space-y-4">
                  <h2 className="font-display text-foreground flex items-center gap-2">
                    <Zap size={18} className="text-primary" /> Criar Evento Especial
                  </h2>
                  <Input placeholder="Título (ex: Hora da Fazenda)" value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} className="bg-secondary border-border" />
                  <Textarea placeholder="Descrição do evento" value={eventDesc} onChange={(e) => setEventDesc(e.target.value)} className="bg-secondary border-border" />
                  <Select value={eventType} onValueChange={setEventType}>
                    <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="double_points">🔥 Pontos Dobrados</SelectItem>
                      <SelectItem value="combo_bonus">🎁 Combo da Semana</SelectItem>
                      <SelectItem value="monthly_challenge">🏆 Desafio do Mês</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="grid grid-cols-2 gap-2">
                    <Input type="number" placeholder="Pontos bônus" value={eventBonus} onChange={(e) => setEventBonus(e.target.value)} className="bg-secondary border-border" />
                    <Input type="number" placeholder="Meta de pontos" value={eventTarget} onChange={(e) => setEventTarget(e.target.value)} className="bg-secondary border-border" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-muted-foreground text-xs">Início</label>
                      <Input type="datetime-local" value={eventStart} onChange={(e) => setEventStart(e.target.value)} className="bg-secondary border-border" />
                    </div>
                    <div>
                      <label className="text-muted-foreground text-xs">Fim</label>
                      <Input type="datetime-local" value={eventEnd} onChange={(e) => setEventEnd(e.target.value)} className="bg-secondary border-border" />
                    </div>
                  </div>
                  <Button onClick={handleCreateEvent} disabled={savingEvent} className="w-full gradient-gold text-primary-foreground font-bold h-12 rounded-xl">
                    <Plus size={16} className="mr-1" /> {savingEvent ? "Salvando..." : "Criar Evento"}
                  </Button>
                </div>
                {activeEvents && activeEvents.length > 0 && (
                  <div className="space-y-2">
                    {activeEvents.map((ev: any) => (
                      <div key={ev.id} className="gradient-card border-warm rounded-xl p-3 flex items-center justify-between">
                        <div>
                          <p className="text-foreground text-sm font-semibold">{ev.title}</p>
                          <p className="text-muted-foreground text-xs">{ev.event_type} • {ev.active ? "Ativo" : "Inativo"}</p>
                        </div>
                        <Switch checked={ev.active} onCheckedChange={() => handleToggleEvent(ev.id, ev.active)} />
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* MISSIONS */}
              <TabsContent value="missions" className="space-y-4">
                <div className="gradient-card rounded-2xl p-5 border border-border space-y-4">
                  <h2 className="font-display text-foreground flex items-center gap-2">
                    <Target size={18} className="text-primary" /> Criar Missão Semanal
                  </h2>
                  <Input placeholder="Título da missão" value={missionTitle} onChange={(e) => setMissionTitle(e.target.value)} className="bg-secondary border-border" />
                  <Textarea placeholder="Descrição" value={missionDesc} onChange={(e) => setMissionDesc(e.target.value)} className="bg-secondary border-border" />
                  <div className="grid grid-cols-2 gap-2">
                    <Input type="number" placeholder="Pontos de recompensa" value={missionReward} onChange={(e) => setMissionReward(e.target.value)} className="bg-secondary border-border" />
                    <Select value={missionType} onValueChange={setMissionType}>
                      <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="consecutive_purchase">Compra recorrente</SelectItem>
                        <SelectItem value="spend_amount">Valor mínimo</SelectItem>
                        <SelectItem value="combo">Combo categorias</SelectItem>
                        <SelectItem value="referral">Indicação</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleCreateMission} disabled={savingMission} className="w-full gradient-gold text-primary-foreground font-bold h-12 rounded-xl">
                    <Plus size={16} className="mr-1" /> {savingMission ? "Salvando..." : "Criar Missão"}
                  </Button>
                </div>
                {activeMissions && activeMissions.length > 0 && (
                  <div className="space-y-2">
                    {activeMissions.map((m: any) => (
                      <div key={m.id} className="gradient-card border-warm rounded-xl p-3 flex items-center justify-between">
                        <div>
                          <p className="text-foreground text-sm font-semibold">{m.title}</p>
                          <p className="text-muted-foreground text-xs">+{m.reward_points} pts • {m.active ? "Ativa" : "Inativa"}</p>
                        </div>
                        <Switch checked={m.active} onCheckedChange={() => handleToggleMission(m.id, m.active)} />
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
