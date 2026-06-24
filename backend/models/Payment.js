const mongoose = require('mongoose');

const paymentSchema = mongoose.Schema({
  user:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  appointment:   { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  amount:        { type: Number, required: true },
  currency:      { type: String, default: 'usd' },
  transactionId: { type: String },
  status:        { type: String, enum: ['succeeded', 'pending', 'failed'], default: 'pending' },
  cardLast4:     { type: String },
  cardBrand:     { type: String },
  items: [{
    name:        { type: String },
    description: { type: String },
    price:       { type: Number },
    quantity:    { type: Number, default: 1 },
    type:        { type: String },
  }],
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
