import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import Cookies from 'js-cookie';

const API = import.meta.env.VITE_API_URL || 'https://fitness-nmmf.onrender.com/api';

const getAuthHeader = () => {
  const info = Cookies.get('userInfo');
  if (!info) return {};
  return { Authorization: `Bearer ${JSON.parse(info).token}` };
};

const roleColors = {
  trainer: 'bg-blue-100 text-blue-700 border-blue-200',
  user: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

// ── Modal ──────────────────────────────────────────────────────────────────────
const Modal = ({ title, onClose, children }) => (
  <AnimatePresence>
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 z-10"
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-300 transition-colors text-xl"
          >
            ×
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  </AnimatePresence>
);

// ── Input field ────────────────────────────────────────────────────────────────
const Field = ({ label, type = 'text', value, onChange, placeholder, required }) => (
  <div>
    <label className="block text-sm font-medium text-gray-200 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 border border-white/[0.12] rounded-xl text-sm bg-[#1C1C1C] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#36a8cd]/30 focus:border-[#36a8cd] transition-all"
    />
  </div>
);

// ── Confirm Delete Dialog ──────────────────────────────────────────────────────
const ConfirmDelete = ({ name, onConfirm, onCancel, loading }) => (
  <Modal title="Confirm Delete" onClose={onCancel}>
    <p className="text-gray-300 text-sm mb-6">
      Are you sure you want to delete <span className="font-semibold text-white">{name}</span>? This action cannot be undone.
    </p>
    <div className="flex gap-3 justify-end">
      <button onClick={onCancel} className="px-4 py-2 text-sm rounded-xl border border-gray-200 text-gray-300 hover:bg-gray-50 transition-colors">
        Cancel
      </button>
      <button onClick={onConfirm} disabled={loading} className="px-4 py-2 text-sm rounded-xl bg-red-500/100 text-white font-semibold hover:bg-red-600 disabled:opacity-50 transition-colors">
        {loading ? 'Deleting…' : 'Delete'}
      </button>
    </div>
  </Modal>
);

// ── Member Form ────────────────────────────────────────────────────────────────
const MemberForm = ({ initial, onSave, onClose, saving }) => {
  const [form, setForm] = useState({ name: '', email: '', password: '', fitnessGoals: '', ...initial });
  const set = key => val => setForm(f => ({ ...f, [key]: val }));

  return (
    <form
      onSubmit={e => { e.preventDefault(); onSave(form); }}
      className="space-y-4"
    >
      <Field label="Name" value={form.name} onChange={set('name')} placeholder="Full name" required />
      <Field label="Email" type="email" value={form.email} onChange={set('email')} placeholder="Email address" required />
      <Field label="Password" type="password" value={form.password} onChange={set('password')} placeholder={initial ? 'Leave blank to keep current' : 'Password'} required={!initial} />
      <Field label="Fitness Goals" value={form.fitnessGoals} onChange={set('fitnessGoals')} placeholder="e.g. Weight loss, muscle gain…" />
      <div className="flex gap-3 justify-end pt-2">
        <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-xl border border-gray-200 text-gray-300 hover:bg-gray-50 transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={saving} className="px-5 py-2 text-sm rounded-xl bg-black text-white font-semibold hover:bg-[#1C1C1C] disabled:opacity-50 transition-colors">
          {saving ? 'Saving…' : initial ? 'Save Changes' : 'Create Member'}
        </button>
      </div>
    </form>
  );
};

// ── Trainer Form ───────────────────────────────────────────────────────────────
const TrainerForm = ({ initial, onSave, onClose, saving }) => {
  const [form, setForm] = useState({ name: '', email: '', password: '', specialization: '', isVerified: true, ...initial });
  const set = key => val => setForm(f => ({ ...f, [key]: val }));

  return (
    <form
      onSubmit={e => { e.preventDefault(); onSave(form); }}
      className="space-y-4"
    >
      <Field label="Name" value={form.name} onChange={set('name')} placeholder="Full name" required />
      <Field label="Email" type="email" value={form.email} onChange={set('email')} placeholder="Email address" required />
      <Field label="Password" type="password" value={form.password} onChange={set('password')} placeholder={initial ? 'Leave blank to keep current' : 'Password'} required={!initial} />
      <Field label="Specialization" value={form.specialization} onChange={set('specialization')} placeholder="e.g. Yoga, Strength Training…" />
      <div className="flex items-center gap-2">
        <input
          id="verified"
          type="checkbox"
          checked={form.isVerified}
          onChange={e => setForm(f => ({ ...f, isVerified: e.target.checked }))}
          className="w-4 h-4 rounded accent-[#36a8cd]"
        />
        <label htmlFor="verified" className="text-sm font-medium text-gray-200">Verified Trainer</label>
      </div>
      <div className="flex gap-3 justify-end pt-2">
        <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-xl border border-gray-200 text-gray-300 hover:bg-gray-50 transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={saving} className="px-5 py-2 text-sm rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors">
          {saving ? 'Saving…' : initial ? 'Save Changes' : 'Create Trainer'}
        </button>
      </div>
    </form>
  );
};

// ── Row ────────────────────────────────────────────────────────────────────────
const Row = ({ item, type, onEdit, onDelete, onApprove, onToggleBlock, index }) => (
  <motion.div
    custom={index}
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0, transition: { delay: index * 0.04 } }}
    className={`flex items-center justify-between p-4 rounded-xl border transition-all group ${item.isBlocked ? 'bg-red-500/10 border-red-100' : 'bg-gray-50 border-white/[0.08] hover:bg-white hover:shadow-sm hover:border-[#E0F4FA]'}`}
  >
    <div className="flex items-center gap-3 min-w-0">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 bg-gradient-to-br ${item.isBlocked ? 'from-red-400 to-rose-500' : 'from-[#36a8cd] to-[#2089ab]'}`}>
        {item.name?.charAt(0).toUpperCase() || '?'}
      </div>
      <div className="min-w-0">
        <p className="font-semibold text-gray-100 text-sm group-hover:text-[#2089ab] transition-colors truncate">{item.name}</p>
        <p className="text-xs text-gray-400 truncate">{item.email}</p>
        {type === 'trainer' && item.specialization && (
          <p className="text-xs text-blue-500 truncate">{item.specialization}</p>
        )}
        {type === 'user' && item.fitnessGoals && (
          <p className="text-xs text-emerald-600 truncate">{item.fitnessGoals}</p>
        )}
      </div>
    </div>
    <div className="flex items-center gap-2 flex-shrink-0 ml-3 flex-wrap justify-end">
      {/* Trainer approval badge + button */}
      {type === 'trainer' && (
        <>
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${item.isVerified ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/100/15 text-amber-400 border-amber-200'}`}>
            {item.isVerified ? 'Approved' : 'Pending'}
          </span>
          {!item.isVerified && (
            <button
              onClick={() => onApprove(item._id)}
              className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold transition-colors"
            >
              Approve
            </button>
          )}
        </>
      )}
      {/* Block / Unblock */}
      <button
        onClick={() => onToggleBlock(item._id)}
        className={`px-2.5 py-1 rounded-lg text-white text-xs font-semibold transition-colors ${item.isBlocked ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500/100 hover:bg-red-600'}`}
      >
        {item.isBlocked ? 'Unblock' : 'Block'}
      </button>
      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${roleColors[type === 'trainer' ? 'trainer' : 'user']}`}>
        {type === 'trainer' ? '🏋️ Trainer' : '🏃 Member'}
      </span>
      <button
        onClick={() => onEdit(item)}
        className="p-2 rounded-lg hover:bg-black/10 text-gray-400 hover:text-[#36a8cd] transition-colors text-sm"
        title="Edit"
      >
        ✏️
      </button>
      <button
        onClick={() => onDelete(item)}
        className="p-2 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-colors text-sm"
        title="Delete"
      >
        🗑️
      </button>
    </div>
  </motion.div>
);

// ── Section (reusable Members / Trainers panel) ───────────────────────────────
const Section = ({ title, icon, accentClass, addLabel, items, type, loading, onAdd, onEdit, onDelete, onApprove, onToggleBlock }) => (
  <div className="bg-[#1C1C1C] rounded-2xl border border-white/[0.08] shadow-[0px_8px_25px_rgba(0,0,0,0.4)] overflow-hidden">
    {/* Section header */}
    <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08]">
      <div className="flex items-center gap-2">
        <span className="text-xl">{icon}</span>
        <h3 className="font-bold text-white">{title}</h3>
        <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-400">
          {items.length}
        </span>
      </div>
      <button
        onClick={onAdd}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white transition-colors ${accentClass}`}
      >
        + Add {addLabel}
      </button>
    </div>

    <div className="p-4">
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-14 rounded-xl bg-gray-100 relative overflow-hidden">
              <motion.div
                className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/60 to-transparent"
                animate={{ x: ['-150%', '200%'] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-10">
          <div className="text-4xl mb-2">{icon}</div>
          <p className="text-gray-400 text-sm">No {addLabel.toLowerCase()}s yet.</p>
          <button onClick={onAdd} className="mt-3 text-sm text-[#36a8cd] underline">
            Add the first {addLabel.toLowerCase()}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item, idx) => (
            <Row
              key={item._id}
              item={item}
              type={type}
              index={idx}
              onEdit={onEdit}
              onDelete={onDelete}
              onApprove={onApprove}
              onToggleBlock={onToggleBlock}
            />
          ))}
        </div>
      )}
    </div>
  </div>
);

// ── UserManagement ─────────────────────────────────────────────────────────────
const UserManagement = () => {
  const [members, setMembers] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await axios.get(`${API}/admin/users`, { headers: getAuthHeader() });
      setMembers(data.users || []);
      setTrainers(data.trainers || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const closeModal = () => { setModal(null); setModalError(''); };

  const handleSaveMember = async (form) => {
    setSaving(true);
    setModalError('');
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;
      if (modal.type === 'createMember') {
        const { data } = await axios.post(`${API}/admin/members`, payload, { headers: getAuthHeader() });
        setMembers(prev => [...prev, data]);
      } else {
        const { data } = await axios.put(`${API}/admin/members/${modal.target._id}`, payload, { headers: getAuthHeader() });
        setMembers(prev => prev.map(m => m._id === data._id ? data : m));
      }
      closeModal();
    } catch (err) {
      setModalError(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTrainer = async (form) => {
    setSaving(true);
    setModalError('');
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;
      if (modal.type === 'createTrainer') {
        const { data } = await axios.post(`${API}/admin/trainers`, payload, { headers: getAuthHeader() });
        setTrainers(prev => [...prev, data]);
      } else {
        const { data } = await axios.put(`${API}/admin/trainers/${modal.target._id}`, payload, { headers: getAuthHeader() });
        setTrainers(prev => prev.map(t => t._id === data._id ? data : t));
      }
      closeModal();
    } catch (err) {
      setModalError(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleApproveTrainer = async (id) => {
    try {
      const { data } = await axios.put(`${API}/admin/trainers/${id}/verify`, {}, { headers: getAuthHeader() });
      setTrainers(prev => prev.map(t => t._id === id ? { ...t, isVerified: true } : t));
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const handleToggleBlockMember = async (id) => {
    try {
      const { data } = await axios.put(`${API}/admin/members/${id}/block`, {}, { headers: getAuthHeader() });
      setMembers(prev => prev.map(m => m._id === id ? { ...m, isBlocked: data.isBlocked } : m));
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const handleToggleBlockTrainer = async (id) => {
    try {
      const { data } = await axios.put(`${API}/admin/trainers/${id}/block`, {}, { headers: getAuthHeader() });
      setTrainers(prev => prev.map(t => t._id === id ? { ...t, isBlocked: data.isBlocked } : t));
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    setModalError('');
    try {
      const { target, deleteType } = modal;
      if (deleteType === 'member') {
        await axios.delete(`${API}/admin/members/${target._id}`, { headers: getAuthHeader() });
        setMembers(prev => prev.filter(m => m._id !== target._id));
      } else {
        await axios.delete(`${API}/admin/trainers/${target._id}`, { headers: getAuthHeader() });
        setTrainers(prev => prev.filter(t => t._id !== target._id));
      }
      closeModal();
    } catch (err) {
      setModalError(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <motion.div
          className="p-3 bg-red-500/10 text-red-600 rounded-xl text-sm flex items-center gap-2 border border-red-100"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        >
          <span>⚠️</span> {error}
          <button onClick={fetchAll} className="ml-auto underline text-xs">Retry</button>
        </motion.div>
      )}

      {/* Members list */}
      <Section
        title="Members"
        icon="🏃"
        addLabel="Member"
        accentClass="bg-black hover:bg-[#1C1C1C]"
        items={members}
        type="user"
        loading={loading}
        onAdd={() => setModal({ type: 'createMember' })}
        onEdit={it => setModal({ type: 'editMember', target: it })}
        onDelete={it => setModal({ type: 'delete', target: it, deleteType: 'member' })}
        onToggleBlock={handleToggleBlockMember}
      />

      {/* Trainers list */}
      <Section
        title="Trainers"
        icon="🏋️"
        addLabel="Trainer"
        accentClass="bg-blue-600 hover:bg-blue-700"
        items={trainers}
        type="trainer"
        loading={loading}
        onAdd={() => setModal({ type: 'createTrainer' })}
        onEdit={it => setModal({ type: 'editTrainer', target: it })}
        onDelete={it => setModal({ type: 'delete', target: it, deleteType: 'trainer' })}
        onApprove={handleApproveTrainer}
        onToggleBlock={handleToggleBlockTrainer}
      />

      {/* Modals */}
      {modal?.type === 'createMember' && (
        <Modal title="Add New Member" onClose={closeModal}>
          {modalError && <p className="text-red-500 text-sm mb-3">{modalError}</p>}
          <MemberForm onSave={handleSaveMember} onClose={closeModal} saving={saving} />
        </Modal>
      )}
      {modal?.type === 'editMember' && (
        <Modal title="Edit Member" onClose={closeModal}>
          {modalError && <p className="text-red-500 text-sm mb-3">{modalError}</p>}
          <MemberForm initial={modal.target} onSave={handleSaveMember} onClose={closeModal} saving={saving} />
        </Modal>
      )}
      {modal?.type === 'createTrainer' && (
        <Modal title="Add New Trainer" onClose={closeModal}>
          {modalError && <p className="text-red-500 text-sm mb-3">{modalError}</p>}
          <TrainerForm onSave={handleSaveTrainer} onClose={closeModal} saving={saving} />
        </Modal>
      )}
      {modal?.type === 'editTrainer' && (
        <Modal title="Edit Trainer" onClose={closeModal}>
          {modalError && <p className="text-red-500 text-sm mb-3">{modalError}</p>}
          <TrainerForm initial={modal.target} onSave={handleSaveTrainer} onClose={closeModal} saving={saving} />
        </Modal>
      )}
      {modal?.type === 'delete' && (
        <ConfirmDelete
          name={modal.target.name}
          onConfirm={handleDelete}
          onCancel={closeModal}
          loading={saving}
        />
      )}
      {modal?.type === 'delete' && modalError && (
        <div className="fixed bottom-4 right-4 bg-red-500/10 border border-red-200 text-red-600 text-sm px-4 py-2 rounded-xl z-[60]">
          {modalError}
        </div>
      )}
    </div>
  );
};

export default UserManagement;
