import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { Check, Clock, Package, Truck, Info, RefreshCw } from "lucide-react";

export function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    fetchOrders();

    const sub = supabase
      .channel("orders_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "purchase_history" }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(sub);
    };
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("purchase_history")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erro ao buscar pedidos: " + error.message);
      setLoading(false);
      return;
    }

    const list = data || [];
    const userIds = [...new Set(list.map((o: any) => o.user_id).filter(Boolean))];
    let profilesMap: Record<string, any> = {};

    if (userIds.length > 0) {
      const { data: profs } = await supabase.from("profiles").select("*").in("user_id", userIds);
      (profs || []).forEach((p: any) => {
        profilesMap[p.user_id] = p;
      });
    }

    setOrders(list.map((o: any) => ({ ...o, profiles: profilesMap[o.user_id] || null })));
    setLoading(false);
  };

  const updateStatus = async (id: string, newStatus: string) => {
    toast.loading("Atualizando status...", { id: "status-update" });
    const { error } = await supabase
      .from("purchase_history")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      toast.error("Erro ao atualizar status", { id: "status-update" });
    } else {
      toast.success("Status atualizado com sucesso!", { id: "status-update" });
      setOrders(orders.map((o) => (o.id === id ? { ...o, status: newStatus } : o)));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return { label: "Tentativa / Aguardando Pix", color: "bg-orange-500/20 text-orange-400 border border-orange-500/30" };
      case "approved":
        return { label: "Pago / Recebido", color: "bg-blue-500/20 text-blue-400 border border-blue-500/30" };
      case "processing":
        return { label: "Produzindo", color: "bg-yellow-500/20 text-yellow-500 border border-yellow-500/30" };
      case "shipping":
        return { label: "A Caminho", color: "bg-purple-500/20 text-purple-400 border border-purple-500/30" };
      case "delivered":
        return { label: "Entregue", color: "bg-green-500/20 text-green-400 border border-green-500/30" };
      case "cancelled":
      case "rejected":
        return { label: "Cancelado", color: "bg-red-500/20 text-red-400 border border-red-500/30" };
      default:
        return { label: status, color: "bg-secondary text-muted-foreground border border-border" };
    }
  };

  const formatItems = (raw: any) => {
    try {
      let items = raw;
      while (typeof items === "string") items = JSON.parse(items);
      if (!Array.isArray(items)) return "Itens desconhecidos";
      return items.map((i: any) => `${i.quantity}x ${i.name || i.title || "Item"}`).join(", ");
    } catch {
      return "Itens desconhecidos";
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (filter === "paid") return o.status !== "pending" && o.status !== "cancelled" && o.status !== "rejected";
    if (filter === "pending") return o.status === "pending";
    return true;
  });

  return (
    <div className="space-y-4 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-display font-bold text-foreground">Gestão e Acompanhamento de Pedidos</h2>
          <p className="text-xs text-muted-foreground">Atualize o status das compras em tempo real para os clientes</p>
        </div>
        <button
          onClick={fetchOrders}
          className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
          title="Recarregar Pedidos"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* FILTER TABS */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            filter === "all" ? "bg-primary text-primary-foreground font-bold" : "bg-secondary text-muted-foreground hover:text-foreground"
          }`}
        >
          Todos ({orders.length})
        </button>
        <button
          onClick={() => setFilter("paid")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            filter === "paid" ? "bg-primary text-primary-foreground font-bold" : "bg-secondary text-muted-foreground hover:text-foreground"
          }`}
        >
          Apenas Pagos ({orders.filter((o) => o.status !== "pending" && o.status !== "cancelled" && o.status !== "rejected").length})
        </button>
        <button
          onClick={() => setFilter("pending")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            filter === "pending" ? "bg-primary text-primary-foreground font-bold" : "bg-secondary text-muted-foreground hover:text-foreground"
          }`}
        >
          Tentativas / Pendentes ({orders.filter((o) => o.status === "pending").length})
        </button>
      </div>

      {loading ? (
        <div className="text-center p-8 text-sm text-muted-foreground">Carregando pedidos...</div>
      ) : filteredOrders.length === 0 ? (
        <div className="gradient-card border border-border rounded-xl p-8 text-center">
          <p className="text-muted-foreground text-sm">Nenhum pedido encontrado neste filtro.</p>
        </div>
      ) : (
        filteredOrders.map((order) => {
          const badge = getStatusBadge(order.status);
          return (
            <div key={order.id} className="gradient-card border border-border rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-foreground text-sm">
                    {order.profiles?.display_name || order.profiles?.nome || "Cliente (Sem nome cadastrado)"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {order.created_at ? format(new Date(order.created_at), "dd/MM/yyyy 'às' HH:mm") : "Data indisponível"}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-mono mt-0.5">ID: {order.id.slice(0, 8)}...</p>
                </div>
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${badge.color}`}>
                  {badge.label}
                </span>
              </div>

              <div className="bg-secondary/40 rounded-lg p-3 text-sm">
                <p className="font-semibold text-foreground text-xs mb-1">Itens:</p>
                <p className="text-muted-foreground text-xs leading-relaxed mb-2">{formatItems(order.items)}</p>
                <div className="flex justify-between items-center pt-2 border-t border-border/50">
                  <span className="text-xs text-muted-foreground">Forma: {order.payment_method || "pix"}</span>
                  <span className="font-bold text-primary text-base">R$ {Number(order.total || 0).toFixed(2)}</span>
                </div>
              </div>

              <div className="bg-secondary/40 rounded-lg p-3 text-sm">
                <p className="font-semibold text-foreground text-xs mb-1">Endereço de Entrega & Contato:</p>
                <p className="text-muted-foreground text-xs">{order.profiles?.endereco || "Endereço não informado"}</p>
                {(order.profiles?.cidade || order.profiles?.cep) && (
                  <p className="text-muted-foreground text-xs">
                    {order.profiles?.cidade} {order.profiles?.cep ? `- CEP ${order.profiles.cep}` : ""}
                  </p>
                )}
                {order.profiles?.ponto_referencia && (
                  <p className="text-muted-foreground text-xs text-muted-foreground/80 italic">Ref: {order.profiles.ponto_referencia}</p>
                )}
                <p className="text-primary text-xs font-semibold mt-1">
                  WhatsApp/Tel: {order.profiles?.telefone || order.profiles?.whatsapp || "Não informado"}
                </p>
              </div>

              {/* STATUS CHANGE BUTTONS */}
              <div className="border-t border-border pt-3">
                <p className="text-xs font-semibold text-foreground mb-2">Avançar Etapa do Pedido:</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    onClick={() => updateStatus(order.id, "approved")}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                      order.status === "approved"
                        ? "bg-blue-500 text-white shadow-md shadow-blue-500/20"
                        : "bg-secondary text-foreground hover:bg-blue-500/20 hover:text-blue-400"
                    }`}
                  >
                    1. Recebido
                  </button>
                  <button
                    onClick={() => updateStatus(order.id, "processing")}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                      order.status === "processing"
                        ? "bg-yellow-500 text-black shadow-md shadow-yellow-500/20"
                        : "bg-secondary text-foreground hover:bg-yellow-500/20 hover:text-yellow-400"
                    }`}
                  >
                    2. Produzindo
                  </button>
                  <button
                    onClick={() => updateStatus(order.id, "shipping")}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                      order.status === "shipping"
                        ? "bg-purple-500 text-white shadow-md shadow-purple-500/20"
                        : "bg-secondary text-foreground hover:bg-purple-500/20 hover:text-purple-400"
                    }`}
                  >
                    3. A Caminho
                  </button>
                  <button
                    onClick={() => updateStatus(order.id, "delivered")}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                      order.status === "delivered"
                        ? "bg-green-500 text-white shadow-md shadow-green-500/20"
                        : "bg-secondary text-foreground hover:bg-green-500/20 hover:text-green-400"
                    }`}
                  >
                    4. Entregue
                  </button>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
