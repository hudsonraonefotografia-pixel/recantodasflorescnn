import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ScanLine, Truck, MapPin, Package, RefreshCw, PackageCheck } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import heroBanner from "@/assets/hero-banner.jpg";
import arranjosImg from "@/assets/arranjos.jpg";
import buquesImg from "@/assets/buques.jpg";
import presentesImg from "@/assets/presentes.jpg";
import produtosRoca from "@/assets/produtos-roca.jpg";

import flowerBranch from "@/assets/flower_branch.png";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-20 relative overflow-hidden">
      {/* Ribbon Background */}
      <div className="ribbon-container top-40 -left-1/4 rotate-[-15deg] bg-primary opacity-10">
        <div className="ribbon-text text-primary-foreground">
          RECANTO DAS FLORES • A ARTE DE PRESENTEAR • RECANTO DAS FLORES • EMOÇÕES EM FLORES • RECANTO DAS FLORES • 
        </div>
      </div>
      
      {/* Flower Branch Background */}
      <img 
        src={flowerBranch} 
        alt="" 
        className="absolute top-1/3 -right-20 w-80 h-auto opacity-20 pointer-events-none mix-blend-multiply z-0" 
      />

      <div className="relative z-10 w-full">
        <Header />

        <main className="max-w-lg md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto">
        {/* Hero Banner */}
        <div className="relative mx-3 mt-3 rounded-xl overflow-hidden">
          <img src={heroBanner} alt="Arranjos frescos" className="w-full h-44 object-cover" />
          <div className="absolute inset-0 gradient-hero flex flex-col justify-end p-4">
            <p className="text-foreground text-xs opacity-80">Bom dia! 🌿</p>
            <p className="text-foreground text-sm font-semibold mb-1">
              Seu arranjo de hoje já está pronto!
            </p>
            <div className="mt-1">
              <p className="text-primary font-display font-bold text-sm">💐 CLUBE Recanto das Flores</p>
              <p className="text-foreground text-xs">
                Receba flores toda semana e <span className="font-bold text-primary">DECORE SUA CASA</span>
              </p>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/arranjos")}
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
            title="Arranjos"
            image={arranjosImg}
            items={["Pequenos", "Médios", "Grandes"]}
            to="/arranjos"
          />
          <ProductCard
            title="Buquês"
            image={buquesImg}
            items={["Rosas", "Girassóis", "Mistos"]}
            to="/buques"
          />
          <ProductCard
            title="Presentes"
            image={presentesImg}
            items={["Cestas", "Chocolates", "Vinhos"]}
            to="/presentes"
          />
          <ProductCard
            title="Outros"
            image={produtosRoca}
            items={["Vasos", "Adubos", "Cartões"]}
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

        {/* Promo Savings - Combo Romântico */}
        <div className="mx-3 mt-4 mb-4 gradient-card border-2 border-primary rounded-xl overflow-hidden glow-gold">
          <div className="flex items-center gap-3 p-4">
            <div className="flex-1">
              <p className="text-foreground text-sm font-bold">
                Você economiza mais de <span className="text-primary text-lg font-display">R$30</span>
              </p>
              <p className="text-muted-foreground text-xs mt-1">no Combo Romântico ❤️</p>
              <div className="mt-2">
                <p className="text-muted-foreground text-xs line-through">De R$ 180,00</p>
                <p className="text-primary font-display text-xl font-bold">Por R$ 150,00</p>
              </div>
              <p className="text-muted-foreground text-[10px] mt-1">
                Buquê de Rosas + Caixa de Bombons Finos
              </p>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/buques")}
                className="mt-2 gradient-gold text-primary-foreground text-xs font-bold px-5 py-1.5 rounded-full shadow-gold"
              >
                Comprar Combo
              </motion.button>
            </div>
            <img
              src={buquesImg}
              alt="Combo Romântico"
              className="w-28 h-24 object-cover rounded-lg"
            />
          </div>
          <div className="flex border-t border-border">
            {[
              { Icon: PackageCheck, label: "Escolha as flores" },
              { Icon: Truck, label: "Entregar ou retirar" },
              { Icon: RefreshCw, label: "Agende a entrega" },
            ].map((step) => (
              <div key={step.label} className="flex-1 flex flex-col items-center py-2 border-r border-border last:border-r-0">
                <step.Icon size={18} className="text-primary" />
                <span className="text-[9px] text-muted-foreground text-center leading-tight mt-1">{step.label}</span>
              </div>
            ))}
          </div>
        </div>
      </main>

      </div>

      <BottomNav />
    </div>
  );
};

export default Index;
