import Question from '../models/Question.js';
import { ErrorResponse } from '../middlewares/errorMiddleware.js';

// @desc    Get all questions (with search, filter, pagination)
// @route   GET /api/questions
// @access  Private
export const getQuestions = async (req, res, next) => {
  try {
    const { category, difficulty, search, page = 1, limit = 10 } = req.query;

    const query = {};

    // Filter by Category
    if (category) {
      query.category = category;
    }

    // Filter by Difficulty
    if (difficulty) {
      query.difficulty = difficulty;
    }

    // Search query matching question text
    if (search) {
      query.question = { $regex: search, $options: 'i' };
    }

    // Execute query with pagination
    const total = await Question.countDocuments(query);
    const questions = await Question.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      success: true,
      count: questions.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: Number(page),
      questions,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single question
// @route   GET /api/questions/:id
// @access  Private
export const getQuestionById = async (req, res, next) => {
  try {
    const question = await Question.findById(req.params.id);

    if (!question) {
      return next(new ErrorResponse(`Question not found with id ${req.params.id}`, 404));
    }

    res.json({
      success: true,
      question,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a question
// @route   POST /api/questions
// @access  Private (Admin Only)
export const createQuestion = async (req, res, next) => {
  const { question, options, correctAnswer, category, difficulty, marks } = req.body;

  try {
    if (!question || !options || !correctAnswer || !category || !difficulty) {
      return next(new ErrorResponse('Please provide all required fields', 400));
    }

    // Ensure correctAnswer is one of the options
    if (!options.includes(correctAnswer)) {
      return next(new ErrorResponse('Correct answer must be one of the options', 400));
    }

    const newQuestion = await Question.create({
      question,
      options,
      correctAnswer,
      category,
      difficulty,
      marks: Number(marks) || 1,
    });

    res.status(201).json({
      success: true,
      question: newQuestion,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a question
// @route   PUT /api/questions/:id
// @access  Private (Admin Only)
export const updateQuestion = async (req, res, next) => {
  const { question, options, correctAnswer, category, difficulty, marks } = req.body;

  try {
    let q = await Question.findById(req.params.id);

    if (!q) {
      return next(new ErrorResponse(`Question not found with id ${req.params.id}`, 404));
    }

    // Verify option constraints if updated
    if (options && correctAnswer && !options.includes(correctAnswer)) {
      return next(new ErrorResponse('Correct answer must be one of the options', 400));
    }

    q = await Question.findByIdAndUpdate(
      req.params.id,
      { question, options, correctAnswer, category, difficulty, marks },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      question: q,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a question
// @route   DELETE /api/questions/:id
// @access  Private (Admin Only)
export const deleteQuestion = async (req, res, next) => {
  try {
    const q = await Question.findById(req.params.id);

    if (!q) {
      return next(new ErrorResponse(`Question not found with id ${req.params.id}`, 404));
    }

    await q.deleteOne();

    res.json({
      success: true,
      message: 'Question deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
