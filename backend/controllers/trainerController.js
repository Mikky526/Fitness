const User = require('../models/User');
const Trainer = require('../models/Trainer');

exports.getAllTrainers = async (req, res) => {
  try {
    const trainers = await Trainer.find({}).select('-password');
    res.json(trainers);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch trainers' });
  }
};

exports.selectTrainer = async (req, res) => {
  try {
    const trainer = await Trainer.findById(req.params.trainerId).select('-password');
    if (!trainer) return res.status(404).json({ message: 'Trainer not found' });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { assignedTrainer: req.params.trainerId },
      { new: true }
    ).select('-password').populate('assignedTrainer', 'name email specialization');

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Failed to select trainer' });
  }
};

exports.getMyTrainer = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('assignedTrainer')
      .populate('assignedTrainer', 'name email specialization isVerified');
    res.json(user?.assignedTrainer || null);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch trainer' });
  }
};

exports.getMyMembers = async (req, res) => {
  try {
    const members = await User.find({ assignedTrainer: req.user._id }).select('-password');
    res.json(members);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch members' });
  }
};
