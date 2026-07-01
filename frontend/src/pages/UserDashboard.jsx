import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring, useInView } from 'framer-motion';
import axios from 'axios';
import Cookies from 'js-cookie';

const API = import.meta.env.VITE_API_URL || 'https://fitness-nmmf.onrender.com/api';

const getAuth = () => {
  const info = Cookies.get('userInfo');
  if (!info) return { headers: {} };
  return { headers: { Authorization: `Bearer ${JSON.parse(info).token}` } };
};

const getUserInfo = () => {
  try { return JSON.parse(Cookies.get('userInfo') || '{}'); } catch { return {}; }
};

// ─── Tab constants ───────────────────────────────────────────────────────────
const TABS = [
  { key: 'overview',     label: 'Overview',      icon: '📊' },
  { key: 'find-trainer', label: 'Find Trainer',  icon: '🔍' },
  { key: 'my-trainer',   label: 'My Trainer',    icon: '🤝' },
  { key: 'exercises',    label: 'My Exercises',  icon: '🏋️' },
  { key: 'diet-plans',   label: 'Diet Plans',    icon: '🥗' },
  { key: 'profile',      label: 'My Profile',    icon: '👤' },
];

// ─── FloatingParticles ───────────────────────────────────────────────────────
const FloatingParticles = ({ count = 12, className = '' }) => (
  <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
    {Array.from({ length: count }).map((_, i) => {
      const colors = ['bg-[#33B8D4]', 'bg-[#66CCE0]', 'bg-cyan-300', 'bg-blue-300'];
      const size = 2 + Math.random() * 5;
      return (
        <motion.div
          key={i}
          className={`absolute rounded-full opacity-20 ${colors[i % colors.length]}`}
          style={{ width: size, height: size, left: `${(i * 7 + 5) % 95}%`, top: `${(i * 13 + 10) % 85}%` }}
          animate={{ y: [0, -(15 + i * 3), 0, 10, 0], x: [0, i % 2 === 0 ? 12 : -12, 0], opacity: [0.1, 0.4, 0.15, 0.4, 0.1], scale: [1, 1.3, 0.9, 1] }}
          transition={{ duration: 6 + i * 0.7, repeat: Infinity, ease: 'easeInOut', delay: i * 0.3 }}
        />
      );
    })}
  </div>
);

// ─── TiltCard (3D perspective hover) ─────────────────────────────────────────
const TiltCard = ({ children, className = '' }) => {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotateX = useTransform(my, [-50, 50], [5, -5]);
  const rotateY = useTransform(mx, [-50, 50], [-5, 5]);
  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    mx.set(e.clientX - r.left - r.width / 2);
    my.set(e.clientY - r.top - r.height / 2);
  };
  const onLeave = () => { mx.set(0); my.set(0); };
  return (
    <motion.div
      style={{ rotateX, rotateY, transformPerspective: 800 }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      whileHover={{ scale: 1.03, zIndex: 10 }}
      transition={{ type: 'spring', stiffness: 250, damping: 22 }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// ─── SpringCounter ────────────────────────────────────────────────────────────
const SpringCounter = ({ value }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const num = parseInt(String(value).replace(/\D/g, ''), 10) || 0;
  const suffix = String(value).replace(/[0-9]/g, '');
  const spring = useSpring(0, { stiffness: 35, damping: 8 });
  const display = useTransform(spring, (v) => Math.round(v).toLocaleString() + suffix);
  useEffect(() => { if (inView) spring.set(num); }, [inView]);
  return <motion.span ref={ref}>{display}</motion.span>;
};

// ─── StatCard ─────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, icon, gradient, bg, border, bar }) => (
  <TiltCard>
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      animate={{
        boxShadow: [
          '0 1px 3px rgba(0,0,0,0.05)',
          '0 4px 15px rgba(99,102,241,0.1)',
          '0 1px 3px rgba(0,0,0,0.05)',
        ],
      }}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      className="bg-white rounded-3xl p-6 border border-[#E2E8F0] shadow-sm overflow-hidden relative"
    >
      <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full bg-gradient-to-br ${gradient} opacity-5`} />
      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-xl shadow-md`}>
        {icon}
      </div>
      <motion.h3
        whileInView={{ scale: [0.8, 1.05, 1] }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="text-3xl font-black text-[#36a8cd] mt-4"
      >
        <SpringCounter value={value} />
      </motion.h3>
      <p className="text-sm text-gray-500 font-medium mt-1">{label}</p>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden mt-4">
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${gradient}`}
          initial={{ width: 0 }}
          whileInView={{ width: bar }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </motion.div>
  </TiltCard>
);

// ─── Stagger variants for stat grid ──────────────────────────────────────────
const statGridVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

// ─── Overview Tab ─────────────────────────────────────────────────────────────
const OverviewTab = ({ userName, quote, quoteLoading }) => {
  const stats = [
    { label: 'Active Streak',  value: '3 Days', icon: '🔥', gradient: 'from-orange-400 to-rose-500',  bg: 'from-orange-50 to-rose-50',   border: 'border-orange-100',  bar: '43%' },
    { label: 'Workouts Done',  value: '12',     icon: '💪', gradient: 'from-[#36a8cd] to-[#2089ab]', bg: 'from-[#EFF9FD] to-[#D0EEF8]', border: 'border-[#36a8cd]/20', bar: '60%' },
    { label: 'Total Time',     value: '4h 30m', icon: '⏱️', gradient: 'from-emerald-400 to-teal-500', bg: 'from-emerald-50 to-teal-50',  border: 'border-emerald-100', bar: '75%' },
  ];
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-5"
        variants={statGridVariants}
        initial="hidden"
        animate="visible"
      >
        {stats.map((s, i) => <StatCard key={i} {...s} />)}
      </motion.div>

      {/* Quote */}
      <div className="bg-[#EFF9FD] border-l-4 border-[#36a8cd] rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-3 right-4 text-7xl opacity-5 font-serif leading-none select-none">"</div>
        <div className="flex items-center gap-2 mb-4">
          <span className="w-2 h-2 rounded-full bg-[#36a8cd] animate-pulse" />
          <span className="text-xs font-bold text-[#36a8cd] uppercase tracking-wide">Daily Motivation · DummyJSON API</span>
        </div>
        {quoteLoading ? (
          <div className="space-y-2">
            <motion.div
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="h-4 rounded-lg bg-[#36a8cd]/20 w-4/5"
            />
            <motion.div
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
              className="h-4 rounded-lg bg-[#36a8cd]/20 w-2/3"
            />
          </div>
        ) : quote ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p className="text-gray-700 text-lg font-medium leading-relaxed italic mb-3">"{quote.quote}"</p>
            <p className="text-[#36a8cd] font-semibold text-sm">— {quote.author}</p>
          </motion.div>
        ) : null}
      </div>
    </motion.div>
  );
};

// ─── Trainer card stagger variants ───────────────────────────────────────────
const trainerContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const trainerCardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

// ─── Find Trainer Tab ─────────────────────────────────────────────────────────
const FindTrainerTab = ({ myTrainer, onSelect }) => {
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(null);

  useEffect(() => {
    axios.get(`${API}/trainers`, getAuth())
      .then(r => setTrainers(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSelect = async (trainer) => {
    setSelecting(trainer._id);
    try {
      await axios.put(`${API}/trainers/select/${trainer._id}`, {}, getAuth());
      onSelect(trainer);
    } catch (err) {
      console.error(err);
    } finally {
      setSelecting(null);
    }
  };

  if (loading) return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[1,2,3,4].map(i => (
        <motion.div
          key={i}
          className="h-32 rounded-2xl overflow-hidden relative bg-gray-100"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent"
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear', delay: i * 0.2 }}
          />
        </motion.div>
      ))}
    </div>
  );

  if (trainers.length === 0) return (
    <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-sm p-16 text-center">
      <div className="text-5xl mb-4">🔍</div>
      <p className="text-[#0F172A] font-bold text-lg mb-1">No trainers available yet</p>
      <p className="text-[#475569] text-sm">Check back soon — new trainers are being added.</p>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <p className="text-sm text-gray-500 font-medium px-1">
        {trainers.length} trainer{trainers.length !== 1 ? 's' : ''} available — choose one to get started.
      </p>
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
        variants={trainerContainerVariants}
        initial="hidden"
        animate="visible"
      >
        {trainers.map((t, i) => {
          const isSelected = myTrainer?._id === t._id;
          return (
            <TiltCard key={t._id}>
              <motion.div
                variants={trainerCardVariants}
                className={`bg-white rounded-2xl p-5 border transition-all duration-200 ${
                  isSelected
                    ? 'border-[#36a8cd] shadow-md shadow-[#36a8cd]/15'
                    : 'border-[#E2E8F0] shadow-sm hover:border-[#36a8cd]/30'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <motion.div
                      animate={{
                        boxShadow: [
                          '0 4px 15px rgba(54,168,205,0.2)',
                          '0 8px 30px rgba(54,168,205,0.4)',
                          '0 4px 15px rgba(54,168,205,0.2)',
                        ],
                      }}
                      transition={{ duration: 2.5, repeat: Infinity }}
                      className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#36a8cd] to-[#2089ab] flex items-center justify-center text-white text-lg font-black flex-shrink-0"
                    >
                      {t.name?.charAt(0).toUpperCase()}
                    </motion.div>
                    <div>
                      <p className="text-base font-bold text-[#0F172A]">{t.name}</p>
                      <p className="text-xs text-[#94A3B8] mt-0.5">{t.email}</p>
                      {t.specialization && (
                        <span className="inline-flex items-center mt-1.5 text-xs font-bold px-2.5 py-1 rounded-full border bg-[#EFF9FD] text-[#36a8cd] border-[#36a8cd]/20">
                          {t.specialization}
                        </span>
                      )}
                    </div>
                  </div>

                  {isSelected ? (
                    <span className="flex-shrink-0 text-xs font-bold px-2.5 py-1 rounded-full border inline-flex items-center gap-1 bg-[#EFF9FD] text-[#36a8cd] border-[#36a8cd]/20">
                      ✓ My Trainer
                    </span>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => handleSelect(t)}
                      disabled={selecting === t._id}
                      className="flex-shrink-0 bg-gradient-to-r from-[#36a8cd] to-[#2089ab] text-white text-sm font-bold px-4 py-2 rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-60"
                    >
                      {selecting === t._id ? (
                        <span className="flex items-center gap-1.5">
                          <motion.span
                            animate={{ rotate: 360 }}
                            transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
                            className="block w-3.5 h-3.5 border-2 border-white/50 border-t-white rounded-full"
                          />
                          Selecting
                        </span>
                      ) : 'Select Trainer'}
                    </motion.button>
                  )}
                </div>
              </motion.div>
            </TiltCard>
          );
        })}
      </motion.div>
    </motion.div>
  );
};

// ─── My Trainer Tab (Chat + Appointment) ─────────────────────────────────────
const MyTrainerTab = ({ myTrainer }) => {
  const userInfo = getUserInfo();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [msgLoading, setMsgLoading] = useState(true);
  const [aptDate, setAptDate] = useState('');
  const [aptNotes, setAptNotes] = useState('');
  const [aptLoading, setAptLoading] = useState(false);
  const [aptSuccess, setAptSuccess] = useState(false);
  const [myApts, setMyApts] = useState([]);
  const [section, setSection] = useState('chat');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!myTrainer) return;
    axios.get(`${API}/messages/${myTrainer._id}`, getAuth())
      .then(r => setMessages(r.data))
      .catch(() => {})
      .finally(() => setMsgLoading(false));

    axios.get(`${API}/appointments`, getAuth())
      .then(r => setMyApts(r.data))
      .catch(() => {});
  }, [myTrainer]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    try {
      const res = await axios.post(`${API}/messages`, { recipientId: myTrainer._id, content: newMessage }, getAuth());
      setMessages(prev => [...prev, res.data]);
      setNewMessage('');
    } catch (err) { console.error(err); }
  };

  const bookAppointment = async (e) => {
    e.preventDefault();
    setAptLoading(true);
    setAptSuccess(false);
    try {
      const apt = await axios.post(`${API}/appointments`, { trainer: myTrainer._id, date: aptDate, notes: aptNotes }, getAuth());
      setMyApts(prev => [apt.data, ...prev]);
      setAptDate('');
      setAptNotes('');
      setAptSuccess(true);
      setTimeout(() => setAptSuccess(false), 3000);
    } catch (err) { console.error(err); }
    finally { setAptLoading(false); }
  };

  const STATUS_COLORS = {
    pending:   'bg-yellow-100 text-yellow-700 border-yellow-200',
    confirmed: 'bg-blue-100 text-blue-700 border-blue-200',
    completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    cancelled: 'bg-red-100 text-red-600 border-red-200',
  };

  if (!myTrainer) return (
    <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-sm p-16 text-center">
      <div className="text-5xl mb-4">🔍</div>
      <p className="text-gray-900 font-bold text-lg mb-1">No trainer selected yet</p>
      <p className="text-gray-400 text-sm">Go to the <strong className="text-gray-600">Find Trainer</strong> tab to choose one.</p>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      {/* Trainer Card — dark gradient */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        className="bg-gradient-to-br from-[#0A0F1E] via-[#0F172A] to-[#0D1B26] rounded-3xl p-6 text-white flex items-center gap-4"
      >
        <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-white font-black text-2xl flex-shrink-0">
          {myTrainer.name?.charAt(0)}
        </div>
        <div>
          <p className="text-white/50 text-xs font-bold uppercase tracking-wide mb-0.5">Your Trainer</p>
          <p className="font-black text-white text-xl leading-tight">{myTrainer.name}</p>
          <p className="text-white/60 text-sm mt-0.5">{myTrainer.email}</p>
          {myTrainer.specialization && (
            <span className="inline-flex items-center mt-2 text-xs font-bold px-2.5 py-1 rounded-full border bg-white/10 border-white/20 text-white/80">
              {myTrainer.specialization}
            </span>
          )}
        </div>
      </motion.div>

      {/* Section tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="flex gap-1 bg-white border border-[#E2E8F0] rounded-2xl p-1.5 shadow-sm w-fit"
      >
        {[{ key: 'chat', label: '💬 Chat' }, { key: 'book', label: '📅 Book Appointment' }, { key: 'apts', label: '🗓️ My Appointments' }].map(s => (
          <button
            key={s.key}
            onClick={() => setSection(s.key)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
              section === s.key
                ? 'bg-[#36a8cd] text-white shadow-md'
                : 'text-[#475569] hover:bg-[#EFF9FD] hover:text-[#36a8cd]'
            }`}
          >
            {s.label}
          </button>
        ))}
      </motion.div>

      <AnimatePresence mode="wait">
        {section === 'chat' && (
          <motion.div
            key="chat"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="bg-white rounded-3xl border border-[#E2E8F0] shadow-sm overflow-hidden flex flex-col"
            style={{ height: 420 }}
          >
            {/* Chat header */}
            <div className="bg-[#F8FAFC] border-b border-[#E2E8F0] px-5 py-4 flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm font-bold text-[#0F172A]">Chat with {myTrainer.name}</span>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {msgLoading ? (
                <div className="flex items-center justify-center h-full text-gray-400 text-sm">Loading messages...</div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400">
                  <span className="text-4xl">💬</span>
                  <p className="text-sm font-medium">No messages yet. Say hello!</p>
                </div>
              ) : messages.map((msg, i) => {
                const isMine = msg.sender === userInfo._id;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.7, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                    className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`text-sm ${
                      isMine
                        ? 'bg-[#36a8cd] text-white rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-xs ml-auto'
                        : 'bg-[#F1F5F9] text-[#0F172A] rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-xs border border-[#E2E8F0]'
                    }`}>
                      <p>{msg.content}</p>
                      <span className={`text-[10px] block mt-1 ${isMine ? 'text-white/70' : 'text-[#94A3B8]'}`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input bar */}
            <form onSubmit={sendMessage} className="bg-[#F8FAFC] border-t border-[#E2E8F0] px-4 py-3 flex gap-2">
              <input
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-white border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#36a8cd]/20 focus:border-[#36a8cd] transition-all"
              />
              <motion.button
                type="submit"
                disabled={!newMessage.trim()}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className="px-5 py-2.5 bg-[#36a8cd] hover:bg-[#2089ab] text-white rounded-xl font-bold text-sm shadow-sm disabled:opacity-50 transition-all"
              >
                Send
              </motion.button>
            </form>
          </motion.div>
        )}

        {section === 'book' && (
          <motion.div
            key="book"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="bg-white rounded-3xl p-6 border border-[#E2E8F0] shadow-sm max-w-md"
          >
            <h3 className="font-black text-gray-900 mb-5 text-xl">Book a Session with {myTrainer.name}</h3>
            <AnimatePresence>
              {aptSuccess && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="mb-4 p-3 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-semibold border border-emerald-100 flex items-center gap-2"
                >
                  ✅ Appointment sent! Your trainer will confirm soon.
                </motion.div>
              )}
            </AnimatePresence>
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              onSubmit={bookAppointment}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Preferred Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={aptDate}
                  onChange={e => setAptDate(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full bg-white border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#36a8cd]/20 focus:border-[#36a8cd] transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Notes (optional)</label>
                <textarea
                  value={aptNotes}
                  onChange={e => setAptNotes(e.target.value)}
                  placeholder="E.g. I want to focus on upper body strength..."
                  rows={3}
                  className="w-full bg-white border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#36a8cd]/20 focus:border-[#36a8cd] transition-all resize-none"
                />
              </div>
              <motion.button
                type="submit"
                disabled={aptLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#36a8cd] to-[#2089ab] text-white font-bold shadow-md disabled:opacity-60 transition-all"
              >
                {aptLoading ? 'Sending...' : 'Send Appointment Request'}
              </motion.button>
            </motion.form>
          </motion.div>
        )}

        {section === 'apts' && (
          <motion.div
            key="apts"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-3"
          >
            {myApts.length === 0 ? (
              <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-sm p-12 text-center">
                <div className="text-4xl mb-3">📭</div>
                <p className="text-gray-900 font-bold mb-1">No appointments yet</p>
                <p className="text-gray-400 text-sm">Book your first session using the Book Appointment tab.</p>
              </div>
            ) : myApts.map((apt, i) => (
              <motion.div
                key={apt._id || i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                className="flex items-center justify-between p-4 bg-white rounded-2xl border border-[#E2E8F0] shadow-sm hover:shadow-md transition-all"
              >
                <div>
                  <p className="font-bold text-gray-900 text-sm">
                    {apt.trainer?.name || myTrainer.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{new Date(apt.date).toLocaleString()}</p>
                  {apt.notes && <p className="text-xs text-gray-400 mt-0.5 italic">"{apt.notes}"</p>}
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border inline-flex items-center ${STATUS_COLORS[apt.status] || STATUS_COLORS.pending}`}>
                  {apt.status}
                </span>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ─── Exercises Tab ────────────────────────────────────────────────────────────
const ExercisesTab = () => {
  const [workouts, setWorkouts]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [toast, setToast]         = useState('');   // brief notification message
  const [ticking, setTicking]     = useState(null); // {workoutId, index} being saved

  useEffect(() => {
    axios.get(`${API}/workouts/assigned`, getAuth())
      .then(r => setWorkouts(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const toggleExercise = async (workout, exIndex) => {
    const key = `${workout._id}-${exIndex}`;
    setTicking(key);
    try {
      const res = await axios.put(
        `${API}/workouts/${workout._id}/exercise/${exIndex}`,
        {},
        getAuth()
      );
      setWorkouts(prev => prev.map(w => w._id === workout._id ? res.data : w));
      const updated = res.data.exercises[exIndex];
      if (updated.completed) {
        showToast(`✅ "${updated.name}" marked done — trainer notified!`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTicking(null);
    }
  };

  if (loading) return (
    <div className="space-y-4">
      {[1,2,3].map(i => (
        <motion.div
          key={i}
          className="h-32 rounded-2xl overflow-hidden relative bg-gray-100"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent"
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear', delay: i * 0.2 }}
          />
        </motion.div>
      ))}
    </div>
  );

  if (workouts.length === 0) return (
    <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-sm p-16 text-center">
      <div className="text-5xl mb-4">📋</div>
      <p className="text-gray-900 font-bold text-lg mb-1">No exercises assigned yet</p>
      <p className="text-gray-400 text-sm">Your trainer will assign exercises after you connect.</p>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      {/* Toast notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: -30, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="fixed top-4 right-4 bg-emerald-600 text-white rounded-2xl px-5 py-3 shadow-xl flex items-center gap-2 font-semibold z-50"
          >
            <span className="text-base">🔔</span> {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <p className="text-sm text-gray-500 font-medium px-1">
        {workouts.length} workout plan{workouts.length !== 1 ? 's' : ''} assigned by your trainer.
      </p>

      {workouts.map((w, i) => {
        const doneCount = w.exercises?.filter(e => e.completed).length || 0;
        const total = w.exercises?.length || 0;
        const allDone = total > 0 && doneCount === total;
        const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;

        return (
          <motion.div
            key={w._id}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.4, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="bg-white rounded-3xl border border-[#E2E8F0] shadow-sm overflow-hidden"
          >
            {/* Plan header — gradient with shimmer */}
            <div className="bg-gradient-to-r from-[#36a8cd] to-[#2089ab] px-6 py-4 flex items-start justify-between relative overflow-hidden">
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 4, ease: 'easeInOut' }}
              />
              <div className="relative z-10">
                <h4 className="font-black text-white text-base">{w.title}</h4>
                <p className="text-[#A5F3FC] text-xs mt-0.5">
                  From: {w.trainer?.name || 'Your Trainer'} · {new Date(w.date).toLocaleDateString()}
                </p>
              </div>
              {total > 0 && (
                <span className={`relative z-10 text-xs font-bold px-2.5 py-1 rounded-full border inline-flex items-center ${
                  allDone ? 'bg-emerald-500/30 text-emerald-100 border-emerald-400/40' : 'bg-white/15 text-white/90 border-white/25'
                }`}>
                  {doneCount}/{total} done
                </span>
              )}
            </div>

            <div className="px-6 pt-4 pb-5">
              {/* Progress bar */}
              {total > 0 && (
                <div className="bg-gray-200 rounded-full h-2 overflow-hidden mb-4">
                  <motion.div
                    className="h-full bg-gradient-to-r from-[#36a8cd] to-[#10B981] rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
                  />
                </div>
              )}

              {w.exercises?.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-gray-100">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="text-left px-4 py-2.5 text-slate-500 text-xs font-bold uppercase tracking-wide rounded-tl-xl">Exercise</th>
                        <th className="text-center px-4 py-2.5 text-slate-500 text-xs font-bold uppercase tracking-wide">Sets</th>
                        <th className="text-center px-4 py-2.5 text-slate-500 text-xs font-bold uppercase tracking-wide">Reps</th>
                        <th className="text-center px-4 py-2.5 text-slate-500 text-xs font-bold uppercase tracking-wide">Weight (kg)</th>
                        <th className="text-center px-4 py-2.5 text-slate-500 text-xs font-bold uppercase tracking-wide rounded-tr-xl">Mark Done</th>
                      </tr>
                    </thead>
                    <tbody>
                      {w.exercises.map((ex, j) => {
                        const key = `${w._id}-${j}`;
                        const saving = ticking === key;
                        return (
                          <motion.tr
                            key={j}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: j * 0.05, ease: [0.22, 1, 0.36, 1] }}
                            className={`border-t border-gray-100 transition-colors ${
                              ex.completed ? 'bg-emerald-50/30' : 'hover:bg-gray-50/50'
                            }`}
                          >
                            <td className={`px-4 py-3 font-semibold ${ex.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                              {ex.name}
                            </td>
                            <td className="px-4 py-3 text-center text-gray-600">{ex.sets}</td>
                            <td className="px-4 py-3 text-center text-gray-600">{ex.reps}</td>
                            <td className="px-4 py-3 text-center text-gray-600">{ex.weight > 0 ? ex.weight : '—'}</td>
                            <td className="px-4 py-3 text-center">
                              {saving ? (
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
                                  className="w-5 h-5 border-2 border-[#36a8cd] border-t-transparent rounded-full mx-auto"
                                />
                              ) : ex.completed ? (
                                <motion.button
                                  whileTap={{ scale: 0.85 }}
                                  animate={{ scale: [1, 1.3, 1] }}
                                  transition={{ duration: 0.3 }}
                                  onClick={() => toggleExercise(w, j)}
                                  className="w-6 h-6 rounded-full bg-emerald-500 border-2 border-emerald-500 flex items-center justify-center mx-auto transition-all"
                                  title="Mark as not done"
                                >
                                  <motion.svg
                                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                                    className="w-3.5 h-3.5" viewBox="0 0 12 12" fill="none"
                                  >
                                    <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  </motion.svg>
                                </motion.button>
                              ) : (
                                <motion.button
                                  whileTap={{ scale: 0.85 }}
                                  onClick={() => toggleExercise(w, j)}
                                  className="w-6 h-6 border-2 border-[#E2E8F0] rounded hover:border-[#36a8cd] flex items-center justify-center mx-auto bg-white transition-all"
                                  title="Mark as done"
                                />
                              )}
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">No specific exercises listed — check with your trainer.</p>
              )}
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
};

// ─── Diet Plans Tab ───────────────────────────────────────────────────────────
const DietPlansTab = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    axios.get(`${API}/diet-plans/my`, getAuth())
      .then(r => setPlans(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const STATUS_STYLE = {
    pending:  { bar: 'bg-amber-400',   badge: 'bg-amber-50 text-amber-700 border-amber-200',   label: '⏳ Awaiting Trainer Review' },
    approved: { bar: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: '✅ Approved by Trainer' },
    rejected: { bar: 'bg-rose-500',    badge: 'bg-rose-50 text-rose-600 border-rose-200',       label: '❌ Needs Revision' },
  };

  if (loading) return (
    <div className="space-y-3">
      {[1,2,3].map(i => (
        <div key={i} className="h-24 rounded-2xl overflow-hidden relative bg-gray-100">
          <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent"
            animate={{ x: ['-100%', '200%'] }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear', delay: i * 0.2 }} />
        </div>
      ))}
    </div>
  );

  if (plans.length === 0) return (
    <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-sm p-16 text-center">
      <div className="text-5xl mb-4">🥗</div>
      <p className="text-gray-900 font-bold text-lg mb-1">No diet plans yet</p>
      <p className="text-gray-400 text-sm">Your trainer will generate a personalised diet plan and send it here for you.</p>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <p className="text-sm text-gray-500 font-medium px-1">
        {plans.length} plan{plans.length !== 1 ? 's' : ''} — trainer-approved plans appear here once reviewed.
      </p>
      {plans.map((p, i) => {
        const st = STATUS_STYLE[p.status] || STATUS_STYLE.pending;
        const isOpen = expanded === p._id;
        return (
          <motion.div
            key={p._id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
            className="bg-white rounded-3xl border border-[#E2E8F0] shadow-sm overflow-hidden"
          >
            {/* Status bar */}
            <div className={`h-1 w-full ${st.bar}`} />

            <div className="p-5">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border inline-flex items-center ${st.badge}`}>
                      {st.label}
                    </span>
                    <span className="text-xs text-gray-400 font-medium">
                      {new Date(p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Goal: <span className="font-semibold text-[#0F172A]">{p.input?.goal || '—'}</span>
                    {' · '}Diet: <span className="font-semibold text-[#0F172A]">{p.input?.dietType || '—'}</span>
                    {' · '}{p.input?.weightKg}kg · {p.input?.heightCm}cm
                  </p>
                  {p.status === 'approved' && p.trainerComment && (
                    <div className="mt-2 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2 text-sm text-emerald-700">
                      <span className="font-bold">Trainer note:</span> {p.trainerComment}
                    </div>
                  )}
                  {p.status === 'rejected' && p.trainerComment && (
                    <div className="mt-2 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2 text-sm text-rose-600">
                      <span className="font-bold">Trainer feedback:</span> {p.trainerComment}
                    </div>
                  )}
                </div>
                <motion.button
                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                  onClick={() => setExpanded(isOpen ? null : p._id)}
                  className="flex-shrink-0 px-4 py-2 rounded-xl bg-[#EFF9FD] text-[#36a8cd] border border-[#36a8cd]/20 text-sm font-bold hover:bg-[#36a8cd]/15 transition-colors"
                >
                  {isOpen ? 'Hide Plan ▲' : 'View Plan ▼'}
                </motion.button>
              </div>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] p-4">
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
                        {p.plan}
                      </pre>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const UserDashboard = () => {
  const userInfo = getUserInfo();
  const [activeTab, setActiveTab] = useState('overview');
  const [myTrainer, setMyTrainer] = useState(null);
  const [quote, setQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(true);

  useEffect(() => {
    // Fetch assigned trainer
    axios.get(`${API}/trainers/my-trainer`, getAuth())
      .then(r => setMyTrainer(r.data))
      .catch(() => {});

    // Motivational quote from DummyJSON
    const id = Math.floor(Math.random() * 100) + 1;
    fetch(`https://dummyjson.com/quotes/${id}`)
      .then(r => r.json())
      .then(d => setQuote(d))
      .catch(() => setQuote({ quote: 'Push yourself — no one else is going to do it for you.', author: 'Unknown' }))
      .finally(() => setQuoteLoading(false));
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-[#F8FAFC] w-full pb-12"
    >
      {/* Header banner — dark gradient */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="bg-gradient-to-br from-[#0A0F1E] via-[#0F172A] to-[#0D1B26] rounded-3xl p-8 mx-4 mt-4 relative overflow-hidden"
      >
        {/* Floating particles */}
        <FloatingParticles count={12} />

        {/* Decorative blobs */}
        <motion.div
          animate={{ scale: [1, 1.4, 0.9, 1.2, 1], x: [0, 25, -15, 10, 0], opacity: [0.08, 0.18, 0.06, 0.15, 0.08] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-[#36a8cd] blur-3xl pointer-events-none"
        />
        <motion.div
          animate={{ scale: [1, 1.4, 0.9, 1.2, 1], x: [0, 25, -15, 10, 0], opacity: [0.08, 0.18, 0.06, 0.15, 0.08] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
          className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-[#2089ab] blur-3xl pointer-events-none"
        />
        <motion.div
          animate={{ scale: [1, 1.4, 0.9, 1.2, 1], x: [0, 25, -15, 10, 0], opacity: [0.08, 0.18, 0.06, 0.15, 0.08] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
          className="absolute top-1/2 right-1/3 w-32 h-32 rounded-full bg-[#66CCE0] blur-3xl pointer-events-none"
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="relative z-10 flex items-start justify-between gap-4 flex-wrap mb-6"
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <motion.span
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', delay: 0.5, stiffness: 200 }}
                className="bg-white/15 border border-white/25 text-white/90 text-xs font-bold px-3 py-1 rounded-full"
              >
                Member
              </motion.span>
            </div>
            <p className="text-[#66CCE0] text-sm mb-1">Welcome back 👋</p>
            <h1 className="text-3xl font-black text-white">{userInfo.name || 'Member'}</h1>
            {myTrainer ? (
              <p className="text-[#66CCE0] text-sm mt-1.5">
                Trainer: <span className="text-white font-bold">{myTrainer.name}</span>
              </p>
            ) : (
              <p className="text-[#66CCE0] text-sm mt-1.5">
                No trainer assigned yet —{' '}
                <button onClick={() => setActiveTab('find-trainer')} className="text-white font-bold underline underline-offset-2">
                  Find one
                </button>
              </p>
            )}
          </div>
          {myTrainer && (
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab('my-trainer')}
              className="flex items-center gap-2 bg-white/15 hover:bg-white/25 border border-white/20 backdrop-blur-sm rounded-2xl px-5 py-3 text-white font-bold text-sm transition-all"
            >
              💬 Chat with Trainer
            </motion.button>
          )}
        </motion.div>

      </motion.div>

      {/* Tab Bar — white card below header, matching trainer style */}
      <div className="px-4 mt-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white rounded-2xl p-1.5 shadow-sm border border-[#E2E8F0] mb-6 flex overflow-x-auto"
        >
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative flex items-center gap-2 px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-all duration-200 flex-1 justify-center ${
                activeTab === tab.key
                  ? 'text-white'
                  : 'text-[#475569] hover:text-[#0F172A] hover:bg-[#F8FAFC] rounded-xl'
              }`}
            >
              {activeTab === tab.key && (
                <motion.div
                  layoutId="activeUserTab"
                  className="absolute inset-0 bg-[#36a8cd] rounded-xl shadow-md"
                  transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                />
              )}
              <span className="relative z-10">{tab.icon}</span>
              <span className="relative z-10">{tab.label}</span>
              {tab.key === 'my-trainer' && myTrainer && (
                <span className="relative z-10 w-2 h-2 rounded-full bg-emerald-400" />
              )}
            </button>
          ))}
        </motion.div>

      {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <OverviewTab userName={userInfo.name} quote={quote} quoteLoading={quoteLoading} />
            </motion.div>
          )}
          {activeTab === 'find-trainer' && (
            <motion.div
              key="find-trainer"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <FindTrainerTab myTrainer={myTrainer} onSelect={trainer => { setMyTrainer(trainer); setActiveTab('my-trainer'); }} />
            </motion.div>
          )}
          {activeTab === 'my-trainer' && (
            <motion.div
              key="my-trainer"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <MyTrainerTab myTrainer={myTrainer} />
            </motion.div>
          )}
          {activeTab === 'exercises' && (
            <motion.div
              key="exercises"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <ExercisesTab />
            </motion.div>
          )}
          {activeTab === 'diet-plans' && (
            <motion.div
              key="diet-plans"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <DietPlansTab />
            </motion.div>
          )}
          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <ProfileTab />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// ─── Profile Tab ─────────────────────────────────────────────────────────────
const ProfileTab = () => {
  const calcAge = (dob) => {
    if (!dob) return null;
    const today = new Date();
    const birth = new Date(dob);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age > 0 ? age : null;
  };

  const [form, setForm] = useState({
    name: '', dateOfBirth: '', gender: 'male', heightCm: '', weightKg: '',
    fitnessGoal: 'maintenance', activityLevel: 'moderate',
    dietType: 'balanced', allergies: '', fitnessNotes: '',
  });
  const [dobText, setDobText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [hasPurchased, setHasPurchased] = useState(false);

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/auth/me`, getAuth()),
      axios.get(`${API}/payments/my`, getAuth()),
    ]).then(([profileRes, paymentsRes]) => {
        const u = profileRes.data;
        const dob = u.dateOfBirth ? new Date(u.dateOfBirth).toISOString().split('T')[0] : '';
        if (dob) {
          const [y, m, d] = dob.split('-');
          setDobText(`${d}/${m}/${y}`);
        }
        setForm({
          name: u.name || '',
          dateOfBirth: dob,
          gender: u.gender || 'male',
          heightCm: u.heightCm || '',
          weightKg: u.weightKg || '',
          fitnessGoal: u.fitnessGoal || 'maintenance',
          activityLevel: u.activityLevel || 'moderate',
          dietType: u.dietType || 'balanced',
          allergies: u.allergies || '',
          fitnessNotes: u.fitnessNotes || '',
        });
        const payments = paymentsRes.data || [];
        setHasPurchased(payments.some(p => p.status === 'succeeded'));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!hasPurchased) return;
    setSaving(true); setError(''); setSaved(false);
    try {
      await axios.put(`${API}/auth/profile`, form, getAuth());
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-[#36a8cd] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl space-y-5">

      {/* Purchase gate banner */}
      {hasPurchased ? (
        <div className="flex items-start gap-3 bg-[#EFF9FD] border border-[#B0E4F4] rounded-2xl px-5 py-4">
          <span className="text-xl mt-0.5">ℹ️</span>
          <p className="text-sm text-[#0F172A] leading-relaxed">
            Your trainer uses this profile to generate personalised diet and exercise plans for you. Keep it up to date for the best results.
          </p>
        </div>
      ) : (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
          <span className="text-xl mt-0.5">🔒</span>
          <div>
            <p className="text-sm font-bold text-amber-800">Purchase required</p>
            <p className="text-sm text-amber-700 mt-0.5">
              You need to purchase a plan or product before you can update your profile. Visit the <a href="/shop" className="underline font-semibold">Shop</a> to get started.
            </p>
          </div>
        </div>
      )}

      <AnimatePresence>
        {saved && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="p-4 bg-emerald-50 text-emerald-700 rounded-2xl text-sm font-semibold border border-emerald-100 flex items-center gap-2">
            ✅ Profile saved successfully!
          </motion.div>
        )}
        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="p-4 bg-rose-50 text-rose-600 rounded-2xl text-sm border border-rose-100">
            ⚠️ {error}
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSave} className={`space-y-5 ${!hasPurchased ? 'opacity-50 pointer-events-none select-none' : ''}`}>
        {/* Basic info */}
        <div className="bg-white rounded-3xl p-6 border border-[#E2E8F0] shadow-sm space-y-4">
          <h4 className="text-sm font-black text-[#0F172A] mb-1">Basic Information</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#475569] mb-1.5">Full Name</label>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="Your name" className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#36a8cd]/20 focus:border-[#36a8cd]" />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#475569] mb-1.5">
                Date of Birth
                {form.dateOfBirth && calcAge(form.dateOfBirth) && (
                  <span className="ml-2 text-[#36a8cd] font-black">· Age {calcAge(form.dateOfBirth)}</span>
                )}
              </label>
              <input
                type="text"
                placeholder="DD / MM / YYYY"
                value={dobText}
                maxLength={10}
                onChange={e => {
                  let val = e.target.value.replace(/[^\d/]/g, '');
                  if (val.length === 2 && dobText.length === 1) val = val + '/';
                  if (val.length === 5 && dobText.length === 4) val = val + '/';
                  setDobText(val);
                  const parts = val.split('/');
                  if (parts.length === 3 && parts[0].length === 2 && parts[1].length === 2 && parts[2].length === 4) {
                    const [d, m, y] = parts;
                    const iso = `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
                    const date = new Date(iso);
                    if (!isNaN(date) && date <= new Date()) {
                      setForm(p => ({ ...p, dateOfBirth: iso }));
                    }
                  } else if (val === '') {
                    setForm(p => ({ ...p, dateOfBirth: '' }));
                  }
                }}
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#36a8cd]/20 focus:border-[#36a8cd]"
              />
              <p className="text-xs text-[#94A3B8] mt-1">Type manually as DD/MM/YYYY or use the calendar icon</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#475569] mb-1.5">Gender</label>
              <select value={form.gender} onChange={e => setForm(p => ({ ...p, gender: e.target.value }))}
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#36a8cd]/20 focus:border-[#36a8cd]">
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#475569] mb-1.5">Height (cm)</label>
              <input type="number" min="100" max="250" value={form.heightCm} onChange={e => setForm(p => ({ ...p, heightCm: e.target.value }))}
                placeholder="e.g. 175" className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#36a8cd]/20 focus:border-[#36a8cd]" />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#475569] mb-1.5">Weight (kg)</label>
              <input type="number" min="30" max="300" value={form.weightKg} onChange={e => setForm(p => ({ ...p, weightKg: e.target.value }))}
                placeholder="e.g. 72" className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#36a8cd]/20 focus:border-[#36a8cd]" />
            </div>
          </div>
        </div>

        {/* Fitness preferences */}
        <div className="bg-white rounded-3xl p-6 border border-[#E2E8F0] shadow-sm space-y-4">
          <h4 className="text-sm font-black text-[#0F172A] mb-1">Fitness Preferences</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#475569] mb-1.5">Fitness Goal</label>
              <select value={form.fitnessGoal} onChange={e => setForm(p => ({ ...p, fitnessGoal: e.target.value }))}
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#36a8cd]/20 focus:border-[#36a8cd]">
                <option value="weight_loss">Weight Loss</option>
                <option value="muscle_gain">Muscle Gain</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#475569] mb-1.5">Activity Level</label>
              <select value={form.activityLevel} onChange={e => setForm(p => ({ ...p, activityLevel: e.target.value }))}
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#36a8cd]/20 focus:border-[#36a8cd]">
                <option value="low">Low</option>
                <option value="moderate">Moderate</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#475569] mb-1.5">Diet Type</label>
              <select value={form.dietType} onChange={e => setForm(p => ({ ...p, dietType: e.target.value }))}
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#36a8cd]/20 focus:border-[#36a8cd]">
                <option value="balanced">Balanced</option>
                <option value="high_protein">High Protein</option>
                <option value="vegetarian">Vegetarian</option>
                <option value="keto">Keto</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#475569] mb-1.5">Allergies / Intolerances</label>
              <input value={form.allergies} onChange={e => setForm(p => ({ ...p, allergies: e.target.value }))}
                placeholder="e.g. nuts, dairy, gluten" className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#36a8cd]/20 focus:border-[#36a8cd]" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#475569] mb-1.5">Additional Notes <span className="font-normal text-[#94A3B8]">(injuries, medical conditions, preferences…)</span></label>
              <textarea rows={3} value={form.fitnessNotes} onChange={e => setForm(p => ({ ...p, fitnessNotes: e.target.value }))}
                placeholder="e.g. bad lower back, diabetic, prefer no fish, post-knee surgery"
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#36a8cd]/20 focus:border-[#36a8cd] resize-none" />
            </div>
          </div>
        </div>

        <motion.button
          type="submit"
          disabled={saving}
          whileHover={{ scale: 1.02, boxShadow: '0 8px 25px rgba(54,168,205,0.4)' }}
          whileTap={{ scale: 0.97 }}
          className="w-full bg-[#36a8cd] hover:bg-[#2089ab] text-white font-bold py-4 rounded-xl shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {saving ? 'Saving…' : 'Save Profile'}
        </motion.button>
      </form>
    </motion.div>
  );
};

export default UserDashboard;
