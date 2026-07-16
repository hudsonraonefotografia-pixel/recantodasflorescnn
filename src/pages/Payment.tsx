import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { motion } from "framer-motion";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { CreditCard, QrCode, Coins, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import DeliveryAddressDialog from "@/components/DeliveryAddressDialog";

const PaymentPage = () => {
  const { items, total, cashback, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [method, setMethod] = useState<string>("pix");
  const [useCashback, setUseCashback] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDeliveryDialog, setShowDeliveryDialog] = useState(false);
  const [addressConfirmed, setAddressConfirmed] = useState(false);

  const finalTotal = useCashback ? Math.max(0, total - cashback) : total;

  // Check if user already has address
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("endereco, cep, cidade")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data?.endereco && data?.cep && data?.cidade) {
          setAddressConfirmed(true);
        }
      });
  }, [user]);

  const { data: multipliers } = useQuery({
    queryKey: ["category-multipliers"],
    queryFn: async () => {
      const { data } = await supabase.from("category_multipliers").select("category_name, points_per_real");
      return data || [];
    },
  });

  const estimatedPoints = items.reduce((sum, item) => {
    const category = item.category || "Produtos da Roça";
    const mult = multipliers?.find((m) => m.category_name === category);
    const pointsPerReal = mult?.points_per_real || 10;
    return sum + Math.floor(item.price * item.quantity * pointsPerReal);
  }, 0);

  const handleConfirm = async () => {
    if (!user) {
      toast.error("Faça login para continuar.");
      return;
    }

    // Check delivery address first
    if (!addressConfirmed) {
      setShowDeliveryDialog(true);
      return;
    }

    if (finalTotal <= 0) {
      clearCart();
      toast.success("Compra realizada com cashback! 🎉");
      navigate("/home");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-payment", {
        body: {
          items: items.map(i => ({ name: i.name, quantity: i.quantity, price: i.price, category: i.category || "Produtos da Roça" })),
          total: finalTotal,
          paymentMethod: method,
        },
      });

      if (error) throw error;
      if (data?.url) {
        clearCart();
        window.open(data.url, "_blank");
        toast.success("Redirecionando para pagamento seguro...");
        navigate("/home");
      }
    } catch (err: any) {
      toast.error("Erro ao iniciar pagamento. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const methods = [
    { id: "pix", icon: QrCode, label: "Pix" },
    { id: "cartao", icon: CreditCard, label: "Cartão" },
    { id: "cashback", icon: Coins, label: "Cashback" },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <main className="max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto px-3 py-4">
        <h2 className="font-display text-2xl font-bold text-foreground mb-4">💳 Pagamento</h2>

        <div className="space-y-3 mb-6">
          {methods.map((m) => {
            const Icon = m.icon;
            return (
              <motion.button
                key={m.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setMethod(m.id);
                  if (m.id === "cashback") setUseCashback(true);
                  else setUseCashback(false);
                }}
                className={`w-full gradient-card rounded-xl p-4 flex items-center gap-3 transition-all ${
                  method === m.id ? "border-2 border-primary glow-gold" : "border-warm"
                }`}
              >
                <Icon size={24} className={method === m.id ? "text-primary" : "text-muted-foreground"} />
                <span className="text-foreground font-semibold">{m.label}</span>
              </motion.button>
            );
          })}
        </div>

        {useCashback && cashback > 0 && (
          <div className="bg-farm/20 border border-farm rounded-xl p-3 mb-4">
            <p className="text-foreground text-sm">
              Usando <span className="text-primary font-bold">R$ {cashback.toFixed(2)}</span> de cashback
            </p>
          </div>
        )}

        <div className="gradient-card border-warm rounded-xl p-4 mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-muted-foreground text-sm">Subtotal</span>
            <span className="text-foreground font-semibold">R$ {total.toFixed(2)}</span>
          </div>
          {useCashback && cashback > 0 && (
            <div className="flex justify-between mb-2">
              <span className="text-muted-foreground text-sm">Cashback</span>
              <span className="text-farm font-semibold">- R$ {cashback.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-border pt-2">
            <span className="text-foreground font-bold">Total</span>
            <span className="text-primary font-display font-bold text-xl">R$ {finalTotal.toFixed(2)}</span>
          </div>
          {estimatedPoints > 0 && (
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
              <div className="flex items-center gap-1">
                <Sparkles size={14} className="text-primary" />
                <span className="text-muted-foreground text-xs">Pontos da Fazenda</span>
              </div>
              <span className="text-primary font-bold text-sm">+{estimatedPoints.toLocaleString()} pts</span>
            </div>
          )}
        </div>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleConfirm}
          disabled={loading}
          className="w-full gradient-gold text-primary-foreground font-bold py-4 rounded-xl shadow-gold text-lg flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Processando...
            </>
          ) : (
            "Confirmar Pagamento"
          )}
        </motion.button>
      </main>
      <BottomNav />

      <DeliveryAddressDialog
        open={showDeliveryDialog}
        onClose={() => setShowDeliveryDialog(false)}
        onConfirm={() => {
          setShowDeliveryDialog(false);
          setAddressConfirmed(true);
          toast.success("Endereço confirmado! Finalize o pagamento.");
        }}
      />
    </div>
  );
};

export default PaymentPage;
