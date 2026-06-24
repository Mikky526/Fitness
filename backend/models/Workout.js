const mongoose = require('mongoose');

const workoutSchema = mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  trainer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  title: { type: String, required: true },
  exercises: [{
    name:      { type: String,  required: true },
    sets:      { type: Number,  required: true },
    reps:      { type: Number,  required: true },
    weight:    { type: Number },
    completed: { type: Boolean, default: false },
  }],
  date: { type: Date, default: Date.now },
  completed: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Workout', workoutSchema);