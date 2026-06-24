const Message = require('../models/Message');

exports.sendMessage = async (req, res) => {
  try {
    res.status(201).json(await Message.create({ sender: req.user._id, recipient: req.body.recipientId, content: req.body.content }));
  } catch (error) {
    res.status(500).json({ message: 'Failed to send' });
  }
};

exports.getConversation = async (req, res) => {
  try {
    res.json(await Message.find({
      $or: [
        { sender: req.user._id, recipient: req.params.otherUserId },
        { sender: req.params.otherUserId, recipient: req.user._id }
      ]
    }).sort({ createdAt: 1 }));
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch' });
  }
};