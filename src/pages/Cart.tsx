import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { motion } from "framer-motion";
import { useCart } from "@/contexts/CartContext";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const CartPage = () => {
  const { items, updateQuantity, removeItem, total, cashback, clearCart } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <Header />
        <main className="max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto px-3 py-12 text-center">
          <p className="text-5xl mb-4">🛒</p>
          <h2 className="font-display text-xl font-bold text-foreground mb-2">Carrinho vazio</h2>
          <p className="text-muted-foreground text-sm mb-6">Adicione produtos para começar</p>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/home")}
            className="gradient-gold text-primary-foreground font-bold px-6 py-3 rounded-full shadow-gold"
          >
            Ver Produtos
          </motion.button>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <Header />
      <main className="max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto px-3 py-4">
        <h2 className="font-display text-2xl font-bold text-foreground mb-4">🛒 Carrinho</h2>

        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="gradient-card border-warm rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-foreground font-semibold text-sm">{item.name}</p>
                  {item.variant && <p className="text-muted-foreground text-xs">{item.variant}</p>}
                </div>
                <button onClick={() => removeItem(item.id)} className="text-destructive p-1">
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 bg-secondary rounded-full px-1 py-1">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="w-7 h-7 rounded-full bg-background flex items-center justify-center"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="text-foreground font-bold text-sm w-5 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-7 h-7 rounded-full bg-background flex items-center justify-center"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <p className="text-primary font-display font-bold">
                  R$ {(item.price * item.quantity).toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {cashback > 0 && (
          <div className="mt-4 bg-farm/20 border border-farm rounded-xl p-3 text-center">
            <p className="text-foreground text-sm">
              💰 Você ganhará <span className="text-primary font-bold">R$ {cashback.toFixed(2)}</span> de cashback!
            </p>
          </div>
        )}
      </main>

      {/* Fixed bottom checkout */}
      <div className="fixed bottom-16 left-0 right-0 z-40 gradient-card border-t border-border p-4">
        <div className="max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-xs">Total</p>
            <p className="text-primary font-display font-bold text-xl">R$ {total.toFixed(2)}</p>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/pagamento")}
            className="gradient-gold text-primary-foreground font-bold px-6 py-3 rounded-full shadow-gold"
          >
            Finalizar Compra
          </motion.button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default CartPage;
