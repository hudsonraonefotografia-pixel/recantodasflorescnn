import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import { useQuery } from "@tanstack/react-query";
import { Navigate, Link } from "react-router-dom";
import { ArrowLeft, Package, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

const ParceiroProdutosPage = () => {
  const { user, profile } = useAuth();
  const { addItem } = useCart();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["partner-products"],
    queryFn: async () => {
      const { data } = await supabase
        .from("produtos")
        .select("*")
        .eq("visivel_parceiro", true)
        .order("categoria", { ascending: true })
        .order("sort_order", { ascending: true });
      return data || [];
    },
  });

  if (!user || !profile) return <Navigate to="/" replace />;
  if (profile.user_type !== "parceiro") return <Navigate to="/home" replace />;

  const grouped = products.reduce((acc: Record<string, any[]>, p: any) => {
    const cat = p.categoria || "Outros";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});

  const handleAdd = (p: any) => {
    const price = p.preco_parceiro ? Number(p.preco_parceiro) : Number(p.preco);
    addItem({
      id: p.id,
      name: p.nome,
      price,
      variant: `${p.unit_type === "kg" ? "Por kg" : p.unit_type === "cartela" ? "Cartela 30 ovos" : p.unit_type === "bandeja" ? "Bandeja" : "Unidade"}`,
      category: p.categoria || "Outros",
    });
    toast.success("Adicionado ao carrinho! 🤝");
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 gradient-card border-b border-border px-4 py-3">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <Link to="/conta"><ArrowLeft size={20} className="text-foreground" /></Link>
          <Package size={20} className="text-primary" />
          <h1 className="font-display text-foreground text-lg">Área do Parceiro</h1>
          <Link to="/carrinho" className="ml-auto">
            <ShoppingCart size={20} className="text-primary" />
          </Link>
        </div>
      </header>

      <main className="max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto px-3 py-4">
        <div className="gradient-card border border-primary/20 rounded-xl p-4 mb-4">
          <p className="text-foreground text-sm font-semibold">🤝 Olá, {profile.display_name || "Parceiro"}!</p>
          <p className="text-muted-foreground text-xs">Você tem acesso a preços especiais de parceiro.</p>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground text-center py-8">Carregando produtos...</p>
        ) : products.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">Nenhum produto disponível no momento.</p>
        ) : (
          Object.entries(grouped).map(([cat, items]) => (
            <div key={cat} className="mb-6">
              <h3 className="font-display font-bold text-foreground text-lg mb-3">{cat}</h3>
              <div className="space-y-2">
                {(items as any[]).map((p: any) => {
                  const partnerPrice = p.preco_parceiro ? Number(p.preco_parceiro) : null;
                  const regularPrice = Number(p.preco);
                  const displayPrice = partnerPrice || regularPrice;

                  return (
                    <motion.div
                      key={p.id}
                      whileTap={{ scale: 0.98 }}
                      className="gradient-card border-warm rounded-xl p-3 flex items-center justify-between"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-foreground font-semibold text-sm truncate">{p.nome}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                            {p.unit_type === "kg" ? "Por kg" : p.unit_type === "cartela" ? "Cartela" : p.unit_type === "bandeja" ? "Bandeja" : "Unidade"}
                          </Badge>
                          {p.estoque > 0 && <span className="text-[10px] text-muted-foreground">Est: {p.estoque}</span>}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-primary font-display font-bold">R$ {displayPrice.toFixed(2)}</p>
                        </div>
                      </div>
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleAdd(p)}
                        className="gradient-gold text-primary-foreground text-xs font-bold px-4 py-2 rounded-full shadow-gold ml-2"
                      >
                        Adicionar
                      </motion.button>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </main>
      <BottomNav />
    </div>
  );
};

export default ParceiroProdutosPage;
