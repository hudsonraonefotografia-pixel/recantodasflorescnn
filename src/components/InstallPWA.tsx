import React, { useEffect, useState } from "react";
import { Download, Share, PlusSquare, X, Smartphone } from "lucide-react";
import { useLocation } from "react-router-dom";
import logoRecantoDasFlores from "@/assets/logo-recantodasflores.png";

export function InstallPWA({ inline = false }: { inline?: boolean }) {
  const location = useLocation();
  const isLoginPage = location.pathname === "/";
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstruction, setShowIOSInstruction] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone;
    setIsStandalone(standalone);

    if (standalone) return;

    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIosDevice);

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSInstruction(true);
      return;
    }

    if (!deferredPrompt) {
      if (import.meta.env.DEV) {
        alert("Modo Dev: No navegador do PC, clique no ícone de instalação na barra de endereços, ou teste em um dispositivo móvel real para ver a tela nativa.");
      }
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  if (isStandalone || dismissed) return null;

  const isDev = import.meta.env.DEV;
  if (!deferredPrompt && !isIOS && !isDev) return null;

  if (!inline && isLoginPage) return null;

  const InstallContent = (
    <>
      {showIOSInstruction ? (
        <div className={`bg-background/50 p-3 rounded-xl text-xs flex flex-col gap-2 ${inline ? '' : 'mt-2'}`}>
          <p className="font-bold text-foreground">Para instalar no iOS:</p>
          <ol className="list-decimal pl-5 text-muted-foreground space-y-1">
            <li className="flex items-center gap-1">
              Toque em Compartilhar <Share className="w-3 h-3 inline text-primary" />
            </li>
            <li className="flex items-center gap-1">
              "Adicionar à Tela de Início" <PlusSquare className="w-3 h-3 inline text-primary" />
            </li>
          </ol>
        </div>
      ) : (
        <button
          onClick={handleInstallClick}
          className={
            inline
              ? "w-full h-12 border-2 border-white/20 text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 hover:bg-white/10 transition-colors backdrop-blur-sm"
              : "w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-gold"
          }
        >
          {inline ? <Smartphone size={18} /> : <Download size={14} />}
          {isIOS ? "Instalar no iOS" : "Instalar Aplicativo"}
        </button>
      )}
    </>
  );

  if (inline) {
    return InstallContent;
  }

  return (
    <div className="fixed bottom-24 right-4 z-[60] w-[calc(100vw-2rem)] max-w-[320px] bg-card/95 backdrop-blur-md border border-border shadow-2xl rounded-2xl p-4 animate-in slide-in-from-bottom-10 fade-in duration-500">
      <div className="flex items-start gap-3">
        <img
          src={logoRecantoDasFlores}
          alt="App"
          className="w-10 h-10 object-contain drop-shadow-md flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <h3 className="font-display font-bold text-foreground text-sm truncate">Recanto das Flores App</h3>
            <button 
              onClick={() => setDismissed(true)}
              className="text-muted-foreground hover:text-foreground transition-colors p-1 -mt-1 -mr-1"
            >
              <X size={16} />
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground leading-tight mt-0.5 mb-3">
            Instale para uma experiência mais rápida e completa 🌸
          </p>
          {InstallContent}
        </div>
      </div>
    </div>
  );
}


