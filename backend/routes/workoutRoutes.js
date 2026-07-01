const express = require('express');
const router = express.Router();
const {
  createWorkout, getMyWorkouts, updateWorkout, getUserWorkouts,
  assignWorkout, getAssignedWorkouts, markWorkoutComplete, completeExercise,
  generateAIWorkout,
} = require('../controllers/workoutController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

router.route('/').post(protect, createWorkout).get(protect, getMyWorkouts);
router.route('/assign').post(protect, authorizeRoles('trainer'), assignWorkout);
router.route('/ai-generate').post(protect, authorizeRoles('trainer'), generateAIWorkout);
router.route('/assigned').get(protect, authorizeRoles('user'), getAssignedWorkouts);
router.route('/:id').put(protect, updateWorkout);
router.route('/:id/exercise/:index').put(protect, authorizeRoles('user'), completeExercise);
router.route('/:id/complete').put(protect, authorizeRoles('trainer'), markWorkoutComplete);
router.route('/user/:userId').get(protect, authorizeRoles('admin', 'trainer'), getUserWorkouts);

module.exports = router;
