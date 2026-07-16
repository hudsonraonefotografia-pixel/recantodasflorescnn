import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

interface ProductCardProps {
  title: string;
  image: string;
  items: string[];
  to: string;
}

const ProductCard = ({ title, image, items, to }: ProductCardProps) => {
  const navigate = useNavigate();

  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      onClick={() => navigate(to)}
      className="gradient-card border-warm rounded-xl overflow-hidden cursor-pointer hover:border-gold/30 transition-colors group"
    >
      {/* Mobile: compact horizontal layout */}
      <div className="md:hidden flex items-center p-3 gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-bold text-foreground text-sm mb-1.5">{title}</h3>
          <ul className="space-y-0.5">
            {items.map((item) => (
              <li key={item} className="text-xs text-muted-foreground flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <img
          src={image}
          alt={title}
          className="w-24 h-20 object-cover rounded-lg flex-shrink-0"
          loading="lazy"
        />
      </div>

      {/* Tablet/Desktop: vertical card with large image */}
      <div className="hidden md:flex md:flex-col">
        <div className="relative overflow-hidden">
          <img
            src={image}
            alt={title}
            className="w-full h-36 lg:h-44 object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
          <h3 className="absolute bottom-2 left-3 font-display font-bold text-foreground text-base lg:text-lg drop-shadow-md">
            {title}
          </h3>
        </div>
        <div className="p-3 pt-2">
          <ul className="space-y-1">
            {items.map((item) => (
              <li key={item} className="text-xs lg:text-sm text-muted-foreground flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
          <span className="inline-block mt-2 text-[10px] lg:text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
            Ver produtos →
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
