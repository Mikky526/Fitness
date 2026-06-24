import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const NavLink = ({ to, dark, label }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <Link
      to={to}
      className={`relative px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${dark ? 'text-white/80 hover:text-white' : 'text-gray-600 hover:text-indigo-600'}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {label}
      <AnimatePresence>
        {hovered && (
          <motion.span
            className={`absolute bottom-0 left-2 right-2 h-0.5 rounded-full ${dark ? 'bg-white/60' : 'bg-indigo-500'}`}
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            exit={{ scaleX: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </AnimatePresence>
    </Link>
  );
};

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { count } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
  };

  const dark = !scrolled;

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-xl shadow-lg border-b border-gray-100/80'
          : 'bg-gradient-to-r from-slate-900 via-indigo-900 to-purple-900'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex justify-between items-center">
        {/* Logo */}
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Link
            to="/"
            className={`flex items-center gap-2.5 text-[1.2rem] font-extrabold tracking-tight ${
              dark ? 'text-white' : 'text-indigo-700'
            }`}
          >
            {/* Gradient icon box */}
            <motion.span
              animate={{ rotate: [0, -8, 8, 0] }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 4 }}
              className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/30 flex-shrink-0"
            >
              <span className="text-base leading-none">
                💪
              </span>
            </motion.span>
            {/* Animated gradient logo text */}
            <motion.span
              style={{
                backgroundImage: 'linear-gradient(90deg, #6366f1, #a855f7, #ec4899, #6366f1)',
                backgroundSize: '200% auto',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: dark ? 'transparent' : undefined,
                backgroundClip: dark ? 'text' : undefined,
                color: dark ? 'transparent' : undefined,
              }}
              animate={dark ? { backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] } : {}}
              transition={{ duration: 5, repeat: Infinity }}
            >
              Fitness Manager
            </motion.span>
          </Link>
        </motion.div>

        {/* Desktop Nav */}
        <div className="hidden sm:flex items-center gap-2">
          {user?.role === 'user' && (
            <>
              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              >
                <NavLink to="/shop" dark={dark} label="🛍️ Shop" />
              </motion.div>

              {/* Cart icon */}
              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
              >
                <Link to="/cart">
                  <motion.div
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl font-semibold text-sm transition-all ${
                      dark
                        ? 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
                        : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100'
                    }`}
                  >
                    🛒
                    <AnimatePresence>
                      {count > 0 && (
                        <motion.span
                          key={count}
                          initial={{ scale: 0.4, opacity: 0 }}
                          animate={{ scale: [1, 1.3, 1], opacity: 1 }}
                          exit={{ scale: 0.4, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold flex items-center justify-center shadow-md"
                        >
                          {count > 9 ? '9+' : count}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </Link>
              </motion.div>
            </>
          )}

          {user ? (
            <>
              {/* User email pill */}
              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border ${
                  dark
                    ? 'bg-white/10 border-white/20 text-white/90'
                    : 'bg-indigo-50 border-indigo-100 text-indigo-700'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                <span className="max-w-[140px] truncate">{user.email}</span>
              </motion.div>

              {/* Logout button */}
              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
              >
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={handleLogout}
                  className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all border ${
                    dark
                      ? 'bg-white/15 hover:bg-white/25 text-white border-white/20'
                      : 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100'
                  }`}
                >
                  Logout
                </motion.button>
              </motion.div>
            </>
          ) : (
            <>
              {/* Sign In */}
              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              >
                <NavLink to="/login" dark={dark} label="Sign In" />
              </motion.div>

              {/* Sign Up */}
              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ scale: 1.05, boxShadow: '0 8px 25px rgba(99,102,241,0.4)' }}
                whileTap={{ scale: 0.97 }}
              >
                <Link
                  to="/register"
                  className={`px-5 py-2 rounded-xl font-bold text-sm transition-all shadow-md block ${
                    dark
                      ? 'bg-white text-indigo-700 hover:bg-indigo-50'
                      : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg hover:shadow-indigo-200/50'
                  }`}
                >
                  Sign Up
                </Link>
              </motion.div>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className={`sm:hidden p-2 rounded-xl transition-colors ${
            dark ? 'text-white hover:bg-white/10' : 'text-gray-700 hover:bg-gray-100'
          }`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </div>

      {/* Animated scroll indicator line */}
      {scrolled && (
        <motion.div
          className="h-[2px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          style={{ transformOrigin: 'left' }}
        />
      )}

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="sm:hidden bg-white/95 backdrop-blur-xl border-t border-gray-100/80 px-4 pb-5 pt-2 space-y-1 overflow-hidden shadow-lg"
          >
            {user?.role === 'user' && (
              <>
                <Link
                  to="/shop"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-gray-700 font-semibold text-sm hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                >
                  🛍️ Shop
                </Link>
                <Link
                  to="/cart"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-between px-4 py-2.5 rounded-xl text-gray-700 font-semibold text-sm hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                >
                  <span>🛒 Cart</span>
                  {count > 0 && (
                    <span className="w-6 h-6 rounded-full bg-rose-500 text-white text-xs font-extrabold flex items-center justify-center shadow-sm">
                      {count}
                    </span>
                  )}
                </Link>
              </>
            )}

            {user ? (
              <>
                <div className="flex items-center gap-2 px-4 py-2 mt-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                  <span className="text-sm text-indigo-700 font-medium truncate">{user.email}</span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2.5 rounded-xl bg-rose-50 text-rose-600 font-semibold text-sm border border-rose-100 hover:bg-rose-100 transition-colors"
                >
                  Logout
                </motion.button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-2.5 rounded-xl text-gray-700 font-semibold text-sm hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-sm text-center shadow-md shadow-indigo-200/50"
                >
                  Sign Up
                </Link>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
