import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Star, Shield, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function AdminAssinantes() {
  const [assinantes, setAssinantes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchAssinantes();
  }, []);

  const fetchAssinantes = async () => {
    try {
      const { data, error } = await supabase
        .from("user_subscriptions")
        .select(`
          id, subscription_type, active, created_at,
          profiles ( display_name, email, whatsapp )
        `)
        .eq("active", true)
        .order("created_at", { ascending: false });

      if (data) setAssinantes(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = assinantes.filter(a => 
    a.profiles?.display_name?.toLowerCase().includes(search.toLowerCase()) ||
    a.profiles?.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Star size={18} className="text-primary" />
        <h2 className="font-display font-bold text-foreground">Gestão de Assinantes</h2>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
        <Input 
          placeholder="Buscar por nome ou email..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-secondary border-border"
        />
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando assinantes...</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum assinante encontrado.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((a) => (
            <div key={a.id} className="gradient-card border border-border rounded-xl p-4 flex flex-col gap-2 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-primary/20 px-3 py-1 rounded-bl-xl">
                <span className="text-xs font-bold text-primary uppercase">{a.subscription_type}</span>
              </div>
              <h3 className="font-bold text-foreground mt-2">{a.profiles?.display_name || "Cliente"}</h3>
              <p className="text-xs text-muted-foreground">{a.profiles?.email}</p>
              <p className="text-xs text-muted-foreground">{a.profiles?.whatsapp || "Sem WhatsApp"}</p>
              <div className="mt-2 pt-2 border-t border-border flex justify-between items-center">
                <span className="text-[10px] text-muted-foreground">Desde: {new Date(a.created_at).toLocaleDateString()}</span>
                <span className="text-[10px] bg-green-500/20 text-green-500 px-2 py-0.5 rounded-full font-bold">Ativo</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
