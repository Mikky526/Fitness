import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';

const NavLink = ({ to, dark, label }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <Link
      to={to}
      className={`relative px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${dark ? 'text-white/80 hover:text-white' : 'text-[#475569] hover:text-[#36a8cd]'}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {label}
      <AnimatePresence>
        {hovered && (
          <motion.span
            className={`absolute bottom-0 left-2 right-2 h-0.5 rounded-full ${dark ? 'bg-white/60' : 'bg-[#36a8cd]'}`}
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            exit={{ scaleX: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
          />
        )}
      </AnimatePresence>
    </Link>
  );
};

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
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
          ? 'bg-white/95 backdrop-blur-xl shadow-sm border-b border-[#E2E8F0]'
          : 'bg-gradient-to-br from-[#0A0F1E] via-[#0F172A] to-[#0D1B26]'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex justify-between items-center">
        {/* Logo */}
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Link
            to="/"
            className={`flex items-center gap-2.5 text-[1.2rem] font-extrabold tracking-tight ${
              dark ? 'text-white' : 'text-[#0F172A]'
            }`}
          >
            <motion.span
              animate={{ rotate: [0, -8, 8, 0] }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 4 }}
              className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#36a8cd] to-[#2089ab] flex items-center justify-center shadow-md shadow-[#36a8cd]/30 flex-shrink-0"
            >
              <span className="text-base leading-none">💪</span>
            </motion.span>
            <span
              className="font-['Kanit'] font-bold"
              style={dark ? {
                backgroundImage: 'linear-gradient(90deg, #66CCE0, #A5F3FC, #66CCE0)',
                backgroundSize: '200% auto',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              } : { color: '#0F172A' }}
            >
              Fitness Manager
            </span>
          </Link>
        </motion.div>

        {/* Desktop Nav */}
        <div className="hidden sm:flex items-center gap-2">
          {user && user.role === 'trainer' && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            >
              <NavLink to="/diet-plan" dark={dark} label="AI Diet" />
            </motion.div>
          )}

          {user?.role === 'user' && (
            <>
              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              >
                 <NavLink to="/shop" dark={dark} label="Choose Your Plan" />
              </motion.div>
            </>
          )}

          {user ? (
            <>
              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border ${
                  dark
                    ? 'bg-white/10 border-white/20 text-white/90'
                    : 'bg-[#EFF9FD] border-[#36a8cd]/20 text-[#475569]'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                <span className="max-w-[140px] truncate">{user.email}</span>
              </motion.div>

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
                      : 'bg-rose-50 text-rose-500 border-rose-200 hover:bg-rose-100'
                  }`}
                >
                  Logout
                </motion.button>
              </motion.div>
            </>
          ) : (
            <>
              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              >
                <NavLink to="/login" dark={dark} label="Sign In" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ scale: 1.05, boxShadow: '0 8px 25px rgba(54,168,205,0.4)' }}
                whileTap={{ scale: 0.97 }}
              >
                <Link
                  to="/register"
                  className={`px-5 py-2 rounded-xl font-bold text-sm transition-all shadow-sm block ${
                    dark
                      ? 'bg-[#36a8cd] text-white hover:bg-[#2089ab]'
                      : 'bg-[#36a8cd] text-white hover:bg-[#2089ab]'
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
            dark ? 'text-white hover:bg-white/10' : 'text-[#475569] hover:bg-[#F1F5F9]'
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
          className="h-[2px] bg-gradient-to-r from-[#36a8cd] to-[#2089ab]"
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
            className="sm:hidden bg-white border-t border-[#E2E8F0] px-4 pb-5 pt-2 space-y-1 overflow-hidden shadow-md"
          >
            {user?.role === 'user' && (
              <>
                <Link
                  to="/shop"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[#475569] font-semibold text-sm hover:bg-[#EFF9FD] hover:text-[#36a8cd] transition-colors"
                >
                  Choose Your Plan
                </Link>
              </>
            )}

            {user ? (
              <>
                {user.role === 'trainer' && (
                  <Link
                    to="/diet-plan"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2.5 rounded-xl text-[#475569] font-semibold text-sm hover:bg-[#EFF9FD] hover:text-[#36a8cd] transition-colors"
                  >
                    AI Diet
                  </Link>
                )}
                <div className="flex items-center gap-2 px-4 py-2 mt-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                  <span className="text-sm text-[#36a8cd] font-medium truncate">{user.email}</span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2.5 rounded-xl bg-rose-50 text-rose-500 font-semibold text-sm border border-rose-100 hover:bg-rose-100 transition-colors"
                >
                  Logout
                </motion.button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-2.5 rounded-xl text-[#475569] font-semibold text-sm hover:bg-[#EFF9FD] hover:text-[#36a8cd] transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-2.5 rounded-xl bg-[#36a8cd] text-white font-bold text-sm text-center shadow-sm hover:bg-[#2089ab] transition-colors"
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
