const DietPlan = require('../models/DietPlan');

exports.getMyDietPlans = async (req, res) => {
  try {
    const plans = await DietPlan.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(100);

    const normalizedPlans = plans.map((plan) => {
      if (plan.status) return plan;
      return {
        ...plan.toObject(),
        status: 'pending',
      };
    });

    res.json(normalizedPlans);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load your diet plans' });
  }
};

exports.getAllDietPlans = async (req, res) => {
  try {
    const plans = await DietPlan.find({})
      .sort({ createdAt: -1 })
      .limit(300);

    const normalizedPlans = plans.map((plan) => {
      if (plan.status) return plan;
      return {
        ...plan.toObject(),
        status: 'pending',
      };
    });

    res.json(normalizedPlans);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load diet plans' });
  }
};

exports.updateDietPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { plan } = req.body;

    if (!plan || !plan.trim()) {
      return res.status(400).json({ message: 'Plan content is required' });
    }

    const updated = await DietPlan.findByIdAndUpdate(
      id,
      { plan: plan.trim() },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Diet plan not found' });
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update diet plan' });
  }
};

exports.deleteDietPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await DietPlan.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: 'Diet plan not found' });
    }

    res.json({ message: 'Diet plan deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete diet plan' });
  }
};

exports.reviewDietPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, comment } = req.body; // action: 'approve' | 'reject'

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'action must be approve or reject' });
    }

    const plan = await DietPlan.findById(id);
    if (!plan) return res.status(404).json({ message: 'Diet plan not found' });

    plan.status = action === 'approve' ? 'approved' : 'rejected';
    plan.trainerComment = comment?.trim() || '';
    plan.reviewedBy = req.user._id;
    plan.reviewedByName = req.user.name || '';
    plan.reviewedAt = new Date();

    // Backward compatibility for old documents created before comments existed.
    if (!Array.isArray(plan.comments)) {
      plan.comments = [];
    }

    if (comment?.trim()) {
      plan.comments.push({
        trainerId: req.user._id,
        trainerName: req.user.name || 'Trainer',
        comment: comment.trim(),
      });
    }

    await plan.save();
    res.json(plan);
  } catch (error) {
    res.status(500).json({ message: 'Failed to review diet plan' });
  }
};

exports.addTrainerComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;

    if (!comment || !comment.trim()) {
      return res.status(400).json({ message: 'Comment is required' });
    }

    const plan = await DietPlan.findById(id);
    if (!plan) {
      return res.status(404).json({ message: 'Diet plan not found' });
    }

    plan.comments.push({
      trainerId: req.user._id,
      trainerName: req.user.name,
      comment: comment.trim(),
    });

    await plan.save();
    res.status(201).json(plan);
  } catch (error) {
    res.status(500).json({ message: 'Failed to add comment' });
  }
};
