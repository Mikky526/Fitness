const Workout = require('../models/Workout');
const Message = require('../models/Message');

exports.createWorkout = async (req, res) => {
  try {
    const workout = new Workout({ user: req.user._id, ...req.body });
    res.status(201).json(await workout.save());
  } catch (error) {
    res.status(500).json({ message: 'Failed to create workout' });
  }
};

exports.getMyWorkouts = async (req, res) => {
  try {
    res.json(await Workout.find({ user: req.user._id, trainer: { $exists: false } }).sort({ date: -1 }));
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch workouts' });
  }
};

exports.updateWorkout = async (req, res) => {
  try {
    const workout = await Workout.findById(req.params.id);
    if (!workout || workout.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    workout.completed = req.body.completed !== undefined ? req.body.completed : workout.completed;
    res.json(await workout.save());
  } catch (error) {
    res.status(500).json({ message: 'Failed to update' });
  }
};

exports.getUserWorkouts = async (req, res) => {
  try {
    res.json(await Workout.find({ user: req.params.userId }).sort({ date: -1 }));
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch user workouts' });
  }
};

// Trainer assigns a workout plan to a specific member
exports.assignWorkout = async (req, res) => {
  try {
    const { userId, title, exercises } = req.body;
    if (!userId || !title) return res.status(400).json({ message: 'userId and title are required' });
    const workout = new Workout({
      user: userId,
      trainer: req.user._id,
      title,
      exercises: exercises || [],
    });
    res.status(201).json(await workout.save());
  } catch (error) {
    res.status(500).json({ message: 'Failed to assign workout' });
  }
};

// Member gets all workouts assigned by their trainer
exports.getAssignedWorkouts = async (req, res) => {
  try {
    const workouts = await Workout.find({
      user: req.user._id,
      trainer: { $exists: true, $ne: null },
    })
      .populate('trainer', 'name email specialization')
      .sort({ date: -1 });
    res.json(workouts);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch assigned workouts' });
  }
};

// Member checks off a single exercise and notifies the trainer via message
exports.completeExercise = async (req, res) => {
  try {
    const workout = await Workout.findById(req.params.id);
    if (!workout) return res.status(404).json({ message: 'Workout not found' });
    if (workout.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const idx = parseInt(req.params.index, 10);
    const ex = workout.exercises[idx];
    if (!ex) return res.status(404).json({ message: 'Exercise not found' });

    ex.completed = !ex.completed;

    // Auto-mark the whole plan as completed when every exercise is ticked
    workout.completed = workout.exercises.length > 0 && workout.exercises.every(e => e.completed);

    // Force Mongoose to detect subdocument array changes before saving
    workout.markModified('exercises');
    await workout.save();

    if (workout.trainer) {
      if (workout.completed) {
        // All exercises done — send a plan-complete notification
        await Message.create({
          sender:    req.user._id,
          recipient: workout.trainer,
          content:   `🏆 All exercises completed for plan "${workout.title}"! Every set and rep is done.`,
        });
      } else if (ex.completed) {
        // Single exercise ticked done
        const weightPart = ex.weight ? ` @ ${ex.weight} kg` : '';
        await Message.create({
          sender:    req.user._id,
          recipient: workout.trainer,
          content:   `✅ Exercise done: "${ex.name}" — ${ex.sets} sets × ${ex.reps} reps${weightPart} (Plan: "${workout.title}")`,
        });
      }
    }

    res.json(workout);
  } catch (error) {
    console.error('completeExercise error:', error);
    res.status(500).json({ message: 'Failed to update exercise' });
  }
};

// Trainer marks a member's workout as complete/reviewed
exports.markWorkoutComplete = async (req, res) => {
  try {
    const workout = await Workout.findById(req.params.id);
    if (!workout) return res.status(404).json({ message: 'Workout not found' });
    workout.completed = req.body.completed !== undefined ? req.body.completed : true;
    res.json(await workout.save());
  } catch (error) {
    res.status(500).json({ message: 'Failed to update workout' });
  }
};
