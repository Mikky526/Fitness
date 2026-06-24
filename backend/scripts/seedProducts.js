const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Product = require('../models/Product');

const PRODUCTS = [
  {
    name: 'Basic Membership',
    description: '1-month access to workout tracking, community feed, and basic trainer chat.',
    price: 2499,
    type: 'membership',
    icon: '⭐',
    color: 'from-blue-500 to-indigo-600',
    bg: 'bg-blue-50',
    badge: null,
  },
  {
    name: 'Premium Membership',
    description: '1 month unlimited access + 2 personal trainer sessions included.',
    price: 6499,
    type: 'membership',
    icon: '💎',
    color: 'from-purple-500 to-indigo-600',
    bg: 'bg-purple-50',
    badge: 'Best Value',
  },
  {
    name: 'Personal Training Session',
    description: '60-minute 1-on-1 live session with your assigned trainer.',
    price: 3999,
    type: 'session',
    icon: '🏋️',
    color: 'from-orange-400 to-rose-500',
    bg: 'bg-orange-50',
    badge: null,
  },
  {
    name: '10-Session Package',
    description: 'Bundle of 10 personal training sessions. Save ₹10,000 vs individual bookings.',
    price: 29999,
    type: 'package',
    icon: '📦',
    color: 'from-emerald-500 to-teal-600',
    bg: 'bg-emerald-50',
    badge: 'Save ₹10,000',
  },
  {
    name: 'Nutrition Consultation',
    description: 'Personalised meal plan and macro-nutrient guidance from a certified nutritionist.',
    price: 5999,
    type: 'consultation',
    icon: '🥗',
    color: 'from-green-400 to-emerald-500',
    bg: 'bg-green-50',
    badge: null,
  },
  {
    name: 'Group Training Class',
    description: 'Access to 30+ live online group workout sessions for one month.',
    price: 1999,
    type: 'class',
    icon: '👥',
    color: 'from-pink-400 to-rose-500',
    bg: 'bg-pink-50',
    badge: 'Popular',
  },
];

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB connected');

  const existing = await Product.countDocuments();
  if (existing > 0) {
    console.log(`Products collection already has ${existing} document(s) — skipping seed.`);
    process.exit(0);
  }

  await Product.insertMany(PRODUCTS);
  console.log(`Seeded ${PRODUCTS.length} products successfully.`);
  process.exit(0);
};

seed().catch(err => {
  console.error('Seed error:', err.message);
  process.exit(1);
});
