import React, { useContext, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

const initialForm = {
  age: '',
  gender: 'other',
  heightCm: '',
  weightKg: '',
  goal: 'maintenance',
  activityLevel: 'moderate',
  dietType: 'balanced',
  allergies: '',
  notes: '',
};

const OPTIONS = {
  gender: [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
  ],
  goal: [
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'weight_loss', label: 'Weight Loss' },
    { value: 'muscle_gain', label: 'Muscle Gain' },
  ],
  activityLevel: [
    { value: 'low', label: 'Low' },
    { value: 'moderate', label: 'Moderate' },
    { value: 'high', label: 'High' },
  ],
  dietType: [
    { value: 'balanced', label: 'Balanced' },
    { value: 'high_protein', label: 'High Protein' },
    { value: 'vegetarian', label: 'Vegetarian' },
    { value: 'keto', label: 'Keto' },
  ],
};

const PROFILE_FIELDS = [
  { name: 'age', label: 'Age', type: 'number', min: 12, max: 100, required: true },
  { name: 'gender', label: 'Gender', type: 'select', options: OPTIONS.gender },
  { name: 'heightCm', label: 'Height (cm)', type: 'number', min: 120, max: 230, required: true },
  { name: 'weightKg', label: 'Weight (kg)', type: 'number', min: 35, max: 250, required: true },
  { name: 'goal', label: 'Goal', type: 'select', options: OPTIONS.goal },
  { name: 'activityLevel', label: 'Activity Level', type: 'select', options: OPTIONS.activityLevel },
];

const PRESETS = [
  { label: '🔥 Cut Mode', desc: 'Weight loss plan', preset: { goal: 'weight_loss', activityLevel: 'moderate', dietType: 'balanced' }, color: 'from-rose-500 to-orange-500' },
  { label: '💪 Build Mode', desc: 'Muscle gain plan', preset: { goal: 'muscle_gain', activityLevel: 'high', dietType: 'high_protein' }, color: 'from-[#36a8cd] to-[#2089ab]' },
  { label: '🌿 Plant Focus', desc: 'Vegetarian plan', preset: { goal: 'maintenance', activityLevel: 'moderate', dietType: 'vegetarian' }, color: 'from-emerald-500 to-teal-600' },
];

const FloatingParticles = ({ count = 14 }) => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {Array.from({ length: count }).map((_, i) => {
      const colors = ['bg-[#33B8D4]', 'bg-[#33B8D4]', 'bg-[#66CCE0]', 'bg-blue-300', 'bg-cyan-300'];
      const size = 2 + (i % 5);
      return (
        <motion.div
          key={i}
          className={`absolute rounded-full opacity-20 ${colors[i % colors.length]}`}
          style={{ width: size, height: size, left: `${(i * 8 + 5) % 94}%`, top: `${(i * 11 + 7) % 87}%` }}
          animate={{ y: [0, -(18 + i * 2), 6, 0], x: [0, i % 2 ? 12 : -12, 0], opacity: [0.1, 0.35, 0.1], scale: [1, 1.4, 0.8, 1] }}
          transition={{ duration: 7 + i * 0.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.25 }}
        />
      );
    })}
  </div>
);

const LabeledField = ({ label, children }) => (
  <label className="block">
    <span className="text-sm text-[#0F172A] font-semibold block mb-1.5">{label}</span>
    {children}
  </label>
);

const inputClass = "w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#36a8cd]/20 focus:border-[#36a8cd] transition-all text-sm text-[#0F172A] placeholder-[#94A3B8]";

const EASE = [0.22, 1, 0.36, 1];

const AIDietPlanner = () => {
  const { user } = useContext(AuthContext);
  const [form, setForm] = useState(initialForm);
  const [plan, setPlan] = useState('');
  const [source, setSource] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activePreset, setActivePreset] = useState(null);

  const apiBaseUrl =
    import.meta.env.VITE_API_URL ||
    `${window.location.protocol}//${window.location.hostname}:5001/api`;

  const canSubmit = useMemo(() => {
    return form.age && form.heightCm && form.weightKg && form.goal && form.activityLevel;
  }, [form]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const setPreset = (preset, index) => {
    setForm((prev) => ({ ...prev, ...preset }));
    setActivePreset(index);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setPlan('');
    setSource('');

    if (!user?.token) {
      setError('Please login again. Token is missing.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post(
        `${apiBaseUrl}/ai/diet-plan`,
        { ...form, name: user.name },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      setPlan(data.plan || 'No plan generated.');
      setSource(data.source || 'unknown');
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        'Something went wrong while generating the diet plan'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE }}
      className="max-w-7xl mx-auto py-6 md:py-8 px-4 min-h-screen bg-[#F8FAFC]"
    >
      {/* Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE }}
        className="bg-gradient-to-br from-[#0A0F1E] via-[#0F172A] to-[#0D1B26] rounded-3xl p-8 md:p-10 text-white shadow-2xl border border-white/10 relative overflow-hidden mb-8"
      >
        {/* Dot grid */}
        <div className="absolute inset-0 hero-grid rounded-3xl pointer-events-none" />

        {/* Floating particles */}
        <FloatingParticles count={14} />

        {/* Gradient overlays */}
        <motion.div
          className="absolute inset-0 rounded-3xl pointer-events-none"
          animate={{ backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
          style={{
            background: 'radial-gradient(ellipse at 15% 25%, rgba(54,168,205,0.2) 0%, transparent 50%), radial-gradient(ellipse at 85% 75%, rgba(54,168,205,0.15) 0%, transparent 50%)',
            backgroundSize: '200% 200%',
          }}
        />

        {/* Decorative blobs */}
        <motion.div
          animate={{ scale: [1, 1.2, 1], x: [0, 20, 0], y: [0, -15, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-20 -right-20 w-64 h-64 bg-[#36a8cd] rounded-full opacity-[0.08] blur-3xl pointer-events-none"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], x: [0, -20, 0], y: [0, 15, 0] }}
          transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute -bottom-16 -left-16 w-56 h-56 bg-[#36a8cd] rounded-full opacity-[0.08] blur-3xl pointer-events-none"
        />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, ease: EASE }}
            >
              <span className="inline-flex items-center gap-2 bg-white/10 border border-white/15 text-[#CCEEf9] text-xs font-bold px-3 py-1.5 rounded-full mb-4 backdrop-blur-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-[#33B8D4] animate-pulse" />
                Nutrition Intelligence
              </span>
            </motion.div>
            <motion.h1
              className="text-3xl md:text-5xl font-black tracking-tight text-white font-['Kanit']"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, ease: EASE }}
            >
              AI Diet Planner
            </motion.h1>
            <motion.p
              className="mt-3 text-[#A5F3FC]/80 max-w-2xl text-sm md:text-base"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, ease: EASE }}
            >
              Personalized 7-day diet plans powered by AI. Fill in your profile, choose a preset, and generate your plan in seconds.
            </motion.p>
          </div>

          <motion.div
            className="grid grid-cols-3 gap-2 text-center min-w-[250px]"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, ease: EASE }}
          >
            {[
              { label: 'Output', value: '7 Day Plan' },
              { label: 'Format', value: 'Meals + g' },
              { label: 'Engine', value: 'Hybrid AI' },
            ].map(({ label, value }) => (
              <motion.div
                key={label}
                whileHover={{ scale: 1.05, y: -2 }}
                className="rounded-2xl bg-white/10 border border-white/20 py-3 px-2 backdrop-blur-sm cursor-default"
              >
                <p className="text-[10px] text-[#CCEEf9]/75 uppercase tracking-wider">{label}</p>
                <p className="text-sm font-bold text-white mt-0.5">{value}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left — Form */}
        <motion.form
          onSubmit={onSubmit}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.5, ease: EASE }}
          className="bg-white rounded-3xl border border-[#E2E8F0] shadow-sm p-6 md:p-7 space-y-5"
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-[#0F172A]">Member Details</h2>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#EFF9FD] text-[#36a8cd] border border-[#36a8cd]/20">
              Personalized
            </span>
          </div>

          {/* Quick Presets */}
          <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
            <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-3">Quick Presets</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {PRESETS.map(({ label, desc, preset, color }, i) => (
                <motion.button
                  key={i}
                  type="button"
                  onClick={() => setPreset(preset, i)}
                  whileHover={{ scale: 1.04, y: -2 }}
                  whileTap={{ scale: 0.96 }}
                  className={`relative rounded-2xl p-3 border-2 transition-all text-left overflow-hidden ${
                    activePreset === i
                      ? 'border-transparent text-white'
                      : 'border-[#E2E8F0] bg-white text-[#475569] hover:border-[#36a8cd]/40'
                  }`}
                >
                  {activePreset === i && (
                    <motion.div
                      layoutId="presetBg"
                      className={`absolute inset-0 bg-gradient-to-br ${color}`}
                      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                    />
                  )}
                  <span className="relative z-10 block text-sm font-bold">{label}</span>
                  <span className={`relative z-10 block text-xs mt-0.5 ${activePreset === i ? 'text-white/80' : 'text-[#94A3B8]'}`}>{desc}</span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Profile fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PROFILE_FIELDS.map((field, i) => (
              <motion.div
                key={field.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05, ease: EASE }}
              >
                <LabeledField label={field.label}>
                  {field.type === 'select' ? (
                    <select
                      name={field.name}
                      value={form[field.name]}
                      onChange={onChange}
                      className={inputClass}
                    >
                      {field.options.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      name={field.name}
                      value={form[field.name]}
                      onChange={onChange}
                      type={field.type}
                      min={field.min}
                      max={field.max}
                      required={field.required}
                      className={inputClass}
                    />
                  )}
                </LabeledField>
              </motion.div>
            ))}
          </div>

          <LabeledField label="Diet Type">
            <select name="dietType" value={form.dietType} onChange={onChange} className={inputClass}>
              {OPTIONS.dietType.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </LabeledField>

          <LabeledField label="Allergies">
            <input
              name="allergies"
              value={form.allergies}
              onChange={onChange}
              type="text"
              placeholder="e.g. nuts, lactose"
              className={inputClass}
            />
          </LabeledField>

          <LabeledField label="Notes">
            <textarea
              name="notes"
              value={form.notes}
              onChange={onChange}
              rows={3}
              placeholder="Any medical or preference notes"
              className={`${inputClass} resize-none`}
            />
          </LabeledField>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-[#FEF2F2] border border-[#FCA5A5] text-[#EF4444] rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-2"
              >
                <span>⚠️</span> {error}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            type="submit"
            disabled={!canSubmit || loading}
            whileHover={canSubmit ? { scale: 1.02, boxShadow: '0 12px 30px rgba(54,168,205,0.4)' } : {}}
            whileTap={canSubmit ? { scale: 0.98 } : {}}
            animate={{
              boxShadow: canSubmit && !loading ? [
                '0 4px 15px rgba(54,168,205,0.3)',
                '0 4px 25px rgba(54,168,205,0.5)',
                '0 4px 15px rgba(54,168,205,0.3)',
              ] : '0 0 0 rgba(0,0,0,0)',
            }}
            transition={{ boxShadow: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' } }}
            className="w-full rounded-xl bg-[#36a8cd] hover:bg-[#2089ab] text-white font-bold px-4 py-4 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                {[0, 1, 2].map(i => (
                  <motion.span
                    key={i}
                    className="w-2 h-2 rounded-full bg-white"
                    animate={{ y: [0, -7, 0] }}
                    transition={{ duration: 0.5, delay: i * 0.12, repeat: Infinity }}
                  />
                ))}
                <span className="ml-1">Generating Plan...</span>
              </span>
            ) : '✦ Generate Diet Plan'}
          </motion.button>
        </motion.form>

        {/* Right — Output */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.5, ease: EASE }}
          className="bg-white rounded-3xl border border-[#E2E8F0] shadow-sm p-6 md:p-7 relative overflow-hidden"
        >
          {/* Subtle radial glow */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_5%,rgba(54,168,205,0.04),transparent_35%)] pointer-events-none" />

          <div className="flex items-center justify-between mb-5 relative z-10">
            <h2 className="text-xl font-bold text-[#0F172A]">Generated Plan</h2>
            <AnimatePresence>
              {source && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#EFF9FD] text-[#36a8cd] border border-[#36a8cd]/20"
                >
                  Source: {source}
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3 relative z-10"
              >
                {[1, 2, 3, 4, 5].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ backgroundPosition: ['200% 0%', '-200% 0%'] }}
                    style={{
                      background: 'linear-gradient(90deg, #EFF9FD 25%, #D0EEF8 50%, #EFF9FD 75%)',
                      backgroundSize: '200% 100%',
                    }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'linear', delay: i * 0.1 }}
                    className={`h-4 rounded-full ${i % 3 === 0 ? 'w-3/4' : i % 2 === 0 ? 'w-5/6' : 'w-full'}`}
                  />
                ))}
                <p className="text-xs text-[#94A3B8] text-center pt-2">AI is crafting your plan...</p>
              </motion.div>
            ) : plan ? (
              <motion.div
                key="plan"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ease: EASE }}
                className="relative z-10"
              >
                <pre className="text-sm text-[#0F172A] whitespace-pre-wrap leading-relaxed font-sans bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-5 max-h-[500px] overflow-y-auto">
                  {plan}
                </pre>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-2xl border-2 border-dashed border-[#E2E8F0] p-12 text-center relative z-10"
              >
                <motion.div
                  animate={{ y: [0, -10, 0], rotate: [0, -5, 5, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="text-5xl mb-4"
                >
                  🥗
                </motion.div>
                <p className="text-sm font-semibold text-[#0F172A]">Ready to generate</p>
                <p className="text-sm text-[#475569] mt-1 max-w-xs mx-auto">
                  Complete the form and click Generate to get your personalized 7-day plan.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default AIDietPlanner;
