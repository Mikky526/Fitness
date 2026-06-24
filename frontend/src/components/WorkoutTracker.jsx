import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { workoutService } from '../services/workoutService';

const FITNESS_EXERCISES = [
  'Bench Press', 'Back Squats', 'Deadlifts', 'Pull-Ups', 'Push-Ups',
  'Barbell Lunges', 'Plank Hold', 'Bicep Curls', 'Shoulder Press', 'Leg Press',
  'Tricep Dips', 'Cable Rows', 'Hip Thrusts', 'Calf Raises', 'Face Pulls',
  'Lat Pulldown', 'Romanian Deadlift', 'Incline Press', 'Dumbbell Fly', 'Arnold Press',
];

const WorkoutTracker = () => {
  const [workouts, setWorkouts] = useState([]);
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(true);

  useEffect(() => {
    workoutService.getWorkouts()
      .then(setWorkouts)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Fetch exercise suggestions from JSONPlaceholder /todos
  useEffect(() => {
    fetch('https://jsonplaceholder.typicode.com/todos?_limit=20')
      .then(r => r.json())
      .then(todos => {
        const mapped = todos.map((todo, i) => ({
          id: todo.id,
          title: FITNESS_EXERCISES[i] || todo.title,
          completed: todo.completed,
        }));
        setSuggestions(mapped);
      })
      .catch(() => setSuggestions([]))
      .finally(() => setSuggestionsLoading(false));
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setAdding(true);
    try {
      const created = await workoutService.createWorkout({ title: title.trim(), exercises: [] });
      setWorkouts([created, ...workouts]);
      setTitle('');
    } catch (err) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  };

  const quickAdd = (exerciseName) => {
    setTitle(exerciseName);
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: (i) => ({
      opacity: 1, y: 0,
      transition: { duration: 0.4, delay: i * 0.05, ease: 'easeOut' },
    }),
    exit: { opacity: 0, x: 20, transition: { duration: 0.25 } },
  };

  return (
    <div className="space-y-8">
      {error && (
        <motion.div
          className="p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100 flex items-center gap-2"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        >
          <span>⚠️</span> {error}
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Add Workout Form */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        >
          <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center text-sm">➕</span>
            Log a Workout
          </h3>
          <form onSubmit={handleAdd} className="space-y-3">
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field"
              placeholder="e.g. Bench Press, Squats..."
            />
            <motion.button
              type="submit"
              disabled={adding || !title.trim()}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-sm shadow-md shadow-indigo-200/50 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {adding ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.span
                    className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
                  />
                  Saving...
                </span>
              ) : 'Save Workout'}
            </motion.button>
          </form>
        </motion.div>

        {/* Saved Workouts */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        >
          <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center text-sm">📋</span>
            Recent Workouts
            {workouts.length > 0 && (
              <span className="ml-auto text-xs font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                {workouts.length}
              </span>
            )}
          </h3>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-10 rounded-xl shimmer-bg" />
              ))}
            </div>
          ) : workouts.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">🏋️</div>
              <p className="text-gray-400 text-sm">No workouts logged yet.</p>
              <p className="text-gray-400 text-xs mt-1">Log your first workout above!</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              <AnimatePresence>
                {workouts.map((w, idx) => (
                  <motion.div
                    key={w._id}
                    custom={idx}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-indigo-50 border border-gray-100 hover:border-indigo-100 transition-all group cursor-default"
                  >
                    <span className="w-2 h-2 rounded-full bg-indigo-400 flex-shrink-0" />
                    <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-700 transition-colors flex-1 truncate">
                      {w.title}
                    </span>
                    <span className="text-xs text-gray-400 flex-shrink-0">✓</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>

      {/* Exercise Suggestions from JSONPlaceholder /todos */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-orange-100 flex items-center justify-center text-sm">⚡</span>
            Quick-Add Exercises
          </h3>
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
            via JSONPlaceholder API
          </span>
        </div>

        {suggestionsLoading ? (
          <div className="flex flex-wrap gap-2">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="h-8 w-28 rounded-full shimmer-bg" />
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s, i) => (
              <motion.button
                key={s.id}
                onClick={() => quickAdd(s.title)}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03, duration: 0.3 }}
                whileHover={{ scale: 1.06, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className={`px-3.5 py-1.5 rounded-full text-sm font-semibold border transition-all duration-150 ${
                  title === s.title
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200'
                    : s.completed
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200'
                }`}
              >
                {s.title}
              </motion.button>
            ))}
          </div>
        )}
        <p className="text-xs text-gray-400 mt-3">
          Click any exercise to fill the form above, then save to your log.
        </p>
      </motion.div>
    </div>
  );
};

export default WorkoutTracker;
