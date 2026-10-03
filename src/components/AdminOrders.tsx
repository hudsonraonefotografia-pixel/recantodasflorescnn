import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { Check, Clock, Package, Truck, Info } from "lucide-react";

export function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
    const { data, error } = await supabase
      .from("purchase_history")
      .select("*, profiles(display_name, endereco, telefone, cidade, cep)")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erro ao buscar pedidos");
    } else {
      setOrders(data || []);
    }
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
      setOrders(orders.map(o => o.id === id ? { ...o, status: newStatus } : o));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-orange-500/20 text-orange-400";
      case "approved": return "bg-blue-500/20 text-blue-400";
      case "processing": return "bg-yellow-500/20 text-yellow-500";
      case "shipping": return "bg-purple-500/20 text-purple-400";
      case "delivered": return "bg-green-500/20 text-green-400";
      default: return "bg-gray-500/20 text-gray-400";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending": return "Aguardando Pix";
      case "approved": return "Pago / Recebido";
      case "processing": return "Produzindo";
      case "shipping": return "A Caminho";
      case "delivered": return "Entregue";
      default: return status;
    }
  };

  const formatItems = (itemsJson: string) => {
    try {
      const items = JSON.parse(itemsJson);
      return items.map((i: any) => `${i.quantity}x ${i.name}`).join(", ");
    } catch {
      return "Itens desconhecidos";
    }
  };

  if (loading) return <div className="text-center p-4">Carregando pedidos...</div>;

  return (
    <div className="space-y-4 pb-20">
      <h2 className="text-lg font-display font-bold text-foreground">Gestão de Pedidos</h2>
      
      {orders.length === 0 ? (
        <p className="text-muted-foreground text-center">Nenhum pedido ainda.</p>
      ) : (
        orders.map((order) => (
          <div key={order.id} className="gradient-card border border-border rounded-xl p-4 space-y-3">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-bold text-foreground">{order.profiles?.display_name || "Cliente Desconhecido"}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(order.created_at), "dd/MM/yyyy 'às' HH:mm")}
                </p>
              </div>
              <span className={\`text-[10px] font-bold px-2 py-1 rounded-full \${getStatusColor(order.status)}\`}>
                {getStatusText(order.status)}
              </span>
            </div>

            <div className="bg-secondary/40 rounded-lg p-3 text-sm">
              <p className="font-semibold text-foreground mb-1">Itens:</p>
              <p className="text-muted-foreground text-xs leading-relaxed mb-2">{formatItems(order.items)}</p>
              <p className="font-bold text-primary">Total: R$ {Number(order.total).toFixed(2)}</p>
            </div>

            <div className="bg-secondary/40 rounded-lg p-3 text-sm">
              <p className="font-semibold text-foreground mb-1">Endereço de Entrega:</p>
              <p className="text-muted-foreground text-xs">{order.profiles?.endereco || "Endereço não informado"}</p>
              <p className="text-muted-foreground text-xs">{order.profiles?.cidade} - CEP {order.profiles?.cep}</p>
              <p className="text-muted-foreground text-xs font-semibold mt-1">Tel: {order.profiles?.telefone || "N/A"}</p>
            </div>

            {order.status !== "pending" && (
              <div className="border-t border-border pt-3">
                <p className="text-xs font-semibold mb-2">Atualizar Status:</p>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => updateStatus(order.id, "approved")}
                    disabled={order.status === "approved"}
                    className={\`py-1.5 rounded-lg text-xs font-bold \${order.status === "approved" ? "bg-blue-500/20 text-blue-400" : "bg-secondary text-foreground hover:bg-secondary/80"}\`}
                  >
                    Recebido
                  </button>
                  <button 
                    onClick={() => updateStatus(order.id, "processing")}
                    disabled={order.status === "processing"}
                    className={\`py-1.5 rounded-lg text-xs font-bold \${order.status === "processing" ? "bg-yellow-500/20 text-yellow-500" : "bg-secondary text-foreground hover:bg-secondary/80"}\`}
                  >
                    Produzindo
                  </button>
                  <button 
                    onClick={() => updateStatus(order.id, "shipping")}
                    disabled={order.status === "shipping"}
                    className={\`py-1.5 rounded-lg text-xs font-bold \${order.status === "shipping" ? "bg-purple-500/20 text-purple-400" : "bg-secondary text-foreground hover:bg-secondary/80"}\`}
                  >
                    A Caminho
                  </button>
                  <button 
                    onClick={() => updateStatus(order.id, "delivered")}
                    disabled={order.status === "delivered"}
                    className={\`py-1.5 rounded-lg text-xs font-bold \${order.status === "delivered" ? "bg-green-500/20 text-green-400" : "bg-secondary text-foreground hover:bg-secondary/80"}\`}
                  >
                    Entregue
                  </button>
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
