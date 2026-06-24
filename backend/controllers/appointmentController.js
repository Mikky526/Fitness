const Appointment = require('../models/Appointment');
const User = require('../models/User');

exports.createAppointment = async (req, res) => {
  try {
    const appointment = new Appointment({ user: req.user._id, ...req.body });
    res.status(201).json(await appointment.save());
  } catch (error) {
    res.status(500).json({ message: 'Failed to book appointment' });
  }
};

exports.getMyAppointments = async (req, res) => {
  try {
    let appointments = req.user.role === 'trainer' 
      ? await Appointment.find({ trainer: req.user._id }).populate('user', 'name email').sort({ date: 1 })
      : await Appointment.find({ user: req.user._id }).populate('trainer', 'name specialization').sort({ date: 1 });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch appointments' });
  }
};

exports.updateAppointmentStatus = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (appointment.trainer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    appointment.status = req.body.status;
    res.json(await appointment.save());
  } catch (error) {
    res.status(500).json({ message: 'Failed to update status' });
  }
};