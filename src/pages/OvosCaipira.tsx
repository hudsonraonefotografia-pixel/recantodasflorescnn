import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ovosCaipira from "@/assets/ovos-caipira.jpg";
import SubscriptionDialog from "@/components/SubscriptionDialog";

const subscriptions = [
  {
    id: "sub-quinzenal",
    label: "Assinatura Quinzenal",
    desc: "1x a cada 15 dias — 2 entregas/mês",
    price: 31.9,
    priceId: "price_1T3q3eKKA3bHK4ncxTZdG3Ov",
  },
  {
    id: "sub-semanal",
    label: "Assinatura Semanal",
    desc: "1x por semana — 4 entregas/mês",
    price: 62.9,
    highlight: true,
    priceId: "price_1T3q6CKKA3bHK4ncPX3SC2CI",
  },
];

interface Produto {
  id: string;
  nome: string;
  descricao: string | null;
  preco: number;
  categoria: string | null;
  unit_type: string;
}

const OvosCaipiraPage = () => {
  const { addItem, items } = useCart();
  const [selectedPlan, setSelectedPlan] = useState<(typeof subscriptions)[0] | null>(null);
  const [products, setProducts] = useState<Produto[]>([]);

  useEffect(() => {
    supabase
      .from("produtos")
      .select("id, nome, descricao, preco, categoria, unit_type")
      .eq("visivel_cliente", true)
      .eq("categoria", "Ovos Caipira")
      .order("sort_order", { ascending: true })
      .then(({ data }) => setProducts(data || []));
  }, []);

  const handleAdd = (p: Produto) => {
    addItem({ id: p.id, name: p.nome, price: p.preco, variant: p.descricao || "", category: "Ovos Caipira" });
    toast.success("Produto adicionado ao carrinho! 🥚");
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <main className="max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto px-3 py-4">
        <img src={ovosCaipira} alt="Ovos Caipira" className="w-full h-48 object-cover rounded-xl mb-4" />
        <h2 className="font-display text-2xl font-bold text-foreground mb-4">🥚 Ovos Caipira</h2>

        <div className="space-y-3">
          {products.map((p) => (
            <motion.div
              key={p.id}
              whileTap={{ scale: 0.98 }}
              className="gradient-card border-warm rounded-xl p-4 flex items-center justify-between"
            >
              <div>
                <p className="text-foreground font-semibold text-sm">{p.nome}</p>
                {p.descricao && <p className="text-muted-foreground text-xs">{p.descricao}</p>}
                <p className="text-primary font-display font-bold text-lg">R$ {p.preco.toFixed(2)}</p>
              </div>
              {(() => {
                const inCart = items.some((ci) => ci.id === p.id);
                return (
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleAdd(p)}
                    className={`text-xs font-bold px-4 py-2 rounded-full ${inCart ? "bg-green-600 text-white" : "gradient-gold text-primary-foreground shadow-gold"}`}
                  >
                    {inCart ? "✓ Adicionado" : "Adicionar"}
                  </motion.button>
                );
              })()}
            </motion.div>
          ))}
          {products.length === 0 && (
            <p className="text-muted-foreground text-sm text-center py-8">Nenhum produto disponível no momento.</p>
          )}
        </div>

        <h3 className="font-display text-lg font-bold text-foreground mt-6 mb-3">📅 Planos de Assinatura</h3>
        <div className="space-y-3">
          {subscriptions.map((s) => (
            <motion.div
              key={s.id}
              whileTap={{ scale: 0.98 }}
              className={`gradient-card rounded-xl p-4 ${
                s.highlight ? "border-2 border-primary glow-gold" : "border-warm"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-foreground font-semibold text-sm">{s.label}</p>
                  <p className="text-muted-foreground text-xs">{s.desc}</p>
                  <p className="text-primary font-display font-bold text-lg mt-1">A partir de R$ {s.price.toFixed(2)}</p>
                </div>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSelectedPlan(s)}
                  className="gradient-gold text-primary-foreground text-xs font-bold px-4 py-2 rounded-full shadow-gold"
                >
                  Assinar
                </motion.button>
              </div>
              {s.highlight && (
                <span className="inline-block mt-2 bg-primary/20 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">
                  ⭐ Mais Econômico
                </span>
              )}
            </motion.div>
          ))}
        </div>
      </main>

      {selectedPlan && (
        <SubscriptionDialog
          open={!!selectedPlan}
          onOpenChange={(open) => !open && setSelectedPlan(null)}
          plan={selectedPlan}
        />
      )}

      <BottomNav />
    </div>
  );
};

export default OvosCaipiraPage;
