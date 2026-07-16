import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CreditCard, Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: {
    id: string;
    label: string;
    price: number;
    priceId: string;
  };
}

const quantityOptions: Record<string, { label: string; price: number; priceId: string }[]> = {
  "sub-quinzenal": [
    { label: "15 Unidades", price: 31.9, priceId: "price_1T3q3eKKA3bHK4ncxTZdG3Ov" },
    { label: "30 Unidades", price: 62.9, priceId: "price_quinzenal_30" },
  ],
  "sub-semanal": [
    { label: "15 Unidades", price: 62.9, priceId: "price_semanal_15" },
    { label: "30 Unidades", price: 124.9, priceId: "price_semanal_30" },
  ],
};

const SubscriptionDialog = ({ open, onOpenChange, plan }: SubscriptionDialogProps) => {
  const { user } = useAuth();
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedQty, setSelectedQty] = useState<number | null>(null);

  const options = quantityOptions[plan.id] || null;
  const selectedOption = options && selectedQty !== null ? options[selectedQty] : null;

  const finalPrice = selectedOption ? selectedOption.price : plan.price;
  const finalPriceId = selectedOption ? selectedOption.priceId : plan.priceId;

  const handleCheckout = async () => {
    if (!user) {
      toast.error("Faça login para assinar.");
      return;
    }
    if (!accepted) {
      toast.error("Aceite os termos de cobrança recorrente.");
      return;
    }
    if (options && selectedQty === null) {
      toast.error("Escolha a quantidade desejada.");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId: finalPriceId },
      });

      if (error) throw error;
      if (data?.url) {
        // Save subscription type
        const subType = plan.id.includes("quinzenal") ? "quinzenal" : "semanal";
        const qty = selectedOption ? parseInt(selectedOption.label) : 15;
        await supabase.from("user_subscriptions").upsert({
          user_id: user.id,
          subscription_type: subType,
          quantity: qty,
          active: true,
        }, { onConflict: "user_id" });

        window.open(data.url, "_blank");
      }
    } catch (err: any) {
      toast.error("Erro ao iniciar pagamento. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (o: boolean) => {
    if (!o) {
      setSelectedQty(null);
      setAccepted(false);
    }
    onOpenChange(o);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm mx-auto bg-card border-border rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-foreground">💳 Assinar {plan.label}</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {selectedOption
              ? `R$ ${selectedOption.price.toFixed(2)} por período — ${selectedOption.label}`
              : `Escolha a quantidade`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Quantity Selection */}
          {options && (
            <div className="space-y-2">
              <p className="text-foreground text-sm font-semibold">📦 Quantidade por entrega:</p>
              <div className="grid grid-cols-2 gap-2">
                {options.map((opt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedQty(idx)}
                    className={`rounded-xl p-3 border text-center transition-all ${
                      selectedQty === idx
                        ? "border-primary bg-primary/10 glow-gold"
                        : "border-border bg-secondary/50 hover:border-primary/30"
                    }`}
                  >
                    <p className="text-foreground font-semibold text-sm">{opt.label}</p>
                    <p className="text-primary font-display font-bold text-lg mt-1">
                      R$ {opt.price.toFixed(2)}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="gradient-card border-warm rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <CreditCard size={24} className="text-primary" />
              <div>
                <p className="text-foreground font-semibold text-sm">Pagamento via Cartão de Crédito</p>
                <p className="text-muted-foreground text-xs">Você será redirecionado para o pagamento seguro</p>
              </div>
            </div>
          </div>

          <div className="bg-secondary/50 rounded-xl p-4 space-y-2">
            <p className="text-foreground text-sm font-semibold">📋 Termos da Assinatura:</p>
            <ul className="text-muted-foreground text-xs space-y-1.5">
              <li>• Cobrança recorrente no seu cartão de crédito</li>
              <li>• O valor referente a <strong>todas as entregas do mês</strong> será cobrado adiantado</li>
              <li>• Você pode cancelar a qualquer momento</li>
              <li>• A assinatura renova automaticamente</li>
            </ul>
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <button
              type="button"
              onClick={() => setAccepted(!accepted)}
              className={`mt-0.5 w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
                accepted ? "bg-primary border-primary" : "border-muted-foreground"
              }`}
            >
              {accepted && <Check size={14} className="text-primary-foreground" />}
            </button>
            <span className="text-muted-foreground text-xs">
              Li e aceito os termos de cobrança recorrente mensal. Estou ciente que o valor será cobrado
              adiantado referente a todas as entregas do período.
            </span>
          </label>

          <Button
            onClick={handleCheckout}
            disabled={!accepted || loading || (options !== null && selectedQty === null)}
            className="w-full gradient-gold text-primary-foreground font-bold rounded-xl h-12"
          >
            {loading ? "Processando..." : "Pagar com Cartão de Crédito"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionDialog;
