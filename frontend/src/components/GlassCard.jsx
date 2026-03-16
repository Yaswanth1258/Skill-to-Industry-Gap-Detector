import React from 'react';
import { motion } from 'framer-motion';

const GlassCard = ({ children, hover = true, className = '', delay = 0, strong = false, onClick }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={hover ? { y: -8, scale: 1.01 } : {}}
      onClick={onClick}
      className={`${strong ? 'glass-card-strong' : 'glass-card'} rounded-3xl transition-shadow hover:shadow-xl ${className}`}
    >
      {children}
    </motion.div>
  );
};

export default GlassCard;
