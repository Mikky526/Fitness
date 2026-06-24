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

const STATUS_STYLES = {
  pending:   'bg-amber-50 text-amber-700 border-amber-100',
  confirmed: 'bg-blue-50 text-blue-700 border-blue-100',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  cancelled: 'bg-rose-50 text-rose-600 border-rose-100',
};

const TABS = [
  { key: 'appointments', label: 'Appointments', icon: '📅' },
  { key: 'members',      label: 'My Members',   icon: '👥' },
  { key: 'assign',       label: 'Assign Exercise', icon: '📋' },
];

// ─── Shared Utility Components ────────────────────────────────────────────────

const FloatingParticles = ({ count = 14 }) => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {Array.from({ length: count }).map((_, i) => {
      const colors = ['bg-purple-300', 'bg-indigo-300', 'bg-pink-300', 'bg-violet-300'];
      const size = 2 + (i % 4) + Math.random() * 3;
      return (
        <motion.div
          key={i}
          className={`absolute rounded-full opacity-20 ${colors[i % colors.length]}`}
          style={{ width: size, height: size, left: `${(i * 7 + 3) % 93}%`, top: `${(i * 11 + 5) % 88}%` }}
          animate={{ y: [0, -(18 + i * 2), 5, 0], x: [0, i % 2 ? 14 : -14, 0], opacity: [0.1, 0.35, 0.1], scale: [1, 1.3, 0.9, 1] }}
          transition={{ duration: 7 + i * 0.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.25 }}
        />
      );
    })}
  </div>
);

const TiltCard = ({ children, className = '' }) => {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useTransform(my, [-50, 50], [4, -4]);
  const ry = useTransform(mx, [-50, 50], [-4, 4]);
  const onMove = (e) => { const r = e.currentTarget.getBoundingClientRect(); mx.set(e.clientX - r.left - r.width / 2); my.set(e.clientY - r.top - r.height / 2); };
  const onLeave = () => { mx.set(0); my.set(0); };
  return (
    <motion.div style={{ rotateX: rx, rotateY: ry, transformPerspective: 800 }} onMouseMove={onMove} onMouseLeave={onLeave} whileHover={{ scale: 1.02, zIndex: 10 }} transition={{ type: 'spring', stiffness: 250, damping: 22 }} className={className}>
      {children}
    </motion.div>
  );
};

// ─── Appointments Tab ─────────────────────────────────────────────────────────
const AppointmentsTab = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get(`${API}/appointments`, getAuth())
      .then(r => setAppointments(r.data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = async (id, status) => {
    try {
      const res = await axios.put(`${API}/appointments/${id}/status`, { status }, getAuth());
      setAppointments(prev => prev.map(a => a._id === id ? { ...a, status: res.data.status } : a));
    } catch (e) { setError(e.message); }
  };

  if (loading) return (
    <div className="space-y-3">
      {[1,2,3].map(i => (
        <div key={i} className="h-24 rounded-2xl overflow-hidden relative bg-gray-100">
          <motion.div
            className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/50 to-transparent"
            animate={{ x: ['-150%', '200%'] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          />
        </div>
      ))}
    </div>
  );

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.09 } },
      }}
      className="space-y-4"
    >
      {error && (
        <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl text-sm border border-rose-100 flex items-center gap-2 font-medium">
          <span className="text-base">⚠️</span> {error}
        </div>
      )}
      {appointments.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center justify-center py-24 px-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center text-3xl mb-4 border border-gray-100">📭</div>
          <p className="text-gray-900 font-bold text-lg mb-1">No appointments yet</p>
          <p className="text-gray-400 text-sm max-w-xs">Members will appear here when they book sessions with you.</p>
        </div>
      ) : (
        appointments.map((apt) => (
          <motion.div
            key={apt._id}
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
            }}
          >
            <TiltCard className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <motion.div
                    className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-black text-lg flex-shrink-0"
                    animate={{ boxShadow: ['0 4px 15px rgba(139,92,246,0.25)', '0 8px 30px rgba(99,102,241,0.45)', '0 4px 15px rgba(139,92,246,0.25)'] }}
                    transition={{ duration: 2.5, repeat: Infinity }}
                  >
                    {apt.user?.name?.charAt(0) || '?'}
                  </motion.div>
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 text-base">{apt.user?.name || 'Member'}</p>
                    <p className="text-sm text-gray-500">{apt.user?.email}</p>
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                      <span>🕐</span>
                      {new Date(apt.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                      {' · '}
                      {new Date(apt.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {apt.notes && (
                      <p className="mt-2 bg-gray-50 rounded-xl px-3 py-2 text-sm italic text-gray-500 border border-gray-100">
                        "{apt.notes}"
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap sm:flex-col sm:items-end gap-y-2">
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, delay: 0.3 }}
                    className={`text-xs font-bold px-2.5 py-1 rounded-full border inline-flex items-center ${STATUS_STYLES[apt.status] || STATUS_STYLES.pending}`}
                  >
                    {apt.status}
                  </motion.span>
                  <div className="flex items-center gap-2">
                    <motion.button
                      whileHover={{ scale: 1.12, y: -2 }}
                      whileTap={{ scale: 0.88 }}
                      onClick={() => updateStatus(apt._id, 'confirmed')}
                      className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-xl text-xs font-bold hover:bg-blue-100 transition-colors"
                    >
                      Confirm
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.12, y: -2 }}
                      whileTap={{ scale: 0.88 }}
                      onClick={() => updateStatus(apt._id, 'completed')}
                      className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-colors"
                    >
                      Complete
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.12, y: -2 }}
                      whileTap={{ scale: 0.88 }}
                      onClick={() => updateStatus(apt._id, 'cancelled')}
                      className="px-3 py-1.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl text-xs font-bold hover:bg-rose-100 transition-colors"
                    >
                      Cancel
                    </motion.button>
                  </div>
                </div>
              </div>
            </TiltCard>
          </motion.div>
        ))
      )}
    </motion.div>
  );
};

// ─── Members Tab ──────────────────────────────────────────────────────────────
const MembersTab = ({ onAssign }) => {
  const userInfo = getUserInfo();
  const [members, setMembers]           = useState([]);
  const [loading, setLoading]           = useState(true);
  // chat
  const [chatMember, setChatMember]     = useState(null);
  const [messages, setMessages]         = useState([]);
  const [newMessage, setNewMessage]     = useState('');
  const [msgLoading, setMsgLoading]     = useState(false);
  const messagesEndRef                  = useRef(null);
  // plans
  const [plansMember, setPlansMember]   = useState(null);
  const [plans, setPlans]               = useState([]);
  const [plansLoading, setPlansLoading] = useState(false);
  // completion status map: { [memberId]: true | false }
  const [completionMap, setCompletionMap] = useState({});

  const checkMemberCompletion = async (memberId) => {
    try {
      const res = await axios.get(`${API}/workouts/user/${memberId}`, getAuth());
      const myPlans = res.data.filter(w => w.trainer && w.trainer.toString() === userInfo._id);
      const allDone = myPlans.length > 0 && myPlans.every(plan => {
        const total = plan.exercises?.length || 0;
        const done  = plan.exercises?.filter(e => e.completed).length || 0;
        return plan.completed || (total > 0 && done === total);
      });
      setCompletionMap(prev => ({ ...prev, [memberId]: allDone }));
      return myPlans;
    } catch {
      return [];
    }
  };

  useEffect(() => {
    axios.get(`${API}/trainers/my-members`, getAuth())
      .then(async r => {
        const membersList = r.data;
        setMembers(membersList);
        // check completion for all members in parallel
        await Promise.all(membersList.map(m => checkMemberCompletion(m._id)));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // ── chat helpers ──
  const openChat = async (member) => {
    setChatMember(member);
    setMsgLoading(true);
    try {
      const res = await axios.get(`${API}/messages/${member._id}`, getAuth());
      setMessages(res.data);
    } catch (e) { console.error(e); }
    finally { setMsgLoading(false); }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatMember) return;
    try {
      const res = await axios.post(`${API}/messages`, { recipientId: chatMember._id, content: newMessage }, getAuth());
      setMessages(prev => [...prev, res.data]);
      setNewMessage('');
    } catch (e) { console.error(e); }
  };

  // ── plans helpers ──
  const openPlans = async (member) => {
    setPlansMember(member);
    setPlans([]);
    setPlansLoading(true);
    try {
      const myPlans = await checkMemberCompletion(member._id);
      setPlans(myPlans);
    } catch (e) { console.error(e); }
    finally { setPlansLoading(false); }
  };

  if (loading) return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1,2,3,4].map(i => (
        <div key={i} className="h-36 rounded-2xl overflow-hidden relative bg-gray-100">
          <motion.div
            className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/50 to-transparent"
            animate={{ x: ['-150%', '200%'] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          />
        </div>
      ))}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-5"
    >
      {members.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center justify-center py-24 px-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center text-3xl mb-4 border border-gray-100">👤</div>
          <p className="text-gray-900 font-bold text-lg mb-1">No members yet</p>
          <p className="text-gray-400 text-sm max-w-xs">Members who choose you as their trainer will appear here.</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 font-medium">
            <span className="font-bold text-gray-900">{members.length}</span> member{members.length !== 1 ? 's' : ''} connected to you
          </p>
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
            }}
          >
            {members.map((m, i) => (
              <motion.div
                key={m._id}
                variants={{
                  hidden: { opacity: 0, y: 20, scale: 0.97 },
                  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4 } },
                }}
              >
                <TiltCard className={`rounded-2xl p-5 border shadow-sm transition-all h-full ${
                  completionMap[m._id]
                    ? 'bg-emerald-50/40 border-emerald-200 hover:border-emerald-300'
                    : 'bg-white border-gray-100'
                }`}>
                  <div className="flex items-center gap-3 mb-4">
                    <motion.div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white text-lg font-black flex-shrink-0 ${
                        completionMap[m._id]
                          ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                          : 'bg-gradient-to-br from-purple-500 to-indigo-600'
                      }`}
                      animate={{ boxShadow: completionMap[m._id]
                        ? ['0 4px 15px rgba(16,185,129,0.3)', '0 8px 25px rgba(20,184,166,0.5)', '0 4px 15px rgba(16,185,129,0.3)']
                        : ['0 4px 15px rgba(139,92,246,0.3)', '0 8px 25px rgba(99,102,241,0.5)', '0 4px 15px rgba(139,92,246,0.3)']
                      }}
                      transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                    >
                      {m.name?.charAt(0)}
                    </motion.div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-gray-900 truncate">{m.name}</p>
                        {completionMap[m._id] && (
                          <motion.span
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex-shrink-0"
                          >
                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                            Completed
                          </motion.span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 truncate">{m.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.1, y: -2 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => openChat(m)}
                      className="flex-1 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs font-bold hover:bg-indigo-100 transition-colors"
                    >
                      💬 Chat
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1, y: -2 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => openPlans(m)}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                        completionMap[m._id]
                          ? 'bg-emerald-500 text-white border border-emerald-600 hover:bg-emerald-600'
                          : 'bg-purple-50 text-purple-700 border border-purple-100 hover:bg-purple-100'
                      }`}
                    >
                      {completionMap[m._id] ? '✅ Completed' : '📊 Progress'}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1, y: -2 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => onAssign(m)}
                      className="flex-1 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-bold hover:bg-emerald-100 transition-colors"
                    >
                      📋 Assign
                    </motion.button>
                  </div>
                </TiltCard>
              </motion.div>
            ))}
          </motion.div>
        </>
      )}

      {/* ── Chat Modal ── */}
      <AnimatePresence>
        {chatMember && (
          <motion.div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, backdropFilter: 'blur(6px)' }}
            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            transition={{ duration: 0.3 }}
            onClick={e => e.target === e.currentTarget && setChatMember(null)}
          >
            <motion.div
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden"
              style={{ height: 540 }}
              initial={{ opacity: 0, scale: 0.85, y: 40, rotateX: 5 }}
              animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 40, rotateX: 5 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            >
              {/* Modal header */}
              <div className="bg-gradient-to-r from-slate-900 to-indigo-900 rounded-t-3xl p-5 text-white flex items-center gap-3 flex-shrink-0">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white font-black text-lg">
                  {chatMember.name?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white">{chatMember.name}</p>
                  <p className="text-xs text-indigo-300">{chatMember.email}</p>
                </div>
                <button
                  onClick={() => setChatMember(null)}
                  className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white text-sm font-bold transition-all"
                >
                  ✕
                </button>
              </div>

              {/* Messages area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {msgLoading ? (
                  <div className="flex items-center justify-center h-full text-gray-400 text-sm">Loading messages...</div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
                    <span className="text-4xl">💬</span>
                    <p className="text-sm font-medium">No messages yet. Start the conversation!</p>
                  </div>
                ) : messages.map((msg, i) => {
                  const isMine = msg.sender === userInfo._id;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.6, x: isMine ? 20 : -20 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`px-4 py-2.5 max-w-xs text-sm ${
                        isMine
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl rounded-tr-sm'
                          : 'bg-white text-gray-800 rounded-2xl rounded-tl-sm border border-gray-100 shadow-sm'
                      }`}>
                        <p>{msg.content}</p>
                        <span className={`text-[10px] block mt-0.5 ${isMine ? 'text-indigo-200' : 'text-gray-400'}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input area */}
              <form onSubmit={sendMessage} className="bg-white border-t border-gray-100 px-4 py-3 flex gap-2 flex-shrink-0">
                <input
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
                />
                <motion.button
                  type="submit"
                  disabled={!newMessage.trim()}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-sm disabled:opacity-50 hover:shadow-md hover:shadow-indigo-200/50 transition-all"
                >
                  Send
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Plans / Progress Modal ── */}
      <AnimatePresence>
        {plansMember && (
          <motion.div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, backdropFilter: 'blur(6px)' }}
            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            transition={{ duration: 0.3 }}
            onClick={e => e.target === e.currentTarget && setPlansMember(null)}
          >
            <motion.div
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden"
              style={{ maxHeight: '85vh' }}
              initial={{ opacity: 0, scale: 0.85, y: 40, rotateX: 5 }}
              animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 40, rotateX: 5 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            >
              {/* Modal header */}
              <div className="bg-gradient-to-r from-slate-900 to-indigo-900 rounded-t-3xl p-6 text-white flex items-center gap-3 flex-shrink-0">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white font-black text-lg">
                  {plansMember.name?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white">{plansMember.name}'s Training Plans</p>
                  <p className="text-xs text-indigo-300">{plansMember.email}</p>
                </div>
                <button
                  onClick={() => openPlans(plansMember)}
                  disabled={plansLoading}
                  title="Refresh progress"
                  className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-all disabled:opacity-40"
                >
                  <svg className={`w-4 h-4 ${plansLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
                <button
                  onClick={() => setPlansMember(null)}
                  className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white font-bold transition-all"
                >
                  ✕
                </button>
              </div>

              {/* Modal body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {plansLoading ? (
                  <div className="space-y-4">
                    {[1,2].map(i => (
                      <div key={i} className="relative overflow-hidden bg-gray-100 rounded-3xl h-40">
                        <motion.div
                          className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/50 to-transparent"
                          animate={{ x: ['-150%', '200%'] }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                        />
                      </div>
                    ))}
                  </div>
                ) : plans.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center text-2xl mb-4 border border-gray-100">📋</div>
                    <p className="text-gray-900 font-bold mb-1">No plans assigned yet</p>
                    <p className="text-gray-400 text-sm max-w-xs">Use the Assign tab to create a workout plan for {plansMember.name}.</p>
                  </div>
                ) : plans.map((plan, pi) => {
                  const doneCount = plan.exercises?.filter(e => e.completed).length || 0;
                  const total     = plan.exercises?.length || 0;
                  const allDone   = plan.completed || (total > 0 && doneCount === total);
                  const pct       = total > 0 ? (doneCount / total) * 100 : 0;
                  return (
                    <motion.div
                      key={plan._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: pi * 0.08 }}
                      className={`rounded-2xl shadow-sm mb-4 overflow-hidden border ${
                        allDone ? 'bg-emerald-50/40 border-emerald-200' : 'bg-white border-gray-100'
                      }`}
                    >
                      {/* Completed banner */}
                      {allDone && (
                        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2.5 flex items-center gap-2">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-white text-xs font-extrabold tracking-wide uppercase">Plan Completed</span>
                        </div>
                      )}

                      {/* Plan title header */}
                      <div className={`border-b px-5 py-4 flex items-center justify-between ${
                        allDone ? 'bg-emerald-50/60 border-emerald-100' : 'bg-slate-50 border-gray-100'
                      }`}>
                        <div>
                          <h4 className={`font-bold ${allDone ? 'text-emerald-800' : 'text-gray-900'}`}>{plan.title}</h4>
                          <p className="text-xs text-gray-400 mt-0.5">Assigned {new Date(plan.date).toLocaleDateString()}</p>
                        </div>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border inline-flex items-center ${
                          allDone ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                        }`}>
                          {doneCount}/{total} done
                        </span>
                      </div>

                      {/* Progress bar */}
                      {total > 0 && (
                        <div className="h-1.5 bg-gray-100">
                          <motion.div
                            className={`h-full rounded-full bg-gradient-to-r ${
                              allDone ? 'from-emerald-400 to-teal-500' : 'from-indigo-500 to-emerald-500'
                            }`}
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: `${pct}%`, opacity: 1 }}
                            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
                          />
                        </div>
                      )}

                      {/* Exercise table */}
                      {plan.exercises?.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-slate-50">
                                <th className="text-left px-4 py-3 text-slate-500 text-xs font-bold uppercase tracking-wide">Exercise</th>
                                <th className="text-center px-4 py-3 text-slate-500 text-xs font-bold uppercase tracking-wide">Sets</th>
                                <th className="text-center px-4 py-3 text-slate-500 text-xs font-bold uppercase tracking-wide">Reps</th>
                                <th className="text-center px-4 py-3 text-slate-500 text-xs font-bold uppercase tracking-wide">Weight (kg)</th>
                                <th className="text-center px-4 py-3 text-slate-500 text-xs font-bold uppercase tracking-wide">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {plan.exercises.map((ex, j) => (
                                <tr key={j} className="border-t border-gray-100 hover:bg-gray-50/50">
                                  <td className={`px-4 py-3 font-semibold ${ex.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                                    {ex.name}
                                  </td>
                                  <td className="px-4 py-3 text-center text-gray-600">{ex.sets}</td>
                                  <td className="px-4 py-3 text-center text-gray-600">{ex.reps}</td>
                                  <td className="px-4 py-3 text-center text-gray-600">{ex.weight > 0 ? ex.weight : '—'}</td>
                                  <td className="px-4 py-3 text-center">
                                    {ex.completed ? (
                                      <span className="text-xs font-bold px-2.5 py-1 rounded-full border inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border-emerald-100">
                                        <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                                          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                        Done
                                      </span>
                                    ) : (
                                      <span className="text-xs font-bold px-2.5 py-1 rounded-full border inline-flex items-center bg-gray-100 text-gray-500 border-gray-200">
                                        ○ Pending
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="px-5 py-4 text-sm text-gray-400 italic">No exercises in this plan.</p>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ─── Assign Exercise Tab ──────────────────────────────────────────────────────
const AssignTab = ({ preselectedMember, onClear }) => {
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(preselectedMember || null);
  const [title, setTitle] = useState('');
  const [exercises, setExercises] = useState([{ name: '', sets: '', reps: '', weight: '' }]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get(`${API}/trainers/my-members`, getAuth())
      .then(r => setMembers(r.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (preselectedMember) setSelectedMember(preselectedMember);
  }, [preselectedMember]);

  const addExercise = () => setExercises(prev => [...prev, { name: '', sets: '', reps: '', weight: '' }]);
  const removeExercise = (i) => setExercises(prev => prev.filter((_, idx) => idx !== i));
  const updateExercise = (i, field, value) => setExercises(prev => prev.map((ex, idx) => idx === i ? { ...ex, [field]: value } : ex));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMember) return setError('Please select a member.');
    setLoading(true);
    setError('');
    setSuccess(false);
    try {
      const payload = {
        userId: selectedMember._id,
        title,
        exercises: exercises
          .filter(ex => ex.name.trim())
          .map(ex => ({ name: ex.name, sets: Number(ex.sets) || 1, reps: Number(ex.reps) || 1, weight: Number(ex.weight) || 0 })),
      };
      await axios.post(`${API}/workouts/assign`, payload, getAuth());
      setSuccess(true);
      setTitle('');
      setExercises([{ name: '', sets: '', reps: '', weight: '' }]);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to assign workout.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl space-y-5">
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="p-4 bg-emerald-50 text-emerald-700 rounded-2xl text-sm font-semibold border border-emerald-100 flex items-center gap-2"
          >
            ✅ Exercise plan assigned successfully!
          </motion.div>
        )}
        {error && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="p-4 bg-rose-50 text-rose-600 rounded-2xl text-sm border border-rose-100"
          >
            ⚠️ {error}
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Select Member */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
          <label className="block text-sm font-bold text-gray-900 mb-4">Select Member</label>
          {members.length === 0 ? (
            <p className="text-gray-400 text-sm">No members connected yet.</p>
          ) : (
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 gap-3"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
              }}
            >
              {members.map(m => (
                <motion.button
                  key={m._id}
                  type="button"
                  onClick={() => { setSelectedMember(m); onClear?.(); }}
                  variants={{
                    hidden: { opacity: 0, y: 12, scale: 0.97 },
                    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35 } },
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`relative flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                    selectedMember?._id === m._id
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-indigo-200 bg-white'
                  }`}
                >
                  {selectedMember?._id === m._id && (
                    <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">✓</span>
                  )}
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-sm font-black flex-shrink-0 shadow-md shadow-purple-200/40">
                    {m.name?.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{m.name}</p>
                    <p className="text-xs text-gray-500 truncate">{m.email}</p>
                  </div>
                </motion.button>
              ))}
            </motion.div>
          )}
        </div>

        {/* Plan Details */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">Workout Plan Title</label>
            <input
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Upper Body Strength Week 1"
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
            />
          </div>

          {/* Exercises */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-bold text-gray-900">Exercises</label>
            </div>
            <div className="space-y-3">
              {exercises.map((ex, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07, type: 'spring', stiffness: 200 }}
                  className="grid grid-cols-12 gap-2 items-center"
                >
                  <input
                    value={ex.name}
                    onChange={e => updateExercise(i, 'name', e.target.value)}
                    placeholder="Exercise name"
                    className="col-span-12 sm:col-span-5 bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
                  />
                  <input
                    type="number" min="1"
                    value={ex.sets}
                    onChange={e => updateExercise(i, 'sets', e.target.value)}
                    placeholder="Sets"
                    className="col-span-4 sm:col-span-2 bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
                  />
                  <input
                    type="number" min="1"
                    value={ex.reps}
                    onChange={e => updateExercise(i, 'reps', e.target.value)}
                    placeholder="Reps"
                    className="col-span-4 sm:col-span-2 bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
                  />
                  <input
                    type="number" min="0"
                    value={ex.weight}
                    onChange={e => updateExercise(i, 'weight', e.target.value)}
                    placeholder="kg"
                    className="col-span-3 sm:col-span-2 bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => removeExercise(i)}
                    disabled={exercises.length === 1}
                    className="col-span-1 flex items-center justify-center text-rose-400 hover:text-rose-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-lg font-bold"
                  >
                    ×
                  </button>
                </motion.div>
              ))}
              <div className="grid grid-cols-12 gap-2 text-xs text-gray-400 px-1">
                <span className="col-span-12 sm:col-span-5">Exercise</span>
                <span className="col-span-4 sm:col-span-2 text-center">Sets</span>
                <span className="col-span-4 sm:col-span-2 text-center">Reps</span>
                <span className="col-span-3 sm:col-span-2 text-center">Weight (kg)</span>
              </div>
              <motion.button
                type="button"
                onClick={addExercise}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 hover:border-indigo-300 hover:text-indigo-500 text-sm font-bold transition-all hover:bg-indigo-50/30"
              >
                + Add Exercise
              </motion.button>
            </div>
          </div>
        </div>

        <motion.button
          type="submit"
          disabled={loading || !selectedMember || !title.trim()}
          whileHover={{ scale: 1.03, boxShadow: '0 12px 35px rgba(16,185,129,0.45)' }}
          whileTap={{ scale: 0.97 }}
          className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-extrabold py-4 rounded-2xl shadow-lg shadow-emerald-200/50 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? 'Assigning...' : `Assign Plan to ${selectedMember ? selectedMember.name : 'Member'}`}
        </motion.button>
      </form>
    </motion.div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const TrainerDashboard = () => {
  const [activeTab, setActiveTab] = useState('appointments');
  const [preselectedMember, setPreselectedMember] = useState(null);
  const [counts, setCounts] = useState({ appointments: 0, members: 0 });
  const userInfo = getUserInfo();

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/appointments`, getAuth()),
      axios.get(`${API}/trainers/my-members`, getAuth()),
    ]).then(([aptRes, membersRes]) => {
      setCounts({ appointments: aptRes.data.length, members: membersRes.data.length });
    }).catch(() => {});
  }, []);

  const handleAssignFromMember = (member) => {
    setPreselectedMember(member);
    setActiveTab('assign');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-gray-50 pb-12"
    >
      {/* Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="bg-gradient-to-br from-slate-900 via-purple-950 to-indigo-900 rounded-3xl p-8 mx-4 mt-4 relative overflow-hidden"
      >
        {/* Floating particles */}
        <FloatingParticles count={14} />

        {/* Decorative blobs */}
        <motion.div
          animate={{ scale: [1, 1.4, 0.8, 1.2, 1], x: [0, 30, -20, 10, 0], opacity: [0.08, 0.2, 0.06, 0.15, 0.08] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-16 -right-16 w-64 h-64 bg-purple-500 rounded-full blur-3xl pointer-events-none"
        />
        <motion.div
          animate={{ scale: [1, 1.4, 0.8, 1.2, 1], x: [0, -30, 20, -10, 0], opacity: [0.08, 0.2, 0.06, 0.15, 0.08] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute -bottom-12 left-12 w-48 h-48 bg-indigo-500 rounded-full blur-3xl pointer-events-none"
        />

        {/* Shimmer sweep */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent rounded-3xl pointer-events-none"
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 4, repeat: Infinity, repeatDelay: 6, ease: 'easeInOut' }}
        />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <p className="text-purple-200 text-sm font-medium mb-1">Trainer Portal</p>
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-3xl font-black text-white leading-tight"
            >
              Trainer Dashboard
            </motion.h1>
            {userInfo.name && (
              <p className="text-purple-200 text-sm mt-1">{userInfo.name} · {userInfo.email}</p>
            )}
          </div>
          <div className="flex gap-3 flex-shrink-0">
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', delay: 0.5, stiffness: 200 }}
              className="bg-white/10 border border-white/20 rounded-2xl px-4 py-2 flex items-center gap-2"
            >
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span className="text-white text-sm font-semibold">{counts.appointments} Appointments</span>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', delay: 0.65, stiffness: 200 }}
              className="bg-white/10 border border-white/20 rounded-2xl px-4 py-2 flex items-center gap-2"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="text-white text-sm font-semibold">{counts.members} Members</span>
            </motion.div>
          </div>
        </div>
      </motion.div>

      <div className="px-4 mt-6">
        {/* Tab Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white rounded-2xl p-1.5 shadow-sm border border-gray-100 mb-6 flex overflow-x-auto"
        >
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative flex items-center gap-2 px-5 py-2.5 text-sm font-semibold whitespace-nowrap transition-all duration-200 flex-1 justify-center ${
                activeTab === tab.key
                  ? 'text-white'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-xl'
              }`}
            >
              {activeTab === tab.key && (
                <motion.div
                  layoutId="activeTrainerTab"
                  className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl shadow-md"
                  transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                />
              )}
              <span className="relative z-10">{tab.icon}</span>
              <span className="relative z-10">{tab.label}</span>
            </button>
          ))}
        </motion.div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'appointments' && (
            <motion.div
              key="appointments"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <AppointmentsTab />
            </motion.div>
          )}
          {activeTab === 'members' && (
            <motion.div
              key="members"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <MembersTab onAssign={handleAssignFromMember} />
            </motion.div>
          )}
          {activeTab === 'assign' && (
            <motion.div
              key="assign"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <AssignTab preselectedMember={preselectedMember} onClear={() => setPreselectedMember(null)} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default TrainerDashboard;
