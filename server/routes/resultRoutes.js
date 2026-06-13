import express from 'express';
import {
  submitTest,
  getMyResults,
  getLeaderboard,
  getPlatformStats,
  getStudentAnalytics,
} from '../controllers/resultController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/submit', submitTest);
router.get('/my', getMyResults);
router.get('/leaderboard', getLeaderboard);
router.get('/analytics', getStudentAnalytics);
router.get('/stats', authorize('admin'), getPlatformStats);

export default router;
