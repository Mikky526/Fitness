import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import Cookies from 'js-cookie';
import { AuthContext } from '../context/AuthContext';

const EASE = [0.22, 1, 0.36, 1];
const SPRING = { type: 'spring', damping: 20, stiffness: 300 };

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('user');
  const [trainerCode, setTrainerCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (role === 'trainer' && trainerCode !== '9989') {
      setError('Invalid trainer sign up code');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5001/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role, trainerCode }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Registration failed');
      Cookies.set('userInfo', JSON.stringify(data), { expires: 30 });
      navigate(`/${data.role}/dashboard`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { label: 'Full Name', type: 'text', value: name, setter: setName, placeholder: 'Name', delay: 0.3 },
    { label: 'Email Address', type: 'email', value: email, setter: setEmail, placeholder: 'Name@example.com', delay: 0.4 },
    { label: 'Password', type: showPassword ? 'text' : 'password', value: password, setter: setPassword, placeholder: '••••••••', delay: 0.5, isPassword: true },
    { label: 'Confirm Password', type: 'password', value: confirmPassword, setter: setConfirmPassword, placeholder: '••••••••', delay: 0.6 },
  ];

  return (
    <motion.div
      className="min-h-screen flex relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Page-level animated gradient background noise */}
      <motion.div
        className="fixed inset-0 -z-10"
        animate={{
          background: [
            'radial-gradient(ellipse at 20% 50%, rgba(99,102,241,0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(139,92,246,0.06) 0%, transparent 40%)',
            'radial-gradient(ellipse at 60% 80%, rgba(99,102,241,0.08) 0%, transparent 50%), radial-gradient(ellipse at 20% 30%, rgba(139,92,246,0.06) 0%, transparent 40%)',
            'radial-gradient(ellipse at 20% 50%, rgba(99,102,241,0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(139,92,246,0.06) 0%, transparent 40%)',
          ],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Left Panel */}
      <motion.div
        className="hidden md:flex flex-col justify-between w-[45%] bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-900 p-12 relative overflow-hidden"
        initial={{ x: -60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: EASE }}
      >
        {/* Decorative blobs — swapped colors vs Login, upgraded animation */}
        <motion.div
          className="absolute -top-24 -right-24 w-64 h-64 bg-purple-500 rounded-full opacity-10 blur-3xl pointer-events-none"
          animate={{ scale: [1, 1.3, 0.9, 1.2, 1], x: [0, 30, -20, 10, 0], opacity: [0.1, 0.2, 0.08, 0.18, 0.1] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-20 -left-20 w-56 h-56 bg-indigo-500 rounded-full opacity-10 blur-3xl pointer-events-none"
          animate={{ scale: [1, 1.3, 0.9, 1.2, 1], x: [0, 30, -20, 10, 0], opacity: [0.1, 0.2, 0.08, 0.18, 0.1] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
        />

        {/* Top: logo + brand */}
        <div className="relative z-10">
          {/* Logo mark */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5, ease: EASE }}
          >
            <motion.div
              className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-400 to-purple-600 flex items-center justify-center text-4xl shadow-2xl mb-8"
              animate={{ rotate: [0, -5, 5, 0] }}
              transition={{ duration: 4, repeat: Infinity, repeatDelay: 3 }}
            >
              🏋️
            </motion.div>
          </motion.div>

          {/* Title */}
          <motion.h2
            className="text-3xl font-black text-white"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5, ease: EASE }}
          >
            Fitness Manager
          </motion.h2>

          {/* Tagline */}
          <motion.p
            className="text-indigo-300 text-sm mt-2 mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5, ease: EASE }}
          >
            Join thousands of fitness enthusiasts today.
          </motion.p>

          {/* Feature list — upgraded per-item stagger + check icon hover */}
          <div className="space-y-4">
            {[
              'Set & achieve your fitness goals',
              'Track progress with visual insights',
              'Book sessions with certified trainers',
            ].map((item, i) => (
              <motion.div
                key={i}
                className="flex items-center gap-3 text-white text-sm font-medium"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.15, type: 'spring', stiffness: 100 }}
              >
                <motion.span
                  className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0"
                  whileHover={{ scale: 1.2, rotate: 10 }}
                  transition={{ type: 'spring', stiffness: 500 }}
                >
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </motion.span>
                {item}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom card */}
        <motion.div
          className="relative z-10 bg-white/10 border border-white/20 rounded-2xl p-4 mt-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5, ease: EASE }}
        >
          <p className="text-indigo-100 text-sm leading-relaxed italic">
            "Whether you're a member chasing goals or a trainer building a client base — this is your platform."
          </p>
          <p className="text-indigo-300 text-xs font-semibold mt-2">— Fitness Manager Team</p>
        </motion.div>
      </motion.div>

      {/* Right Panel */}
      <motion.div
        className="flex-1 bg-white flex items-center justify-center overflow-y-auto relative"
        initial={{ x: 60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: EASE }}
      >
        {/* Moving orb background */}
        <motion.div
          className="absolute w-64 h-64 rounded-full bg-gradient-to-br from-indigo-200/30 to-purple-200/30 blur-3xl pointer-events-none"
          animate={{ x: [0, 40, -20, 30, 0], y: [0, -30, 40, -10, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          style={{ top: '20%', left: '10%' }}
        />

        {/* Decorative animated accent lines */}
        <motion.div
          className="absolute top-0 right-0 w-px h-32 bg-gradient-to-b from-transparent via-indigo-300 to-transparent opacity-40"
          animate={{ scaleY: [0, 1, 0], opacity: [0, 0.4, 0] }}
          transition={{ duration: 3, repeat: Infinity, delay: 1 }}
        />
        <motion.div
          className="absolute bottom-0 left-0 w-px h-24 bg-gradient-to-t from-transparent via-purple-300 to-transparent opacity-30"
          animate={{ scaleY: [0, 1, 0], opacity: [0, 0.3, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, delay: 2 }}
        />

        <div className="w-full max-w-md px-8 py-12 relative z-10">

          {/* Top accent line */}
          <motion.div
            className="h-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full mb-8"
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ delay: 0.3, duration: 0.5, ease: EASE }}
            style={{ originX: 0 }}
          />

          {/* Caption */}
          <motion.p
            className="text-indigo-600 font-semibold text-sm mb-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4, ease: EASE }}
          >
            Join thousands of fitness enthusiasts
          </motion.p>

          {/* Title */}
          <motion.h2
            className="text-3xl font-black text-gray-900 mb-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4, ease: EASE }}
          >
            Create your account
          </motion.h2>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                className="bg-rose-50 border border-rose-100 text-rose-600 rounded-xl px-4 py-3 text-sm mb-4 flex items-center gap-2"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: [0, -8, 8, -4, 4, 0] }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.4 }}
              >
                <span className="text-base">⚠️</span> {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map((field) => (
              <motion.div
                key={field.label}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: field.delay, duration: 0.4, ease: EASE }}
              >
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">{field.label}</label>
                <motion.div
                  className="relative"
                  whileFocusWithin={{ scale: 1.01 }}
                  transition={{ duration: 0.15 }}
                >
                  <input
                    type={field.type}
                    placeholder={field.placeholder}
                    required
                    value={field.value}
                    onChange={(e) => field.setter(e.target.value)}
                    className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all text-sm w-full"
                  />
                  {field.isPassword && (
                    <motion.button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      {showPassword ? '🙈' : '👁️'}
                    </motion.button>
                  )}
                </motion.div>
              </motion.div>
            ))}

            {/* Role Selector — upgraded dramatic transition */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.4, ease: EASE }}
            >
              <label className="text-sm font-semibold text-gray-700 mb-2 block">I am registering as</label>
              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  type="button"
                  onClick={() => setRole('user')}
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  animate={role === 'user' ? {
                    boxShadow: '0 0 0 2px #6366f1, 0 8px 25px rgba(99,102,241,0.3)',
                  } : { boxShadow: '0 0 0 2px transparent' }}
                  transition={{ duration: 0.3 }}
                  className={`py-4 rounded-2xl font-bold text-sm border-2 transition-colors duration-200 relative overflow-hidden ${
                    role === 'user'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 text-gray-600 bg-white'
                  }`}
                >
                  {role === 'user' && (
                    <motion.div
                      layoutId="roleSelector"
                      className="absolute inset-0 bg-indigo-100/60 rounded-2xl"
                      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                    />
                  )}
                  <span className="relative z-10">🏃 Member</span>
                </motion.button>
                <motion.button
                  type="button"
                  onClick={() => setRole('trainer')}
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  animate={role === 'trainer' ? {
                    boxShadow: '0 0 0 2px #a855f7, 0 8px 25px rgba(168,85,247,0.3)',
                  } : { boxShadow: '0 0 0 2px transparent' }}
                  transition={{ duration: 0.3 }}
                  className={`py-4 rounded-2xl font-bold text-sm border-2 transition-colors duration-200 relative overflow-hidden ${
                    role === 'trainer'
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 text-gray-600 bg-white'
                  }`}
                >
                  {role === 'trainer' && (
                    <motion.div
                      layoutId="roleSelector"
                      className="absolute inset-0 bg-purple-100/60 rounded-2xl"
                      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                    />
                  )}
                  <span className="relative z-10">🏋️ Trainer</span>
                </motion.button>
              </div>
            </motion.div>

            {/* Trainer Code — more dramatic reveal */}
            <AnimatePresence>
              {role === 'trainer' && (
                <motion.div
                  initial={{ opacity: 0, height: 0, scale: 0.95 }}
                  animate={{ opacity: 1, height: 'auto', scale: 1 }}
                  exit={{ opacity: 0, height: 0, scale: 0.95 }}
                  transition={{ type: 'spring', damping: 20, stiffness: 200 }}
                  style={{ overflow: 'hidden' }}
                >
                  <motion.div
                    whileFocusWithin={{ scale: 1.01 }}
                    transition={{ duration: 0.15 }}
                  >
                    <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Trainer Access Code</label>
                    <input
                      type="text"
                      placeholder="Enter 4-digit code"
                      required
                      value={trainerCode}
                      onChange={(e) => setTrainerCode(e.target.value)}
                      className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all text-sm w-full"
                    />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit — glow pulse */}
            <motion.button
              type="submit"
              disabled={loading}
              initial={{ opacity: 0, y: 10 }}
              animate={{
                opacity: 1,
                y: 0,
                boxShadow: [
                  '0 4px 15px rgba(99,102,241,0.3)',
                  '0 4px 25px rgba(139,92,246,0.5)',
                  '0 4px 15px rgba(99,102,241,0.3)',
                ],
              }}
              transition={{
                opacity: { delay: 0.75, duration: 0.4, ease: EASE },
                y: { delay: 0.75, duration: 0.4, ease: EASE },
                boxShadow: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' },
              }}
              whileHover={{
                scale: 1.03,
                boxShadow: '0 0 0 0px rgba(99,102,241,0.4), 0 15px 35px rgba(99,102,241,0.5)',
              }}
              whileTap={{ scale: 0.97 }}
              className="w-full mt-1 py-4 rounded-2xl font-extrabold text-white text-base bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg shadow-indigo-200/50 hover:shadow-xl hover:shadow-indigo-300/50 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.98]"
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
              ) : 'Create Account'}
            </motion.button>
          </form>

          <motion.p
            className="text-center text-gray-500 text-sm mt-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-600 font-semibold hover:text-purple-600 transition-colors">
              Sign in
            </Link>
          </motion.p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Register;
