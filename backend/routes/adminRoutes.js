const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  createMember, updateMember, deleteMember, toggleBlockMember,
  createTrainer, updateTrainer, deleteTrainer, toggleBlockTrainer,
  verifyTrainer, getPlatformStats, getAllAppointments,
} = require('../controllers/adminController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

const adminOnly = [protect, authorizeRoles('admin')];

router.get('/users',   protect, authorizeRoles('admin', 'trainer'), getAllUsers);
router.get('/stats',        ...adminOnly, getPlatformStats);
router.get('/appointments', ...adminOnly, getAllAppointments);

// Members
router.post('/members',             ...adminOnly, createMember);
router.put('/members/:id',          ...adminOnly, updateMember);
router.put('/members/:id/block',    ...adminOnly, toggleBlockMember);
router.delete('/members/:id',       ...adminOnly, deleteMember);

// Trainers — specific routes must come before /:id
router.post('/trainers',            ...adminOnly, createTrainer);
router.put('/trainers/:id/verify',  ...adminOnly, verifyTrainer);
router.put('/trainers/:id/block',   ...adminOnly, toggleBlockTrainer);
router.put('/trainers/:id',         ...adminOnly, updateTrainer);
router.delete('/trainers/:id',      ...adminOnly, deleteTrainer);

module.exports = router;
