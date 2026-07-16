import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Produto {
  id: string;
  nome: string;
  descricao: string | null;
  preco: number;
  categoria: string | null;
  unit_type: string;
}

const ProdutosPage = () => {
  const { addItem, items: cartItems } = useCart();
  const [products, setProducts] = useState<Produto[]>([]);

  useEffect(() => {
    supabase
      .from("produtos")
      .select("id, nome, descricao, preco, categoria, unit_type")
      .eq("visivel_cliente", true)
      .order("sort_order", { ascending: true })
      .then(({ data }) => setProducts(data || []));
  }, []);

  const grouped = products.reduce<Record<string, Produto[]>>((acc, p) => {
    const cat = p.categoria || "Outros";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <main className="max-w-lg md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto px-3 py-4">
        <h2 className="font-display text-2xl font-bold text-foreground mb-4">🛍️ Produtos</h2>

        {Object.entries(grouped).map(([category, items]) => (
          <div key={category} className="mb-6">
            <h3 className="font-display font-bold text-foreground text-lg mb-3">{category}</h3>
            <div className="space-y-2 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-3 md:space-y-0">
              {items.map((p) => (
                <motion.div
                  key={p.id}
                  whileTap={{ scale: 0.98 }}
                  className="gradient-card border-warm rounded-xl p-3 flex items-center justify-between"
                >
                  <div>
                    <p className="text-foreground font-semibold text-sm">{p.nome}</p>
                    {p.descricao && <p className="text-muted-foreground text-xs">{p.descricao}</p>}
                    <p className="text-primary font-display font-bold">R$ {p.preco.toFixed(2)}</p>
                  </div>
                  {(() => {
                    const inCart = cartItems.some((ci) => ci.id === p.id);
                    return (
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                          addItem({ id: p.id, name: p.nome, price: p.preco, variant: p.descricao || "", category: category });
                          toast.success("Adicionado! 🌿");
                        }}
                        className={`text-xs font-bold px-4 py-2 rounded-full ${inCart ? "bg-green-600 text-white" : "gradient-gold text-primary-foreground shadow-gold"}`}
                      >
                        {inCart ? "✓ Adicionado" : "Adicionar"}
                      </motion.button>
                    );
                  })()}
                </motion.div>
              ))}
            </div>
          </div>
        ))}

        {products.length === 0 && (
          <p className="text-muted-foreground text-sm text-center py-8">Nenhum produto disponível no momento.</p>
        )}
      </main>
      <BottomNav />
    </div>
  );
};

export default ProdutosPage;
