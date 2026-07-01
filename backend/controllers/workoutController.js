const Workout = require('../models/Workout');
const Message = require('../models/Message');

const buildRuleBasedWorkout = ({ goal, fitnessLevel, focusArea, memberName, sets }) => {
  const level = (fitnessLevel || 'beginner').toLowerCase();
  const goalLower = (goal || 'general fitness').toLowerCase();
  const s = Number(sets) || 3;

  const plans = {
    beginner: [
      { name: 'Bodyweight Squat', sets: s, reps: 12, weight: 0 },
      { name: 'Push-Up', sets: s, reps: 10, weight: 0 },
      { name: 'Dumbbell Row', sets: s, reps: 12, weight: 10 },
      { name: 'Glute Bridge', sets: s, reps: 15, weight: 0 },
      { name: 'Plank Hold (30s)', sets: s, reps: 1, weight: 0 },
      { name: 'Dumbbell Shoulder Press', sets: s, reps: 10, weight: 8 },
    ],
    intermediate: [
      { name: 'Barbell Squat', sets: s, reps: 8, weight: 60 },
      { name: 'Bench Press', sets: s, reps: 8, weight: 50 },
      { name: 'Deadlift', sets: s, reps: 6, weight: 80 },
      { name: 'Pull-Up', sets: s, reps: 8, weight: 0 },
      { name: 'Overhead Press', sets: s, reps: 10, weight: 40 },
      { name: 'Cable Row', sets: s, reps: 12, weight: 45 },
    ],
    advanced: [
      { name: 'Back Squat', sets: s, reps: 5, weight: 100 },
      { name: 'Bench Press', sets: s, reps: 5, weight: 80 },
      { name: 'Romanian Deadlift', sets: s, reps: 6, weight: 100 },
      { name: 'Weighted Pull-Up', sets: s, reps: 6, weight: 20 },
      { name: 'Military Press', sets: s, reps: 6, weight: 60 },
      { name: 'Barbell Row', sets: s, reps: 8, weight: 70 },
      { name: 'Dips', sets: s, reps: 12, weight: 0 },
    ],
  };

  const exercises = plans[level] || plans.beginner;
  const titleGoal = goalLower.includes('weight') ? 'Weight Loss' : goalLower.includes('muscle') ? 'Muscle Building' : 'General Fitness';
  const titleLevel = level.charAt(0).toUpperCase() + level.slice(1);
  return { title: `${titleGoal} – ${titleLevel} (${memberName || 'Member'})`, exercises };
};

exports.generateAIWorkout = async (req, res) => {
  try {
    const { memberName, goal, fitnessLevel, sets, exerciseCount, equipment, focusArea, notes } = req.body;
    const setsNum = Number(sets) || 3;
    const exCount = Math.min(Math.max(Number(exerciseCount) || 6, 1), 20);
    let result = null;

    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      try {
        const prompt = [
          'Generate a structured single-session workout plan for a fitness member.',
          `Member: ${memberName || 'Member'}`,
          `Goal: ${goal || 'general fitness'}`,
          `Fitness Level: ${fitnessLevel || 'beginner'}`,
          `Sets per exercise: ${setsNum}`,
          `Number of exercises to include: ${exCount}`,
          `Equipment: ${equipment || 'full gym'}`,
          `Focus area: ${focusArea || 'full body'}`,
          `Notes: ${notes || 'none'}`,
          '',
          'Return ONLY valid JSON — no markdown, no explanation:',
          '{"title":"Plan name","exercises":[{"name":"Exercise name","sets":3,"reps":12,"weight":0}]}',
          `Include exactly ${exCount} exercises. Weight in kg (use 0 for bodyweight). Be practical and safe.`,
        ].join('\n');

        const resp = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({
            model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
            temperature: 0.5,
            messages: [
              { role: 'system', content: 'You are a professional personal trainer. Always respond with valid JSON only, no extra text.' },
              { role: 'user', content: prompt },
            ],
          }),
        });
        if (resp.ok) {
          const data = await resp.json();
          const text = (data.choices?.[0]?.message?.content || '').replace(/```json|```/g, '').trim();
          if (text) result = JSON.parse(text);
        }
      } catch (e) {
        console.error('AI workout fallback:', e.message);
      }
    }

    if (!result) {
      result = buildRuleBasedWorkout({ goal, fitnessLevel, focusArea, memberName, sets: setsNum });
      result.exercises = result.exercises.slice(0, exCount);
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate workout plan' });
  }
};

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
