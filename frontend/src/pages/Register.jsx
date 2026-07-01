import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Cookies from 'js-cookie';

const EASE = [0.22, 1, 0.36, 1];
const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

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

  // OTP step
  const [step, setStep] = useState('form'); // 'form' | 'otp'
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpSending, setOtpSending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const otpRefs = useRef([]);
  const timerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => () => clearInterval(timerRef.current), []);

  const startCountdown = () => {
    setCountdown(60);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) return setError('Please enter your full name');
    if (!email.trim()) return setError('Please enter your email');
    if (password !== confirmPassword) return setError('Passwords do not match');
    if (password.length < 6) return setError('Password must be at least 6 characters');
    if (role === 'trainer' && trainerCode !== '9989') return setError('Invalid trainer sign up code');

    setOtpSending(true);
    try {
      const res = await fetch(`${API}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to send OTP');
      setOtp(['', '', '', '', '', '']);
      setStep('otp');
      startCountdown();
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err) {
      setError(err.message);
    } finally {
      setOtpSending(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      otpRefs.current[5]?.focus();
    }
  };

  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    setError('');
    const code = otp.join('');
    if (code.length < 6) return setError('Please enter the complete 6-digit OTP');

    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role, trainerCode, otp: code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Registration failed');
      Cookies.set('userInfo', JSON.stringify(data), { expires: 30 });
      navigate(`/${data.role}/dashboard`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setError('');
    setOtpSending(true);
    try {
      const res = await fetch(`${API}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to resend OTP');
      setOtp(['', '', '', '', '', '']);
      startCountdown();
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err) {
      setError(err.message);
    } finally {
      setOtpSending(false);
    }
  };

  const fields = [
    { label: 'Full Name', type: 'text', value: name, setter: setName, placeholder: 'Your full name', delay: 0.2 },
    { label: 'Email Address', type: 'email', value: email, setter: setEmail, placeholder: 'you@example.com', delay: 0.25 },
    { label: 'Password', type: showPassword ? 'text' : 'password', value: password, setter: setPassword, placeholder: '••••••••', delay: 0.3, isPassword: true },
    { label: 'Confirm Password', type: 'password', value: confirmPassword, setter: setConfirmPassword, placeholder: '••••••••', delay: 0.35 },
  ];

  return (
    <motion.div
      className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4 py-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
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
            🏋️
          </motion.div>
          <h1 className="text-2xl font-black text-[#0F172A] font-['Kanit']">Fitness Manager</h1>
          <AnimatePresence mode="wait">
            {step === 'form' ? (
              <motion.p key="subtitle-form" className="text-[#475569] text-sm mt-1"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                Create your account
              </motion.p>
            ) : (
              <motion.p key="subtitle-otp" className="text-[#475569] text-sm mt-1"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                Verify your email
              </motion.p>
            )}
          </AnimatePresence>
        </div>

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

        <AnimatePresence mode="wait">
          {/* ── STEP 1: Registration form ── */}
          {step === 'form' && (
            <motion.form
              key="form"
              onSubmit={handleSendOtp}
              className="space-y-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: EASE }}
            >
              {fields.map((field) => (
                <motion.div
                  key={field.label}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: field.delay, duration: 0.4, ease: EASE }}
                >
                  <label className="text-sm font-semibold text-[#0F172A] mb-1.5 block">{field.label}</label>
                  <div className="relative">
                    <input
                      type={field.type}
                      placeholder={field.placeholder}
                      required
                      value={field.value}
                      onChange={(e) => field.setter(e.target.value)}
                      className="w-full bg-white border border-[#E2E8F0] rounded-xl px-4 py-3 text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#36a8cd]/20 focus:border-[#36a8cd] transition-all text-sm"
                    />
                    {field.isPassword && (
                      <motion.button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#475569] transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        {showPassword ? '🙈' : '👁️'}
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              ))}

              {/* Role Selector */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.4, ease: EASE }}
              >
                <label className="text-sm font-semibold text-[#0F172A] mb-2 block">I am registering as</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'user', label: '🏃 Member' },
                    { key: 'trainer', label: '🏋️ Trainer' },
                  ].map(({ key, label }) => (
                    <motion.button
                      key={key}
                      type="button"
                      onClick={() => setRole(key)}
                      whileHover={{ scale: 1.03, y: -1 }}
                      whileTap={{ scale: 0.97 }}
                      className={`py-3.5 rounded-xl font-semibold text-sm border-2 transition-all duration-200 ${
                        role === key
                          ? 'border-[#36a8cd] bg-[#EFF9FD] text-[#36a8cd] shadow-sm'
                          : 'border-[#E2E8F0] text-[#475569] bg-white hover:border-[#36a8cd]/40'
                      }`}
                    >
                      {label}
                    </motion.button>
                  ))}
                </div>
              </motion.div>

              <AnimatePresence>
                {role === 'trainer' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, scale: 0.95 }}
                    animate={{ opacity: 1, height: 'auto', scale: 1 }}
                    exit={{ opacity: 0, height: 0, scale: 0.95 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 200 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <label className="text-sm font-semibold text-[#0F172A] mb-1.5 block">Trainer Access Code</label>
                    <input
                      type="text"
                      placeholder="Enter 4-digit code"
                      required
                      value={trainerCode}
                      onChange={(e) => setTrainerCode(e.target.value)}
                      className="w-full bg-white border border-[#E2E8F0] rounded-xl px-4 py-3 text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#36a8cd]/20 focus:border-[#36a8cd] transition-all text-sm"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                type="submit"
                disabled={otpSending}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.4, ease: EASE }}
                whileHover={{ scale: 1.02, boxShadow: '0 8px 25px rgba(54,168,205,0.4)' }}
                whileTap={{ scale: 0.98 }}
                className="w-full mt-2 py-3.5 rounded-xl font-semibold text-white text-base bg-[#36a8cd] hover:bg-[#2089ab] shadow-sm hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
              >
                {otpSending ? (
                  <div className="flex items-center justify-center gap-1.5">
                    {[0, 1, 2].map(i => (
                      <motion.span key={i} className="w-1.5 h-1.5 rounded-full bg-white"
                        animate={{ y: [0, -6, 0] }} transition={{ duration: 0.5, delay: i * 0.1, repeat: Infinity }} />
                    ))}
                  </div>
                ) : 'Send OTP'}
              </motion.button>
            </motion.form>
          )}

          {/* ── STEP 2: OTP verification ── */}
          {step === 'otp' && (
            <motion.form
              key="otp"
              onSubmit={handleVerifyAndRegister}
              className="space-y-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3, ease: EASE }}
            >
              {/* Info box */}
              <div className="bg-[#EFF9FD] border border-[#36a8cd]/30 rounded-2xl px-4 py-4 text-center">
                <div className="text-2xl mb-2">📧</div>
                <p className="text-[#0F172A] font-semibold text-sm">OTP sent to</p>
                <p className="text-[#36a8cd] font-bold text-sm mt-0.5 break-all">{email}</p>
                <p className="text-[#94A3B8] text-xs mt-1.5">Check your inbox (and spam folder)</p>
              </div>

              {/* 6-digit OTP boxes */}
              <div>
                <label className="text-sm font-semibold text-[#0F172A] mb-3 block text-center">Enter 6-digit OTP</label>
                <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <motion.input
                      key={i}
                      ref={el => otpRefs.current[i] = el}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleOtpChange(i, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(i, e)}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05, duration: 0.3, ease: EASE }}
                      className="w-11 h-13 text-center text-xl font-bold text-[#0F172A] bg-white border-2 border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#36a8cd] focus:ring-2 focus:ring-[#36a8cd]/20 transition-all"
                      style={{ height: '52px' }}
                    />
                  ))}
                </div>
              </div>

              {/* Resend */}
              <div className="text-center text-sm text-[#94A3B8]">
                {countdown > 0 ? (
                  <span>Resend OTP in <span className="text-[#36a8cd] font-bold">{countdown}s</span></span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={otpSending}
                    className="text-[#36a8cd] font-semibold hover:text-[#2089ab] transition-colors disabled:opacity-50"
                  >
                    {otpSending ? 'Sending…' : 'Resend OTP'}
                  </button>
                )}
              </div>

              <div className="flex gap-3">
                <motion.button
                  type="button"
                  onClick={() => { setStep('form'); setError(''); }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 py-3.5 rounded-xl font-semibold text-[#475569] text-sm bg-[#F1F5F9] hover:bg-[#E2E8F0] transition-all duration-200"
                >
                  ← Back
                </motion.button>
                <motion.button
                  type="submit"
                  disabled={loading || otp.join('').length < 6}
                  whileHover={{ scale: 1.02, boxShadow: '0 8px 25px rgba(54,168,205,0.4)' }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-2 flex-grow py-3.5 rounded-xl font-semibold text-white text-sm bg-[#36a8cd] hover:bg-[#2089ab] shadow-sm hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-1.5">
                      {[0, 1, 2].map(i => (
                        <motion.span key={i} className="w-1.5 h-1.5 rounded-full bg-white"
                          animate={{ y: [0, -6, 0] }} transition={{ duration: 0.5, delay: i * 0.1, repeat: Infinity }} />
                      ))}
                    </div>
                  ) : 'Verify & Create Account'}
                </motion.button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {step === 'form' && (
          <motion.p
            className="text-center text-[#475569] text-sm mt-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            Already have an account?{' '}
            <Link to="/login" className="text-[#36a8cd] font-semibold hover:text-[#2089ab] transition-colors">
              Sign in
            </Link>
          </motion.p>
        )}
      </motion.div>
    </motion.div>
  );
};

export default Register;
