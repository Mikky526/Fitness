const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Admin = require('../models/Admin');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB connected');
};

const createAdmin = async () => {
  await connectDB();

  const existing = await Admin.findOne({ email: 'admin@fitness.com' });
  if (existing) {
    console.log('Admin already exists:', existing.email);
    process.exit(0);
  }

  const admin = await Admin.create({
    name: 'Admin',
    email: 'admin@fitness.com',
    password: 'Admin@123',
  });

  console.log('Admin created successfully!');
  console.log('  Email:    admin@fitness.com');
  console.log('  Password: Admin@123');
  console.log('  ID:      ', admin._id.toString());
  process.exit(0);
};

createAdmin().catch(err => {
  console.error('Error creating admin:', err.message);
  process.exit(1);
});
