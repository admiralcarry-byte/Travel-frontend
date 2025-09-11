import React from 'react';
import { motion } from 'framer-motion';

const pageVariants = {
  initial: {
    opacity: 0,
    y: 30,
    scale: 0.95,
    rotateX: -10
  },
  in: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotateX: 0
  },
  out: {
    opacity: 0,
    y: -30,
    scale: 0.95,
    rotateX: 10
  }
};

const pageTransition = {
  type: 'spring',
  stiffness: 100,
  damping: 20,
  mass: 0.8
};

const PageTransition = ({ children, className = '' }) => {
  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className={`${className} transform-gpu`}
      style={{
        transformStyle: 'preserve-3d'
      }}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;