import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring, useInView } from 'framer-motion';
import axios from 'axios';
import Cookies from 'js-cookie';

const API = 'http://localhost:5001/api';

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
];

// ─── FloatingParticles ───────────────────────────────────────────────────────
const FloatingParticles = ({ count = 12, className = '' }) => (
  <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
    {Array.from({ length: count }).map((_, i) => {
      const colors = ['bg-indigo-300', 'bg-purple-300', 'bg-pink-300', 'bg-blue-300'];
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
      className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm overflow-hidden relative"
    >
      <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full bg-gradient-to-br ${gradient} opacity-5`} />
      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-xl shadow-md`}>
        {icon}
      </div>
      <motion.h3
        whileInView={{ scale: [0.8, 1.05, 1] }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="text-3xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mt-4"
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
    { label: 'Workouts Done',  value: '12',     icon: '💪', gradient: 'from-indigo-500 to-purple-600', bg: 'from-indigo-50 to-purple-50', border: 'border-indigo-100', bar: '60%' },
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
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-l-4 border-indigo-500 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-3 right-4 text-7xl opacity-5 font-serif leading-none select-none">"</div>
        <div className="flex items-center gap-2 mb-4">
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
          <span className="text-xs font-bold text-indigo-500 uppercase tracking-wide">Daily Motivation · DummyJSON API</span>
        </div>
        {quoteLoading ? (
          <div className="space-y-2">
            <motion.div
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="h-4 rounded-lg bg-indigo-100/70 w-4/5"
            />
            <motion.div
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
              className="h-4 rounded-lg bg-indigo-100/70 w-2/3"
            />
          </div>
        ) : quote ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p className="text-gray-700 text-lg font-medium leading-relaxed italic mb-3">"{quote.quote}"</p>
            <p className="text-indigo-600 font-semibold text-sm">— {quote.author}</p>
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
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-16 text-center">
      <div className="text-5xl mb-4">🔍</div>
      <p className="text-gray-900 font-bold text-lg mb-1">No trainers available yet</p>
      <p className="text-gray-500 text-sm">Check back soon — new trainers are being added.</p>
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
                    ? 'border-indigo-300 shadow-md shadow-indigo-100/50'
                    : 'border-gray-100 shadow-sm hover:border-indigo-100'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <motion.div
                      animate={{
                        boxShadow: [
                          '0 4px 15px rgba(99,102,241,0.2)',
                          '0 8px 30px rgba(139,92,246,0.4)',
                          '0 4px 15px rgba(99,102,241,0.2)',
                        ],
                      }}
                      transition={{ duration: 2.5, repeat: Infinity }}
                      className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-lg font-black flex-shrink-0"
                    >
                      {t.name?.charAt(0).toUpperCase()}
                    </motion.div>
                    <div>
                      <p className="text-base font-bold text-gray-900">{t.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{t.email}</p>
                      {t.specialization && (
                        <span className="inline-flex items-center mt-1.5 text-xs font-bold px-2.5 py-1 rounded-full border bg-purple-50 text-purple-700 border-purple-100">
                          {t.specialization}
                        </span>
                      )}
                    </div>
                  </div>

                  {isSelected ? (
                    <span className="flex-shrink-0 text-xs font-bold px-2.5 py-1 rounded-full border inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 border-indigo-200">
                      ✓ My Trainer
                    </span>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => handleSelect(t)}
                      disabled={selecting === t._id}
                      className="flex-shrink-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-bold px-4 py-2 rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-60"
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
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-16 text-center">
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
        className="bg-gradient-to-br from-slate-900 to-indigo-900 rounded-3xl p-6 text-white flex items-center gap-4"
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
        className="flex gap-1 bg-white border border-gray-100 rounded-2xl p-1.5 shadow-sm w-fit"
      >
        {[{ key: 'chat', label: '💬 Chat' }, { key: 'book', label: '📅 Book Appointment' }, { key: 'apts', label: '🗓️ My Appointments' }].map(s => (
          <button
            key={s.key}
            onClick={() => setSection(s.key)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
              section === s.key
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
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
            className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col"
            style={{ height: 420 }}
          >
            {/* Chat header */}
            <div className="bg-slate-50 border-b border-gray-100 px-5 py-4 flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm font-bold text-gray-700">Chat with {myTrainer.name}</span>
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
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-xs ml-auto'
                        : 'bg-gray-100 text-gray-800 rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-xs'
                    }`}>
                      <p>{msg.content}</p>
                      <span className={`text-[10px] block mt-1 ${isMine ? 'text-indigo-200' : 'text-gray-400'}`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input bar */}
            <form onSubmit={sendMessage} className="bg-gray-50 border-t border-gray-100 px-4 py-3 flex gap-2">
              <input
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
              />
              <motion.button
                type="submit"
                disabled={!newMessage.trim()}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-sm shadow-md disabled:opacity-50 transition-all"
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
            className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm max-w-md"
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
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Notes (optional)</label>
                <textarea
                  value={aptNotes}
                  onChange={e => setAptNotes(e.target.value)}
                  placeholder="E.g. I want to focus on upper body strength..."
                  rows={3}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all resize-none"
                />
              </div>
              <motion.button
                type="submit"
                disabled={aptLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold shadow-md disabled:opacity-60 transition-all"
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
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-12 text-center">
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
                className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all"
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
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-16 text-center">
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
            className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden"
          >
            {/* Plan header — gradient with shimmer */}
            <div className={`bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-start justify-between relative overflow-hidden`}>
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 4, ease: 'easeInOut' }}
              />
              <div className="relative z-10">
                <h4 className="font-black text-white text-base">{w.title}</h4>
                <p className="text-indigo-200 text-xs mt-0.5">
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
                    className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full"
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
                                  className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full mx-auto"
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
                                  className="w-6 h-6 border-2 border-gray-300 rounded hover:border-indigo-400 flex items-center justify-center mx-auto bg-white transition-all"
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
      className="min-h-screen bg-gray-50 w-full pb-12"
    >
      {/* Header banner — dark gradient */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-900 rounded-3xl p-8 mx-4 mt-4 relative overflow-hidden"
      >
        {/* Floating particles */}
        <FloatingParticles count={12} />

        {/* Decorative blobs */}
        <motion.div
          animate={{ scale: [1, 1.4, 0.9, 1.2, 1], x: [0, 25, -15, 10, 0], opacity: [0.08, 0.18, 0.06, 0.15, 0.08] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-indigo-400 blur-3xl pointer-events-none"
        />
        <motion.div
          animate={{ scale: [1, 1.4, 0.9, 1.2, 1], x: [0, 25, -15, 10, 0], opacity: [0.08, 0.18, 0.06, 0.15, 0.08] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
          className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-purple-400 blur-3xl pointer-events-none"
        />
        <motion.div
          animate={{ scale: [1, 1.4, 0.9, 1.2, 1], x: [0, 25, -15, 10, 0], opacity: [0.08, 0.18, 0.06, 0.15, 0.08] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
          className="absolute top-1/2 right-1/3 w-32 h-32 rounded-full bg-violet-300 blur-3xl pointer-events-none"
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
            <p className="text-indigo-200 text-sm mb-1">Welcome back 👋</p>
            <h1 className="text-3xl font-black text-white">{userInfo.name || 'Member'}</h1>
            {myTrainer ? (
              <p className="text-indigo-200 text-sm mt-1.5">
                Trainer: <span className="text-white font-bold">{myTrainer.name}</span>
              </p>
            ) : (
              <p className="text-indigo-200 text-sm mt-1.5">
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

        {/* Tab Bar — inside dark header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 bg-white/10 border border-white/20 rounded-2xl p-1.5 flex gap-1 overflow-x-auto"
        >
          {TABS.map(tab => (
            <motion.button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 flex-1 justify-center ${
                activeTab === tab.key
                  ? 'text-indigo-700 font-bold'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              {activeTab === tab.key && (
                <motion.div
                  layoutId="activeUserTab"
                  className="absolute inset-0 bg-white rounded-xl shadow-md"
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                />
              )}
              <span className="relative z-10">{tab.icon}</span>
              <span className="relative z-10">{tab.label}</span>
              {tab.key === 'my-trainer' && myTrainer && (
                <span className="relative z-10 w-2 h-2 rounded-full bg-emerald-400" />
              )}
            </motion.button>
          ))}
        </motion.div>
      </motion.div>

      {/* Tab Content */}
      <div className="px-4 mt-6">
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
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default UserDashboard;
