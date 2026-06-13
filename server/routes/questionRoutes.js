import express from 'express';
import {
  getQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
} from '../controllers/questionController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Require logged in for all question routes
router.use(protect);

router
  .route('/')
  .get(getQuestions)
  .post(authorize('admin'), createQuestion);

router
  .route('/:id')
  .get(getQuestionById)
  .put(authorize('admin'), updateQuestion)
  .delete(authorize('admin'), deleteQuestion);

export default router;
