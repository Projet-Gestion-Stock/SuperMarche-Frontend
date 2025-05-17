import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";
import { useEffect, useState } from 'react';

const pageVariants = {
  default: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.3 }
  },
  // Vos configurations spécifiques

  '/vue-ensemnle': {
    initial: { opacity: 0},
    animate: { opacity: 1},
    exit: { opacity: 0},
    transition: { duration: 0.3 }
  },

  '/connexion': {
    initial: { opacity: 0},
    animate: { opacity: 1},
    exit: { opacity: 0},
    transition: { duration: 0.3 }
  },

  '/caisse': {
    initial: { opacity: 0},
    animate: { opacity: 1},
    exit: { opacity: 0},
    transition: { duration: 0.3 }
  },

};

export default function AnimatedRoutes({ children }) {
  const location = useLocation();
  const [isFirstRender, setIsFirstRender] = useState(true);

  useEffect(() => {
    setIsFirstRender(false);
  }, []);

  const variants = pageVariants[location.pathname] || pageVariants.default;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={isFirstRender ? false : variants.initial}
        animate={variants.animate}
        exit={variants.exit}
        transition={variants.transition}
        style={{
          position: 'relative',
          overflow: 'hidden',
          height: '100%'
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}