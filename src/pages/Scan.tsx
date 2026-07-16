import { useState, useCallback, useRef, useEffect } from "react";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { motion, AnimatePresence } from "framer-motion";
import { QrCode, Camera, X, ShoppingCart, ScanLine, Loader2, WifiOff, AlertTriangle } from "lucide-react";
import { useZxing } from "react-zxing";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface Product {
  id: string;
  nome: string;
  descricao: string | null;
  preco: number;
  estoque: number;
  categoria: string | null;
  validade: string | null;
  lote: string | null;
}

const ScanPage = () => {
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const scanLock = useRef(false);
  const { addItem } = useCart();

  const handleDecode = useCallback(async (code: string) => {
    if (scanLock.current || !code) return;
    scanLock.current = true;
    setScanning(false);
    setLoading(true);
    setError(null);
    setProduct(null);

    const sanitized = code.trim().substring(0, 128);
    if (!/^[a-zA-Z0-9_\-]+$/.test(sanitized)) {
      setError("Código inválido detectado.");
      setLoading(false);
      scanLock.current = false;
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      const { data, error: dbError } = await supabase
        .from("produtos")
        .select("*")
        .or(`codigo_barras.eq.${sanitized},qr_code_id.eq.${sanitized}`)
        .maybeSingle();

      clearTimeout(timeout);

      if (dbError) throw dbError;
      if (!data) {
        setError("Produto não encontrado no sistema.");
      } else {
        setProduct(data as Product);
      }
    } catch (err: any) {
      clearTimeout(timeout);
      if (err.name === "AbortError") {
        setError("Tempo de consulta esgotado. Verifique sua conexão.");
      } else if (!navigator.onLine) {
        setError("Sem conexão com a internet.");
      } else {
        setError("Erro ao consultar produto. Tente novamente.");
      }
    } finally {
      setLoading(false);
      scanLock.current = false;
    }
  }, []);

  const { ref: videoRef } = useZxing({
    paused: !scanning,
    onResult: (result) => handleDecode(result.getText()),
    onError: (err) => {
      console.error("Camera error:", err);
      if (err?.message?.includes("NotAllowed") || err?.message?.includes("Permission")) {
        setCameraError("Permissão de câmera negada. Habilite nas configurações do navegador.");
      } else {
        setCameraError("Erro ao acessar a câmera.");
      }
      setScanning(false);
    },
  });

  const openScanner = async () => {
    setError(null);
    setProduct(null);
    setCameraError(null);
    scanLock.current = false;

    try {
      await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      setScanning(true);
    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        setCameraError("Permissão de câmera negada. Habilite nas configurações do navegador.");
      } else {
        setCameraError("Câmera não disponível neste dispositivo.");
      }
    }
  };

  const addToCart = () => {
    if (!product) return;
    addItem({
      id: product.id,
      name: product.nome,
      price: Number(product.preco),
      variant: product.categoria || undefined,
    });
    toast.success(`${product.nome} adicionado ao carrinho!`);
    setProduct(null);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <main className="max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto px-3 py-4">
        <h2 className="font-display text-2xl font-bold text-foreground mb-4">📷 Escanear Produto</h2>

        {/* Camera Scanner */}
        <AnimatePresence>
          {scanning && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative rounded-2xl overflow-hidden mb-4"
            >
              <video ref={videoRef} className="w-full aspect-square object-cover rounded-2xl" />
              {/* Scan overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-56 h-56 border-2 border-primary rounded-2xl relative">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-lg" />
                  <motion.div
                    className="absolute left-2 right-2 h-0.5 bg-primary"
                    animate={{ top: ["10%", "90%", "10%"] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  />
                </div>
              </div>
              <button
                onClick={() => setScanning(false)}
                className="absolute top-3 right-3 bg-background/80 text-foreground rounded-full p-2"
              >
                <X size={20} />
              </button>
              <p className="absolute bottom-4 left-0 right-0 text-center text-foreground text-xs bg-background/60 py-1">
                Aponte para o QR Code ou Código de Barras
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading */}
        {loading && (
          <div className="gradient-card border-warm rounded-xl p-8 flex flex-col items-center text-center mb-4">
            <Loader2 size={48} className="text-primary animate-spin mb-3" />
            <p className="text-foreground font-semibold text-sm">Consultando produto...</p>
          </div>
        )}

        {/* Product Result */}
        {product && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="gradient-card border-warm rounded-xl p-5 mb-4 space-y-3"
          >
            <h3 className="text-foreground font-display font-bold text-lg">{product.nome}</h3>
            {product.descricao && (
              <p className="text-muted-foreground text-xs">{product.descricao}</p>
            )}
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Preço</p>
                <p className="text-primary font-display font-bold text-xl">
                  R$ {Number(product.preco).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Estoque</p>
                <p className="text-foreground font-semibold">{product.estoque} un.</p>
              </div>
              {product.categoria && (
                <div>
                  <p className="text-muted-foreground text-xs">Categoria</p>
                  <p className="text-foreground text-sm">{product.categoria}</p>
                </div>
              )}
              {product.validade && (
                <div>
                  <p className="text-muted-foreground text-xs">Validade</p>
                  <p className="text-foreground text-sm">
                    {new Date(product.validade).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                onClick={addToCart}
                className="flex-1 gradient-gold text-primary-foreground font-bold rounded-xl"
              >
                <ShoppingCart size={16} className="mr-2" />
                Adicionar ao Carrinho
              </Button>
              <Button
                onClick={openScanner}
                variant="outline"
                className="rounded-xl border-border"
              >
                <ScanLine size={16} />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Error */}
        {error && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="gradient-card border-warm rounded-xl p-6 text-center mb-4"
          >
            {!navigator.onLine ? (
              <WifiOff size={40} className="text-destructive mx-auto mb-3" />
            ) : (
              <AlertTriangle size={40} className="text-primary mx-auto mb-3" />
            )}
            <p className="text-foreground font-semibold text-sm mb-1">{error}</p>
            <Button
              onClick={openScanner}
              className="mt-3 gradient-gold text-primary-foreground font-bold rounded-xl"
            >
              Tentar novamente
            </Button>
          </motion.div>
        )}

        {/* Camera Permission Error */}
        {cameraError && (
          <div className="gradient-card border-warm rounded-xl p-6 text-center mb-4">
            <Camera size={40} className="text-destructive mx-auto mb-3" />
            <p className="text-foreground font-semibold text-sm mb-1">{cameraError}</p>
          </div>
        )}

        {/* Initial State */}
        {!scanning && !loading && !product && !error && !cameraError && (
          <>
            <div className="gradient-card border-warm rounded-xl p-8 flex flex-col items-center text-center mb-6">
              <div className="w-48 h-48 border-2 border-dashed border-primary rounded-2xl flex items-center justify-center mb-4 animate-pulse-gold">
                <QrCode size={64} className="text-primary" />
              </div>
              <p className="text-foreground font-semibold mb-1">Aponte para o QR Code</p>
              <p className="text-muted-foreground text-xs">Escaneie o código do produto para adicionar ao carrinho</p>
            </div>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={openScanner}
              className="w-full gradient-gold text-primary-foreground font-bold py-4 rounded-xl shadow-gold flex items-center justify-center gap-2 text-lg"
            >
              <Camera size={24} />
              Abrir Câmera
            </motion.button>
          </>
        )}
      </main>
      <BottomNav />
    </div>
  );
};

export default ScanPage;
