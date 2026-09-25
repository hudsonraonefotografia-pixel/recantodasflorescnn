import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { motion } from "framer-motion";
import { useState } from "react";
import { CheckCircle, X, AlertTriangle, Leaf, Heart, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const plans = [
  {
    id: "basico",
    name: "🌱 Plano Básico",
    icon: Leaf,
    price: 12,
    color: "border-green-500",
    badge: "bg-green-500",
    benefits: [
      "10% de desconto em plantas e arranjos",
      "Cancelável a qualquer momento",
      "Sem carência mínima",
      "Acesso a promoções exclusivas",
    ],
    restriction: null,
    stripeId: "price_basico_12",
  },
  {
    id: "casamentos",
    name: "💍 Plano Casamentos",
    icon: Heart,
    price: 18,
    color: "border-pink-500",
    badge: "bg-pink-500",
    highlight: true,
    benefits: [
      "40% de desconto em arranjos, buquês e ornamentações",
      "Consultoria exclusiva para casamentos",
      "Reserva prioritária de datas",
      "Carência mínima de 6 meses",
    ],
    restriction: "carencia",
    stripeId: "price_casamentos_18",
  },
  {
    id: "premium",
    name: "👑 Plano Premium",
    icon: Crown,
    price: 30,
    color: "border-primary",
    badge: "bg-primary",
    benefits: [
      "40% de desconto em TUDO",
      "Cancelável a qualquer momento",
      "Entrega prioritária",
      "Acesso antecipado a coleções",
      "Brinde mensal surpresa 🎁",
    ],
    restriction: null,
    stripeId: "price_premium_30",
  },
];

const AssinaturasPage = () => {
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<typeof plans[0] | null>(null);
  const [showWeddingModal, setShowWeddingModal] = useState(false);
  const [weddingChecked, setWeddingChecked] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSelectPlan = (plan: typeof plans[0]) => {
    if (plan.restriction === "carencia") {
      setSelectedPlan(plan);
      setShowWeddingModal(true);
      return;
    }
    setSelectedPlan(plan);
    handleSubscribe(plan);
  };

  const handleSubscribe = async (plan: typeof plans[0]) => {
    if (!user) {
      toast.error("Você precisa estar logado para assinar.");
      return;
    }
    setLoading(true);
    try {
      // Register subscription intent in database
      const { error } = await supabase.from("subscriptions").upsert({
        user_id: user.id,
        plan_id: plan.id,
        plan_name: plan.name,
        price: plan.price,
        status: "pending",
        has_min_term: plan.restriction === "carencia",
        min_term_months: plan.restriction === "carencia" ? 6 : 0,
        created_at: new Date().toISOString(),
      }, { onConflict: "user_id" });

      if (error) throw error;

      toast.success(`Plano ${plan.name} ativado com sucesso! 🌸`);
      setShowWeddingModal(false);
      setWeddingChecked(false);
    } catch (err: any) {
      toast.error("Erro ao assinar plano: " + (err.message || "Tente novamente."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <main className="max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto px-3 py-4">
        <div className="text-center mb-6">
          <h1 className="font-display text-2xl font-bold text-foreground mb-1">🌸 Planos de Assinatura</h1>
          <p className="text-muted-foreground text-sm">Escolha o plano ideal para você</p>
        </div>

        <div className="space-y-4">
          {plans.map((plan) => (
            <motion.div
              key={plan.id}
              whileTap={{ scale: 0.98 }}
              className={`gradient-card rounded-2xl border-2 ${
                plan.highlight ? plan.color + " glow-gold" : plan.color.replace("border-", "border-") + " border-opacity-50"
              } p-5 relative overflow-hidden`}
            >
              {plan.highlight && (
                <div className="absolute top-3 right-3">
                  <span className="bg-pink-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">⭐ Popular</span>
                </div>
              )}

              <div className="flex items-center gap-3 mb-3">
                <div className={`${plan.badge} p-2 rounded-xl`}>
                  <plan.icon size={22} className="text-white" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-foreground text-base">{plan.name}</h2>
                  <p className="text-primary font-bold text-xl">
                    R$ {plan.price}<span className="text-sm font-normal text-muted-foreground">/mês</span>
                  </p>
                </div>
              </div>

              <ul className="space-y-1.5 mb-4">
                {plan.benefits.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle size={14} className="text-primary flex-shrink-0 mt-0.5" />
                    {b}
                  </li>
                ))}
              </ul>

              {plan.restriction === "carencia" && (
                <div className="flex items-start gap-2 bg-orange-500/10 border border-orange-500/30 rounded-lg p-2 mb-3">
                  <AlertTriangle size={14} className="text-orange-400 flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] text-orange-300">Carência mínima de 6 meses. Cancelamento não disponível durante esse período.</p>
                </div>
              )}

              <Button
                onClick={() => handleSelectPlan(plan)}
                disabled={loading}
                className={`w-full h-10 font-bold rounded-xl ${
                  plan.highlight
                    ? "gradient-gold text-primary-foreground shadow-gold"
                    : "bg-secondary hover:bg-secondary/80 text-foreground"
                }`}
              >
                Assinar por R$ {plan.price}/mês
              </Button>
            </motion.div>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6 pb-4">
          Todos os planos são cobrados mensalmente. Você pode gerenciar sua assinatura a qualquer momento na sua conta.
        </p>
      </main>

      {/* Wedding Cancellation Modal */}
      {showWeddingModal && selectedPlan && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle size={20} className="text-orange-400" />
                <h3 className="font-display font-bold text-foreground">Atenção — Carência</h3>
              </div>
              <button onClick={() => { setShowWeddingModal(false); setWeddingChecked(false); }}>
                <X size={20} className="text-muted-foreground" />
              </button>
            </div>

            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              O <strong className="text-foreground">Plano Casamentos</strong> possui carência mínima de <strong className="text-orange-400">6 meses</strong>.
              Uma vez processado o pagamento, <strong className="text-destructive">não será possível cancelar durante esse período</strong> e
              uma taxa de cancelamento de <strong className="text-destructive">25%</strong> será aplicada em caso de quebra contratual.
            </p>

            <div
              className="flex items-start gap-3 bg-secondary/50 border border-border rounded-lg p-3 mb-4 cursor-pointer"
              onClick={() => setWeddingChecked(!weddingChecked)}
            >
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                weddingChecked ? "bg-primary border-primary" : "border-muted-foreground"
              }`}>
                {weddingChecked && <CheckCircle size={12} className="text-white" />}
              </div>
              <p className="text-sm text-foreground">
                Li e concordo com a carência mínima de 6 meses e estou ciente de que não poderei cancelar após o processamento.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => { setShowWeddingModal(false); setWeddingChecked(false); }}
                className="h-10 rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                disabled={!weddingChecked || loading}
                onClick={() => handleSubscribe(selectedPlan)}
                className="h-10 gradient-gold text-primary-foreground font-bold rounded-xl shadow-gold"
              >
                {loading ? "Processando..." : "Confirmar"}
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default AssinaturasPage;
