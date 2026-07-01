const mongoose = require('mongoose');

const dietPlanCommentSchema = mongoose.Schema({
  trainerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trainer', required: true },
  trainerName: { type: String, required: true },
  comment: { type: String, required: true, trim: true },
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

const dietPlanSchema = mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'userModel' },
  userModel: { type: String, required: true, enum: ['User', 'Trainer', 'Admin'] },
  userName: { type: String, required: true },
  userRole: { type: String, required: true, enum: ['user', 'trainer', 'admin'] },
  source: { type: String, default: 'rule-based' },
  input: {
    age: Number,
    gender: String,
    heightCm: Number,
    weightKg: Number,
    goal: String,
    activityLevel: String,
    dietType: String,
    allergies: String,
    notes: String,
  },
  plan: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  trainerComment: { type: String, default: '' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Trainer' },
  reviewedByName: { type: String, default: '' },
  reviewedAt: { type: Date },
  comments: { type: [dietPlanCommentSchema], default: [] },
}, { timestamps: true });

module.exports = mongoose.model('DietPlan', dietPlanSchema);
