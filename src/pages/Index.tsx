import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ScanLine, Truck, MapPin, Package, RefreshCw, PackageCheck } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import heroBanner from "@/assets/hero-banner.jpg";
import ovosCaipira from "@/assets/ovos-caipira.jpg";
import frangoCaipira from "@/assets/frango-caipira.jpg";
import polpasFrutas from "@/assets/polpas-frutas.jpg";
import produtosRoca from "@/assets/produtos-roca.jpg";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />

      <main className="max-w-lg md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto">
        {/* Hero Banner */}
        <div className="relative mx-3 mt-3 rounded-xl overflow-hidden">
          <img src={heroBanner} alt="Produtos frescos da granja" className="w-full h-44 object-cover" />
          <div className="absolute inset-0 gradient-hero flex flex-col justify-end p-4">
            <p className="text-foreground text-xs opacity-80">Bom dia! 🌿</p>
            <p className="text-foreground text-sm font-semibold mb-1">
              Seus ovos frescos já estão separados!
            </p>
            <div className="mt-1">
              <p className="text-primary font-display font-bold text-sm">🌿 ASSINATURA Recanto das Flores</p>
              <p className="text-foreground text-xs">
                Receba ovos toda semana e <span className="font-bold text-primary">ECONOMIZE ATÉ 12%</span>
              </p>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/ovos-caipira")}
                className="mt-2 gradient-gold text-primary-foreground text-xs font-bold px-5 py-1.5 rounded-full shadow-gold"
              >
                Assinar agora
              </motion.button>
            </div>
          </div>
        </div>

        {/* Scan Button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate("/escanear")}
          className="mx-3 mt-3 w-[calc(100%-1.5rem)] gradient-gold rounded-xl p-3 flex items-center gap-3 shadow-gold"
        >
          <div className="bg-primary-foreground/20 rounded-lg p-2">
            <ScanLine size={28} className="text-primary-foreground" />
          </div>
          <div className="text-left">
            <p className="text-primary-foreground font-display font-bold text-sm">Escanear Produto</p>
            <p className="text-primary-foreground/80 text-xs">Pague no ponto de venda</p>
          </div>
        </motion.button>

        {/* Product Categories */}
        <div className="px-3 mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <ProductCard
            title="Ovos Caipira"
            image={ovosCaipira}
            items={["15 Unidades", "30 Unidades", "Combo Família"]}
            to="/ovos-caipira"
          />
          <ProductCard
            title="Frango Caipira"
            image={frangoCaipira}
            items={["Inteiro", "Cortado", "Temperado Artesanal"]}
            to="/frango"
          />
          <ProductCard
            title="Polpas Naturais"
            image={polpasFrutas}
            items={["Umbu", "Cajá", "Acerola"]}
            to="/polpas"
          />
          <ProductCard
            title="Produtos da Roça"
            image={produtosRoca}
            items={["Mel", "Manteiga da Terra", "Queijo Artesanal"]}
            to="/produtos"
          />
        </div>

        {/* Delivery Route */}
        <motion.div
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate("/entregas")}
          className="mx-3 mt-4 gradient-card border-warm rounded-xl p-4 flex items-center gap-3 cursor-pointer"
        >
          <Truck size={28} className="text-primary flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-display font-bold text-foreground text-sm">Rota da Semana</h3>
            <p className="text-xs text-muted-foreground">Veja no mapa os dias de entrega por bairro</p>
          </div>
          <MapPin size={22} className="text-primary flex-shrink-0" />
        </motion.div>

        {/* Promo Savings - Combo Família */}
        <div className="mx-3 mt-4 mb-4 gradient-card border-2 border-primary rounded-xl overflow-hidden glow-gold">
          <div className="flex items-center gap-3 p-4">
            <div className="flex-1">
              <p className="text-foreground text-sm font-bold">
                Você economiza mais de <span className="text-primary text-lg font-display">R$28</span>
              </p>
              <p className="text-muted-foreground text-xs mt-1">no Combo Família 🔥</p>
              <div className="mt-2">
                <p className="text-muted-foreground text-xs line-through">De R$ 125,80</p>
                <p className="text-primary font-display text-xl font-bold">Por R$ 97,00</p>
              </div>
              <p className="text-muted-foreground text-[10px] mt-1">
                2x Cartela 30 ovos + Frango Inteiro Caipira
              </p>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/ovos-caipira")}
                className="mt-2 gradient-gold text-primary-foreground text-xs font-bold px-5 py-1.5 rounded-full shadow-gold"
              >
                Comprar Combo
              </motion.button>
            </div>
            <img
              src={ovosCaipira}
              alt="Combo Família"
              className="w-28 h-24 object-cover rounded-lg"
            />
          </div>
          <div className="flex border-t border-border">
            {[
              { Icon: PackageCheck, label: "Escolha quantidade" },
              { Icon: Truck, label: "Entregar ou retirar" },
              { Icon: RefreshCw, label: "Escolha a recorrência" },
            ].map((step) => (
              <div key={step.label} className="flex-1 flex flex-col items-center py-2 border-r border-border last:border-r-0">
                <step.Icon size={18} className="text-primary" />
                <span className="text-[9px] text-muted-foreground text-center leading-tight mt-1">{step.label}</span>
              </div>
            ))}
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Index;
