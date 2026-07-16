import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ShoppingBag, RefreshCw, Calendar, CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

interface PurchaseItem {
  name: string;
  quantity: number;
  price: number;
}

const Historico = () => {
  const { user } = useAuth();
  const { addItem } = useCart();
  const navigate = useNavigate();

  const { data: purchases, isLoading } = useQuery({
    queryKey: ["purchase_history", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchase_history")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const handleBuyAgain = (items: PurchaseItem[]) => {
    items.forEach((item) => {
      addItem({
        id: item.name.toLowerCase().replace(/\s/g, "-"),
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      });
    });
    toast.success("Itens adicionados ao carrinho!");
    navigate("/carrinho");
  };

  const methodLabel = (m: string) => {
    if (m === "pix") return "Pix";
    if (m === "cartao") return "Cartão";
    if (m === "cashback") return "Cashback";
    return m;
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <main className="max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto px-3 py-4">
        <div className="flex items-center gap-2 mb-5">
          <ShoppingBag size={24} className="text-primary" />
          <h2 className="font-display text-2xl font-bold text-foreground">Histórico de Compras</h2>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-36 w-full rounded-xl" />
            ))}
          </div>
        ) : !purchases || purchases.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <ShoppingBag size={48} className="mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-lg">Nenhuma compra realizada ainda.</p>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/home")}
              className="mt-4 gradient-gold text-primary-foreground font-bold py-3 px-6 rounded-xl"
            >
              Explorar Produtos
            </motion.button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {purchases.map((purchase, index) => {
              const items = (purchase.items as unknown as PurchaseItem[]) || [];
              return (
                <motion.div
                  key={purchase.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="gradient-card border-warm rounded-xl p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs">
                      <Calendar size={14} />
                      <span>
                        {format(new Date(purchase.created_at), "dd MMM yyyy, HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                      <CreditCard size={14} className="text-muted-foreground" />
                      <span className="text-muted-foreground">{methodLabel(purchase.payment_method)}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 mb-3">
                    {items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-foreground">
                          {item.quantity}x {item.name}
                        </span>
                        <span className="text-muted-foreground">
                          R$ {(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between border-t border-border pt-3">
                    <span className="text-primary font-display font-bold text-lg">
                      R$ {Number(purchase.total).toFixed(2)}
                    </span>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleBuyAgain(items)}
                      className="flex items-center gap-1.5 bg-primary/10 text-primary font-semibold text-sm py-2 px-4 rounded-lg hover:bg-primary/20 transition-colors"
                    >
                      <RefreshCw size={14} />
                      Comprar novamente
                    </motion.button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
};

export default Historico;
