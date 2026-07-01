const Payment = require('../models/Payment');
const Appointment = require('../models/Appointment');

const detectCardBrand = (number) => {
  const n = (number || '').replace(/\s/g, '');
  if (/^4/.test(n)) return 'Visa';
  if (/^5[1-5]/.test(n)) return 'Mastercard';
  if (/^3[47]/.test(n)) return 'Amex';
  if (/^6(?:011|5)/.test(n)) return 'Discover';
  return 'Card';
};

// Dummy payment — no real gateway, simulates success/decline
exports.processDummyPayment = async (req, res) => {
  try {
    const { amount, items, appointmentId, cardNumber, cardName } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid payment amount' });
    }

    const stripped = (cardNumber || '').replace(/\s/g, '');
    const last4 = stripped.slice(-4);
    const brand = detectCardBrand(stripped);

    // Card ending 0002 always declines (test scenario)
    if (last4 === '0002') {
      return res.status(400).json({ success: false, message: 'Your card was declined. Try a different card.' });
    }

    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

    const payment = await Payment.create({
      user: req.user._id,
      appointment: appointmentId || undefined,
      amount,
      transactionId,
      status: 'succeeded',
      cardLast4: last4,
      cardBrand: brand,
      items: items || [],
    });

    if (appointmentId) {
      await Appointment.findByIdAndUpdate(appointmentId, { isPaid: true });
    }

    res.status(201).json({
      success: true,
      transactionId,
      paymentId: payment._id,
      amount,
      cardLast4: last4,
      cardBrand: brand,
      message: 'Payment processed successfully!',
    });
  } catch (error) {
    console.error('Payment error:', error);
    res.status(500).json({ message: 'Payment processing failed. Please try again.' });
  }
};

// Member: whether they've completed at least one purchase (gates dashboard access)
exports.getPurchaseStatus = async (req, res) => {
  try {
    const hasPurchased = await Payment.exists({ user: req.user._id, status: 'succeeded' });
    res.json({ hasPurchased: !!hasPurchased });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch purchase status' });
  }
};

// Member gets their own payment / order history
exports.getMyPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate('appointment', 'date status');
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch payment history' });
  }
};

// Admin: all payments
exports.getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find({})
      .sort({ createdAt: -1 })
      .populate('user', 'name email')
      .populate('appointment', 'date status');
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch payments' });
  }
};
