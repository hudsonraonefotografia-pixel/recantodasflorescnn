import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface DeliveryAddressDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const DeliveryAddressDialog = ({ open, onClose, onConfirm }: DeliveryAddressDialogProps) => {
  const { user } = useAuth();
  const [endereco, setEndereco] = useState("");
  const [cep, setCep] = useState("");
  const [cidade, setCidade] = useState("");
  const [pontoReferencia, setPontoReferencia] = useState("");
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user || loaded) return;
    supabase
      .from("profiles")
      .select("endereco, cep, cidade, ponto_referencia")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setEndereco(data.endereco || "");
          setCep(data.cep || "");
          setCidade(data.cidade || "");
          setPontoReferencia(data.ponto_referencia || "");
        }
        setLoaded(true);
      });
  }, [user, loaded]);

  const handleSave = async () => {
    if (!endereco.trim() || !cep.trim() || !cidade.trim()) {
      toast.error("Preencha endereço, CEP e cidade.");
      return;
    }
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ endereco, cep, cidade, ponto_referencia: pontoReferencia })
      .eq("user_id", user.id);
    if (error) {
      toast.error("Erro ao salvar endereço.");
    } else {
      toast.success("Endereço salvo!");
      onConfirm();
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <Navigation size={20} className="text-primary" />
            Dados de Entrega
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            Complete seu endereço para prosseguir com o pagamento
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input placeholder="Endereço completo *" value={endereco} onChange={(e) => setEndereco(e.target.value)} className="pl-9 bg-secondary border-border" required />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="CEP *" value={cep} onChange={async (e) => {
              const val = e.target.value;
              setCep(val);
              const clean = val.replace(/\D/g, "");
              if (clean.length === 8) {
                try {
                  const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
                  const data = await res.json();
                  if (!data.erro && data.localidade) setCidade(data.localidade);
                } catch {}
              }
            }} className="bg-secondary border-border" required />
            <Input placeholder="Cidade *" value={cidade} onChange={(e) => setCidade(e.target.value)} className="bg-secondary border-border" required />
          </div>
          <Input placeholder="Ponto de referência" value={pontoReferencia} onChange={(e) => setPontoReferencia(e.target.value)} className="bg-secondary border-border" />
          <Button onClick={handleSave} disabled={saving} className="w-full gradient-gold text-primary-foreground font-bold rounded-xl h-11">
            {saving ? "Salvando..." : "Confirmar Endereço"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeliveryAddressDialog;
