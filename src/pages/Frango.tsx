import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import frangoCaipira from "@/assets/frango-caipira.jpg";

interface Produto {
  id: string;
  nome: string;
  descricao: string | null;
  preco: number;
  unit_type: string;
}

const FrangoPage = () => {
  const { addItem, items } = useCart();
  const [products, setProducts] = useState<Produto[]>([]);

  useEffect(() => {
    supabase
      .from("produtos")
      .select("id, nome, descricao, preco, unit_type")
      .eq("visivel_cliente", true)
      .eq("categoria", "Frango Caipira")
      .order("sort_order", { ascending: true })
      .then(({ data }) => setProducts(data || []));
  }, []);

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <main className="max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto px-3 py-4">
        <img src={frangoCaipira} alt="Frango Caipira" className="w-full h-48 object-cover rounded-xl mb-4" />
        <h2 className="font-display text-2xl font-bold text-foreground mb-4">🍗 Frango Caipira</h2>
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
                    onClick={() => {
                      addItem({ id: p.id, name: p.nome, price: p.preco, variant: p.descricao || "", category: "Frango Caipira" });
                      toast.success("Produto adicionado! 🍗");
                    }}
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
      </main>
      <BottomNav />
    </div>
  );
};

export default FrangoPage;
