import { Link, useLocation } from "react-router-dom";
import { Home, Package, QrCode, Coins, ShoppingCart, User } from "lucide-react";
import { useCart } from "@/contexts/CartContext";

const tabs = [
  { to: "/home", icon: Home, label: "Início" },
  { to: "/produtos", icon: Package, label: "Produtos" },
  { to: "/escanear", icon: QrCode, label: "Escanear", highlight: true },
  { to: "/cashback", icon: Coins, label: "Pontos" },
  { to: "/carrinho", icon: ShoppingCart, label: "Carrinho", showBadge: true },
  { to: "/conta", icon: User, label: "Conta" },
];

const BottomNav = () => {
  const location = useLocation();
  const { itemCount } = useCart();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 gradient-card border-t border-border">
      <div className="flex items-center justify-around py-2 px-1 max-w-lg md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.to;
          const Icon = tab.icon;
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all relative ${
                tab.highlight
                  ? "gradient-gold rounded-2xl px-4 py-2 -mt-5 shadow-gold"
                  : isActive
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              <Icon size={tab.highlight ? 24 : 20} className={tab.highlight ? "text-primary-foreground" : ""} />
              <span className={`text-[10px] font-semibold ${tab.highlight ? "text-primary-foreground" : ""}`}>
                {tab.label}
              </span>
              {tab.showBadge && itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
