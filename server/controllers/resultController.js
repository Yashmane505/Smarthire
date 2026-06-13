import Result from '../models/Result.js';
import Test from '../models/Test.js';
import Question from '../models/Question.js';
import User from '../models/User.js';
import { ErrorResponse } from '../middlewares/errorMiddleware.js';

// @desc    Submit test answers & calculate score
// @route   POST /api/results/submit
// @access  Private
export const submitTest = async (req, res, next) => {
  const { testId, answers } = req.body; // answers: [{ questionId: '...', selectedOption: '...' }]

  try {
    if (!testId || !answers || !Array.isArray(answers)) {
      return next(new ErrorResponse('Please provide testId and answers array', 400));
    }

    // Check if test exists
    const test = await Test.findById(testId).populate('questions');
    if (!test) {
      return next(new ErrorResponse(`Test not found with id ${testId}`, 404));
    }

    // Process and evaluate answers
    let calculatedScore = 0;
    let totalMarks = test.totalMarks;
    const evaluatedAnswers = [];
    const categoryMap = new Map();

    // Setup categories based on test questions
    test.questions.forEach((q) => {
      if (!categoryMap.has(q.category)) {
        categoryMap.set(q.category, { score: 0, total: 0 });
      }
      const cat = categoryMap.get(q.category);
      cat.total += q.marks;
      categoryMap.set(q.category, cat);
    });

    // Evaluate answers
    test.questions.forEach((question) => {
      // Find user submitted answer for this question
      const submittedAnswer = answers.find(
        (a) => a.questionId === question._id.toString()
      );

      const selectedOption = submittedAnswer ? submittedAnswer.selectedOption : '';
      const isCorrect = selectedOption === question.correctAnswer;

      if (isCorrect) {
        calculatedScore += question.marks;
        
        // Update category score
        const cat = categoryMap.get(question.category);
        cat.score += question.marks;
        categoryMap.set(question.category, cat);
      }

      evaluatedAnswers.push({
        question: question._id,
        selectedOption,
        isCorrect,
      });
    });

    const percentage = Number(((calculatedScore / totalMarks) * 100).toFixed(2));

    // Save Result
    const result = await Result.create({
      student: req.user.id,
      test: testId,
      answers: evaluatedAnswers,
      score: calculatedScore,
      totalMarks,
      percentage,
      categoryBreakdown: Object.fromEntries(categoryMap),
    });

    res.status(201).json({
      success: true,
      result,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current student's results
// @route   GET /api/results/my
// @access  Private
export const getMyResults = async (req, res, next) => {
  try {
    const results = await Result.find({ student: req.user.id })
      .populate('test', 'title totalMarks duration')
      .populate('answers.question')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: results.length,
      results,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get leaderboard
// @route   GET /api/results/leaderboard
// @access  Private
export const getLeaderboard = async (req, res, next) => {
  try {
    // Aggregate results to find best percentage per student
    const leaderboard = await Result.aggregate([
      {
        $group: {
          _id: '$student',
          avgPercentage: { $avg: '$percentage' },
          totalTests: { $sum: 1 },
          maxScore: { $max: '$score' },
        },
      },
      { $sort: { avgPercentage: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'studentInfo',
        },
      },
      { $unwind: '$studentInfo' },
      {
        $project: {
          _id: 1,
          avgPercentage: 1,
          totalTests: 1,
          name: '$studentInfo.name',
          email: '$studentInfo.email',
        },
      },
    ]);

    res.json({
      success: true,
      leaderboard,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get overall stats for admin dashboard
// @route   GET /api/results/stats
// @access  Private (Admin Only)
export const getPlatformStats = async (req, res, next) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalTests = await Test.countDocuments();
    const totalSubmissions = await Result.countDocuments();
    
    // Average score aggregate
    const avgScoreAgg = await Result.aggregate([
      {
        $group: {
          _id: null,
          avgPercentage: { $avg: '$percentage' },
        },
      },
    ]);

    const averagePercentage = avgScoreAgg.length > 0 ? avgScoreAgg[0].avgPercentage : 0;

    // Fetch recent registration list and test activity logs
    const recentActivity = await Result.find()
      .populate('student', 'name')
      .populate('test', 'title')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      stats: {
        totalStudents,
        totalTests,
        totalSubmissions,
        averagePercentage: Number(averagePercentage.toFixed(2)),
      },
      recentActivity,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get student analytical report from Python microservice
// @route   GET /api/results/analytics
// @access  Private
export const getStudentAnalytics = async (req, res, next) => {
  try {
    const results = await Result.find({ student: req.user.id }).populate('test', 'title');

    const formattedResults = results.map((r) => {
      // Handle Mongoose Map type
      const breakdownObj = r.categoryBreakdown instanceof Map 
        ? Object.fromEntries(r.categoryBreakdown) 
        : r.categoryBreakdown;

      const cleanBreakdown = {};
      if (breakdownObj) {
        for (const [catName, scores] of Object.entries(breakdownObj)) {
          if (scores) {
            // Support both mongoose subdocument getters and direct properties
            const scoreVal = typeof scores.score === 'number' ? scores.score : (scores.get ? scores.get('score') : 0);
            const totalVal = typeof scores.total === 'number' ? scores.total : (scores.get ? scores.get('total') : 0);
            cleanBreakdown[catName] = {
              score: Math.round(scoreVal) || 0,
              total: Math.round(totalVal) || 0
            };
          }
        }
      }

      return {
        test_title: r.test?.title || 'Practice Test',
        percentage: r.percentage,
        category_breakdown: cleanBreakdown,
      };
    });

    // Invoke Python FastAPI service
    const pythonUrl = `${process.env.PYTHON_SERVICE_URL || 'http://127.0.0.1:8000'}/analyze`;
    
    const pyResponse = await fetch(pythonUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ results: formattedResults }),
    });

    if (!pyResponse.ok) {
      throw new Error(`Python service responded with status ${pyResponse.status}`);
    }

    const report = await pyResponse.json();

    res.json({
      success: true,
      report,
    });
  } catch (error) {
    next(error);
  }
};
