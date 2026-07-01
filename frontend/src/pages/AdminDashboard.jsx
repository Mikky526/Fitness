import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import UserManagement from '../components/UserManagement';
import Cookies from 'js-cookie';
import { useCart } from '../context/CartContext';

const API = import.meta.env.VITE_API_URL || 'https://fitness-nmmf.onrender.com/api';

const getAuthHeader = () => {
  const info = Cookies.get('userInfo');
  return info ? { Authorization: `Bearer ${JSON.parse(info).token}` } : {};
};

// ─── Floating particles ───────────────────────────────────────────────────────
const FloatingParticles = ({ count = 12 }) => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {Array.from({ length: count }).map((_, i) => {
      const colors = ['bg-[#33B8D4]', 'bg-[#66CCE0]', 'bg-cyan-300', 'bg-blue-300'];
      const size = 2 + (i % 4);
      return (
        <motion.div
          key={i}
          className={`absolute rounded-full opacity-20 ${colors[i % colors.length]}`}
          style={{ width: size, height: size, left: `${(i * 7 + 3) % 93}%`, top: `${(i * 11 + 5) % 88}%` }}
          animate={{ y: [0, -(18 + i * 2), 5, 0], x: [0, i % 2 ? 14 : -14, 0], opacity: [0.1, 0.35, 0.1] }}
          transition={{ duration: 7 + i * 0.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.25 }}
        />
      );
    })}
  </div>
);

// ─── Tilt card ────────────────────────────────────────────────────────────────
const TiltCard = ({ children, className = '', onClick }) => {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useTransform(my, [-50, 50], [4, -4]);
  const ry = useTransform(mx, [-50, 50], [-4, 4]);
  return (
    <motion.div
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 800 }}
      onMouseMove={e => { const r = e.currentTarget.getBoundingClientRect(); mx.set(e.clientX - r.left - r.width / 2); my.set(e.clientY - r.top - r.height / 2); }}
      onMouseLeave={() => { mx.set(0); my.set(0); }}
      whileHover={{ scale: 1.03, zIndex: 10 }}
      transition={{ type: 'spring', stiffness: 250, damping: 22 }}
      onClick={onClick}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// ─── Skeleton row ─────────────────────────────────────────────────────────────
const SkeletonRow = () => (
  <div className="h-14 rounded-xl bg-gray-100 relative overflow-hidden">
    <motion.div
      className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/60 to-transparent"
      animate={{ x: ['-150%', '200%'] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
    />
  </div>
);

// ─── Status badge ─────────────────────────────────────────────────────────────
const statusColors = {
  pending:   'bg-amber-50 text-amber-700 border-amber-200',
  confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-red-50 text-red-600 border-red-200',
  succeeded: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  failed:    'bg-red-50 text-red-600 border-red-200',
};
const Badge = ({ label }) => (
  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${statusColors[label] || 'bg-gray-100 text-gray-500 border-gray-200'}`}>
    {label}
  </span>
);

// ─── Detail panel: Members ────────────────────────────────────────────────────
const MembersDetail = ({ items, loading, onToggleBlock }) => (
  <div className="space-y-2">
    {loading ? [1,2,3].map(i => <SkeletonRow key={i} />) : items.length === 0 ? (
      <p className="text-center text-gray-400 py-8 text-sm">No members found.</p>
    ) : items.map((m, i) => (
      <motion.div key={m._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0, transition: { delay: i * 0.04 } }}
        className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${m.isBlocked ? 'bg-red-50 border-red-100' : 'bg-[#F8FAFC] border-[#E2E8F0] hover:bg-white hover:border-[#36a8cd]/20'}`}>
        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 bg-gradient-to-br ${m.isBlocked ? 'from-red-400 to-rose-500' : 'from-[#36a8cd] to-[#2089ab]'}`}>
          {m.name?.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800 text-sm truncate">{m.name}</p>
          <p className="text-xs text-gray-500 truncate">{m.email}</p>
          {m.fitnessGoals && <p className="text-xs text-[#36a8cd] truncate">{m.fitnessGoals}</p>}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {m.isBlocked && <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-600 border border-red-200">Blocked</span>}
          <button
            onClick={() => onToggleBlock(m._id)}
            className={`px-2.5 py-1 rounded-lg text-white text-xs font-semibold transition-colors ${m.isBlocked ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'}`}
          >
            {m.isBlocked ? 'Unblock' : 'Block'}
          </button>
          <p className="text-xs text-gray-400">{new Date(m.createdAt).toLocaleDateString()}</p>
        </div>
      </motion.div>
    ))}
  </div>
);

// ─── Detail panel: Trainers ───────────────────────────────────────────────────
const TrainersDetail = ({ items, loading, onVerify, onToggleBlock }) => (
  <div className="space-y-2">
    {loading ? [1,2,3].map(i => <SkeletonRow key={i} />) : items.length === 0 ? (
      <p className="text-center text-gray-400 py-8 text-sm">No trainers found.</p>
    ) : items.map((t, i) => (
      <motion.div key={t._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0, transition: { delay: i * 0.04 } }}
        className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${t.isBlocked ? 'bg-red-50 border-red-100' : 'bg-[#F8FAFC] border-[#E2E8F0] hover:bg-white hover:border-[#36a8cd]/20'}`}>
        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 bg-gradient-to-br ${t.isBlocked ? 'from-red-400 to-rose-500' : 'from-[#36a8cd] to-[#2089ab]'}`}>
          {t.name?.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800 text-sm truncate">{t.name}</p>
          <p className="text-xs text-gray-500 truncate">{t.email}</p>
          {t.specialization && <p className="text-xs text-[#36a8cd] truncate">{t.specialization}</p>}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
          <Badge label={t.isVerified ? 'verified' : 'pending'} />
          {!t.isVerified && (
            <button
              onClick={() => onVerify(t._id)}
              className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold transition-colors"
            >
              Approve
            </button>
          )}
          {t.isBlocked && <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-600 border border-red-200">Blocked</span>}
          <button
            onClick={() => onToggleBlock(t._id)}
            className={`px-2.5 py-1 rounded-lg text-white text-xs font-semibold transition-colors ${t.isBlocked ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'}`}
          >
            {t.isBlocked ? 'Unblock' : 'Block'}
          </button>
        </div>
      </motion.div>
    ))}
  </div>
);

// ─── Detail panel: Appointments ───────────────────────────────────────────────
const AppointmentsDetail = ({ items, loading }) => (
  <div className="space-y-2">
    {loading ? [1,2,3].map(i => <SkeletonRow key={i} />) : items.length === 0 ? (
      <p className="text-center text-gray-400 py-8 text-sm">No appointments found.</p>
    ) : items.map((a, i) => (
      <motion.div key={a._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0, transition: { delay: i * 0.04 } }}
        className="flex items-center gap-3 p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-white hover:border-emerald-100 transition-all">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-lg flex-shrink-0">
          📅
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800 text-sm truncate">
            {a.user?.name || 'Unknown'} → {a.trainer?.name || 'Unknown'}
          </p>
          <p className="text-xs text-gray-500">
            {a.date ? new Date(a.date).toLocaleString() : '—'}
            {a.trainer?.specialization ? ` · ${a.trainer.specialization}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {a.isPaid && <Badge label="succeeded" />}
          <Badge label={a.status} />
        </div>
      </motion.div>
    ))}
  </div>
);

// ─── Detail panel: Revenue ────────────────────────────────────────────────────
const RevenueDetail = ({ items, loading }) => {
  const total = items.filter(p => p.status === 'succeeded').reduce((s, p) => s + p.amount, 0);
  return (
    <div>
      {!loading && items.length > 0 && (
        <div className="mb-4 p-3 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-between">
          <span className="text-sm font-medium text-orange-700">Total Collected</span>
          <span className="text-xl font-black text-orange-600">₹{total.toLocaleString()}</span>
        </div>
      )}
      <div className="space-y-2">
        {loading ? [1,2,3].map(i => <SkeletonRow key={i} />) : items.length === 0 ? (
          <p className="text-center text-gray-400 py-8 text-sm">No transactions found.</p>
        ) : items.map((p, i) => (
          <motion.div key={p._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0, transition: { delay: i * 0.04 } }}
            className="flex items-center gap-3 p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-white hover:border-orange-100 transition-all">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center text-white text-lg flex-shrink-0">
              💳
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-800 text-sm truncate">{p.user?.name || 'Unknown'}</p>
              <p className="text-xs text-gray-500 truncate">
                {p.cardBrand} ···{p.cardLast4} · {p.transactionId}
              </p>
              {p.items?.length > 0 && (
                <p className="text-xs text-orange-500 truncate">{p.items.map(it => it.name).join(', ')}</p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="font-bold text-gray-800 text-sm">₹{p.amount}</span>
              <Badge label={p.status} />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// ─── Admin Diet Plans Section ─────────────────────────────────────────────────
const AdminDietPlansSection = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [editing, setEditing] = useState(null);    // plan._id being edited
  const [editText, setEditText] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    fetch(`${API}/diet-plans`, { headers: getAuthHeader() })
      .then(r => r.json())
      .then(d => setPlans(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this diet plan?')) return;
    try {
      await fetch(`${API}/diet-plans/${id}`, { method: 'DELETE', headers: getAuthHeader() });
      setPlans(prev => prev.filter(p => p._id !== id));
      showToast('🗑️ Plan deleted.');
    } catch { showToast('⚠️ Delete failed.'); }
  };

  const handleSaveEdit = async (id) => {
    if (!editText.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`${API}/diet-plans/${id}`, {
        method: 'PUT',
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: editText }),
      });
      const updated = await res.json();
      setPlans(prev => prev.map(p => p._id === id ? updated : p));
      setEditing(null);
      showToast('✅ Plan updated.');
    } catch { showToast('⚠️ Save failed.'); }
    finally { setSaving(false); }
  };

  const STATUS_STYLE = {
    pending:  { bar: 'bg-amber-400',   badge: 'bg-amber-50 text-amber-700 border-amber-200',        dot: 'bg-amber-400' },
    approved: { bar: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',  dot: 'bg-emerald-500' },
    rejected: { bar: 'bg-rose-500',    badge: 'bg-rose-50 text-rose-600 border-rose-200',           dot: 'bg-rose-500' },
  };

  const visible = plans;

  if (loading) return (
    <div className="space-y-2">
      {[1,2,3].map(i => <SkeletonRow key={i} />)}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div key="toast" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="fixed top-4 right-4 bg-[#0F172A] text-white rounded-2xl px-5 py-3 shadow-xl z-50 font-semibold">
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {visible.length === 0 ? (
        <p className="text-center text-gray-400 py-8 text-sm">No diet plans found.</p>
      ) : (
        <div className="space-y-3">
          {visible.map((p, i) => {
            const st = STATUS_STYLE[p.status] || STATUS_STYLE.pending;
            const isOpen = expanded === p._id;
            const isEditing = editing === p._id;
            return (
              <motion.div key={p._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden"
              >
                <div className={`h-1 w-full ${st.bar}`} />
                <div className="p-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#36a8cd] to-[#2089ab] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {p.userName?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 text-sm">{p.userName}</p>
                      <p className="text-xs text-gray-500">
                        {p.input?.goal} · {p.input?.dietType} · {new Date(p.createdAt).toLocaleDateString()}
                      </p>
                      {p.reviewedByName && (
                        <p className="text-xs text-[#36a8cd]">Reviewed by {p.reviewedByName}</p>
                      )}
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border inline-flex items-center capitalize ${st.badge}`}>
                      {p.status}
                    </span>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button onClick={() => setExpanded(isOpen ? null : p._id)}
                        className="px-2.5 py-1 rounded-lg bg-[#EFF9FD] text-[#36a8cd] border border-[#36a8cd]/20 text-xs font-bold hover:bg-[#36a8cd]/15 transition-colors">
                        {isOpen ? 'Hide' : 'View'}
                      </button>
                      <button onClick={() => { setEditing(isEditing ? null : p._id); setEditText(p.plan); setExpanded(null); }}
                        className="px-2.5 py-1 rounded-lg bg-orange-50 text-orange-600 border border-orange-200 text-xs font-bold hover:bg-orange-100 transition-colors">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(p._id)}
                        className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 text-xs font-bold hover:bg-rose-100 transition-colors">
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* View plan */}
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                        <div className="mt-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] p-4 max-h-64 overflow-y-auto">
                          <pre className="text-xs text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">{p.plan}</pre>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Edit plan */}
                  <AnimatePresence>
                    {isEditing && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                        <div className="mt-3 space-y-2">
                          <textarea
                            value={editText}
                            onChange={e => setEditText(e.target.value)}
                            rows={8}
                            className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#36a8cd]/20 focus:border-[#36a8cd] resize-y transition-all"
                          />
                          <div className="flex gap-2">
                            <button onClick={() => handleSaveEdit(p._id)} disabled={saving}
                              className="px-4 py-2 rounded-xl bg-[#36a8cd] text-white text-xs font-bold hover:bg-[#2089ab] disabled:opacity-60 transition-colors">
                              {saving ? 'Saving…' : 'Save Changes'}
                            </button>
                            <button onClick={() => setEditing(null)}
                              className="px-4 py-2 rounded-xl bg-gray-100 text-gray-600 text-xs font-bold hover:bg-gray-200 transition-colors">
                              Cancel
                            </button>
                          </div>
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
    </div>
  );
};

// ─── AdminDashboard ───────────────────────────────────────────────────────────
const AdminDashboard = () => {
  const [platformStats, setPlatformStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [activeCard, setActiveCard] = useState(null); // 'members' | 'trainers' | 'appointments' | 'revenue'

  // Per-detail data
  const [members, setMembers] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [payments, setPayments] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');

  useEffect(() => {
    fetch(`${API}/admin/stats`, { headers: getAuthHeader() })
      .then(r => r.json())
      .then(data => setPlatformStats(data))
      .catch(() => setPlatformStats(null))
      .finally(() => setStatsLoading(false));
  }, []);

  const handleVerify = useCallback(async (trainerId) => {
    try {
      const res = await fetch(`${API}/admin/trainers/${trainerId}/verify`, { method: 'PUT', headers: getAuthHeader() });
      if (!res.ok) throw new Error('Approve failed');
      setTrainers(prev => prev.map(t => t._id === trainerId ? { ...t, isVerified: true } : t));
    } catch (err) {
      setDetailError(err.message);
    }
  }, []);

  const handleToggleBlockMember = useCallback(async (memberId) => {
    try {
      const res = await fetch(`${API}/admin/members/${memberId}/block`, { method: 'PUT', headers: getAuthHeader() });
      if (!res.ok) throw new Error('Block toggle failed');
      const data = await res.json();
      setMembers(prev => prev.map(m => m._id === memberId ? { ...m, isBlocked: data.isBlocked } : m));
    } catch (err) {
      setDetailError(err.message);
    }
  }, []);

  const handleToggleBlockTrainer = useCallback(async (trainerId) => {
    try {
      const res = await fetch(`${API}/admin/trainers/${trainerId}/block`, { method: 'PUT', headers: getAuthHeader() });
      if (!res.ok) throw new Error('Block toggle failed');
      const data = await res.json();
      setTrainers(prev => prev.map(t => t._id === trainerId ? { ...t, isBlocked: data.isBlocked } : t));
    } catch (err) {
      setDetailError(err.message);
    }
  }, []);

  const fetchDetail = useCallback(async (key) => {
    if (key === activeCard) { setActiveCard(null); return; }
    setActiveCard(key);
    setDetailLoading(true);
    setDetailError('');
    try {
      if (key === 'members' || key === 'trainers') {
        const res = await fetch(`${API}/admin/users`, { headers: getAuthHeader() });
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        const data = await res.json();
        // handle both array (old) and object (new) response shapes
        if (Array.isArray(data)) {
          setMembers(data.filter(u => u.role === 'user'));
          setTrainers(data.filter(u => u.role === 'trainer'));
        } else {
          setMembers(data.users || []);
          setTrainers(data.trainers || []);
        }
      } else if (key === 'appointments') {
        const res = await fetch(`${API}/admin/appointments`, { headers: getAuthHeader() });
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        const data = await res.json();
        setAppointments(Array.isArray(data) ? data : []);
      } else if (key === 'revenue') {
        const res = await fetch(`${API}/payments/all`, { headers: getAuthHeader() });
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        const data = await res.json();
        setPayments(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      setDetailError(err.message || 'Failed to load data');
    } finally {
      setDetailLoading(false);
    }
  }, [activeCard]);

  const statCards = platformStats ? [
    { key: 'members',      label: 'Total Members',  value: platformStats.users ?? 0,         icon: '🏃', gradient: 'from-[#36a8cd] to-[#2089ab]', ring: 'ring-[#36a8cd]' },
    { key: 'trainers',     label: 'Total Trainers', value: platformStats.trainers ?? 0,      icon: '🏋️', gradient: 'from-blue-500 to-cyan-500',    ring: 'ring-blue-400' },
    { key: 'appointments', label: 'Appointments',   value: platformStats.appointments ?? 0,  icon: '📅', gradient: 'from-emerald-500 to-teal-500', ring: 'ring-emerald-400' },
    { key: 'revenue',      label: 'Revenue (₹)',    value: `₹${platformStats.revenue ?? 0}`, icon: '💰', gradient: 'from-orange-400 to-rose-500',  ring: 'ring-orange-400' },
  ] : [];

  const detailTitles = {
    members:      '🏃 Members List',
    trainers:     '🏋️ Trainers List',
    appointments: '📅 All Appointments',
    revenue:      '💰 Revenue & Transactions',
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="min-h-screen bg-[#F8FAFC] pb-8">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="bg-gradient-to-br from-[#0A0F1E] via-[#0F172A] to-[#0D1B26] rounded-3xl p-8 mx-4 mt-4 relative overflow-hidden"
      >
        <FloatingParticles count={12} />
        <motion.div animate={{ scale: [1, 1.4, 0.8, 1.2, 1], x: [0, 30, -20, 10, 0], opacity: [0.08, 0.2, 0.06, 0.15, 0.08] }} transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-16 -right-16 w-64 h-64 bg-[#36a8cd] rounded-full blur-3xl pointer-events-none" />
        <motion.div animate={{ scale: [1, 1.4, 0.8, 1.2, 1], x: [0, -30, 20, -10, 0], opacity: [0.08, 0.2, 0.06, 0.15, 0.08] }} transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
          className="absolute -bottom-12 left-12 w-48 h-48 bg-[#2089ab] rounded-full blur-3xl pointer-events-none" />
        <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent rounded-3xl pointer-events-none"
          animate={{ x: ['-100%', '200%'] }} transition={{ duration: 4, repeat: Infinity, repeatDelay: 6, ease: 'easeInOut' }} />
        <div className="absolute top-6 right-6">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }} className="text-5xl opacity-20 select-none">⚙️</motion.div>
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <motion.span animate={{ scale: [1, 1.6, 1], opacity: [1, 0.4, 1] }} transition={{ duration: 1.8, repeat: Infinity }}
              className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
            <span className="text-emerald-300 text-sm font-medium">System Online</span>
          </div>
          <h1 className="text-3xl font-black text-white mb-1">Admin Dashboard</h1>
          <p className="text-[#66CCE0]/70 text-sm">Click a stat card to view its details.</p>
        </div>
      </motion.div>

      <div className="px-4 mt-8 space-y-8">

        {/* Stat cards */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-[#0F172A]">Platform Overview</h2>
            <span className="text-xs text-gray-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live from database
            </span>
          </div>

          {statsLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[1,2,3,4].map(i => (
                <div key={i} className="relative overflow-hidden bg-gray-100 rounded-3xl h-40">
                  <motion.div className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/50 to-transparent"
                    animate={{ x: ['-150%', '200%'] }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }} />
                </div>
              ))}
            </div>
          ) : (
            <motion.div className="grid grid-cols-2 lg:grid-cols-4 gap-4"
              initial="hidden" animate="visible"
              variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } }}
            >
              {statCards.map((s, i) => {
                const isActive = activeCard === s.key;
                return (
                  <motion.div key={s.key}
                    variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}
                    whileHover={{ y: -6, boxShadow: '0 20px 50px rgba(54,168,205,0.2)' }}
                  >
                    <TiltCard
                      onClick={() => fetchDetail(s.key)}
                      className={`bg-white rounded-3xl p-6 border shadow-sm cursor-pointer h-full transition-all duration-200 ${
                        isActive ? `border-2 ${s.ring} ring-2 ring-offset-1 ${s.ring}` : 'border-[#E2E8F0]'
                      }`}
                    >
                      <motion.div animate={{ rotate: [0, -5, 5, 0], scale: [1, 1.05, 1] }} transition={{ duration: 3, repeat: Infinity, delay: i * 0.5 }}
                        className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${s.gradient} flex items-center justify-center text-2xl shadow-md`}>
                        {s.icon}
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.3 + i * 0.1 }}
                        className={`text-4xl font-black mt-4 bg-gradient-to-r ${s.gradient} bg-clip-text text-transparent`}
                      >
                        {s.value}
                      </motion.div>
                      <div className="text-sm font-medium text-[#475569] mt-1">{s.label}</div>
                      <div className="flex items-center justify-between mt-4">
                        <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
                          transition={{ duration: 0.8, delay: 0.5 + i * 0.1 }} style={{ transformOrigin: 'left' }}
                          className={`flex-1 h-1 bg-gradient-to-r ${s.gradient} rounded-full`} />
                        <span className={`ml-3 text-xs font-semibold transition-colors ${isActive ? 'text-[#36a8cd]' : 'text-[#94A3B8]'}`}>
                          {isActive ? 'Hide ▲' : 'View ▼'}
                        </span>
                      </div>
                    </TiltCard>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {/* Detail panel */}
          <AnimatePresence mode="wait">
            {activeCard && (
              <motion.div
                key={activeCard}
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                style={{ marginTop: 20 }}
              >
                <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0]">
                    <h3 className="font-bold text-[#0F172A]">{detailTitles[activeCard]}</h3>
                    <button onClick={() => { setActiveCard(null); setDetailError(''); }}
                      className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors text-lg">
                      ×
                    </button>
                  </div>
                  {detailError && (
                    <div className="mx-4 mt-3 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl">
                      ⚠️ {detailError}
                    </div>
                  )}
                  <div className="p-4 max-h-96 overflow-y-auto">
                    {activeCard === 'members'      && <MembersDetail      items={members}      loading={detailLoading} onToggleBlock={handleToggleBlockMember} />}
                    {activeCard === 'trainers'     && <TrainersDetail     items={trainers}     loading={detailLoading} onVerify={handleVerify} onToggleBlock={handleToggleBlockTrainer} />}
                    {activeCard === 'appointments' && <AppointmentsDetail items={appointments} loading={detailLoading} />}
                    {activeCard === 'revenue'      && <RevenueDetail      items={payments}     loading={detailLoading} />}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Diet Plans Management */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
          <h2 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-base shadow-md shadow-emerald-200/50">🥗</span>
            AI Diet Plans
          </h2>
          <AdminDietPlansSection />
        </motion.div>

        {/* User Management */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
          <h2 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#36a8cd] to-[#2089ab] flex items-center justify-center text-base shadow-md shadow-[#36a8cd]/30">🛡️</span>
            User Management
          </h2>
          <UserManagement />
        </motion.div>

        {/* Plans & Sessions Management */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
          <h2 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center text-base shadow-md shadow-orange-200/50">🏷️</span>
            Plans &amp; Sessions
          </h2>
          <ProductManagement />
        </motion.div>

      </div>
    </motion.div>
  );
};

// ─── TYPE options ─────────────────────────────────────────────────────────────
const TYPE_OPTIONS = ['membership', 'session', 'package', 'consultation', 'class'];
const GRADIENT_OPTIONS = [
  'from-blue-500 to-indigo-600',
  'from-purple-500 to-indigo-600',
  'from-orange-400 to-rose-500',
  'from-emerald-500 to-teal-600',
  'from-green-400 to-emerald-500',
  'from-pink-400 to-rose-500',
  'from-yellow-400 to-orange-500',
  'from-cyan-400 to-blue-500',
];
const BG_OPTIONS = [
  'bg-blue-50', 'bg-purple-50', 'bg-orange-50',
  'bg-emerald-50', 'bg-green-50', 'bg-pink-50',
  'bg-yellow-50', 'bg-cyan-50',
];

// ─── Product Modal ─────────────────────────────────────────────────────────────
const ProductModal = ({ initial, onSave, onClose, saving, error }) => {
  const [form, setForm] = useState({
    name: '', description: '', price: '', type: 'membership',
    icon: '⭐', color: GRADIENT_OPTIONS[0], bg: BG_OPTIONS[0], badge: '',
    ...initial,
    price: initial?.price ?? '',
  });
  const set = (key) => (val) => setForm(f => ({ ...f, [key]: val }));

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <motion.div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <motion.div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 z-10 max-h-[90vh] overflow-y-auto"
          initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }} transition={{ type: 'spring', stiffness: 300, damping: 25 }}>
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold text-gray-900">{initial ? 'Edit Plan / Session' : 'Add New Plan / Session'}</h3>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 text-xl">×</button>
          </div>
          {error && <p className="text-red-500 text-sm mb-3 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}
          <form onSubmit={e => { e.preventDefault(); onSave({ ...form, price: Number(form.price) }); }} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
              <input value={form.name} onChange={e => set('name')(e.target.value)} required placeholder="e.g. Premium Membership"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-red-500">*</span></label>
              <textarea value={form.description} onChange={e => set('description')(e.target.value)} required rows={2}
                placeholder="Short description shown on the card…"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none" />
            </div>
            {/* Price + Type */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹) <span className="text-red-500">*</span></label>
                <input type="number" min="0" value={form.price} onChange={e => set('price')(e.target.value)} required placeholder="2499"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type <span className="text-red-500">*</span></label>
                <select value={form.type} onChange={e => set('type')(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white">
                  {TYPE_OPTIONS.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
            </div>
            {/* Icon + Badge */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Icon (emoji)</label>
                <input value={form.icon} onChange={e => set('icon')(e.target.value)} placeholder="⭐"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Badge (optional)</label>
                <input value={form.badge || ''} onChange={e => set('badge')(e.target.value)} placeholder="Best Value"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
            </div>
            {/* Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Card Color</label>
              <div className="flex flex-wrap gap-2">
                {GRADIENT_OPTIONS.map((g, i) => (
                  <button key={g} type="button" onClick={() => { set('color')(g); set('bg')(BG_OPTIONS[i] || BG_OPTIONS[0]); }}
                    className={`w-8 h-8 rounded-full bg-gradient-to-br ${g} border-2 transition-all ${form.color === g ? 'border-gray-800 scale-125' : 'border-transparent'}`} />
                ))}
              </div>
            </div>
            {/* Preview */}
            <div className={`rounded-2xl p-4 ${form.bg} border border-gray-100`}>
              <div className="flex items-center gap-3">
                <span className="text-3xl">{form.icon || '⭐'}</span>
                <div>
                  <p className="font-bold text-gray-900">{form.name || 'Plan Name'}</p>
                  <p className={`text-lg font-black bg-gradient-to-r ${form.color} bg-clip-text text-transparent`}>
                    ₹{Number(form.price || 0).toLocaleString('en-IN')}
                  </p>
                </div>
                {form.badge && <span className="ml-auto px-2 py-0.5 rounded-full text-xs font-bold bg-white text-gray-700 border">{form.badge}</span>}
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={saving}
                className="px-5 py-2 text-sm rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 text-white font-semibold hover:opacity-90 disabled:opacity-50">
                {saving ? 'Saving…' : initial ? 'Save Changes' : 'Add Plan'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ─── ProductManagement ─────────────────────────────────────────────────────────
const ProductManagement = () => {
  const { products, productsLoading, refreshProducts } = useCart();
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const closeModal = () => { setModal(null); setModalError(''); };

  const handleSave = async (form) => {
    setSaving(true);
    setModalError('');
    try {
      const headers = { ...getAuthHeader(), 'Content-Type': 'application/json' };
      if (modal === 'create') {
        await fetch(`${API}/products`, { method: 'POST', headers, body: JSON.stringify(form) });
      } else {
        await fetch(`${API}/products/${modal._id}`, { method: 'PUT', headers, body: JSON.stringify(form) });
      }
      refreshProducts();
      closeModal();
    } catch (err) {
      setModalError(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await fetch(`${API}/products/${deleteTarget._id}`, { method: 'DELETE', headers: getAuthHeader() });
      refreshProducts();
      setDeleteTarget(null);
    } catch (err) {
      setError(err.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const TYPE_COLORS = {
    membership: 'bg-[#EFF9FD] text-[#36a8cd]',
    session: 'bg-orange-100 text-orange-700',
    package: 'bg-emerald-100 text-emerald-700',
    consultation: 'bg-green-100 text-green-700',
    class: 'bg-pink-100 text-pink-700',
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0]">
        <div className="flex items-center gap-2">
          <span className="font-bold text-[#0F172A]">All Plans &amp; Sessions</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#EFF9FD] text-[#36a8cd] border border-[#36a8cd]/20">{products.length}</span>
        </div>
        <button onClick={() => setModal('create')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-orange-500 to-rose-500 hover:opacity-90 transition-opacity">
          + Add Plan
        </button>
      </div>

      {error && (
        <div className="mx-4 mt-3 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl">⚠️ {error}</div>
      )}

      <div className="p-4">
        {productsLoading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="h-14 rounded-xl bg-gray-100 relative overflow-hidden">
                <motion.div className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/60 to-transparent"
                  animate={{ x: ['-150%', '200%'] }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }} />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-4xl mb-2">🏷️</p>
            <p className="text-gray-400 text-sm">No plans yet.</p>
            <button onClick={() => setModal('create')} className="mt-3 text-sm text-orange-600 underline">Add the first plan</button>
          </div>
        ) : (
          <div className="space-y-2">
            {products.map((p, i) => (
              <motion.div key={p._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0, transition: { delay: i * 0.04 } }}
                className="flex items-center gap-3 p-4 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] hover:bg-white hover:border-[#36a8cd]/20 hover:shadow-sm transition-all group">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${p.color} flex items-center justify-center text-xl flex-shrink-0 shadow-sm`}>
                  {p.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-800 text-sm truncate group-hover:text-orange-700 transition-colors">{p.name}</p>
                    {p.badge && <span className="px-1.5 py-0.5 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700 border border-yellow-200 flex-shrink-0">{p.badge}</span>}
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{p.description}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${TYPE_COLORS[p.type] || 'bg-gray-100 text-gray-600'}`}>
                    {p.type}
                  </span>
                  <span className="font-black text-gray-900 text-sm">₹{p.price.toLocaleString('en-IN')}</span>
                  <button onClick={() => setModal(p)} className="p-2 rounded-lg hover:bg-orange-50 text-gray-400 hover:text-orange-600 transition-colors text-sm" title="Edit">✏️</button>
                  <button onClick={() => setDeleteTarget(p)} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors text-sm" title="Delete">🗑️</button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit modal */}
      {modal && (
        <ProductModal
          initial={modal === 'create' ? null : modal}
          onSave={handleSave}
          onClose={closeModal}
          saving={saving}
          error={modalError}
        />
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <AnimatePresence>
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
            <motion.div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 z-10"
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Plan</h3>
              <p className="text-gray-600 text-sm mb-6">
                Are you sure you want to delete <span className="font-semibold text-gray-900">{deleteTarget.name}</span>? This cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-sm rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50">Cancel</button>
                <button onClick={handleDelete} disabled={deleting} className="px-4 py-2 text-sm rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 disabled:opacity-50">
                  {deleting ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
};

export default AdminDashboard;
