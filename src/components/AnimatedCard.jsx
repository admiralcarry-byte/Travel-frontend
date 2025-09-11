import React from 'react';
import { motion } from 'framer-motion';

const cardVariants = {
  initial: {
    scale: 1,
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    y: 0
  },
  hover: {
    scale: 1.05,
    y: -8,
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(14, 165, 233, 0.1)',
    transition: {
      duration: 0.3,
      ease: 'easeOut'
    }
  },
  tap: {
    scale: 0.98,
    y: -2,
    transition: {
      duration: 0.1
    }
  }
};

const AnimatedCard = ({ 
  children, 
  className = '', 
  onClick, 
  whileHover = true, 
  whileTap = true,
  delay = 0,
  ...props 
}) => {
  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      whileHover={whileHover ? "hover" : "initial"}
      whileTap={whileTap ? "tap" : "initial"}
      onClick={onClick}
      className={`${className} cursor-pointer`}
      style={{
        animationDelay: `${delay}ms`
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedCard;