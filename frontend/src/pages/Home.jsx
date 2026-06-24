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
  { icon: '📊', title: 'Track Workouts', desc: 'Monitor every rep, set, and session. Visualize your progress.', gradient: 'from-blue-500 to-indigo-600', bg: 'bg-blue-50' },
  { icon: '📅', title: 'Book Trainers', desc: 'Schedule expert sessions and get real-time appointment updates.', gradient: 'from-purple-500 to-pink-500', bg: 'bg-purple-50' },
  { icon: '💳', title: 'Secure Payments', desc: 'Fast, safe transactions powered by Stripe. Zero hidden fees.', gradient: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-50' },
];

const stats = [
  { value: '10K+', label: 'Active Members' },
  { value: '500+', label: 'Expert Trainers' },
  { value: '50K+', label: 'Workouts Logged' },
  { value: '98%', label: 'Satisfaction Rate' },
];

// FloatingParticles — ambient animated dots scattered across hero background
const FloatingParticles = ({ count = 18 }) => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {Array.from({ length: count }).map((_, i) => {
      const size = Math.random() * 5 + 2;
      const x = Math.random() * 100;
      const y = Math.random() * 100;
      const dur = 10 + Math.random() * 12;
      const delay = Math.random() * 6;
      const colors = ['bg-indigo-400', 'bg-purple-400', 'bg-pink-300', 'bg-blue-300', 'bg-violet-400'];
      const color = colors[i % colors.length];
      return (
        <motion.div
          key={i}
          className={`absolute rounded-full ${color} opacity-25`}
          style={{ width: size, height: size, left: `${x}%`, top: `${y}%` }}
          animate={{
            y: [0, -(20 + Math.random() * 40), 0, 15, 0],
            x: [0, 10 + Math.random() * 20, -10, 5, 0],
            opacity: [0.15, 0.45, 0.2, 0.5, 0.15],
            scale: [1, 1.4, 0.8, 1.2, 1],
          }}
          transition={{ duration: dur, delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      );
    })}
  </div>
);

// TiltCard — 3D perspective tilt on mouse move with spotlight glow
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
        className="absolute inset-0 rounded-3xl opacity-0 pointer-events-none"
        style={{
          background: useTransform(
            [glowX, glowY],
            ([gx, gy]) => `radial-gradient(circle at ${gx}% ${gy}%, rgba(99,102,241,0.15) 0%, transparent 60%)`
          ),
        }}
        whileHover={{ opacity: 1 }}
      />
      {children}
    </motion.div>
  );
};

// BlurReveal — text that appears word-by-word with blur-to-sharp effect
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

// SpringCounter — spring-powered number that bounces into place when entering viewport
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

// Variants for hero text stagger
const heroVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.2 } },
};
const heroItemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

// Variants for feature cards with custom stagger index
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

  // Fetch fitness tips from JSONPlaceholder /posts
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
      className="min-h-screen bg-gray-50"
    >

      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.section
          className="bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-900 rounded-3xl mx-4 mt-4 p-10 lg:p-16 relative overflow-hidden"
          variants={heroVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Floating particles */}
          <FloatingParticles count={20} />

          {/* Animated gradient overlay */}
          <motion.div
            className="absolute inset-0 rounded-3xl pointer-events-none"
            animate={{ backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'] }}
            transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
            style={{
              background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(168,85,247,0.08) 50%, rgba(99,102,241,0.08) 100%)',
              backgroundSize: '200% 200%',
            }}
          />

          {/* Decorative blobs — floating animation */}
          <motion.div
            animate={{ scale: [1, 1.15, 1], x: [0, 20, 0], y: [0, -15, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-500 rounded-full opacity-10 blur-3xl pointer-events-none"
          />
          <motion.div
            animate={{ scale: [1, 1.15, 1], x: [0, -20, 0], y: [0, 15, 0] }}
            transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -bottom-20 -right-20 w-80 h-80 bg-purple-500 rounded-full opacity-10 blur-3xl pointer-events-none"
          />

          {/* Hero content — stagger container */}
          <motion.div
            variants={heroVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Top pill badge */}
            <motion.div variants={heroItemVariants} className="mb-8">
              <span className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white/90 text-sm font-semibold px-4 py-2 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Next-Gen Fitness Platform
              </span>
            </motion.div>

            {/* Headline — BlurReveal per line */}
            <motion.div
              className="text-4xl lg:text-6xl font-black tracking-tight text-white leading-tight mb-4"
              variants={heroItemVariants}
            >
              <BlurReveal
                text="Elevate Your"
                delay={0.3}
                className="text-white"
              />
              <BlurReveal
                text="Fitness Journey"
                delay={0.55}
                className="bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent"
              />
            </motion.div>

            {/* Subtext */}
            <motion.p
              className="text-indigo-200/80 text-lg leading-relaxed max-w-xl mt-4 mb-10"
              variants={heroItemVariants}
            >
              Track workouts, connect with expert trainers, and achieve your goals with our all-in-one fitness management platform.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div className="flex flex-col sm:flex-row gap-4 mb-12" variants={heroItemVariants}>
              {!user ? (
                <>
                  <motion.div
                    whileHover={{ scale: 1.06, boxShadow: '0 15px 40px rgba(255,255,255,0.3)' }}
                    whileTap={{ scale: 0.96 }}
                  >
                    <Link
                      to="/register"
                      className="bg-white text-indigo-700 font-extrabold px-8 py-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all inline-flex items-center gap-2"
                    >
                      Get Started Free →
                    </Link>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.06, boxShadow: '0 15px 40px rgba(255,255,255,0.3)' }}
                    whileTap={{ scale: 0.96 }}
                  >
                    <Link
                      to="/login"
                      className="bg-white/10 border border-white/20 text-white font-bold px-8 py-4 rounded-2xl hover:bg-white/20 transition-all inline-flex items-center gap-2"
                    >
                      Sign In
                    </Link>
                  </motion.div>
                </>
              ) : (
                <motion.div
                  whileHover={{ scale: 1.06, boxShadow: '0 15px 40px rgba(255,255,255,0.3)' }}
                  whileTap={{ scale: 0.96 }}
                >
                  <Link
                    to={`/${user.role}/dashboard`}
                    className="bg-white text-indigo-700 font-extrabold px-8 py-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all inline-flex items-center gap-2"
                  >
                    Go to Dashboard →
                  </Link>
                </motion.div>
              )}
            </motion.div>

            {/* Stats row */}
            {!user && (
              <motion.div
                className="grid grid-cols-2 md:grid-cols-4 gap-4"
                variants={heroVariants}
              >
                {stats.map((s, i) => (
                  <motion.div
                    key={i}
                    variants={heroItemVariants}
                    whileHover={{ scale: 1.08, y: -4 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    className="bg-white/10 border border-white/20 rounded-2xl px-6 py-4 text-center backdrop-blur-sm cursor-default"
                  >
                    <div className="text-2xl font-black text-white">
                      <SpringCounter value={s.value} />
                    </div>
                    <div className="text-xs text-indigo-200/70 mt-1">{s.label}</div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </motion.div>
        </motion.section>
      </motion.div>

      {/* Features Section */}
      {!user && (
        <section className="px-4 py-16 max-w-7xl mx-auto">
          {/* Section heading — BlurReveal */}
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="text-xs font-bold px-3 py-1.5 rounded-full border border-indigo-200 bg-indigo-50 text-indigo-600 inline-flex items-center gap-1.5 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              Why Choose Us
            </span>
            <BlurReveal
              text="Everything you need"
              delay={0.1}
              className="text-3xl font-black text-gray-900 justify-center mt-3"
            />
            <p className="text-gray-500 text-lg max-w-xl mx-auto mt-3">One platform, endless possibilities for your fitness journey.</p>
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
                  whileHover={{ y: -6, boxShadow: '0 20px 40px rgba(99,102,241,0.15)' }}
                  transition={{ duration: 0.3 }}
                  className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:border-indigo-100/60 cursor-default"
                >
                  <motion.div
                    animate={{
                      rotate: [0, -5, 5, 0],
                      scale: [1, 1.05, 1],
                    }}
                    transition={{ duration: 4, repeat: Infinity, delay: idx * 0.5 }}
                    className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${f.gradient} flex items-center justify-center text-2xl shadow-lg`}
                  >
                    {f.icon}
                  </motion.div>
                  <h3 className="text-xl font-bold text-gray-900 mt-6 mb-2">{f.title}</h3>
                  <p className="text-gray-500 leading-relaxed text-sm">{f.desc}</p>
                  <div className={`mt-6 h-0.5 bg-gradient-to-r ${f.gradient} rounded-full`} />
                </motion.div>
              </TiltCard>
            ))}
          </div>
        </section>
      )}

      {/* Fitness Tips Section */}
      {!user && (
        <section className="bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 py-16">
            {/* Tips heading */}
            <motion.div
              className="text-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="text-xs font-bold px-3 py-1.5 rounded-full border border-indigo-200 bg-indigo-50 text-indigo-600 inline-flex items-center gap-1.5 mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Fitness Tips
              </span>
              <BlurReveal
                text="Fitness Tips & Articles"
                delay={0.1}
                className="text-3xl font-black text-gray-900 justify-center mt-3 mb-3"
              />
              <p className="text-gray-500 max-w-xl mx-auto">Expert-curated advice to help you train smarter, recover faster, and stay motivated.</p>
            </motion.div>

            {tipsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <motion.div
                    key={i}
                    animate={{ backgroundPosition: ['200% 0%', '-200% 0%'] }}
                    style={{
                      background: 'linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)',
                      backgroundSize: '200% 100%',
                    }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                    className="rounded-2xl p-6 border border-gray-100 shadow-sm"
                  >
                    <div className="h-4 bg-gray-200/60 rounded-full mb-3 w-1/4" />
                    <div className="h-5 bg-gray-200/60 rounded-full mb-3" />
                    <div className="h-3 bg-gray-100/60 rounded-full mb-2" />
                    <div className="h-3 bg-gray-100/60 rounded-full mb-2" />
                    <div className="h-3 bg-gray-100/60 rounded-full w-3/4" />
                  </motion.div>
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
                    whileHover={{ y: -8, boxShadow: '0 24px 60px rgba(99,102,241,0.18)', scale: 1.02 }}
                    className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm cursor-default"
                  >
                    <span className="bg-indigo-50 text-indigo-600 border border-indigo-100 text-xs font-bold px-2.5 py-1 rounded-full">
                      Tip #{tip.id}
                    </span>
                    <h4 className="font-bold text-gray-900 mt-3 mb-2 line-clamp-2 leading-snug">
                      {tip.title}
                    </h4>
                    <p className="text-gray-500 text-sm leading-relaxed line-clamp-3">{tip.body}</p>
                    <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                      <span className="text-xs text-gray-400">Author #{tip.userId}</span>
                      <span className="text-xs font-semibold text-indigo-500 hover:text-indigo-700 transition-colors cursor-pointer">
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
    </motion.div>
  );
};

export default Home;
