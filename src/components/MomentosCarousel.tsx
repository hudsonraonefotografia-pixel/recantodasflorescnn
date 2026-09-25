import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Video, Plus, X, UploadCloud, CheckCircle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface Momento {
  id: string;
  media_url: string;
  media_type: "video" | "image";
  caption: string;
  user_id: string;
  profiles: { display_name: string };
}

export function MomentosCarousel() {
  const { user } = useAuth();
  const [momentos, setMomentos] = useState<Momento[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Form states
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchMomentos();
  }, []);

  const fetchMomentos = async () => {
    try {
      const { data, error } = await supabase
        .from("momentos")
        .select(`
          id, media_url, media_type, caption, user_id,
          profiles ( display_name )
        `)
        .eq("status", "aprovado")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setMomentos(data as any);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.size > 50 * 1024 * 1024) {
        toast.error("O arquivo deve ter no máximo 50MB");
        return;
      }
      setFile(selected);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    if (!user) {
      toast.error("Você precisa estar logado para postar.");
      return;
    }
    
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;
      const isVideo = file.type.startsWith('video/');

      const { error: uploadError } = await supabase.storage
        .from("momentos")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("momentos")
        .getPublicUrl(filePath);

      const { error: dbError } = await supabase.from("momentos").insert({
        user_id: user.id,
        media_url: publicUrl,
        media_type: isVideo ? "video" : "image",
        caption: caption,
        status: "pendente"
      });

      if (dbError) throw dbError;

      setShowUploadModal(false);
      setFile(null);
      setCaption("");
      setShowSuccessPopup(true);
      
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao enviar o momento. Tente novamente.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mt-4 mb-2">
      <div className="flex items-center justify-between px-4 mb-2">
        <h2 className="font-display font-bold text-foreground text-sm flex items-center gap-2">
          <Video size={16} className="text-primary" />
          Momentos Recanto das Flores
        </h2>
        <button 
          onClick={() => setShowUploadModal(true)}
          className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-1 rounded-md flex items-center gap-1 hover:bg-primary/20"
        >
          <Plus size={12} /> Postar
        </button>
      </div>

      {/* Netflix style horizontal scroll (da direita para a esquerda) */}
      <div 
        className="flex overflow-x-auto gap-3 px-4 pb-2 snap-x snap-mandatory hide-scrollbar" 
        style={{ scrollBehavior: 'smooth' }}
      >
        {loading ? (
          // Skeletons
          [1, 2, 3].map((i) => (
            <div key={i} className="flex-shrink-0 w-32 h-48 bg-secondary rounded-xl animate-pulse snap-center" />
          ))
        ) : momentos.length === 0 ? (
          <div className="w-full flex flex-col items-center justify-center p-6 bg-secondary/30 rounded-xl border border-dashed border-border mr-4">
            <Video size={32} className="text-muted-foreground mb-2" />
            <p className="text-xs text-muted-foreground text-center">Nenhum momento aprovado ainda.<br/>Seja o primeiro a postar!</p>
          </div>
        ) : (
          momentos.map((momento) => (
            <div 
              key={momento.id} 
              className="relative flex-shrink-0 w-32 h-48 bg-zinc-900 rounded-xl overflow-hidden snap-center group border border-border shadow-sm"
            >
              {momento.media_type === "video" ? (
                <video 
                  src={momento.media_url} 
                  autoPlay 
                  loop 
                  muted 
                  playsInline
                  className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                />
              ) : (
                <img 
                  src={momento.media_url} 
                  alt={momento.caption}
                  className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                />
              )}
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
              
              <div className="absolute bottom-2 left-2 right-2">
                <p className="text-[10px] font-bold text-white drop-shadow-md truncate">
                  @{momento.profiles?.display_name || "Cliente"}
                </p>
                {momento.caption && (
                  <p className="text-[8px] text-white/80 line-clamp-2 mt-0.5 leading-tight drop-shadow-md">
                    {momento.caption}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-card w-full max-w-lg rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h2 className="font-display font-bold text-foreground">Postar Momento</h2>
                <button onClick={() => setShowUploadModal(false)} className="p-2 bg-secondary rounded-full">
                  <X size={20} className="text-muted-foreground" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-48 border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-secondary/50 transition-colors mb-4 relative overflow-hidden"
                >
                  {file ? (
                    file.type.startsWith("video/") ? (
                      <div className="absolute inset-0 bg-black flex items-center justify-center">
                        <Video size={48} className="text-white/50" />
                        <span className="absolute bottom-2 right-2 bg-black/60 px-2 py-1 rounded text-xs text-white">Pronto para envio</span>
                      </div>
                    ) : (
                      <img src={URL.createObjectURL(file)} className="absolute inset-0 w-full h-full object-cover" />
                    )
                  ) : (
                    <>
                      <div className="bg-secondary p-3 rounded-full">
                        <UploadCloud size={24} className="text-primary" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-semibold text-foreground">Toque para escolher vídeo ou foto</p>
                        <p className="text-xs text-muted-foreground mt-1">MP4, MOV, JPG ou PNG (Max 50MB)</p>
                      </div>
                    </>
                  )}
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept="video/*,image/*" 
                    className="hidden" 
                  />
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground ml-1 mb-1 block">Legenda (opcional)</label>
                    <Textarea 
                      placeholder="Conte sobre esse momento especial..."
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      className="bg-secondary resize-none border-border"
                      rows={3}
                    />
                  </div>

                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 flex gap-3">
                    <CheckCircle size={20} className="text-blue-400 flex-shrink-0" />
                    <p className="text-xs text-blue-200 leading-relaxed">
                      Seu envio será encaminhado para aprovação. Assim que autorizado, aparecerá no app!
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-border bg-background">
                <Button 
                  onClick={handleUpload} 
                  disabled={!file || uploading} 
                  className="w-full h-12 gradient-gold text-primary-foreground font-bold rounded-xl shadow-lg"
                >
                  {uploading ? "Enviando..." : "Enviar para Aprovação"}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Success Popup */}
      <AnimatePresence>
        {showSuccessPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card border border-border rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl"
            >
              <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={40} className="text-green-500" />
              </div>
              <h2 className="text-2xl font-display font-bold text-foreground mb-2">Enviado!</h2>
              <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                Seu momento foi enviado com sucesso e está em análise. Em breve aparecerá no app!
              </p>
              <Button 
                onClick={() => setShowSuccessPopup(false)}
                className="w-full h-12 bg-secondary hover:bg-secondary/80 text-foreground font-semibold rounded-xl"
              >
                Voltar para o Início
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
