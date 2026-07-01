import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';

const EASE = [0.22, 1, 0.36, 1];

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.success) {
      if (result.role === 'user' && result.firstLogin) {
        navigate('/shop');
      } else {
        navigate(`/${result.role}/dashboard`);
      }
    } else {
      setError(result.message);
    }
  };

  return (
    <motion.div
      className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4 py-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#36a8cd] rounded-full opacity-[0.04] blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-[#36a8cd] rounded-full opacity-[0.04] blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: EASE }}
        className="bg-white rounded-3xl shadow-xl border border-[#E2E8F0] p-10 max-w-md w-full relative z-10"
      >
        {/* Brand header */}
        <div className="text-center mb-8">
          <motion.div
            animate={{ rotate: [0, -5, 5, 0] }}
            transition={{ duration: 4, repeat: Infinity, repeatDelay: 3 }}
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#36a8cd] to-[#2089ab] flex items-center justify-center text-3xl shadow-lg shadow-[#36a8cd]/25 mx-auto mb-4"
          >
            💪
          </motion.div>
          <h1 className="text-2xl font-black text-[#0F172A] font-['Kanit']">Fitness Manager</h1>
          <p className="text-[#475569] text-sm mt-1">Sign in to your account</p>
        </div>

        {/* Top accent bar */}
        <motion.div
          className="h-1 bg-gradient-to-r from-[#36a8cd] to-[#2089ab] rounded-full mb-8"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.3, duration: 0.5, ease: EASE }}
          style={{ originX: 0 }}
        />

        <AnimatePresence>
          {error && (
            <motion.div
              className="bg-[#FEF2F2] border border-[#FCA5A5] text-[#EF4444] rounded-xl px-4 py-3 text-sm mb-5 flex items-center gap-2"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: [0, -8, 8, -4, 4, 0] }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4 }}
            >
              <span className="text-base">⚠️</span> {error}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-5">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4, ease: EASE }}
          >
            <label className="text-sm font-semibold text-[#0F172A] mb-1.5 block">Email Address</label>
            <input
              type="email"
              placeholder="you@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white border border-[#E2E8F0] rounded-xl px-4 py-3 text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#36a8cd]/20 focus:border-[#36a8cd] transition-all text-sm"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4, ease: EASE }}
          >
            <label className="text-sm font-semibold text-[#0F172A] mb-1.5 block">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white border border-[#E2E8F0] rounded-xl px-4 py-3 pr-12 text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#36a8cd]/20 focus:border-[#36a8cd] transition-all text-sm"
              />
              <motion.button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#475569] transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                {showPassword ? '🙈' : '👁️'}
              </motion.button>
            </div>
          </motion.div>

          <motion.button
            type="submit"
            disabled={loading}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4, ease: EASE }}
            whileHover={{ scale: 1.02, boxShadow: '0 8px 25px rgba(54,168,205,0.4)' }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3.5 rounded-xl font-semibold text-white text-base bg-[#36a8cd] hover:bg-[#2089ab] shadow-sm hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-1.5">
                {[0, 1, 2].map(i => (
                  <motion.span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-white"
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 0.5, delay: i * 0.1, repeat: Infinity }}
                  />
                ))}
              </div>
            ) : 'Sign In'}
          </motion.button>
        </form>

        <motion.p
          className="text-center text-[#475569] text-sm mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Don't have an account?{' '}
          <Link to="/register" className="text-[#36a8cd] font-semibold hover:text-[#2089ab] transition-colors">
            Sign up
          </Link>
        </motion.p>
      </motion.div>
    </motion.div>
  );
};

export default Login;
