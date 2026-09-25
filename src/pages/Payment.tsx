import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { motion } from "framer-motion";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Sparkles, Loader2, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import DeliveryAddressDialog from "@/components/DeliveryAddressDialog";
import { initMercadoPago, Payment } from '@mercadopago/sdk-react';

// Inicializa o SDK com a Public Key do cliente
initMercadoPago('APP_USR-eac386ba-9b16-49b8-a45a-577f37dc14c0');

const PaymentPage = () => {
  const { items, total, cashback, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [useCashback, setUseCashback] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDeliveryDialog, setShowDeliveryDialog] = useState(false);
  const [addressConfirmed, setAddressConfirmed] = useState(false);
  const [preferenceId, setPreferenceId] = useState<string | null>(null);

  const finalTotal = useCashback ? Math.max(0, total - cashback) : total;

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

  // Gera o Preference ID do Mercado Pago assim que confirma o endereço
  useEffect(() => {
    const fetchPreference = async () => {
      if (items.length > 0 && finalTotal > 0 && addressConfirmed && user) {
        setLoading(true);
        try {
          const { data, error } = await supabase.functions.invoke("mercadopago-checkout", {
            body: { 
              items: items.map(i => ({ name: i.name, quantity: i.quantity, price: i.price, category: i.category || "Produtos da Roça" })), 
              total: finalTotal 
            }
          });
          if (error) throw error;
          if (data?.preferenceId) {
            setPreferenceId(data.preferenceId);
          }
        } catch (err) {
          console.error(err);
          toast.error("Erro ao conectar com Mercado Pago.");
        } finally {
          setLoading(false);
        }
      }
    };
    fetchPreference();
  }, [items, finalTotal, addressConfirmed, user]);

  const { data: multipliers } = useQuery({
    queryKey: ["category-multipliers"],
    queryFn: async () => {
      const { data } = await supabase.from("category_multipliers").select("category_name, points_per_real");
      return data || [];
    },
  });

  const estimatedPoints = items.reduce((sum, item) => {
    const category = item.category || "Produtos da Roça";
    const multiplier = multipliers?.find(m => m.category_name === category)?.points_per_real || 1;
    return sum + (item.price * item.quantity * multiplier);
  }, 0);

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <Header />
        <main className="max-w-lg mx-auto px-4 py-8 text-center">
          <p className="text-muted-foreground">Seu carrinho está vazio.</p>
          <button onClick={() => navigate("/home")} className="mt-4 text-primary font-bold">Voltar às compras</button>
        </main>
        <BottomNav />
      </div>
    );
  }

  const customization = {
    paymentMethods: {
      ticket: "all",
      bankTransfer: "all",
      creditCard: "all",
      debitCard: "all",
      mercadoPago: "all",
    },
    visual: {
      style: {
        theme: "dark",
        customVariables: {
          baseColor: "#E09B76"
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <main className="max-w-lg mx-auto px-4 py-6">
        <h2 className="font-display text-2xl font-bold text-foreground mb-6">Finalizar Pagamento</h2>

        <div className="gradient-card rounded-2xl p-5 border border-border mb-6">
          <div className="flex justify-between items-center mb-4 border-b border-border pb-4">
            <span className="text-muted-foreground">Total da compra</span>
            <span className="text-xl font-bold text-foreground">R$ {total.toFixed(2)}</span>
          </div>

          {cashback > 0 && (
            <div className="flex items-center justify-between mb-4 bg-primary/10 p-3 rounded-xl border border-primary/20">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-primary" />
                <span className="text-sm font-semibold text-foreground">Cashback disponível</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-primary">R$ {cashback.toFixed(2)}</span>
                <input type="checkbox" checked={useCashback} onChange={(e) => setUseCashback(e.target.checked)} className="accent-primary w-4 h-4" />
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-2">
            <span className="font-bold text-foreground">Valor a pagar</span>
            <span className="text-2xl font-black text-primary">R$ {finalTotal.toFixed(2)}</span>
          </div>
          
          {estimatedPoints > 0 && (
            <p className="text-xs text-green-400 mt-3 text-center bg-green-400/10 py-1.5 rounded-lg border border-green-400/20">
              Você ganhará <b>{Math.floor(estimatedPoints)} pontos</b> nesta compra!
            </p>
          )}
        </div>

        {!addressConfirmed ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4">
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
              <MapPin className="text-orange-400 mx-auto mb-2" size={32} />
              <h3 className="font-bold text-foreground mb-1">Endereço de Entrega</h3>
              <p className="text-sm text-muted-foreground mb-4">Você precisa confirmar seu endereço antes de pagar.</p>
              <button onClick={() => setShowDeliveryDialog(true)} className="bg-primary text-primary-foreground font-bold py-2 px-6 rounded-full w-full">
                Informar Endereço
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <h3 className="font-display font-bold text-foreground">Como deseja pagar?</h3>
            
            {loading && !preferenceId && (
              <div className="flex flex-col items-center justify-center p-8 gap-3">
                <Loader2 size={32} className="text-primary animate-spin" />
                <p className="text-sm text-muted-foreground">Carregando painel de pagamento...</p>
              </div>
            )}
            
            {preferenceId && (
              <div className="mercado-pago-container bg-card rounded-xl overflow-hidden border border-border">
                <Payment
                  initialization={{ preferenceId }}
                  customization={customization as any}
                  onSubmit={async (param) => {
                    return new Promise((resolve, reject) => {
                      supabase.functions.invoke("mercadopago-checkout", {
                        body: { action: "process", formData: param }
                      })
                        .then(({ data, error }) => {
                          if (error) throw error;
                          resolve(data);
                          if (data.status === "approved" || data.status === "in_process" || data.status === "pending") {
                            toast.success("Pagamento iniciado com sucesso!");
                            clearCart();
                            navigate(`/home?payment=${data.status}`);
                          } else {
                            toast.error("O pagamento não foi aprovado.");
                          }
                        })
                        .catch((err) => {
                          console.error(err);
                          reject();
                          toast.error("Erro ao processar pagamento.");
                        });
                    });
                  }}
                />
              </div>
            )}
          </div>
        )}
      </main>
      
      <DeliveryAddressDialog
        open={showDeliveryDialog}
        onOpenChange={setShowDeliveryDialog}
        onSuccess={() => setAddressConfirmed(true)}
      />
      <BottomNav />
    </div>
  );
};

export default PaymentPage;
