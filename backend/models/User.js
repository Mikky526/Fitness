const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'trainer'], default: 'user' },
  isVerified: { type: Boolean, default: false },
  isBlocked: { type: Boolean, default: false },
  firstLogin: { type: Boolean, default: true },
  specialization: { type: String },
  fitnessGoals: { type: String },
  assignedTrainer: { type: mongoose.Schema.Types.ObjectId, ref: 'Trainer' },
  dateOfBirth:   { type: Date },
  gender:        { type: String, enum: ['male', 'female', 'other'] },
  heightCm:      { type: Number },
  weightKg:      { type: Number },
  fitnessGoal:   { type: String, enum: ['weight_loss', 'muscle_gain', 'maintenance'] },
  activityLevel: { type: String, enum: ['low', 'moderate', 'high'] },
  dietType:      { type: String, enum: ['balanced', 'high_protein', 'vegetarian', 'keto'] },
  allergies:     { type: String, default: '' },
  fitnessNotes:  { type: String, default: '' }
}, { timestamps: true });

userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model('User', userSchema);