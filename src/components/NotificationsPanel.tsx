import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Bell, BellRing } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { toast } from "sonner";

interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

const NotificationsPanel = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const { isSupported, isSubscribed, permission, loading, subscribe, unsubscribe } = usePushNotifications();

  const fetchNotifications = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setNotifications(data);
  };

  useEffect(() => {
    if (open && user) fetchNotifications();
  }, [open, user]);

  const markAsRead = async (id: string) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const handlePushToggle = async () => {
    if (isSubscribed) {
      await unsubscribe();
      toast.info("Notificações push desativadas");
    } else {
      await subscribe();
      if (Notification.permission === "granted") {
        toast.success("Notificações push ativadas! 🔔");
      } else if (Notification.permission === "denied") {
        toast.error("Permissão negada. Ative nas configurações do navegador.");
      }
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="relative">
          <Bell size={20} className="text-muted-foreground" />
          {user && unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-sm mx-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-display text-foreground">🔔 Notificações</DialogTitle>
        </DialogHeader>

        {user && isSupported && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border">
            <div className="flex items-center gap-2">
              <BellRing size={16} className="text-primary" />
              <span className="text-sm text-foreground">Push notifications</span>
            </div>
            <Switch
              checked={isSubscribed}
              onCheckedChange={handlePushToggle}
              disabled={loading || permission === "denied"}
            />
          </div>
        )}

        <div className="space-y-2 max-h-80 overflow-y-auto">
          {!user ? (
            <p className="text-muted-foreground text-sm text-center py-4">
              Faça login para ver suas notificações.
            </p>
          ) : notifications.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">
              Nenhuma notificação ainda.
            </p>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => !n.read && markAsRead(n.id)}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  n.read ? "bg-secondary/50" : "bg-secondary border border-primary/20"
                }`}
              >
                <p className="text-foreground text-sm font-semibold">{n.title}</p>
                <p className="text-muted-foreground text-xs mt-1">{n.message}</p>
                <p className="text-muted-foreground text-[10px] mt-1">
                  {new Date(n.created_at).toLocaleDateString("pt-BR")}
                </p>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NotificationsPanel;
