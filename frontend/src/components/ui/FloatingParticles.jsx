import React from 'react';
import { motion } from 'framer-motion';

const DEFAULT_COLORS = ['bg-cyan-300', 'bg-[#66CCE0]', 'bg-[#33B8D4]', 'bg-sky-300'];

const FloatingParticles = ({
  count = 12,
  className = '',
  colors = DEFAULT_COLORS,
  minSize = 2,
  sizeVariance = 4,
}) => (
  <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
    {Array.from({ length: count }).map((_, i) => {
      const size = minSize + (i % sizeVariance);
      return (
        <motion.div
          key={i}
          className={`absolute rounded-full opacity-20 ${colors[i % colors.length]}`}
          style={{ width: size, height: size, left: `${(i * 7 + 3) % 93}%`, top: `${(i * 11 + 5) % 88}%` }}
          animate={{ y: [0, -(18 + i * 2), 5, 0], x: [0, i % 2 ? 14 : -14, 0], opacity: [0.1, 0.35, 0.1], scale: [1, 1.3, 0.9, 1] }}
          transition={{ duration: 7 + i * 0.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.25 }}
        />
      );
    })}
  </div>
);

export default FloatingParticles;
