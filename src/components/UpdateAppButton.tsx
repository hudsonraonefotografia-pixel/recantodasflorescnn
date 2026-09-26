import { RefreshCw } from "lucide-react";
import { useState } from "react";

export default function UpdateAppButton() {
  const [updating, setUpdating] = useState(false);

  const handleUpdate = async () => {
    setUpdating(true);
    
    // Desregistra o Service Worker atual
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (let registration of registrations) {
        await registration.unregister();
      }
    }
    
    // Limpa o cache do navegador
    if ('caches' in window) {
      const keys = await caches.keys();
      for (let key of keys) {
        await caches.delete(key);
      }
    }
    
    // Força um recarregamento total sem usar o cache local
    window.location.href = window.location.href;
  };

  return (
    <button
      onClick={handleUpdate}
      disabled={updating}
      className="fixed bottom-20 right-4 z-[90] bg-black/60 backdrop-blur-md border border-white/10 text-[10px] text-white/70 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-xl hover:bg-black/80 hover:text-white transition-all"
    >
      <RefreshCw size={12} className={updating ? "animate-spin" : ""} />
      {updating ? "Atualizando..." : "Atualizar App"}
    </button>
  );
}
