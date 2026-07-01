import React, { useContext, useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView, useMotionValue, useTransform, useSpring, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';

const FITNESS_TIP_TITLES = [
  'Top 5 Morning Workout Routines',
  'Why Recovery Days Matter More Than You Think',
  'The Science of Progressive Overload Explained',
  'Nutrition Timing: Fuel Before or After Training?',
  'How to Build a Sustainable Fitness Habit',
  'Core Strength vs. Cardio: What to Prioritize',
];

const FITNESS_TIP_BODIES = [
  'Start your mornings with purpose. A structured routine boosts metabolism and sets a positive tone for the day ahead.',
  'Rest is where growth happens. Your muscles rebuild stronger during recovery — skipping it slows your long-term progress.',
  'Adding small, consistent increases in weight or reps over time is the single most effective way to build strength.',
  'Timing your meals around workouts can maximize energy levels and recovery. Learn what works best for your body.',
  'Consistency beats perfection every time. Small daily wins compound into life-changing transformations over months.',
  'A strong core supports every movement you make. Combine it with steady-state cardio for a complete fitness base.',
];

const features = [
  { icon: '📊', title: 'Track Workouts', desc: 'Monitor every rep, set, and session. Visualize your progress with beautiful charts.', gradient: 'from-[#36a8cd] to-[#2089ab]', border: 'border-t-[#36a8cd]' },
  { icon: '📅', title: 'Book Trainers', desc: 'Schedule expert sessions and get real-time appointment updates instantly.', gradient: 'from-[#FFB539] to-[#e6a22a]', border: 'border-t-[#FFB539]' },
  { icon: '💳', title: 'Secure Payments', desc: 'Fast, safe transactions powered by Stripe. Zero hidden fees, always.', gradient: 'from-emerald-500 to-teal-600', border: 'border-t-emerald-500' },
];

const stats = [
  { value: '10K+', label: 'Active Members' },
  { value: '500+', label: 'Expert Trainers' },
  { value: '50K+', label: 'Workouts Logged' },
  { value: '98%', label: 'Satisfaction Rate' },
];

const steps = [
  { num: '01', title: 'Create Account', desc: 'Sign up in seconds and set your fitness goals.' },
  { num: '02', title: 'Book a Trainer', desc: 'Browse certified trainers and schedule your first session.' },
  { num: '03', title: 'Track Progress', desc: 'Log workouts, view charts, and celebrate milestones.' },
];

const FloatingParticles = ({ count = 18 }) => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {Array.from({ length: count }).map((_, i) => {
      const size = Math.random() * 5 + 2;
      const x = Math.random() * 100;
      const y = Math.random() * 100;
      const dur = 10 + Math.random() * 12;
      const delay = Math.random() * 6;
      const colors = ['bg-[#33B8D4]', 'bg-[#33B8D4]', 'bg-[#66CCE0]', 'bg-blue-300', 'bg-cyan-400'];
      const color = colors[i % colors.length];
      return (
        <motion.div
          key={i}
          className={`absolute rounded-full ${color} opacity-20`}
          style={{ width: size, height: size, left: `${x}%`, top: `${y}%` }}
          animate={{
            y: [0, -(20 + Math.random() * 40), 0, 15, 0],
            x: [0, 10 + Math.random() * 20, -10, 5, 0],
            opacity: [0.1, 0.35, 0.15, 0.4, 0.1],
            scale: [1, 1.4, 0.8, 1.2, 1],
          }}
          transition={{ duration: dur, delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      );
    })}
  </div>
);

const TiltCard = ({ children, className = '' }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-60, 60], [6, -6]);
  const rotateY = useTransform(x, [-60, 60], [-6, 6]);
  const glowX = useTransform(x, [-60, 60], [0, 100]);
  const glowY = useTransform(y, [-60, 60], [0, 100]);

  const handleMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set(e.clientX - rect.left - rect.width / 2);
    y.set(e.clientY - rect.top - rect.height / 2);
  };
  const handleLeave = () => { x.set(0); y.set(0); };

  return (
    <motion.div
      style={{ rotateX, rotateY, transformPerspective: 900 }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      whileHover={{ scale: 1.03, zIndex: 10 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={`relative ${className}`}
    >
      <motion.div
        className="absolute inset-0 rounded-2xl opacity-0 pointer-events-none"
        style={{
          background: useTransform(
            [glowX, glowY],
            ([gx, gy]) => `radial-gradient(circle at ${gx}% ${gy}%, rgba(54,168,205,0.08) 0%, transparent 60%)`
          ),
        }}
        whileHover={{ opacity: 1 }}
      />
      {children}
    </motion.div>
  );
};

const BlurReveal = ({ text, className = '', delay = 0 }) => {
  const words = text.split(' ');
  return (
    <motion.div
      className={`flex flex-wrap gap-x-2 ${className}`}
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.1, delayChildren: delay } } }}
    >
      {words.map((word, i) => (
        <motion.span
          key={i}
          className="inline-block"
          variants={{
            hidden: { opacity: 0, y: 20, filter: 'blur(12px)' },
            visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
          }}
        >
          {word}
        </motion.span>
      ))}
    </motion.div>
  );
};

const SpringCounter = ({ value }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const num = parseInt(value.replace(/\D/g, ''), 10) || 0;
  const suffix = value.replace(/[0-9]/g, '');
  const spring = useSpring(0, { stiffness: 40, damping: 10, restDelta: 0.5 });
  const display = useTransform(spring, (v) => Math.round(v).toLocaleString() + suffix);
  useEffect(() => { if (inView) spring.set(num); }, [inView]);
  return <motion.span ref={ref}>{display}</motion.span>;
};

const heroVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.2 } },
};
const heroItemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] },
  }),
};

const Home = () => {
  const { user } = useContext(AuthContext);
  const [tips, setTips] = useState([]);
  const [tipsLoading, setTipsLoading] = useState(true);
  const whatsappNumber = '96590027303';
  const whatsappMessage = encodeURIComponent('Hi! I want to know more about your fitness services.');
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  useEffect(() => {
    fetch('https://jsonplaceholder.typicode.com/posts?_limit=6')
      .then(r => r.json())
      .then(posts => {
        const mapped = posts.map((post, i) => ({
          id: post.id,
          title: FITNESS_TIP_TITLES[i] || post.title,
          body: FITNESS_TIP_BODIES[i] || post.body.slice(0, 120),
          userId: post.userId,
        }));
        setTips(mapped);
      })
      .catch(() => setTips([]))
      .finally(() => setTipsLoading(false));
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen app-page"
    >
      {/* ── Hero Section ── */}
      <motion.section
        className="min-h-screen flex flex-col justify-end relative overflow-hidden"
        variants={heroVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Full-screen background image */}
        <motion.img
          src="/hero-runners.webp"
          alt="Fitness community running together"
          className="absolute inset-0 w-full h-full object-cover object-center"
          initial={{ opacity: 0, scale: 1.06 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        />

        {/* Dark overlay — heavier at top/bottom, lighter in middle so runners are visible */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, rgba(10,15,30,0.75) 0%, rgba(10,15,30,0.25) 40%, rgba(10,15,30,0.55) 70%, rgba(10,15,30,0.92) 100%)' }}
        />

        {/* Teal accent glow at bottom */}
        <div
          className="absolute inset-x-0 bottom-0 h-64 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 120%, rgba(54,168,205,0.18) 0%, transparent 70%)' }}
        />

        {/* Floating particles over image */}
        <FloatingParticles count={14} />

        {/* ── Top: badge + headline ── */}
        <motion.div
          className="relative z-10 w-full pt-20 pb-4 text-center"
          variants={heroVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="max-w-4xl mx-auto px-6">
            {/* Badge */}
            <motion.div variants={heroItemVariants} className="mb-5 flex justify-center">
              <span className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white/90 text-xs font-semibold px-4 py-1.5 rounded-full backdrop-blur-sm">
                <span>🏋️</span>
                Fitness Management Platform
                <span className="w-1.5 h-1.5 rounded-full bg-[#33B8D4] animate-pulse ml-1" />
              </span>
            </motion.div>

            {/* Headline */}
            <motion.div
              className="font-['Kanit'] font-black tracking-tight leading-tight"
              variants={heroItemVariants}
            >
              <BlurReveal
                text="Transform Your Fitness."
                delay={0.3}
                className="text-4xl lg:text-5xl xl:text-6xl text-white justify-center"
              />
              <BlurReveal
                text="Manage Everything."
                delay={0.5}
                className="text-4xl lg:text-5xl xl:text-6xl bg-gradient-to-r from-[#36a8cd] via-[#66CCE0] to-[#36a8cd] bg-clip-text text-transparent justify-center"
              />
            </motion.div>
          </div>
        </motion.div>

        {/* spacer — lets runners show through the middle */}
        <div className="flex-1" />

        {/* ── Bottom: subtext + CTAs + stats ── */}
        <motion.div
          className="relative z-10 w-full pb-12"
          variants={heroVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="max-w-7xl mx-auto px-6">
            <motion.div variants={heroVariants} initial="hidden" animate="visible">

              {/* Subtext */}
              <motion.p
                className="text-center text-slate-300/80 text-sm leading-relaxed max-w-lg mx-auto mb-6"
                variants={heroItemVariants}
              >
                Track workouts, connect with expert trainers, and achieve your goals with our all-in-one fitness management platform.
              </motion.p>

              {/* CTA Buttons */}
              <motion.div className="flex justify-center gap-3 mb-8" variants={heroItemVariants}>
                {!user ? (
                  <>
                    <motion.div whileHover={{ scale: 1.06, boxShadow: '0 12px 32px rgba(54,168,205,0.5)' }} whileTap={{ scale: 0.96 }}>
                      <Link
                        to="/register"
                        className="bg-[#36a8cd] hover:bg-[#2089ab] text-white font-bold px-7 py-3 rounded-xl text-sm shadow-lg shadow-[#36a8cd]/30 transition-all inline-flex items-center gap-2"
                      >
                        Get Started Free →
                      </Link>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.96 }}>
                      <Link
                        to="/shop"
                        className="bg-white/10 border border-white/20 text-white font-bold px-7 py-3 rounded-xl text-sm hover:bg-white/20 transition-all inline-flex items-center gap-2 backdrop-blur-sm"
                      >
                        View Plans
                      </Link>
                    </motion.div>
                  </>
                ) : (
                  <motion.div whileHover={{ scale: 1.06, boxShadow: '0 12px 32px rgba(54,168,205,0.5)' }} whileTap={{ scale: 0.96 }}>
                    <Link
                      to={`/${user.role}/dashboard`}
                      className="bg-[#36a8cd] hover:bg-[#2089ab] text-white font-bold px-7 py-3 rounded-xl text-sm shadow-lg shadow-[#36a8cd]/30 transition-all inline-flex items-center gap-2"
                    >
                      Go to Dashboard →
                    </Link>
                  </motion.div>
                )}
              </motion.div>

              {/* Stats bar */}
              {!user && (
                <motion.div
                  className="grid grid-cols-4 gap-3 max-w-2xl mx-auto"
                  variants={heroVariants}
                >
                  {stats.map((s, i) => (
                    <motion.div
                      key={i}
                      variants={heroItemVariants}
                      whileHover={{ scale: 1.06, y: -3 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                      className="bg-white/10 border border-white/15 rounded-2xl px-3 py-2.5 text-center backdrop-blur-sm cursor-default"
                    >
                      <div className="text-lg font-black text-white leading-none">
                        <SpringCounter value={s.value} />
                      </div>
                      <div className="text-[10px] text-slate-300/70 mt-1 leading-tight">{s.label}</div>
                    </motion.div>
                  ))}
                </motion.div>
              )}

            </motion.div>
          </div>
        </motion.div>
      </motion.section>

      {/* ── Features Section ── */}
      {!user && (
        <section className="bg-white py-20">
          <div className="max-w-7xl mx-auto px-6">
            <motion.div
              className="text-center mb-14"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <span className="section-badge mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-[#36a8cd]" />
                Why Choose Us
              </span>
              <BlurReveal
                text="Everything you need"
                delay={0.1}
                className="text-3xl font-black text-[#0F172A] justify-center mt-4 font-['Kanit']"
              />
              <p className="text-[#475569] text-lg max-w-xl mx-auto mt-3">One platform, endless possibilities for your fitness journey.</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
              {features.map((f, idx) => (
                <TiltCard key={idx}>
                  <motion.div
                    custom={idx}
                    variants={cardVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.2 }}
                    className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow p-8 cursor-default relative overflow-hidden"
                  >
                    {/* Colored top border accent */}
                    <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${f.gradient} rounded-t-2xl`} />
                    <motion.div
                      animate={{ rotate: [0, -5, 5, 0], scale: [1, 1.05, 1] }}
                      transition={{ duration: 4, repeat: Infinity, delay: idx * 0.5 }}
                      className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${f.gradient} flex items-center justify-center text-2xl shadow-md`}
                    >
                      {f.icon}
                    </motion.div>
                    <h3 className="text-xl font-bold text-[#0F172A] mt-5 mb-2">{f.title}</h3>
                    <p className="text-[#475569] leading-relaxed text-sm">{f.desc}</p>
                  </motion.div>
                </TiltCard>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── How It Works ── */}
      {!user && (
        <section className="bg-[#F8FAFC] py-20">
          <div className="max-w-7xl mx-auto px-6">
            <motion.div
              className="text-center mb-14"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <span className="section-badge mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-[#36a8cd]" />
                Simple Steps
              </span>
              <BlurReveal
                text="How it works"
                delay={0.1}
                className="text-3xl font-black text-[#0F172A] justify-center mt-4 font-['Kanit']"
              />
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {steps.map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.5, delay: i * 0.15 }}
                  className="text-center"
                >
                  <div className="w-14 h-14 rounded-2xl bg-[#EFF9FD] border border-[#36a8cd]/20 flex items-center justify-center mx-auto mb-5">
                    <span className="text-[#36a8cd] font-black text-lg font-['Kanit']">{step.num}</span>
                  </div>
                  <h3 className="text-xl font-bold text-[#0F172A] mb-2">{step.title}</h3>
                  <p className="text-[#475569] text-sm leading-relaxed">{step.desc}</p>
                  {i < steps.length - 1 && (
                    <div className="hidden md:flex items-center justify-end absolute right-0 top-1/2 -translate-y-1/2 text-[#94A3B8]">→</div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Pricing Preview ── */}
      {!user && (
        <section className="bg-white py-20">
          <div className="max-w-7xl mx-auto px-6">
            <motion.div
              className="text-center mb-14"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <span className="section-badge mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-[#36a8cd] animate-pulse" />
                Simple Pricing
              </span>
              <BlurReveal
                text="Plans for every goal"
                delay={0.1}
                className="text-3xl font-black text-[#0F172A] justify-center mt-4 font-['Kanit']"
              />
              <p className="text-[#475569] max-w-xl mx-auto mt-3">No hidden fees. No long-term contracts. Cancel anytime.</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
              {[
                {
                  tier: 'Basic', icon: '🌱', price: '1,499', period: '/ month',
                  desc: 'Perfect to kickstart your fitness journey.',
                  gradient: 'from-teal-500 to-cyan-600',
                  features: ['Unlimited gym floor access', 'Group fitness classes', 'Locker room access', 'Mobile app tracking'],
                  popular: false,
                },
                {
                  tier: 'Pro', icon: '⚡', price: '2,999', period: '/ month',
                  desc: 'For serious members who want expert guidance.',
                  gradient: 'from-[#36a8cd] to-[#2089ab]',
                  features: ['Everything in Basic', 'Monthly trainer session', 'Custom workout program', 'Diet consultation', 'Priority booking'],
                  popular: true,
                },
                {
                  tier: 'Elite', icon: '🏆', price: '4,999', period: '/ month',
                  desc: 'The complete transformation package.',
                  gradient: 'from-[#FFB539] to-[#e6a22a]',
                  features: ['Everything in Pro', 'Unlimited trainer sessions', 'Personalised diet plan', 'Body composition analysis', 'Dedicated coach'],
                  popular: false,
                },
              ].map((plan, i) => (
                <motion.div
                  key={plan.tier}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.5, delay: i * 0.12 }}
                  className={`relative bg-white rounded-2xl border overflow-hidden flex flex-col shadow-sm ${
                    plan.popular
                      ? 'border-[#36a8cd] shadow-[0px_0px_0px_2px_#36a8cd,0px_8px_30px_rgba(54,168,205,0.15)] md:scale-105'
                      : 'border-[#E2E8F0] hover:shadow-md transition-shadow'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20">
                      <div className="bg-[#36a8cd] text-white text-[10px] font-black px-5 py-1 rounded-b-xl tracking-widest uppercase shadow-lg shadow-[#36a8cd]/30">
                        Most Popular
                      </div>
                    </div>
                  )}
                  <div className={`bg-gradient-to-br ${plan.gradient} p-6 ${plan.popular ? 'pt-10' : ''}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-2xl shadow-lg">{plan.icon}</div>
                      <div>
                        <p className="text-white font-black text-lg">{plan.tier}</p>
                        <p className="text-white/70 text-xs">{plan.desc}</p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-end gap-1">
                      <span className="text-4xl font-black text-white">₹{plan.price}</span>
                      <span className="text-white/60 text-sm mb-1">{plan.period}</span>
                    </div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <ul className="space-y-2.5 flex-1">
                      {plan.features.map((f, j) => (
                        <li key={j} className="flex items-center gap-2.5 text-sm text-[#475569]">
                          <span className="w-4 h-4 rounded-full bg-[#EFF9FD] flex items-center justify-center flex-shrink-0">
                            <svg className="w-2.5 h-2.5 text-[#36a8cd]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </span>
                          {f}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-6">
                      <Link to="/shop">
                        <motion.button
                          whileHover={{ scale: 1.03, y: -1 }}
                          whileTap={{ scale: 0.97 }}
                          className={`w-full text-white font-bold py-3.5 rounded-xl transition-all text-sm ${
                            plan.popular
                              ? 'bg-[#36a8cd] hover:bg-[#2089ab] shadow-md shadow-[#36a8cd]/25'
                              : `bg-gradient-to-r ${plan.gradient} hover:brightness-110 shadow-sm`
                          }`}
                        >
                          Get Started
                        </motion.button>
                      </Link>
                      <p className="text-center text-[11px] text-[#94A3B8] mt-2.5">No contract · Cancel anytime</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mt-8"
            >
              <Link to="/shop">
                <motion.span
                  whileHover={{ scale: 1.05 }}
                  className="text-[#36a8cd] font-semibold text-sm hover:text-[#2089ab] transition-colors cursor-pointer inline-flex items-center gap-1"
                >
                  See all plans & sessions →
                </motion.span>
              </Link>
            </motion.div>
          </div>
        </section>
      )}

      {/* ── Fitness Tips Section ── */}
      {!user && (
        <section className="bg-[#F8FAFC] py-20">
          <div className="max-w-7xl mx-auto px-6">
            <motion.div
              className="text-center mb-14"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <span className="section-badge mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-[#36a8cd] animate-pulse" />
                Expert Advice
              </span>
              <BlurReveal
                text="Fitness Tips & Articles"
                delay={0.1}
                className="text-3xl font-black text-[#0F172A] justify-center mt-4 font-['Kanit']"
              />
              <p className="text-[#475569] max-w-xl mx-auto mt-3">Expert-curated advice to help you train smarter, recover faster, and stay motivated.</p>
            </motion.div>

            {tipsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="rounded-2xl p-6 border border-[#E2E8F0] shimmer-bg h-48" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tips.map((tip, i) => (
                  <motion.div
                    key={tip.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.1 }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    whileHover={{ y: -4, boxShadow: '0 8px 30px rgba(54,168,205,0.1)' }}
                    className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-sm cursor-default"
                  >
                    <span className="bg-[#EFF9FD] text-[#36a8cd] border border-[#36a8cd]/20 text-xs font-bold px-2.5 py-1 rounded-full">
                      Tip #{tip.id}
                    </span>
                    <h4 className="font-bold text-[#0F172A] mt-3 mb-2 line-clamp-2 leading-snug">
                      {tip.title}
                    </h4>
                    <p className="text-[#475569] text-sm leading-relaxed line-clamp-3">{tip.body}</p>
                    <div className="mt-4 pt-4 border-t border-[#E2E8F0] flex items-center justify-between">
                      <span className="text-xs text-[#94A3B8]">Author #{tip.userId}</span>
                      <span className="text-xs font-semibold text-[#36a8cd] hover:text-[#2089ab] transition-colors cursor-pointer">
                        Read More →
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Bottom CTA ── */}
      {!user && (
        <section
          className="py-24 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #0A0F1E 0%, #0F172A 50%, #0D1B26 100%)' }}
        >
          <div className="absolute inset-0 hero-grid pointer-events-none" />
          <FloatingParticles count={12} />
          <motion.div
            className="absolute -top-20 -right-20 w-64 h-64 bg-[#36a8cd] rounded-full opacity-[0.07] blur-3xl pointer-events-none"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center gap-2 bg-white/10 border border-white/15 text-white/80 text-sm font-semibold px-4 py-2 rounded-full mb-6">
                🚀 Start Today
              </span>
              <h2 className="text-4xl lg:text-5xl font-black text-white mb-5 font-['Kanit']">
                Ready to start your<br />
                <span className="text-[#36a8cd]">fitness journey?</span>
              </h2>
              <p className="text-slate-300/80 text-lg mb-10 max-w-xl mx-auto">
                Join thousands of members already transforming their lives. No excuses — start today.
              </p>
              <motion.div
                whileHover={{ scale: 1.06, boxShadow: '0 15px 40px rgba(54,168,205,0.5)' }}
                whileTap={{ scale: 0.96 }}
                className="inline-block"
              >
                <Link
                  to="/register"
                  className="bg-[#36a8cd] hover:bg-[#2089ab] text-white font-bold px-10 py-4 rounded-xl shadow-lg shadow-[#36a8cd]/30 transition-all inline-flex items-center gap-2"
                >
                  Create Free Account →
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </section>
      )}

      {/* WhatsApp Icon Button */}
      <style>{`@keyframes wa-pulse{0%{transform:scale(1);opacity:.7}70%{transform:scale(1.6);opacity:0}100%{transform:scale(1.6);opacity:0}}`}</style>
      <motion.a
        href={whatsappLink}
        target="_blank"
        rel="noopener noreferrer"
        whileHover={{ scale: 1.12 }}
        whileTap={{ scale: 0.92 }}
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full focus:outline-none"
        style={{ background: '#25D366', boxShadow: '0 4px 20px rgba(37,211,102,0.5)' }}
        aria-label="Contact us on WhatsApp"
      >
        <span className="absolute inset-0 rounded-full pointer-events-none" style={{ border: '2px solid rgba(37,211,102,0.5)', animation: 'wa-pulse 2s ease-out infinite' }} />
        <svg viewBox="0 0 32 32" width="30" height="30" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 2C8.268 2 2 8.268 2 16c0 2.47.664 4.785 1.822 6.775L2 30l7.418-1.79A13.93 13.93 0 0016 30c7.732 0 14-6.268 14-14S23.732 2 16 2z" fill="#25D366"/>
          <path d="M16 4.5c-6.352 0-11.5 5.148-11.5 11.5 0 2.142.585 4.147 1.604 5.866l.253.428-1.075 3.924 4.03-1.057.414.245A11.46 11.46 0 0016 27.5c6.352 0 11.5-5.148 11.5-11.5S22.352 4.5 16 4.5z" fill="white"/>
          <path d="M21.073 18.616c-.307-.154-1.814-.895-2.095-.997-.281-.102-.486-.153-.69.154-.205.306-.793.997-.972 1.202-.179.204-.358.23-.665.077-.307-.154-1.296-.478-2.468-1.524-.912-.814-1.528-1.82-1.707-2.126-.179-.307-.019-.473.134-.625.138-.137.307-.358.46-.537.154-.179.205-.307.307-.511.102-.205.051-.384-.026-.537-.077-.154-.69-1.664-.946-2.278-.249-.598-.502-.517-.69-.527l-.588-.01c-.205 0-.537.077-.818.384-.281.307-1.073 1.049-1.073 2.559s1.099 2.97 1.252 3.174c.154.205 2.163 3.303 5.241 4.63.733.316 1.305.505 1.751.647.736.234 1.406.201 1.936.122.59-.088 1.814-.741 2.07-1.457.256-.716.256-1.33.179-1.457-.076-.128-.28-.205-.587-.358z" fill="#25D366"/>
        </svg>
      </motion.a>
    </motion.div>
  );
};

export default Home;
