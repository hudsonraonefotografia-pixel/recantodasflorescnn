import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Package, Truck, CheckCircle2, Clock, ChevronRight, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ActiveOrder {
  id: string;
  created_at: string;
  status: string;
  items: any;
  total: number;
}

export function OrderTrackerBanner() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeOrder, setActiveOrder] = useState<ActiveOrder | null>(null);

  const fetchActiveOrder = async () => {
    if (!user) return;
    try {
      // Find the most recent active order that is NOT yet 'delivered', 'cancelled', or 'rejected'
      // We also look for paid orders (approved, processing, shipping) or pending if placed recently
      const { data, error } = await supabase
        .from("purchase_history")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error || !data) return;

      // Active order: status is approved, processing, or shipping
      const active = data.find(
        (o: any) => o.status === "approved" || o.status === "processing" || o.status === "shipping"
      );

      setActiveOrder(active || null);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (!user) {
      setActiveOrder(null);
      return;
    }

    fetchActiveOrder();

    // Listen to changes in real-time so that when Admin changes status, banner updates instantly
    const channel = supabase
      .channel("active-order-tracker")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "purchase_history", filter: `user_id=eq.${user.id}` },
        () => {
          fetchActiveOrder();
        }
      )
      .subscribe();

    const interval = setInterval(fetchActiveOrder, 10000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [user]);

  if (!activeOrder) return null;

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "approved":
        return {
          step: 1,
          title: "Pedido Recebido",
          desc: "Confirmamos seu pagamento e o pedido já foi recebido!",
          icon: Clock,
          color: "text-blue-400",
          bgColor: "bg-blue-500/10 border-blue-500/30",
          badgeColor: "bg-blue-500 text-white",
        };
      case "processing":
        return {
          step: 2,
          title: "Em Produção 🌸",
          desc: "Seu arranjo / buquê está sendo confeccionado com todo carinho!",
          icon: Package,
          color: "text-yellow-400",
          bgColor: "bg-yellow-500/10 border-yellow-500/30",
          badgeColor: "bg-yellow-500 text-black",
        };
      case "shipping":
        return {
          step: 3,
          title: "A Caminho 🚚",
          desc: "Saiu para entrega! Logo estará no seu endereço.",
          icon: Truck,
          color: "text-purple-400",
          bgColor: "bg-purple-500/10 border-purple-500/30",
          badgeColor: "bg-purple-500 text-white",
        };
      default:
        return {
          step: 1,
          title: "Preparando",
          desc: "Seu pedido está sendo processado.",
          icon: Clock,
          color: "text-primary",
          bgColor: "bg-primary/10 border-primary/30",
          badgeColor: "bg-primary text-primary-foreground",
        };
    }
  };

  const statusInfo = getStatusInfo(activeOrder.status);
  const StatusIcon = statusInfo.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="mx-3 mt-4 mb-2"
      >
        <div
          onClick={() => navigate("/historico")}
          className={`cursor-pointer rounded-2xl border p-4 shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99] ${statusInfo.bgColor} relative overflow-hidden`}
        >
          {/* Top highlight bar */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Acompanhamento em Tempo Real
              </span>
            </div>
            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${statusInfo.badgeColor}`}>
              Etapa {statusInfo.step} de 3
            </span>
          </div>

          {/* Main Info */}
          <div className="flex items-start gap-3">
            <div className={`p-2.5 rounded-xl bg-card border border-border shadow-inner ${statusInfo.color}`}>
              <StatusIcon size={24} className="animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-display font-bold text-foreground text-base leading-tight">
                {statusInfo.title}
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                {statusInfo.desc}
              </p>
            </div>
            <ChevronRight size={18} className="text-muted-foreground self-center ml-1" />
          </div>

          {/* Progress track */}
          <div className="mt-3 pt-3 border-t border-border/40 flex items-center justify-between gap-1.5 text-[10px]">
            <div className="flex-1 flex flex-col items-center">
              <div
                className={`h-1.5 w-full rounded-full mb-1 ${
                  statusInfo.step >= 1 ? "bg-blue-400" : "bg-muted"
                }`}
              />
              <span className={statusInfo.step >= 1 ? "font-bold text-foreground" : "text-muted-foreground"}>
                1. Recebido
              </span>
            </div>
            <div className="flex-1 flex flex-col items-center">
              <div
                className={`h-1.5 w-full rounded-full mb-1 ${
                  statusInfo.step >= 2 ? "bg-yellow-400" : "bg-muted"
                }`}
              />
              <span className={statusInfo.step >= 2 ? "font-bold text-foreground" : "text-muted-foreground"}>
                2. Produzindo
              </span>
            </div>
            <div className="flex-1 flex flex-col items-center">
              <div
                className={`h-1.5 w-full rounded-full mb-1 ${
                  statusInfo.step >= 3 ? "bg-purple-400" : "bg-muted"
                }`}
              />
              <span className={statusInfo.step >= 3 ? "font-bold text-foreground" : "text-muted-foreground"}>
                3. A Caminho
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
