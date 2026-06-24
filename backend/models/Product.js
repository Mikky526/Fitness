const mongoose = require('mongoose');

const productSchema = mongoose.Schema({
  name:        { type: String, required: true },
  description: { type: String, required: true },
  price:       { type: Number, required: true, min: 0 },
  type:        { type: String, enum: ['membership', 'session', 'package', 'consultation', 'class'], required: true },
  icon:        { type: String, default: '⭐' },
  color:       { type: String, default: 'from-blue-500 to-indigo-600' },
  bg:          { type: String, default: 'bg-blue-50' },
  badge:       { type: String, default: null },
  isActive:    { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
