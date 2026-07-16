const User = require('../models/User');
const Trainer = require('../models/Trainer');
const Appointment = require('../models/Appointment');
const Payment = require('../models/Payment');
const bcrypt = require('bcryptjs');

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    const trainers = await Trainer.find({}).select('-password');
    res.json({ users, trainers });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createMember = async (req, res) => {
  try {
    const { name, email, password, fitnessGoals } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'Name, email and password are required' });
    if (await User.findOne({ email }))
      return res.status(400).json({ message: 'Email already in use' });

    const user = await User.create({ name, email, password, role: 'user', fitnessGoals, isVerified: true });
    res.status(201).json({ _id: user._id, name: user.name, email: user.email, role: user.role, fitnessGoals: user.fitnessGoals });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateMember = async (req, res) => {
  try {
    const { name, email, fitnessGoals, password } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Member not found' });

    if (name) user.name = name;
    if (email) user.email = email;
    if (fitnessGoals !== undefined) user.fitnessGoals = fitnessGoals;
    if (password) user.password = password;

    await user.save();
    const { password: _p, ...safe } = user.toObject();
    res.json(safe);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteMember = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Member not found' });
    await user.deleteOne();
    res.json({ message: 'Member deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createTrainer = async (req, res) => {
  try {
    const { name, email, password, specialization } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'Name, email and password are required' });
    if (await Trainer.findOne({ email }))
      return res.status(400).json({ message: 'Email already in use' });

    const trainer = await Trainer.create({ name, email, password, specialization, isVerified: true });
    res.status(201).json({ _id: trainer._id, name: trainer.name, email: trainer.email, role: trainer.role, specialization: trainer.specialization });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateTrainer = async (req, res) => {
  try {
    const { name, email, specialization, isVerified, password } = req.body;
    const trainer = await Trainer.findById(req.params.id);
    if (!trainer) return res.status(404).json({ message: 'Trainer not found' });

    if (name) trainer.name = name;
    if (email) trainer.email = email;
    if (specialization !== undefined) trainer.specialization = specialization;
    if (isVerified !== undefined) trainer.isVerified = isVerified;
    if (password) trainer.password = password;

    await trainer.save();
    const { password: _p, ...safe } = trainer.toObject();
    res.json(safe);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteTrainer = async (req, res) => {
  try {
    const trainer = await Trainer.findById(req.params.id);
    if (!trainer) return res.status(404).json({ message: 'Trainer not found' });
    await trainer.deleteOne();
    res.json({ message: 'Trainer deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({})
      .sort({ date: -1 })
      .populate('user', 'name email')
      .populate('trainer', 'name specialization');
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    await appointment.deleteOne();
    res.json({ message: 'Appointment deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.verifyTrainer = async (req, res) => {
  try {
    const trainer = await Trainer.findByIdAndUpdate(req.params.id, { isVerified: true }, { new: true }).select('-password');
    if (!trainer) return res.status(404).json({ message: 'Trainer not found' });
    res.json(trainer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.toggleBlockMember = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Member not found' });
    user.isBlocked = !user.isBlocked;
    await user.save();
    res.json({ _id: user._id, isBlocked: user.isBlocked });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.toggleBlockTrainer = async (req, res) => {
  try {
    const trainer = await Trainer.findById(req.params.id);
    if (!trainer) return res.status(404).json({ message: 'Trainer not found' });
    trainer.isBlocked = !trainer.isBlocked;
    await trainer.save();
    res.json({ _id: trainer._id, isBlocked: trainer.isBlocked });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getPlatformStats = async (req, res) => {
  try {
    const successfulPayments = await Payment.find({ status: 'succeeded' });
    const usersCount = await User.countDocuments({ role: 'user' });
    const trainersCount = await Trainer.countDocuments();
    const appointmentsCount = await Appointment.countDocuments();
    const revenue = successfulPayments.reduce((acc, curr) => acc + curr.amount, 0);

    res.json({ users: usersCount, trainers: trainersCount, appointments: appointmentsCount, revenue });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
