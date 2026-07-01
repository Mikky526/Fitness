import React from 'react';
import { motion } from 'framer-motion';

const SkeletonRow = ({ className = 'h-14 rounded-xl bg-gray-100' }) => (
  <div className={`${className} relative overflow-hidden`}>
    <motion.div
      className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/60 to-transparent"
      animate={{ x: ['-150%', '200%'] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
    />
  </div>
);

export default SkeletonRow;
