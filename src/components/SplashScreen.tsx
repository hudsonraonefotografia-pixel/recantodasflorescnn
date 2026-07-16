import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import splashGif from "@/assets/splash-animation.gif";

interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen = ({ onFinish }: SplashScreenProps) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence onExitComplete={onFinish}>
      {visible && (
        <motion.div
          key="splash"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background"
        >
          <img src={splashGif} alt="Recanto das Flores" className="w-64 h-64 object-contain" />
          <p className="mt-6 text-xl font-display text-gold-gradient tracking-wide">
            Recanto das Flores – Direto da Granja
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashScreen;
