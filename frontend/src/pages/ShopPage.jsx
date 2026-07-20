import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring, useInView } from 'framer-motion';
import { useCart } from '../context/CartContext';

const TYPE_LABELS = {
  membership:   { label: 'Membership',   color: 'bg-[#EFF9FD] text-[#36a8cd]' },
  session:      { label: 'Session',      color: 'bg-orange-100 text-orange-700' },
  package:      { label: 'Package',      color: 'bg-emerald-100 text-emerald-700' },
  consultation: { label: 'Consultation', color: 'bg-green-100 text-green-700' },
  class:        { label: 'Group Class',  color: 'bg-pink-100 text-pink-700' },
};

const FILTERS = ['all', 'membership', 'session', 'package', 'consultation', 'class'];

const FILTER_LABELS = {
  all:          'All',
  membership:   'Membership',
  session:      'Session',
  package:      'Package',
  consultation: 'Consultation',
  class:        'Class',
};

const gridVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.4 } }
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } }
};

// ─── TiltCard ─────────────────────────────────────────────────────────────────
const TiltCard = ({ children, className = '' }) => {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotateX = useTransform(my, [-60, 60], [6, -6]);
  const rotateY = useTransform(mx, [-60, 60], [-6, 6]);
  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    mx.set(e.clientX - r.left - r.width / 2);
    my.set(e.clientY - r.top - r.height / 2);
  };
  const onLeave = () => { mx.set(0); my.set(0); };
  return (
    <motion.div
      style={{ rotateX, rotateY, transformPerspective: 900 }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      whileHover={{ scale: 1.04, zIndex: 10 }}
      transition={{ type: 'spring', stiffness: 280, damping: 24 }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// ─── FloatingParticles ────────────────────────────────────────────────────────
const FloatingParticles = ({ count = 12 }) => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {Array.from({ length: count }).map((_, i) => {
      const colors = ['bg-[#33B8D4]', 'bg-[#66CCE0]', 'bg-cyan-300', 'bg-blue-300', 'bg-teal-300'];
      const size = 2 + (i % 5);
      return (
        <motion.div
          key={i}
          className={`absolute rounded-full opacity-20 ${colors[i % colors.length]}`}
          style={{ width: size, height: size, left: `${(i * 9 + 4) % 94}%`, top: `${(i * 13 + 8) % 87}%` }}
          animate={{ y: [0, -(20 + i * 2), 8, 0], x: [0, i % 2 ? 15 : -15, 0], opacity: [0.1, 0.4, 0.1], scale: [1, 1.4, 0.8, 1] }}
          transition={{ duration: 7 + i * 0.6, repeat: Infinity, ease: 'easeInOut', delay: i * 0.28 }}
        />
      );
    })}
  </div>
);

// ─── ProductCard ──────────────────────────────────────────────────────────────
const ProductCard = ({ product, index }) => {
  const navigate = useNavigate();
  const typeInfo = TYPE_LABELS[product.type] || { label: product.type, color: 'bg-gray-100 text-gray-600' };

  const handleBuyNow = () => {
    navigate('/checkout', {
      state: {
        directItem: { ...product, quantity: 1 },
      },
    });
  };

  return (
    <TiltCard>
      <motion.div
        layout
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl border border-[#E2E8F0] shadow-sm overflow-hidden hover:shadow-md hover:border-[#36a8cd]/20 flex flex-col h-full transition-shadow"
      >
        {/* Top gradient section */}
        <div className={`bg-gradient-to-br ${product.gradient || product.color} p-6 flex items-center justify-between relative overflow-hidden`}>
          {/* Shimmer sweep on gradient top */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent rounded-t-3xl"
            animate={{ x: ['-150%', '200%'] }}
            transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3, ease: 'easeInOut' }}
          />
          <motion.div
            className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-3xl shadow-lg relative z-10"
            animate={{ y: [0, -5, 0], rotate: [0, -3, 3, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: (index || 0) * 0.4 }}
            whileHover={{ scale: 1.2, rotate: 8 }}
          >
            {product.icon}
          </motion.div>
          {product.badge && (
            <span className="bg-white/20 border border-white/30 text-white text-xs font-bold px-2.5 py-1 rounded-full relative z-10">
              {product.badge}
            </span>
          )}
        </div>

        {/* Body */}
        <div className="p-6 flex-1 flex flex-col">
          <span className="bg-[#EFF9FD] text-[#36a8cd] text-xs font-bold px-2.5 py-1 rounded-full w-fit border border-[#36a8cd]/15">
            {typeInfo.label}
          </span>

          <h3 className="text-xl font-bold text-[#0F172A] mt-2 leading-snug">{product.name}</h3>
          <p className="text-[#475569] text-sm leading-relaxed mt-2 flex-1">{product.description}</p>

          <motion.div
            className={`text-3xl font-black bg-gradient-to-r ${product.gradient || product.color} bg-clip-text text-transparent mt-4`}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.4 }}
          >
            ₹{product.price.toLocaleString('en-IN')}
            <span className="text-xs text-gray-400 font-normal ml-1">/ item</span>
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.button
              key="buy-now"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              whileHover={{ scale: 1.05, boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}
              whileTap={{ scale: 0.95 }}
              onClick={handleBuyNow}
              className="w-full bg-[#36a8cd] hover:bg-[#2089ab] text-white font-bold py-3 rounded-xl shadow-sm hover:shadow-md transition-all mt-4"
            >
              Buy Now
            </motion.button>
          </AnimatePresence>
        </div>
      </motion.div>
    </TiltCard>
  );
};

// ─── ShopPage ─────────────────────────────────────────────────────────────────
const ShopPage = () => {
  const { products, productsLoading } = useCart();
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all' ? products : products.filter(p => p.type === filter);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-[#F8FAFC] pb-12"
    >
      {/* Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="bg-gradient-to-br from-[#0A0F1E] via-[#0F172A] to-[#0D1B26] rounded-3xl p-10 mx-4 mt-4 relative overflow-hidden"
      >
        {/* Floating particles */}
        <FloatingParticles count={12} />

        {/* Shimmer sweep */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/8 to-transparent"
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 3.5, repeat: Infinity, repeatDelay: 5, ease: 'easeInOut' }}
        />

        {/* Decorative blobs */}
        <motion.div
          animate={{ scale: [1, 1.5, 0.8, 1.3, 1], x: [0, 40, -20, 15, 0], opacity: [0.08, 0.2, 0.05, 0.18, 0.08] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-0 right-0 w-72 h-72 bg-[#36a8cd] rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"
        />
        <motion.div
          animate={{ scale: [1, 1.5, 0.8, 1.3, 1], x: [0, -40, 20, -15, 0], opacity: [0.08, 0.2, 0.05, 0.18, 0.08] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
          className="absolute bottom-0 left-0 w-64 h-64 bg-[#2089ab] rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"
        />
        <motion.div
          animate={{ scale: [1, 1.5, 0.8, 1.3, 1], opacity: [0.08, 0.2, 0.05, 0.18, 0.08] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
          className="absolute top-1/2 left-1/2 w-48 h-48 bg-[#36a8cd] rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"
        />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            {/* Top pill */}
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-[#66CCE0] text-xs font-bold px-3 py-1.5 rounded-full mb-4">
              <span>★</span>
              <span>Premium Fitness Store</span>
            </div>
            <div>
              <motion.h1
                className="text-4xl font-black text-white leading-tight"
              >
                {['Plans', '&', 'Sessions'].map((word, i) => (
                  <motion.span
                    key={word}
                    initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    transition={{ delay: 0.2 + i * 0.15, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="inline-block mr-2"
                  >
                    {word}
                  </motion.span>
                ))}
              </motion.h1>
            </div>
            <p className="text-[#66CCE0]/80 text-sm mt-2">Choose a plan that fits your goals. All purchases are instant.</p>
          </div>

        </div>
      </motion.div>

      {/* Filter Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl p-2 shadow-sm border border-[#E2E8F0] flex gap-2 flex-wrap mx-4 my-6"
      >
        {FILTERS.map(f => (
          <motion.button
            key={f}
            onClick={() => setFilter(f)}
            whileHover={{ scale: 1.08, y: -2 }}
            whileTap={{ scale: 0.92 }}
            className={`relative px-5 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
              filter === f
                ? 'text-white'
                : 'text-[#475569] hover:text-[#36a8cd] hover:bg-[#EFF9FD]'
            }`}
          >
            {filter === f && (
              <motion.div
                layoutId="shopFilter"
                className="absolute inset-0 bg-[#36a8cd] rounded-xl shadow-md"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
            <span className="relative z-10">{FILTER_LABELS[f]}</span>
          </motion.button>
        ))}
      </motion.div>

      {/* Product Grid */}
      {productsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="h-64 rounded-3xl bg-gray-100 relative overflow-hidden">
              <motion.div className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/60 to-transparent"
                animate={{ x: ['-150%', '200%'] }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }} />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-[#94A3B8]">
          <p className="text-5xl mb-4">🏋️</p>
          <p className="font-semibold text-lg">No plans available in this category yet.</p>
        </div>
      ) : (
        <motion.div
          layout
          variants={gridVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4"
        >
          <AnimatePresence>
            {filtered.map((p, i) => (
              <motion.div key={p.id} layout>
                <ProductCard product={p} index={i} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ShopPage;
