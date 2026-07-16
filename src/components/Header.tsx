import { ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import logoRecantoDasFlores from "@/assets/logo-recantodasflores.png";
import NotificationsPanel from "@/components/NotificationsPanel";
import { ThemeToggle } from "@/components/ThemeToggle";

const Header = () => {
  const { itemCount } = useCart();

  return (
    <header className="sticky top-0 z-40 gradient-card border-b border-border px-4 py-3">
      <div className="flex items-center justify-between max-w-lg md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <NotificationsPanel />
          <ThemeToggle />
        </div>
        <img src={logoRecantoDasFlores} alt="Recanto das Flores" className="h-8 w-auto" />
        <Link to="/carrinho" className="relative">
          <ShoppingCart size={22} className="text-foreground" />
          {itemCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {itemCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
};

export default Header;
