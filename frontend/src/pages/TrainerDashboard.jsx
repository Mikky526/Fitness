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
  { key: 'appointments', label: 'Appointments',   icon: '📅' },
  { key: 'members',      label: 'My Members',     icon: '👥' },
  { key: 'assign',       label: 'Assign Exercise',icon: '📋' },
  { key: 'diet-plans',   label: 'Diet Plans',     icon: '🥗' },
];

// ─── Shared Utility Components ────────────────────────────────────────────────

const FloatingParticles = ({ count = 14 }) => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {Array.from({ length: count }).map((_, i) => {
      const colors = ['bg-[#33B8D4]', 'bg-[#66CCE0]', 'bg-cyan-300', 'bg-blue-300'];
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
        <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-sm flex flex-col items-center justify-center py-24 px-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#F8FAFC] flex items-center justify-center text-3xl mb-4 border border-[#E2E8F0]">📭</div>
          <p className="text-[#0F172A] font-bold text-lg mb-1">No appointments yet</p>
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
            <TiltCard className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-sm hover:shadow-md transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <motion.div
                    className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#36a8cd] to-[#2089ab] flex items-center justify-center text-white font-black text-lg flex-shrink-0"
                    animate={{ boxShadow: ['0 4px 15px rgba(54,168,205,0.25)', '0 8px 30px rgba(54,168,205,0.45)', '0 4px 15px rgba(54,168,205,0.25)'] }}
                    transition={{ duration: 2.5, repeat: Infinity }}
                  >
                    {apt.user?.name?.charAt(0) || '?'}
                  </motion.div>
                  <div className="min-w-0">
                    <p className="font-bold text-[#0F172A] text-base">{apt.user?.name || 'Member'}</p>
                    <p className="text-sm text-[#475569]">{apt.user?.email}</p>
                    <p className="text-xs text-[#94A3B8] mt-1 flex items-center gap-1">
                      <span>🕐</span>
                      {new Date(apt.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                      {' · '}
                      {new Date(apt.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {apt.notes && (
                      <p className="mt-2 bg-[#F8FAFC] rounded-xl px-3 py-2 text-sm italic text-[#475569] border border-[#E2E8F0]">
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
        <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-sm flex flex-col items-center justify-center py-24 px-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#F8FAFC] flex items-center justify-center text-3xl mb-4 border border-[#E2E8F0]">👤</div>
          <p className="text-[#0F172A] font-bold text-lg mb-1">No members yet</p>
          <p className="text-gray-400 text-sm max-w-xs">Members who choose you as their trainer will appear here.</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-[#475569] font-medium">
            <span className="font-bold text-[#0F172A]">{members.length}</span> member{members.length !== 1 ? 's' : ''} connected to you
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
                    : 'bg-white border-[#E2E8F0]'
                }`}>
                  <div className="flex items-center gap-3 mb-4">
                    <motion.div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white text-lg font-black flex-shrink-0 ${
                        completionMap[m._id]
                          ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                          : 'bg-gradient-to-br from-[#36a8cd] to-[#2089ab]'
                      }`}
                      animate={{ boxShadow: completionMap[m._id]
                        ? ['0 4px 15px rgba(16,185,129,0.3)', '0 8px 25px rgba(20,184,166,0.5)', '0 4px 15px rgba(16,185,129,0.3)']
                        : ['0 4px 15px rgba(54,168,205,0.3)', '0 8px 25px rgba(54,168,205,0.5)', '0 4px 15px rgba(54,168,205,0.3)']
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
                      className="flex-1 py-1.5 rounded-xl bg-[#EFF9FD] text-[#36a8cd] border border-[#36a8cd]/20 text-xs font-bold hover:bg-[#36a8cd]/15 transition-colors"
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
                          : 'bg-[#EFF9FD] text-[#36a8cd] border border-[#36a8cd]/20 hover:bg-[#36a8cd]/15'
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
              <div className="bg-gradient-to-br from-[#0A0F1E] to-[#0D1B26] rounded-t-3xl p-5 text-white flex items-center gap-3 flex-shrink-0">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white font-black text-lg">
                  {chatMember.name?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white">{chatMember.name}</p>
                  <p className="text-xs text-[#66CCE0]">{chatMember.email}</p>
                </div>
                <button
                  onClick={() => setChatMember(null)}
                  className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white text-sm font-bold transition-all"
                >
                  ✕
                </button>
              </div>

              {/* Messages area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F8FAFC]">
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
                          ? 'bg-[#36a8cd] text-white rounded-2xl rounded-tr-sm'
                          : 'bg-white text-[#0F172A] rounded-2xl rounded-tl-sm border border-[#E2E8F0] shadow-sm'
                      }`}>
                        <p>{msg.content}</p>
                        <span className={`text-[10px] block mt-0.5 ${isMine ? 'text-[#EFF9FD]' : 'text-[#94A3B8]'}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input area */}
              <form onSubmit={sendMessage} className="bg-white border-t border-[#E2E8F0] px-4 py-3 flex gap-2 flex-shrink-0">
                <input
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#36a8cd]/20 focus:border-[#36a8cd] transition-all"
                />
                <motion.button
                  type="submit"
                  disabled={!newMessage.trim()}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  className="px-4 py-2.5 bg-[#36a8cd] hover:bg-[#2089ab] text-white rounded-xl font-bold text-sm disabled:opacity-50 transition-all"
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
              <div className="bg-gradient-to-br from-[#0A0F1E] to-[#0D1B26] rounded-t-3xl p-6 text-white flex items-center gap-3 flex-shrink-0">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white font-black text-lg">
                  {plansMember.name?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white">{plansMember.name}'s Training Plans</p>
                  <p className="text-xs text-[#66CCE0]">{plansMember.email}</p>
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
                          allDone ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-[#EFF9FD] text-[#36a8cd] border-[#36a8cd]/20'
                        }`}>
                          {doneCount}/{total} done
                        </span>
                      </div>

                      {/* Progress bar */}
                      {total > 0 && (
                        <div className="h-1.5 bg-gray-100">
                          <motion.div
                            className={`h-full rounded-full bg-gradient-to-r ${
                              allDone ? 'from-emerald-400 to-teal-500' : 'from-[#36a8cd] to-[#10B981]'
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

  // AI generation state
  const [showAI, setShowAI] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiForm, setAiForm] = useState({
    goal: 'general fitness',
    fitnessLevel: 'beginner',
    sets: '3',
    exerciseCount: '6',
    equipment: 'full gym',
    focusArea: 'full body',
    notes: '',
  });

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

  const handleAIGenerate = async () => {
    if (!selectedMember) return setError('Please select a member first.');
    setAiLoading(true);
    setError('');
    try {
      const { data } = await axios.post(`${API}/workouts/ai-generate`, {
        memberName: selectedMember.name,
        ...aiForm,
      }, getAuth());
      setTitle(data.title || '');
      setExercises(
        (data.exercises || []).map(ex => ({
          name: ex.name || '',
          sets: String(ex.sets || 3),
          reps: String(ex.reps || 10),
          weight: String(ex.weight || 0),
        }))
      );
      setShowAI(false);
    } catch (e) {
      setError(e.response?.data?.message || 'AI generation failed. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

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
        <div className="bg-white rounded-3xl p-6 border border-[#E2E8F0] shadow-sm">
          <label className="block text-sm font-bold text-[#0F172A] mb-4">Select Member</label>
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
                      ? 'border-[#36a8cd] bg-[#EFF9FD]'
                      : 'border-[#E2E8F0] hover:border-[#36a8cd]/40 bg-white'
                  }`}
                >
                  {selectedMember?._id === m._id && (
                    <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-[#36a8cd] flex items-center justify-center text-white text-xs font-bold">✓</span>
                  )}
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#36a8cd] to-[#2089ab] flex items-center justify-center text-white text-sm font-black flex-shrink-0 shadow-md shadow-[#36a8cd]/25">
                    {m.name?.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#0F172A] truncate">{m.name}</p>
                    <p className="text-xs text-[#475569] truncate">{m.email}</p>
                  </div>
                </motion.button>
              ))}
            </motion.div>
          )}
        </div>

        {/* ── AI Generate Panel ── */}
        <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => setShowAI(v => !v)}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-[#F8FAFC] transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-base shadow-md">✨</span>
              <div className="text-left">
                <p className="text-sm font-bold text-[#0F172A]">Generate with AI</p>
                <p className="text-xs text-[#64748B]">Let AI build a personalised workout plan for this member</p>
              </div>
            </div>
            <motion.span animate={{ rotate: showAI ? 180 : 0 }} className="text-[#94A3B8] text-lg">▾</motion.span>
          </button>

          <AnimatePresence>
            {showAI && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <div className="px-6 pb-6 space-y-4 border-t border-[#F1F5F9]">
                  <p className="text-xs text-[#64748B] pt-4">Fill in member details — AI will generate the title and exercises automatically.</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#0F172A] mb-1.5">Goal</label>
                      <select
                        value={aiForm.goal}
                        onChange={e => setAiForm(p => ({ ...p, goal: e.target.value }))}
                        className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400"
                      >
                        <option value="general fitness">General Fitness</option>
                        <option value="weight loss">Weight Loss</option>
                        <option value="muscle gain">Muscle Gain</option>
                        <option value="endurance">Endurance</option>
                        <option value="strength">Strength</option>
                        <option value="flexibility">Flexibility & Mobility</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#0F172A] mb-1.5">Fitness Level</label>
                      <select
                        value={aiForm.fitnessLevel}
                        onChange={e => setAiForm(p => ({ ...p, fitnessLevel: e.target.value }))}
                        className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400"
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#0F172A] mb-1.5">Focus Area</label>
                      <select
                        value={aiForm.focusArea}
                        onChange={e => setAiForm(p => ({ ...p, focusArea: e.target.value }))}
                        className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400"
                      >
                        <option value="full body">Full Body</option>
                        <option value="upper body">Upper Body</option>
                        <option value="lower body">Lower Body</option>
                        <option value="core">Core</option>
                        <option value="cardio">Cardio</option>
                        <option value="push">Push (chest, shoulders, triceps)</option>
                        <option value="pull">Pull (back, biceps)</option>
                        <option value="legs">Legs</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#0F172A] mb-1.5">Sets per Exercise</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={aiForm.sets}
                        onChange={e => setAiForm(p => ({ ...p, sets: e.target.value }))}
                        className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#0F172A] mb-1.5">Number of Exercises</label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={aiForm.exerciseCount}
                        onChange={e => setAiForm(p => ({ ...p, exerciseCount: e.target.value }))}
                        className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-[#0F172A] mb-1.5">Equipment Available</label>
                      <select
                        value={aiForm.equipment}
                        onChange={e => setAiForm(p => ({ ...p, equipment: e.target.value }))}
                        className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400"
                      >
                        <option value="full gym">Full Gym</option>
                        <option value="dumbbells only">Dumbbells Only</option>
                        <option value="bodyweight only">Bodyweight Only</option>
                        <option value="resistance bands">Resistance Bands</option>
                        <option value="home gym (dumbbells + bench)">Home Gym (Dumbbells + Bench)</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-[#0F172A] mb-1.5">Additional Notes <span className="font-normal text-[#94A3B8]">(injuries, preferences…)</span></label>
                      <input
                        value={aiForm.notes}
                        onChange={e => setAiForm(p => ({ ...p, notes: e.target.value }))}
                        placeholder="e.g. bad lower back, avoid squats"
                        className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400"
                      />
                    </div>
                  </div>

                  <motion.button
                    type="button"
                    onClick={handleAIGenerate}
                    disabled={aiLoading || !selectedMember}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 text-white text-sm font-bold shadow-md shadow-violet-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {aiLoading ? (
                      <>
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                        Generating…
                      </>
                    ) : '✨ Generate Exercise Plan'}
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Plan Details */}
        <div className="bg-white rounded-3xl p-6 border border-[#E2E8F0] shadow-sm space-y-5">
          <div>
            <label className="block text-sm font-bold text-[#0F172A] mb-2">Workout Plan Title</label>
            <input
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Upper Body Strength Week 1"
              className="w-full bg-white border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#36a8cd]/20 focus:border-[#36a8cd] transition-all"
            />
          </div>

          {/* Exercises */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-bold text-[#0F172A]">Exercises</label>
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
                    className="col-span-12 sm:col-span-5 bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#36a8cd]/20 focus:border-[#36a8cd] transition-all"
                  />
                  <input
                    type="number" min="1"
                    value={ex.sets}
                    onChange={e => updateExercise(i, 'sets', e.target.value)}
                    placeholder="Sets"
                    className="col-span-4 sm:col-span-2 bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#36a8cd]/20 focus:border-[#36a8cd] transition-all"
                  />
                  <input
                    type="number" min="1"
                    value={ex.reps}
                    onChange={e => updateExercise(i, 'reps', e.target.value)}
                    placeholder="Reps"
                    className="col-span-4 sm:col-span-2 bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#36a8cd]/20 focus:border-[#36a8cd] transition-all"
                  />
                  <input
                    type="number" min="0"
                    value={ex.weight}
                    onChange={e => updateExercise(i, 'weight', e.target.value)}
                    placeholder="kg"
                    className="col-span-3 sm:col-span-2 bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#36a8cd]/20 focus:border-[#36a8cd] transition-all"
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
                className="w-full py-3 rounded-xl border-2 border-dashed border-[#E2E8F0] text-[#94A3B8] hover:border-[#36a8cd]/50 hover:text-[#36a8cd] text-sm font-bold transition-all hover:bg-[#EFF9FD]/30"
              >
                + Add Exercise
              </motion.button>
            </div>
          </div>
        </div>

        <motion.button
          type="submit"
          disabled={loading || !selectedMember || !title.trim()}
          whileHover={{ scale: 1.02, boxShadow: '0 8px 25px rgba(54,168,205,0.4)' }}
          whileTap={{ scale: 0.97 }}
          className="w-full bg-[#36a8cd] hover:bg-[#2089ab] text-white font-bold py-4 rounded-xl shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? 'Assigning...' : `Assign Plan to ${selectedMember ? selectedMember.name : 'Member'}`}
        </motion.button>
      </form>
    </motion.div>
  );
};

// ─── Trainer Diet Plans Tab ────────────────────────────────────────────────────
const TrainerDietPlansTab = () => {
  const [plans, setPlans]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('all');
  const [expanded, setExpanded] = useState(null);
  const [comments, setComments] = useState({});
  const [submitting, setSubmitting] = useState(null);
  const [toast, setToast]       = useState('');

  // AI generate state
  const [showAIGen, setShowAIGen] = useState(false);
  const [aiMembers, setAiMembers] = useState([]);
  const [aiMember, setAiMember]   = useState(null);
  const [aiGenLoading, setAiGenLoading] = useState(false);
  const [aiSendLoading, setAiSendLoading] = useState(false);
  const [previewPlan, setPreviewPlan] = useState(null); // { text, source }
  const calcAge = (dob) => {
    if (!dob) return null;
    const today = new Date();
    const birth = new Date(dob);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age > 0 ? age : null;
  };

  const [aiForm, setAiForm] = useState({
    dateOfBirth: '', gender: 'male', heightCm: '', weightKg: '',
    goal: 'maintenance', activityLevel: 'moderate',
    dietType: 'balanced', allergies: '', notes: '',
  });

  useEffect(() => {
    axios.get(`${API}/diet-plans`, getAuth())
      .then(r => setPlans(
        (r.data || [])
          .filter(p => p.userRole === 'user')
          .map(p => ({ ...p, status: p.status || 'pending' }))
      ))
      .catch(() => {})
      .finally(() => setLoading(false));
    axios.get(`${API}/trainers/my-members`, getAuth())
      .then(r => setAiMembers(r.data || []))
      .catch(() => {});
  }, []);

  const handleGenerate = async () => {
    if (!aiMember) return showToast('⚠️ Please select a member first.');
    if (!aiForm.dateOfBirth || !aiForm.heightCm || !aiForm.weightKg) return showToast('⚠️ Fill in date of birth, height and weight.');
    setAiGenLoading(true);
    setPreviewPlan(null);
    try {
      const { data } = await axios.post(`${API}/ai/trainer-diet-preview`, {
        memberName: aiMember.name,
        ...aiForm,
      }, getAuth());
      setPreviewPlan({ text: data.plan, source: data.source });
    } catch (e) {
      showToast(e?.response?.data?.message ? `⚠️ ${e.response.data.message}` : '⚠️ Generation failed. Please try again.');
    } finally {
      setAiGenLoading(false);
    }
  };

  const handleSend = async () => {
    if (!previewPlan || !aiMember) return;
    setAiSendLoading(true);
    try {
      await axios.post(`${API}/ai/trainer-diet-send`, {
        memberId: aiMember._id,
        memberName: aiMember.name,
        ...aiForm,
        planText: previewPlan.text,
        source: previewPlan.source,
      }, getAuth());
      const res = await axios.get(`${API}/diet-plans`, getAuth());
      setPlans((res.data || []).filter(p => p.userRole === 'user').map(p => ({ ...p, status: p.status || 'pending' })));
      setShowAIGen(false);
      setPreviewPlan(null);
      setAiMember(null);
      setAiForm({ dateOfBirth: '', gender: 'male', heightCm: '', weightKg: '', goal: 'maintenance', activityLevel: 'moderate', dietType: 'balanced', allergies: '', notes: '' });
      showToast(`✅ Diet plan sent to ${aiMember.name}!`);
    } catch (e) {
      showToast(e?.response?.data?.message ? `⚠️ ${e.response.data.message}` : '⚠️ Failed to send. Please try again.');
    } finally {
      setAiSendLoading(false);
    }
  };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const handleReview = async (planId, action) => {
    setSubmitting(planId + action);
    try {
      const res = await axios.put(
        `${API}/diet-plans/${planId}/review`,
        { action, comment: comments[planId] || '' },
        getAuth()
      );
      setPlans(prev => prev.map(p => p._id === planId ? res.data : p));
      setComments(prev => { const n = { ...prev }; delete n[planId]; return n; });
      showToast(action === 'approve' ? '✅ Plan approved — member notified.' : '❌ Plan sent back for revision.');
    } catch (error) {
      const serverMessage = error?.response?.data?.message;
      showToast(serverMessage ? `⚠️ ${serverMessage}` : '⚠️ Action failed. Please try again.');
    } finally {
      setSubmitting(null);
    }
  };

  const STATUS_STYLE = {
    pending:  { bar: 'from-amber-400 to-orange-400',    badge: 'bg-amber-50 text-amber-700 border-amber-200',        label: '⏳ Pending Review' },
    approved: { bar: 'from-emerald-500 to-teal-500',    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',  label: '✅ Approved' },
    rejected: { bar: 'from-rose-500 to-red-500',        badge: 'bg-rose-50 text-rose-600 border-rose-200',           label: '❌ Revision Requested' },
  };

  const getPlanStatus = (plan) => plan.status || 'pending';
  const visible = plans;
  const pendingCount = plans.filter(p => getPlanStatus(p) === 'pending').length;

  if (loading) return (
    <div className="space-y-3">
      {[1,2,3].map(i => (
        <div key={i} className="h-28 rounded-2xl overflow-hidden relative bg-gray-100">
          <motion.div className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/50 to-transparent"
            animate={{ x: ['-150%', '200%'] }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }} />
        </div>
      ))}
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div key="toast"
            initial={{ opacity: 0, y: -30, scale: 0.85 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.85 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="fixed top-4 right-4 bg-[#0F172A] text-white rounded-2xl px-5 py-3 shadow-xl z-50 font-semibold text-sm"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header row */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-lg font-black text-[#0F172A]">Member Diet Plans</h3>
          <p className="text-sm text-[#475569] mt-0.5">Generate AI diet plans for members or review submitted plans.</p>
        </div>
        {pendingCount > 0 && (
          <motion.div animate={{ scale: [1, 1.06, 1] }} transition={{ duration: 2, repeat: Infinity }}
            className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-amber-700 text-sm font-bold">{pendingCount} awaiting review</span>
          </motion.div>
        )}
      </div>

      {/* ── AI Diet Plan Generator ── */}
      <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => setShowAIGen(v => !v)}
          className="w-full flex items-center justify-between px-6 py-4 hover:bg-[#F8FAFC] transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-base shadow-md">🥗</span>
            <div className="text-left">
              <p className="text-sm font-bold text-[#0F172A]">Generate AI Diet Plan for Member</p>
              <p className="text-xs text-[#64748B]">Create a personalised diet plan and send it directly to a member</p>
            </div>
          </div>
          <motion.span animate={{ rotate: showAIGen ? 180 : 0 }} className="text-[#94A3B8] text-lg">▾</motion.span>
        </button>

        <AnimatePresence>
          {showAIGen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="px-6 pb-6 space-y-5 border-t border-[#F1F5F9]">

                {/* Select Member */}
                <div className="pt-4">
                  <p className="text-xs font-bold text-[#0F172A] mb-3">Select Member</p>
                  {aiMembers.length === 0 ? (
                    <p className="text-sm text-[#94A3B8]">No members connected yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {aiMembers.map(m => (
                        <button
                          key={m._id} type="button"
                          onClick={() => {
                            setAiMember(m);
                            setPreviewPlan(null);
                            // Auto-fill from member's saved profile
                            setAiForm({
                              dateOfBirth: m.dateOfBirth ? new Date(m.dateOfBirth).toISOString().split('T')[0] : '',
                              gender: m.gender || 'male',
                              heightCm: m.heightCm || '',
                              weightKg: m.weightKg || '',
                              goal: m.fitnessGoal || 'maintenance',
                              activityLevel: m.activityLevel || 'moderate',
                              dietType: m.dietType || 'balanced',
                              allergies: m.allergies || '',
                              notes: m.fitnessNotes || '',
                            });
                          }}
                          className={`flex items-center gap-3 p-3 rounded-2xl border-2 text-left transition-all ${
                            aiMember?._id === m._id ? 'border-violet-400 bg-violet-50' : 'border-[#E2E8F0] hover:border-violet-300'
                          }`}
                        >
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-sm font-black flex-shrink-0">
                            {m.name?.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-[#0F172A] truncate">{m.name}</p>
                            <p className="text-xs text-[#94A3B8] truncate">{m.email}</p>
                          </div>
                          {aiMember?._id === m._id && <span className="ml-auto text-violet-500 font-black">✓</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Member Details Form */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#0F172A] mb-1.5">
                      Date of Birth
                      {aiForm.dateOfBirth && calcAge(aiForm.dateOfBirth) && (
                        <span className="ml-1 text-violet-500 font-black">· Age {calcAge(aiForm.dateOfBirth)}</span>
                      )}
                    </label>
                    <input
                      type="date" max={new Date().toISOString().split('T')[0]}
                      value={aiForm.dateOfBirth}
                      onChange={e => setAiForm(p => ({ ...p, dateOfBirth: e.target.value }))}
                      className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400"
                    />
                  </div>
                  {[
                    { label: 'Height (cm)', key: 'heightCm', placeholder: 'e.g. 175' },
                    { label: 'Weight (kg)', key: 'weightKg', placeholder: 'e.g. 72' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="block text-xs font-bold text-[#0F172A] mb-1.5">{f.label}</label>
                      <input
                        type="number" placeholder={f.placeholder}
                        value={aiForm[f.key]}
                        onChange={e => setAiForm(p => ({ ...p, [f.key]: e.target.value }))}
                        className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400"
                      />
                    </div>
                  ))}
                  <div>
                    <label className="block text-xs font-bold text-[#0F172A] mb-1.5">Gender</label>
                    <select value={aiForm.gender} onChange={e => setAiForm(p => ({ ...p, gender: e.target.value }))}
                      className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400">
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#0F172A] mb-1.5">Goal</label>
                    <select value={aiForm.goal} onChange={e => setAiForm(p => ({ ...p, goal: e.target.value }))}
                      className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400">
                      <option value="weight_loss">Weight Loss</option>
                      <option value="muscle_gain">Muscle Gain</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#0F172A] mb-1.5">Activity Level</label>
                    <select value={aiForm.activityLevel} onChange={e => setAiForm(p => ({ ...p, activityLevel: e.target.value }))}
                      className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400">
                      <option value="low">Low</option>
                      <option value="moderate">Moderate</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#0F172A] mb-1.5">Diet Type</label>
                    <select value={aiForm.dietType} onChange={e => setAiForm(p => ({ ...p, dietType: e.target.value }))}
                      className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400">
                      <option value="balanced">Balanced</option>
                      <option value="high_protein">High Protein</option>
                      <option value="vegetarian">Vegetarian</option>
                      <option value="keto">Keto</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#0F172A] mb-1.5">Allergies</label>
                    <input value={aiForm.allergies} placeholder="e.g. nuts, dairy"
                      onChange={e => setAiForm(p => ({ ...p, allergies: e.target.value }))}
                      className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400" />
                  </div>
                  <div className="col-span-2 sm:col-span-3">
                    <label className="block text-xs font-bold text-[#0F172A] mb-1.5">Notes <span className="font-normal text-[#94A3B8]">(optional)</span></label>
                    <input value={aiForm.notes} placeholder="e.g. diabetic, post-surgery, prefers no fish"
                      onChange={e => setAiForm(p => ({ ...p, notes: e.target.value }))}
                      className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400" />
                  </div>
                </div>

                {/* Generate button */}
                <motion.button
                  type="button"
                  onClick={handleGenerate}
                  disabled={aiGenLoading || !aiMember}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 text-white text-sm font-bold shadow-md shadow-violet-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {aiGenLoading ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                      Generating…
                    </>
                  ) : '✨ Generate Diet Plan'}
                </motion.button>

                {/* Preview + Send */}
                <AnimatePresence>
                  {previewPlan && (
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      className="space-y-3"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-violet-500" />
                        <p className="text-xs font-bold text-[#0F172A]">Preview — review before sending</p>
                        <span className="ml-auto text-[10px] text-[#94A3B8] bg-[#F1F5F9] px-2 py-0.5 rounded-full">
                          {previewPlan.source === 'openai' ? '✨ AI' : '📋 Rule-based'}
                        </span>
                      </div>
                      <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-4 max-h-72 overflow-y-auto">
                        <pre className="text-xs text-[#334155] whitespace-pre-wrap leading-relaxed font-sans">{previewPlan.text}</pre>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <motion.button
                          type="button"
                          onClick={() => { setPreviewPlan(null); }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.97 }}
                          className="py-3 rounded-xl border-2 border-[#E2E8F0] text-[#475569] text-sm font-bold hover:bg-[#F8FAFC] transition-all"
                        >
                          ↺ Regenerate
                        </motion.button>
                        <motion.button
                          type="button"
                          onClick={handleSend}
                          disabled={aiSendLoading}
                          whileHover={{ scale: 1.02, boxShadow: '0 8px 25px rgba(16,185,129,0.4)' }}
                          whileTap={{ scale: 0.97 }}
                          className="py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-bold shadow-md shadow-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {aiSendLoading ? (
                            <>
                              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                              Sending…
                            </>
                          ) : `📤 Send to ${aiMember?.name}`}
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>


      {visible.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-sm p-16 text-center">
          <div className="text-5xl mb-4">🥗</div>
          <p className="text-gray-900 font-bold text-lg mb-1">No diet plans yet</p>
          <p className="text-gray-400 text-sm">Members generate plans via AI Diet and submit them for your review.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {visible.map((p, i) => {
            const currentStatus = getPlanStatus(p);
            const st = STATUS_STYLE[currentStatus] || STATUS_STYLE.pending;
            const isOpen = expanded === p._id;
            const isPending = currentStatus === 'pending';
            const isApprovingThis = submitting === p._id + 'approve';
            const isRejectingThis = submitting === p._id + 'reject';
            return (
              <motion.div key={p._id}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                className={`bg-white rounded-3xl border shadow-sm overflow-hidden transition-all ${
                  isPending ? 'border-amber-200 shadow-amber-100/50' : 'border-[#E2E8F0]'
                }`}
              >
                {/* Gradient status bar */}
                <div className={`h-1.5 w-full bg-gradient-to-r ${st.bar}`} />

                <div className="p-5 space-y-4">
                  {/* Member info row */}
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3">
                      <motion.div
                        animate={{ boxShadow: isPending
                          ? ['0 4px 15px rgba(251,191,36,0.3)', '0 8px 25px rgba(251,191,36,0.5)', '0 4px 15px rgba(251,191,36,0.3)']
                          : ['0 4px 15px rgba(54,168,205,0.2)', '0 8px 25px rgba(54,168,205,0.4)', '0 4px 15px rgba(54,168,205,0.2)']
                        }}
                        transition={{ duration: 2.5, repeat: Infinity }}
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white font-black text-base flex-shrink-0 ${
                          isPending ? 'bg-gradient-to-br from-amber-400 to-orange-500' : 'bg-gradient-to-br from-[#36a8cd] to-[#2089ab]'
                        }`}
                      >
                        {p.userName?.charAt(0).toUpperCase()}
                      </motion.div>
                      <div>
                        <p className="font-bold text-[#0F172A]">{p.userName}</p>
                        <p className="text-xs text-[#94A3B8]">
                          {new Date(p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          {p.reviewedByName ? ` · Reviewed by ${p.reviewedByName}` : ''}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs font-bold px-3 py-1.5 rounded-full border flex-shrink-0 ${st.badge}`}>
                      {st.label}
                    </span>
                  </div>

                  {/* Plan metadata chips */}
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { icon: '🎯', val: p.input?.goal },
                      { icon: '🥦', val: p.input?.dietType },
                      { icon: '⚖️', val: p.input?.weightKg ? `${p.input.weightKg} kg` : null },
                      { icon: '📏', val: p.input?.heightCm ? `${p.input.heightCm} cm` : null },
                      { icon: '🎂', val: p.input?.age ? `Age ${p.input.age}` : null },
                    ].filter(c => c.val).map((c, ci) => (
                      <span key={ci} className="inline-flex items-center gap-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-1 text-xs font-semibold text-[#475569]">
                        {c.icon} {c.val}
                      </span>
                    ))}
                  </div>

                  {/* Previous trainer comment */}
                  {p.trainerComment && (
                    <div className={`rounded-2xl px-4 py-3 text-sm border ${
                      p.status === 'approved' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-700'
                    }`}>
                      <span className="font-bold">Your feedback:</span> {p.trainerComment}
                    </div>
                  )}

                  {/* ── APPROVE / REJECT PANEL (always visible for pending) ── */}
                  {isPending && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                      className="bg-amber-50/60 border border-amber-200 rounded-2xl p-4 space-y-3"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse flex-shrink-0" />
                        <p className="text-sm font-bold text-amber-800">Awaiting your review</p>
                      </div>
                      <textarea
                        value={comments[p._id] || ''}
                        onChange={e => setComments(prev => ({ ...prev, [p._id]: e.target.value }))}
                        placeholder="Leave a comment or feedback for the member (optional)…"
                        rows={2}
                        className="w-full bg-white border border-amber-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300/40 focus:border-amber-400 transition-all resize-none placeholder-amber-300"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <motion.button
                          whileHover={{ scale: 1.02, boxShadow: '0 6px 20px rgba(16,185,129,0.35)' }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => handleReview(p._id, 'approve')}
                          disabled={!!submitting}
                          className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-sm shadow-md shadow-emerald-200 disabled:opacity-60 transition-all"
                        >
                          {isApprovingThis ? (
                            <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
                              className="block w-4 h-4 border-2 border-white/50 border-t-white rounded-full" />
                          ) : '✅'}
                          {isApprovingThis ? 'Approving…' : 'Approve Plan'}
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02, boxShadow: '0 6px 20px rgba(244,63,94,0.35)' }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => handleReview(p._id, 'reject')}
                          disabled={!!submitting}
                          className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 text-white font-bold text-sm shadow-md shadow-rose-200 disabled:opacity-60 transition-all"
                        >
                          {isRejectingThis ? (
                            <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
                              className="block w-4 h-4 border-2 border-white/50 border-t-white rounded-full" />
                          ) : '❌'}
                          {isRejectingThis ? 'Sending…' : 'Request Revision'}
                        </motion.button>
                      </div>
                    </motion.div>
                  )}

                  {/* View plan toggle */}
                  <div className="flex justify-end">
                    <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                      onClick={() => setExpanded(isOpen ? null : p._id)}
                      className="px-4 py-2 rounded-xl bg-[#EFF9FD] text-[#36a8cd] border border-[#36a8cd]/20 text-xs font-bold hover:bg-[#36a8cd]/15 transition-colors"
                    >
                      {isOpen ? 'Hide Plan ▲' : 'View Full Plan ▼'}
                    </motion.button>
                  </div>

                  {/* Plan content */}
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
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
        </div>
      )}
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
      className="min-h-screen app-page pb-12"
    >
      {/* Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="bg-gradient-to-br from-[#0A0F1E] via-[#0F172A] to-[#0D1B26] rounded-3xl p-8 mx-4 mt-4 relative overflow-hidden"
      >
        {/* Floating particles */}
        <FloatingParticles count={14} />

        {/* Decorative blobs */}
        <motion.div
          animate={{ scale: [1, 1.4, 0.8, 1.2, 1], x: [0, 30, -20, 10, 0], opacity: [0.08, 0.2, 0.06, 0.15, 0.08] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-16 -right-16 w-64 h-64 bg-[#36a8cd] rounded-full blur-3xl pointer-events-none"
        />
        <motion.div
          animate={{ scale: [1, 1.4, 0.8, 1.2, 1], x: [0, -30, 20, -10, 0], opacity: [0.08, 0.2, 0.06, 0.15, 0.08] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute -bottom-12 left-12 w-48 h-48 bg-[#2089ab] rounded-full blur-3xl pointer-events-none"
        />

        {/* Shimmer sweep */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent rounded-3xl pointer-events-none"
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 4, repeat: Infinity, repeatDelay: 6, ease: 'easeInOut' }}
        />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <p className="text-[#66CCE0] text-sm font-medium mb-1">Trainer Portal</p>
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-3xl font-black text-white leading-tight"
            >
              Trainer Dashboard
            </motion.h1>
            {userInfo.name && (
              <p className="text-[#66CCE0] text-sm mt-1">{userInfo.name} · {userInfo.email}</p>
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
          className="bg-white rounded-2xl p-1.5 shadow-sm border border-[#E2E8F0] mb-6 flex overflow-x-auto"
        >
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative flex items-center gap-2 px-5 py-2.5 text-sm font-semibold whitespace-nowrap transition-all duration-200 flex-1 justify-center ${
                activeTab === tab.key
                  ? 'text-white'
                  : 'text-[#475569] hover:text-[#0F172A] hover:bg-[#F8FAFC] rounded-xl'
              }`}
            >
              {activeTab === tab.key && (
                <motion.div
                  layoutId="activeTrainerTab"
                  className="absolute inset-0 bg-[#36a8cd] rounded-xl shadow-md"
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
          {activeTab === 'diet-plans' && (
            <motion.div
              key="diet-plans"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <TrainerDietPlansTab />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default TrainerDashboard;
