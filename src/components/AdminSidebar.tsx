import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, Wifi, Clock, ShoppingCart, X, ChevronRight, Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface OnlineUser {
  user_id: string;
  display_name?: string;
  online_at: string;
}

interface AdminSidebarProps {
  totalUsers: number;
  isOpen: boolean;
  onClose: () => void;
}

export function AdminSidebar({ totalUsers, isOpen, onClose }: AdminSidebarProps) {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [lastOnline, setLastOnline] = useState<{ name: string; time: string } | null>(null);
  const [abandonedCarts, setAbandonedCarts] = useState(0);

  useEffect(() => {
    // Track online users via Realtime Presence
    const channel = supabase.channel("admin-presence-tracker", {
      config: { presence: { key: "admin" } }
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<{ user_id: string; display_name?: string; online_at: string }>();
        const users: OnlineUser[] = [];
        Object.values(state).forEach((presences) => {
          presences.forEach((p) => users.push(p));
        });
        setOnlineUsers(users);
      })
      .on("presence", { event: "leave" }, ({ leftPresences }) => {
        const left = leftPresences[0] as any;
        if (left) {
          setLastOnline({
            name: left.display_name || "Usuário",
            time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
          });
        }
      })
      .subscribe();

    // Count abandoned carts (cart_items created > 30 min ago without a purchase)
    const countAbandoned = async () => {
      const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      const { count } = await supabase
        .from("cart_items")
        .select("user_id", { count: "exact", head: true })
        .lt("created_at", thirtyMinAgo);
      setAbandonedCarts(count || 0);
    };

    countAbandoned();
    const interval = setInterval(countAbandoned, 60000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  const stats = [
    {
      icon: Users,
      label: "Usuários Cadastrados",
      value: totalUsers,
      color: "text-blue-400",
      bg: "bg-blue-400/10",
    },
    {
      icon: Wifi,
      label: "Online Agora",
      value: onlineUsers.length,
      color: "text-green-400",
      bg: "bg-green-400/10",
    },
    {
      icon: Activity,
      label: "Acessos Simultâneos",
      value: onlineUsers.length,
      color: "text-purple-400",
      bg: "bg-purple-400/10",
    },
    {
      icon: ShoppingCart,
      label: "Carrinhos Abandonados",
      value: abandonedCarts,
      color: "text-orange-400",
      bg: "bg-orange-400/10",
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            onClick={onClose}
          />

          {/* Sidebar */}
          <motion.aside
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 h-full w-72 bg-card border-r border-border z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Activity size={18} className="text-primary" />
                <h2 className="font-display font-bold text-foreground text-sm">Analytics em Tempo Real</h2>
              </div>
              <button
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Stats */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="gradient-card border border-border rounded-xl p-3 flex items-center gap-3"
                >
                  <div className={`${stat.bg} p-2 rounded-lg flex-shrink-0`}>
                    <stat.icon size={18} className={stat.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-muted-foreground leading-tight">{stat.label}</p>
                    <p className="text-xl font-bold font-display text-foreground">{stat.value}</p>
                  </div>
                </div>
              ))}

              {/* Last Online */}
              {lastOnline && (
                <div className="gradient-card border border-border rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock size={14} className="text-muted-foreground" />
                    <p className="text-[11px] text-muted-foreground">Último Online</p>
                  </div>
                  <p className="text-sm font-semibold text-foreground">{lastOnline.name}</p>
                  <p className="text-xs text-muted-foreground">{lastOnline.time}</p>
                </div>
              )}

              {/* Online Users List */}
              {onlineUsers.length > 0 && (
                <div className="gradient-card border border-border rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <p className="text-[11px] text-muted-foreground font-semibold">Usuários Online</p>
                  </div>
                  <div className="space-y-1">
                    {onlineUsers.slice(0, 8).map((u, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                        <p className="text-xs text-foreground truncate">{u.display_name || "Usuário"}</p>
                      </div>
                    ))}
                    {onlineUsers.length > 8 && (
                      <p className="text-[10px] text-muted-foreground pl-3">
                        +{onlineUsers.length - 8} outros
                      </p>
                    )}
                  </div>
                </div>
              )}

              {onlineUsers.length === 0 && (
                <div className="text-center py-4">
                  <p className="text-xs text-muted-foreground">Nenhum usuário online no momento</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border">
              <p className="text-[10px] text-muted-foreground text-center">
                Atualizado em tempo real via Supabase
              </p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

// Floating toggle button
export function AdminSidebarToggle({ onClick, hasOnline }: { onClick: () => void; hasOnline: boolean }) {
  return (
    <button
      onClick={onClick}
      className="relative flex items-center gap-1.5 bg-secondary/80 hover:bg-secondary border border-border rounded-lg px-3 py-1.5 transition-colors"
    >
      <Activity size={14} className="text-primary" />
      <span className="text-xs font-semibold text-foreground">Analytics</span>
      {hasOnline && (
        <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
      )}
      <ChevronRight size={12} className="text-muted-foreground" />
    </button>
  );
}
