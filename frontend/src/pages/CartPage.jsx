import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring, useInView } from 'framer-motion';
import { useCart } from '../context/CartContext';
import axios from 'axios';
import Cookies from 'js-cookie';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
const getAuth = () => {
  const info = Cookies.get('userInfo');
  if (!info) return { headers: {} };
  return { headers: { Authorization: `Bearer ${JSON.parse(info).token}` } };
};

// ─── Card Helpers ─────────────────────────────────────────────────────────────
const formatCardNumber = (v) =>
  v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();

const formatExpiry = (v) => {
  const digits = v.replace(/\D/g, '').slice(0, 4);
  if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return digits;
};

const detectBrand = (n) => {
  const d = n.replace(/\s/g, '');
  if (/^4/.test(d)) return { name: 'Visa', icon: '💳' };
  if (/^5[1-5]/.test(d)) return { name: 'Mastercard', icon: '🔴' };
  if (/^3[47]/.test(d)) return { name: 'Amex', icon: '🟦' };
  if (/^6/.test(d)) return { name: 'Discover', icon: '🟠' };
  return { name: '', icon: '💳' };
};

// ─── FloatingParticles ────────────────────────────────────────────────────────
const FloatingParticles = ({ count = 12, colors }) => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {Array.from({ length: count }).map((_, i) => {
      const defaultColors = ['bg-[#33B8D4]', 'bg-[#66CCE0]', 'bg-cyan-300', 'bg-blue-300', 'bg-teal-300'];
      const palette = colors || defaultColors;
      const size = 2 + (i % 5);
      return (
        <motion.div
          key={i}
          className={`absolute rounded-full opacity-20 ${palette[i % palette.length]}`}
          style={{ width: size, height: size, left: `${(i * 9 + 4) % 94}%`, top: `${(i * 13 + 8) % 87}%` }}
          animate={{ y: [0, -(20 + i * 2), 8, 0], x: [0, i % 2 ? 15 : -15, 0], opacity: [0.1, 0.4, 0.1], scale: [1, 1.4, 0.8, 1] }}
          transition={{ duration: 7 + i * 0.6, repeat: Infinity, ease: 'easeInOut', delay: i * 0.28 }}
        />
      );
    })}
  </div>
);

// ─── Success Screen ───────────────────────────────────────────────────────────
const SuccessScreen = ({ data, onClose }) => (
  <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4">
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', damping: 20, stiffness: 200, delay: 0.1 }}
      className="bg-white rounded-3xl p-12 text-center border border-[#E2E8F0] shadow-2xl max-w-md w-full relative overflow-hidden"
    >
      {/* Success-specific floating particles (green/emerald) */}
      <FloatingParticles
        count={10}
        colors={['bg-emerald-300', 'bg-green-300', 'bg-teal-300', 'bg-lime-300', 'bg-emerald-400']}
      />

      {/* Checkmark with ripple behind */}
      <div className="relative flex items-center justify-center mb-6">
        {/* Ripple ring */}
        <motion.div
          className="absolute w-24 h-24 rounded-full border-4 border-emerald-300"
          animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
        />
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.3 }}
          className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center relative z-10"
        >
          <motion.svg
            className="w-12 h-12 text-emerald-500"
            fill="none"
            viewBox="0 0 24 24"
          >
            <motion.path
              d="M5 13l4 4L19 7"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.6, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            />
          </motion.svg>
        </motion.div>
      </div>

      {/* "Payment Successful!" — word-by-word blur reveal */}
      <motion.h2 className="text-3xl font-black text-[#0F172A] mb-2">
        {['Payment', 'Successful!'].map((word, i) => (
          <motion.span
            key={word}
            initial={{ opacity: 0, y: 16, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ delay: 0.65 + i * 0.15, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="inline-block mr-2"
          >
            {word}
          </motion.span>
        ))}
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.75 }}
        className="text-[#475569] text-sm mb-6"
      >
        Your order has been confirmed. Thank you for your purchase!
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, type: 'spring' }}
        className="bg-[#F8FAFC] rounded-2xl p-5 text-sm space-y-2 mt-6 text-left border border-[#E2E8F0]"
      >
        <div className="flex justify-between py-1">
          <span className="text-gray-500 font-medium">Transaction ID</span>
          <span className="font-mono text-xs text-[#36a8cd] font-bold">{data.transactionId}</span>
        </div>
        <div className="flex justify-between py-1">
          <span className="text-gray-500 font-medium">Card</span>
          <span className="font-semibold text-gray-800">{data.cardBrand} •••• {data.cardLast4}</span>
        </div>
        <div className="flex justify-between py-1">
          <span className="text-gray-500 font-medium">Total Paid</span>
          <span className="font-extrabold text-emerald-600 text-base">${Number(data.amount).toFixed(2)}</span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
        className="flex flex-col sm:flex-row gap-3 justify-center mt-8"
      >
        <Link to="/user/dashboard">
          <motion.div
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-3 rounded-xl bg-[#36a8cd] hover:bg-[#2089ab] text-white font-bold text-sm shadow-sm cursor-pointer text-center transition-colors"
          >
            View Dashboard
          </motion.div>
        </Link>
        <Link to="/shop">
          <motion.div
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-3 rounded-xl bg-white border border-[#E2E8F0] text-[#475569] font-bold text-sm cursor-pointer hover:bg-[#F8FAFC] transition-colors text-center"
          >
            Shop More
          </motion.div>
        </Link>
      </motion.div>
    </motion.div>
  </div>
);

// ─── Checkout Form ────────────────────────────────────────────────────────────
const CheckoutSection = ({ total, items, onSuccess }) => {
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName]     = useState('');
  const [expiry, setExpiry]         = useState('');
  const [cvv, setCvv]               = useState('');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');

  const brand = detectBrand(cardNumber);
  const digits = cardNumber.replace(/\s/g, '');

  const handlePay = async (e) => {
    e.preventDefault();
    setError('');

    if (digits.length < 16)     return setError('Please enter a valid 16-digit card number.');
    if (!cardName.trim())       return setError('Please enter the cardholder name.');
    if (expiry.length < 5)      return setError('Please enter a valid expiry date (MM/YY).');
    if (cvv.length < 3)         return setError('Please enter a valid CVV.');

    setLoading(true);
    try {
      const res = await axios.post(`${API}/payments/pay`, {
        amount: total,
        cardNumber,
        cardName,
        items: items.map(i => ({ name: i.name, description: i.description, price: i.price, quantity: i.quantity, type: i.type })),
      }, getAuth());
      onSuccess(res.data);
    } catch (err) {
      if (!err.response) {
        setError('Cannot connect to server. Please make sure the backend is running (node server.js on port 5001).');
      } else {
        const msg = err.response.data?.message
          || (typeof err.response.data === 'string' ? err.response.data.slice(0, 120) : null)
          || `Server error ${err.response.status}`;
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handlePay} className="space-y-4">
      {/* Payment Details title with lock icon */}
      <h3 className="text-base font-bold text-[#0F172A] mt-6 mb-4 flex items-center gap-2">
        <span className="w-7 h-7 rounded-lg bg-[#EFF9FD] flex items-center justify-center text-sm">🔒</span>
        Payment Details
      </h3>

      <AnimatePresence>
        {error && (
          <motion.div
            key="error"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: [0, -6, 6, -3, 3, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-rose-50 border border-rose-100 text-rose-600 rounded-xl px-4 py-3 text-sm flex items-center gap-2"
          >
            <span>⚠️</span>
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Demo card hint */}
      <div className="bg-amber-50 border border-amber-100 text-amber-700 rounded-xl px-4 py-3 text-xs font-medium flex items-start gap-2 mb-4">
        <span className="mt-0.5">🧪</span>
        <div className="space-y-0.5">
          <p className="font-bold">Demo Mode</p>
          <p>✅ Use <span className="font-mono font-bold">4242 4242 4242 4242</span> — always succeeds</p>
          <p>❌ Use <span className="font-mono font-bold">4000 0000 0000 0002</span> — always declines</p>
          <p className="text-amber-500">Any future date and any 3-digit CVV work.</p>
        </div>
      </div>

      {/* Card Number */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <label className="block text-sm font-semibold text-[#0F172A] mb-1.5">Card Number</label>
        <div className="relative">
          <input
            type="text"
            inputMode="numeric"
            value={cardNumber}
            onChange={e => setCardNumber(formatCardNumber(e.target.value))}
            placeholder="1234 5678 9012 3456"
            maxLength={19}
            className="w-full bg-white border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#36a8cd]/20 focus:border-[#36a8cd] outline-none transition-all pr-12 font-mono tracking-widest"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xl">{brand.icon}</span>
        </div>
        {brand.name && <p className="text-xs text-gray-400 mt-1">{brand.name} detected</p>}
      </motion.div>

      {/* Cardholder Name */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <label className="block text-sm font-semibold text-[#0F172A] mb-1.5">Cardholder Name</label>
        <input
          type="text"
          value={cardName}
          onChange={e => setCardName(e.target.value.toUpperCase())}
          placeholder="JOHN DOE"
          className="w-full bg-white border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#36a8cd]/20 focus:border-[#36a8cd] outline-none transition-all tracking-wider"
        />
      </motion.div>

      {/* Expiry + CVV */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-2 gap-3"
      >
        <div>
          <label className="block text-sm font-semibold text-[#0F172A] mb-1.5">Expiry</label>
          <input
            type="text"
            inputMode="numeric"
            value={expiry}
            onChange={e => setExpiry(formatExpiry(e.target.value))}
            placeholder="MM/YY"
            maxLength={5}
            className="w-full bg-white border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#36a8cd]/20 focus:border-[#36a8cd] outline-none transition-all font-mono"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-[#0F172A] mb-1.5">CVV</label>
          <input
            type="password"
            inputMode="numeric"
            value={cvv}
            onChange={e => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="•••"
            maxLength={4}
            className="w-full bg-white border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#36a8cd]/20 focus:border-[#36a8cd] outline-none transition-all font-mono"
          />
        </div>
      </motion.div>

      {/* Pay Button */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <motion.button
          type="submit"
          disabled={loading}
          whileHover={{ scale: 1.03, boxShadow: '0 0 0 0px rgba(54,168,205,0.5), 0 20px 50px rgba(54,168,205,0.4)' }}
          whileTap={{ scale: 0.97 }}
          animate={{
            boxShadow: [
              '0 4px 15px rgba(54,168,205,0.25)',
              '0 6px 30px rgba(54,168,205,0.45)',
              '0 4px 15px rgba(54,168,205,0.25)',
            ]
          }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          className="w-full bg-[#36a8cd] hover:bg-[#2089ab] text-white font-extrabold py-4 rounded-xl shadow-sm hover:shadow-md transition-all text-lg mt-4 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-1.5">
              {[0, 1, 2].map(i => (
                <motion.span
                  key={i}
                  className="w-2 h-2 rounded-full bg-white"
                  animate={{ y: [0, -8, 0], scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.5, delay: i * 0.12, repeat: Infinity, ease: 'easeInOut' }}
                />
              ))}
            </span>
          ) : `Pay $${total.toFixed(2)} Now 🔒`}
        </motion.button>
      </motion.div>

      <p className="text-center text-xs text-gray-400 flex items-center justify-center gap-1">
        🔒 256-bit SSL encrypted · Secure checkout
      </p>
    </form>
  );
};

// ─── Cart Page ────────────────────────────────────────────────────────────────
const CartPage = () => {
  const { items, removeItem, updateQty, clearCart, subtotal, tax, total, count } = useCart();
  const [successData, setSuccessData] = useState(null);
  const navigate = useNavigate();

  const handleSuccess = (data) => {
    clearCart();
    setSuccessData(data);
  };

  return (
    <AnimatePresence mode="wait">
      {successData ? (
        <motion.div key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <SuccessScreen data={successData} onClose={() => navigate('/shop')} />
        </motion.div>
      ) : (
        <motion.div
          key="cart"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="min-h-screen bg-[#F8FAFC] pb-12"
        >
          <div className="max-w-7xl mx-auto px-4 py-8">
            {/* Page Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="bg-gradient-to-br from-[#0A0F1E] via-[#0F172A] to-[#0D1B26] rounded-3xl p-8 mb-8 flex items-center justify-between relative overflow-hidden"
            >
              {/* Floating particles */}
              <FloatingParticles count={8} />

              {/* Shimmer sweep */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/8 to-transparent"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 3, repeat: Infinity, repeatDelay: 5, ease: 'easeInOut' }}
              />

              {/* Decorative blobs */}
              <motion.div
                animate={{ scale: [1, 1.5, 0.8, 1.3, 1], x: [0, 40, -20, 15, 0], opacity: [0.08, 0.2, 0.05, 0.18, 0.08] }}
                transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute top-0 right-0 w-56 h-56 bg-[#36a8cd] rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"
              />
              <motion.div
                animate={{ scale: [1, 1.5, 0.8, 1.3, 1], x: [0, -40, 20, -15, 0], opacity: [0.08, 0.2, 0.05, 0.18, 0.08] }}
                transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
                className="absolute bottom-0 left-0 w-40 h-40 bg-[#2089ab] rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"
              />

              <div className="relative z-10">
                <h1 className="text-3xl font-black text-white">Your Cart</h1>
                <p className="text-[#66CCE0]/80 text-sm mt-1">
                  {count === 0 ? 'Your cart is empty' : `${count} item${count !== 1 ? 's' : ''} ready for checkout`}
                </p>
              </div>

              <div className="relative z-10 flex items-center gap-3">
                {items.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-sm text-rose-300 hover:text-rose-200 font-semibold px-3 py-2 rounded-xl hover:bg-white/10 transition-colors"
                  >
                    Clear All
                  </button>
                )}
                {/* Item count chip */}
                {count > 0 && (
                  <span className="bg-white/10 border border-white/20 text-[#66CCE0] text-xs font-bold px-3 py-1.5 rounded-full">
                    {count} item{count !== 1 ? 's' : ''}
                  </span>
                )}
                <Link
                  to="/shop"
                  className="bg-white/10 border border-white/20 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-white/20 transition-colors"
                >
                  ← Continue Shopping
                </Link>
              </div>
            </motion.div>

            {/* Empty Cart */}
            {items.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 18 }}
                className="bg-white rounded-3xl p-16 text-center border border-[#E2E8F0] shadow-sm"
              >
                <motion.div
                  animate={{ y: [0, -15, 0], rotate: [0, -5, 5, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="text-7xl mb-6 opacity-30"
                >
                  🛒
                </motion.div>
                <h2 className="text-2xl font-bold text-[#0F172A] mb-2">Your cart is empty</h2>
                <p className="text-[#475569] text-sm mb-8">Browse our plans and add something to get started.</p>
                <Link to="/shop">
                  <motion.div
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                    className="inline-block px-8 py-3 rounded-xl bg-[#36a8cd] hover:bg-[#2089ab] text-white font-bold shadow-sm cursor-pointer transition-colors"
                  >
                    Browse Plans
                  </motion.div>
                </Link>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Cart Items — left column */}
                <div className="lg:col-span-3 space-y-3">
                  <AnimatePresence>
                    {items.map((item, i) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, x: -50, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 100, scale: 0.8, height: 0, marginBottom: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25, delay: i * 0.05 }}
                        className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-sm flex items-center gap-4 mb-3 hover:shadow-md transition-shadow"
                      >
                        {/* Icon box */}
                        <motion.div
                          className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#36a8cd] to-[#2089ab] flex items-center justify-center text-2xl flex-shrink-0"
                          animate={{ rotate: [0, -3, 3, 0] }}
                          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                        >
                          {item.icon}
                        </motion.div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-[#0F172A] truncate">{item.name}</p>
                          <p className="text-sm text-[#475569] mt-0.5 truncate">{item.description}</p>
                          <p className={`text-sm font-extrabold mt-1 bg-gradient-to-r ${item.color} bg-clip-text text-transparent`}>
                            ₹{item.price.toLocaleString('en-IN')}
                          </p>
                        </div>

                        {/* Qty controls */}
                        <div className="flex items-center gap-2 bg-[#F1F5F9] rounded-xl p-1 flex-shrink-0">
                          <motion.button
                            onClick={() => updateQty(item.id, item.quantity - 1)}
                            whileHover={{ scale: 1.2, backgroundColor: '#eef2ff' }}
                            whileTap={{ scale: 0.8 }}
                            className="w-7 h-7 rounded-lg bg-white shadow-sm font-bold text-[#475569] hover:bg-[#EFF9FD] hover:text-[#36a8cd] transition-colors flex items-center justify-center"
                          >
                            −
                          </motion.button>
                          <span className="w-8 text-center font-bold text-sm text-gray-800">{item.quantity}</span>
                          <motion.button
                            onClick={() => updateQty(item.id, item.quantity + 1)}
                            whileHover={{ scale: 1.2, backgroundColor: '#eef2ff' }}
                            whileTap={{ scale: 0.8 }}
                            className="w-7 h-7 rounded-lg bg-white shadow-sm font-bold text-[#475569] hover:bg-[#EFF9FD] hover:text-[#36a8cd] transition-colors flex items-center justify-center"
                          >
                            +
                          </motion.button>
                        </div>

                        {/* Line total + remove */}
                        <div className="text-right flex-shrink-0 ml-auto">
                          <p className="font-black text-[#0F172A]">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
                          <motion.button
                            onClick={() => removeItem(item.id)}
                            whileHover={{ scale: 1.05 }}
                            className="text-rose-500 text-xs font-semibold hover:text-rose-700 mt-1 transition-colors"
                          >
                            Remove
                          </motion.button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {/* Right column — Order Summary + Payment */}
                <div className="lg:col-span-2 space-y-5">
                  {/* Order Summary */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    className="bg-white rounded-3xl border border-[#E2E8F0] shadow-sm p-6 sticky top-4"
                  >
                    <h3 className="text-lg font-bold text-[#0F172A] mb-6">Order Summary</h3>

                    <div className="space-y-1">
                      {items.map(item => (
                        <div key={item.id} className="flex justify-between py-2 border-b border-[#E2E8F0] text-sm text-[#475569]">
                          <span className="flex-1 truncate mr-2">{item.name} × {item.quantity}</span>
                          <span className="font-semibold text-[#0F172A] flex-shrink-0">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                        </div>
                      ))}

                      <div className="flex justify-between py-2 border-b border-[#E2E8F0] text-sm text-[#475569]">
                        <span>Subtotal</span>
                        <span>₹{subtotal.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-[#E2E8F0] text-sm text-[#475569]">
                        <span>GST (18%)</span>
                        <span>₹{Math.round(tax).toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    <div className="border-t-2 border-[#E2E8F0] my-4" />

                    <div className="flex justify-between items-center">
                      <span className="font-bold text-[#0F172A]">Total</span>
                      <span className="text-2xl font-black text-[#36a8cd]">
                        <motion.span
                          key={total}
                          initial={{ scale: 1.2, color: '#6366f1' }}
                          animate={{ scale: 1, color: 'inherit' }}
                          transition={{ type: 'spring', stiffness: 300 }}
                          className="inline-block"
                        >
                          ₹{Math.round(total).toLocaleString('en-IN')}
                        </motion.span>
                      </span>
                    </div>

                    {/* Checkout Section inside summary card */}
                    <CheckoutSection total={total} items={items} onSuccess={handleSuccess} />
                  </motion.div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CartPage;
