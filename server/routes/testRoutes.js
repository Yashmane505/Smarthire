import express from 'express';
import {
  getTests,
  getTestById,
  createTest,
  updateTest,
  deleteTest,
} from '../controllers/testController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getTests)
  .post(authorize('admin'), createTest);

router
  .route('/:id')
  .get(getTestById)
  .put(authorize('admin'), updateTest)
  .delete(authorize('admin'), deleteTest);

export default router;
