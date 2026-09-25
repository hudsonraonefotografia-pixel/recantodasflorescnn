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
        <div className={`bg-background/50 p-3 rounded-lg text-sm flex flex-col gap-2 ${inline ? '' : 'mt-2'}`}>
          <p className="font-medium text-foreground">Como instalar no iOS:</p>
          <ol className="list-decimal pl-5 text-muted-foreground space-y-1">
            <li className="flex items-center gap-1">
              Toque no botão compartilhar <Share className="w-3 h-3 inline" />
            </li>
            <li className="flex items-center gap-1">
              Selecione "Adicionar à Tela de Início" <PlusSquare className="w-3 h-3 inline" />
            </li>
          </ol>
        </div>
      ) : (
        <button
          onClick={handleInstallClick}
          className={
            inline
              ? "w-full h-12 border-2 border-white/20 text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 hover:bg-white/10 transition-colors backdrop-blur-sm"
              : "w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-gold"
          }
        >
          {inline ? <Smartphone size={18} /> : null}
          {isIOS ? "Como Instalar o App" : "Instalar Aplicativo"}
        </button>
      )}
    </>
  );

  if (inline) {
    return InstallContent;
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 bg-card border border-border shadow-warm rounded-xl p-4 z-50 flex flex-col gap-3 animate-in slide-in-from-bottom-5">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <img
            src={logoRecantoDasFlores}
            alt="Recanto das Flores"
            className="w-10 h-10  object-contain"
            style={{ background: "transparent" }}
          />
          <div>
            <h3 className="font-semibold text-sm text-foreground">Recanto das Flores App</h3>
            <p className="text-xs text-muted-foreground">
              Instale para uma experiência completa 🌸
            </p>
          </div>
        </div>
        <button 
          onClick={() => setDismissed(true)}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {InstallContent}
    </div>
  );
}


