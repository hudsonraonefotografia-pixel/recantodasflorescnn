import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Video, Check, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function AdminMomentos() {
  const [momentos, setMomentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMomentos();
  }, []);

  const fetchMomentos = async () => {
    try {
      const { data, error } = await supabase
        .from("momentos")
        .select(`
          id, media_url, media_type, caption, status, created_at,
          profiles ( display_name )
        `)
        .order("created_at", { ascending: false });

      if (data) setMomentos(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("momentos")
        .update({ status: newStatus })
        .eq("id", id);
      
      if (error) throw error;
      toast.success(`Momento ${newStatus}!`);
      fetchMomentos();
    } catch (e: any) {
      toast.error("Erro ao atualizar: " + e.message);
    }
  };

  const handleDelete = async (id: string, url: string) => {
    if (!confirm("Tem certeza que deseja excluir?")) return;
    try {
      const fileName = url.split("/").pop();
      if (fileName) {
        await supabase.storage.from("momentos").remove([fileName]);
      }
      await supabase.from("momentos").delete().eq("id", id);
      toast.success("Momento excluído.");
      fetchMomentos();
    } catch (e: any) {
      toast.error("Erro ao excluir: " + e.message);
    }
  };

  if (loading) return <p className="text-muted-foreground text-sm">Carregando momentos...</p>;

  return (
    <div className="space-y-4">
      <h2 className="font-display font-bold text-foreground flex items-center gap-2">
        <Video size={18} className="text-primary" />
        Aprovação de Momentos
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {momentos.map((m) => (
          <div key={m.id} className="gradient-card border border-border rounded-xl p-4 flex flex-col gap-3">
            <div className="h-40 bg-black rounded-lg overflow-hidden relative">
              {m.media_type === "video" ? (
                <video src={m.media_url} controls className="w-full h-full object-cover" />
              ) : (
                <img src={m.media_url} className="w-full h-full object-cover" />
              )}
              <div className="absolute top-2 left-2 bg-black/60 px-2 py-1 rounded text-[10px] text-white">
                {m.status.toUpperCase()}
              </div>
            </div>
            
            <div>
              <p className="text-sm font-bold text-foreground">@{m.profiles?.display_name || "Cliente"}</p>
              <p className="text-xs text-muted-foreground line-clamp-2">{m.caption}</p>
            </div>

            <div className="flex gap-2 mt-auto pt-2 border-t border-border">
              {m.status !== "aprovado" && (
                <Button 
                  size="sm" 
                  onClick={() => handleUpdateStatus(m.id, "aprovado")}
                  className="bg-green-500/20 text-green-500 hover:bg-green-500/30 flex-1"
                >
                  <Check size={16} /> Aprovar
                </Button>
              )}
              {m.status !== "rejeitado" && (
                <Button 
                  size="sm" 
                  onClick={() => handleUpdateStatus(m.id, "rejeitado")}
                  className="bg-orange-500/20 text-orange-500 hover:bg-orange-500/30 flex-1"
                >
                  <X size={16} /> Rejeitar
                </Button>
              )}
              <Button 
                size="sm" 
                onClick={() => handleDelete(m.id, m.media_url)}
                className="bg-red-500/20 text-red-500 hover:bg-red-500/30"
              >
                <Trash2 size={16} />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
