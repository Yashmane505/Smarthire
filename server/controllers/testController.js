import Test from '../models/Test.js';
import Question from '../models/Question.js';
import { ErrorResponse } from '../middlewares/errorMiddleware.js';

// @desc    Get all tests
// @route   GET /api/tests
// @access  Private
export const getTests = async (req, res, next) => {
  try {
    const tests = await Test.find()
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: tests.length,
      tests,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single test details
// @route   GET /api/tests/:id
// @access  Private
export const getTestById = async (req, res, next) => {
  try {
    const test = await Test.findById(req.params.id)
      .populate('questions')
      .populate('createdBy', 'name');

    if (!test) {
      return next(new ErrorResponse(`Test not found with id ${req.params.id}`, 404));
    }

    // Safety: If student is fetching the test, strip out the correctAnswer field to prevent cheating
    if (req.user.role === 'student') {
      const sanitizedQuestions = test.questions.map((q) => {
        const qObj = q.toObject();
        delete qObj.correctAnswer;
        return qObj;
      });
      
      const sanitizedTest = test.toObject();
      sanitizedTest.questions = sanitizedQuestions;
      
      return res.json({
        success: true,
        test: sanitizedTest,
      });
    }

    res.json({
      success: true,
      test,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a test
// @route   POST /api/tests
// @access  Private (Admin Only)
export const createTest = async (req, res, next) => {
  const { title, questions, duration } = req.body;

  try {
    if (!title || !questions || !duration) {
      return next(new ErrorResponse('Please provide title, questions list, and duration', 400));
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return next(new ErrorResponse('Please add at least one question to the test', 400));
    }

    // Retrieve questions to calculate total marks
    const questionDocs = await Question.find({ _id: { $in: questions } });
    if (questionDocs.length !== questions.length) {
      return next(new ErrorResponse('One or more invalid Question IDs provided', 400));
    }

    const totalMarks = questionDocs.reduce((sum, q) => sum + q.marks, 0);

    const test = await Test.create({
      title,
      questions,
      duration: Number(duration),
      totalMarks,
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      test,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a test
// @route   PUT /api/tests/:id
// @access  Private (Admin Only)
export const updateTest = async (req, res, next) => {
  const { title, questions, duration } = req.body;

  try {
    let test = await Test.findById(req.params.id);

    if (!test) {
      return next(new ErrorResponse(`Test not found with id ${req.params.id}`, 404));
    }

    const updateData = {};
    if (title) updateData.title = title;
    if (duration) updateData.duration = Number(duration);

    if (questions) {
      if (!Array.isArray(questions) || questions.length === 0) {
        return next(new ErrorResponse('Please add at least one question to the test', 400));
      }
      const questionDocs = await Question.find({ _id: { $in: questions } });
      if (questionDocs.length !== questions.length) {
        return next(new ErrorResponse('One or more invalid Question IDs provided', 400));
      }
      updateData.questions = questions;
      updateData.totalMarks = questionDocs.reduce((sum, q) => sum + q.marks, 0);
    }

    test = await Test.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    res.json({
      success: true,
      test,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a test
// @route   DELETE /api/tests/:id
// @access  Private (Admin Only)
export const deleteTest = async (req, res, next) => {
  try {
    const test = await Test.findById(req.params.id);

    if (!test) {
      return next(new ErrorResponse(`Test not found with id ${req.params.id}`, 404));
    }

    await test.deleteOne();

    res.json({
      success: true,
      message: 'Test deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
