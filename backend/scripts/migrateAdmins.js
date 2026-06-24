const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Admin = require('../models/Admin');

const migrate = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB connected');

  // Find all admin documents still in the users collection.
  // Query the raw collection to bypass the enum restriction on role.
  const usersCol = mongoose.connection.collection('users');
  const adminDocs = await usersCol.find({ role: 'admin' }).toArray();

  if (adminDocs.length === 0) {
    console.log('No admin documents found in users collection. Nothing to migrate.');
    process.exit(0);
  }

  console.log(`Found ${adminDocs.length} admin(s) in users collection. Migrating...`);

  let migrated = 0;
  let skipped = 0;

  for (const doc of adminDocs) {
    const exists = await Admin.findOne({ email: doc.email });
    if (exists) {
      console.log(`  SKIP  ${doc.email} — already exists in admins collection`);
      skipped++;
      continue;
    }

    // Insert directly with the already-hashed password so bcrypt doesn't double-hash.
    await mongoose.connection.collection('admins').insertOne({
      name: doc.name,
      email: doc.email,
      password: doc.password, // already hashed
      role: 'admin',
      createdAt: doc.createdAt || new Date(),
      updatedAt: doc.updatedAt || new Date(),
    });

    await usersCol.deleteOne({ _id: doc._id });
    console.log(`  MOVED ${doc.email} → admins collection`);
    migrated++;
  }

  console.log(`\nDone. Migrated: ${migrated}, Skipped: ${skipped}`);
  process.exit(0);
};

migrate().catch(err => {
  console.error('Migration error:', err.message);
  process.exit(1);
});
