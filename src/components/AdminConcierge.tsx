import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CalendarHeart, Search, Bell, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function AdminConcierge() {
  const [datas, setDatas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchDatas();
  }, []);

  const fetchDatas = async () => {
    try {
      const { data, error } = await supabase
        .from("concierge_dates")
        .select(`
          id, date, event_type, notes,
          profiles ( display_name, whatsapp )
        `)
        .order("date", { ascending: true });

      if (data) setDatas(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = datas.filter(d => 
    d.profiles?.display_name?.toLowerCase().includes(search.toLowerCase()) ||
    d.event_type?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarHeart size={18} className="text-primary" />
          <h2 className="font-display font-bold text-foreground">Concierge de Datas Especiais</h2>
        </div>
        <Button size="sm" variant="outline" className="h-8 gap-1" onClick={() => toast.info("Em breve: Adicionar data manualmente")}>
          <Plus size={14} /> Novo
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
        <Input 
          placeholder="Buscar por cliente ou evento..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-secondary border-border"
        />
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando datas...</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma data especial encontrada.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((d) => {
            const dateObj = new Date(d.date);
            const isNear = (dateObj.getTime() - new Date().getTime()) / (1000 * 3600 * 24) <= 7;
            
            return (
              <div key={d.id} className={`gradient-card border ${isNear ? 'border-primary/50' : 'border-border'} rounded-xl p-4 flex flex-col gap-2`}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-foreground">{d.event_type}</h3>
                    <p className="text-xs text-primary">{dateObj.toLocaleDateString('pt-BR')}</p>
                  </div>
                  {isNear && (
                    <span className="bg-primary/20 text-primary text-[10px] px-2 py-1 rounded-full flex items-center gap-1 font-bold">
                      <Bell size={10} /> Faltam poucos dias!
                    </span>
                  )}
                </div>
                <div className="mt-2">
                  <p className="text-sm text-foreground">Cliente: {d.profiles?.display_name || "Desconhecido"}</p>
                  <p className="text-xs text-muted-foreground">WhatsApp: {d.profiles?.whatsapp || "N/A"}</p>
                </div>
                {d.notes && <p className="text-xs text-muted-foreground bg-black/20 p-2 rounded mt-1 italic">"{d.notes}"</p>}
                
                <Button size="sm" className="mt-2 w-full gap-2" onClick={() => window.open(`https://wa.me/55${d.profiles?.whatsapp?.replace(/\D/g, '')}`, '_blank')}>
                  Sugerir Presente no WhatsApp
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
