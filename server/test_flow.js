import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Question from './models/Question.js';
import Test from './models/Test.js';
import Result from './models/Result.js';

dotenv.config();

const API = 'http://127.0.0.1:5000/api';

// ─── helpers ──────────────────────────────────────────────
const post = (path, body, token) => fetch(`${API}${path}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
  body: JSON.stringify(body)
}).then(r => r.json().then(d => ({ status: r.status, data: d })));

const get = (path, token) => fetch(`${API}${path}`, {
  headers: { ...(token && { Authorization: `Bearer ${token}` }) }
}).then(r => r.json().then(d => ({ status: r.status, data: d })));

const put = (path, body, token) => fetch(`${API}${path}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
  body: JSON.stringify(body)
}).then(r => r.json().then(d => ({ status: r.status, data: d })));

const del = (path, token) => fetch(`${API}${path}`, {
  method: 'DELETE',
  headers: { ...(token && { Authorization: `Bearer ${token}` }) }
}).then(r => r.json().then(d => ({ status: r.status, data: d })));

function banner(title) {
  const line = '─'.repeat(60);
  console.log(`\n${line}`);
  console.log(`  ${title}`);
  console.log(line);
}

function result(label, status, expected, data) {
  const ok = status === expected;
  const icon = ok ? '✅' : '❌';
  console.log(`${icon}  ${label}`);
  console.log(`   Status: ${status} (expected ${expected})`);
  console.log(`   Response: ${JSON.stringify(data, null, 4).split('\n').join('\n   ')}`);
}

// ─── main ─────────────────────────────────────────────────
async function runFlowTests() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅  Connected to MongoDB');

  // Clean up old test data
  const testEmails = ['e2e_student@smarthire.com', 'e2e_admin@smarthire.com'];
  await User.deleteMany({ email: { $in: testEmails } });
  await Question.deleteMany({ question: /E2E Test Question/ });
  console.log('🧹  Cleaned previous E2E test data\n');

  // ── Register users ──────────────────────────────────────
  banner('PHASE 1 · Register Student & Admin');
  const { data: sReg } = await post('/auth/register', {
    name: 'E2E Student', email: 'e2e_student@smarthire.com',
    password: 'pass1234', role: 'student'
  });
  const studentToken = sReg.token;
  console.log(`✅  Student registered  →  token issued: ${studentToken ? 'YES' : 'NO'}`);
  console.log(`   Role: ${sReg.user?.role}, ID: ${sReg.user?.id}`);

  const { data: aReg } = await post('/auth/register', {
    name: 'E2E Admin', email: 'e2e_admin@smarthire.com',
    password: 'pass1234', role: 'admin'
  });
  const adminToken = aReg.token;
  console.log(`✅  Admin registered    →  token issued: ${adminToken ? 'YES' : 'NO'}`);
  console.log(`   Role: ${aReg.user?.role}, ID: ${aReg.user?.id}`);

  // ── Question CRUD ────────────────────────────────────────
  banner('PHASE 2 · Admin Question CRUD');

  // 2a. Create 3 questions
  const questionsPayload = [
    {
      question: 'E2E Test Question: What is 2 + 2?',
      options: ['3', '4', '5', '6'],
      correctAnswer: '4',
      category: 'Aptitude',
      difficulty: 'Easy',
      marks: 2
    },
    {
      question: 'E2E Test Question: Which data structure uses LIFO?',
      options: ['Queue', 'Stack', 'Heap', 'Tree'],
      correctAnswer: 'Stack',
      category: 'Technical',
      difficulty: 'Medium',
      marks: 3
    },
    {
      question: 'E2E Test Question: All cats are animals. All animals have DNA. Therefore?',
      options: ['Cats have DNA', 'Animals are cats', 'DNA has cats', 'None of these'],
      correctAnswer: 'Cats have DNA',
      category: 'Logical',
      difficulty: 'Easy',
      marks: 1
    }
  ];

  const questionIds = [];
  for (const [i, qp] of questionsPayload.entries()) {
    const { status, data } = await post('/questions', qp, adminToken);
    result(`Create Question ${i + 1} (${qp.category})`, status, 201, data.question || data);
    if (data.question?._id) questionIds.push(data.question._id);
  }

  // 2b. Get all questions (with filters)
  banner('PHASE 2b · Get Questions (Filtered)');
  const { status: listStatus, data: listData } = await get('/questions?category=Aptitude&difficulty=Easy', adminToken);
  result('GET /questions?category=Aptitude&difficulty=Easy', listStatus, 200, {
    count: listData.count,
    total: listData.total,
    firstQuestion: listData.questions?.[0]?.question
  });

  // 2c. Update a question
  banner('PHASE 2c · Update Question');
  if (questionIds[0]) {
    const { status: upStatus, data: upData } = await put(
      `/questions/${questionIds[0]}`,
      { marks: 5, difficulty: 'Hard' },
      adminToken
    );
    result('PUT /questions/:id (bump marks to 5, difficulty Hard)', upStatus, 200, {
      marks: upData.question?.marks,
      difficulty: upData.question?.difficulty
    });
  }

  // 2d. Student tries to create question (should fail)
  banner('PHASE 2d · Role Guard – Student Cannot Create Questions');
  const { status: forbidStatus, data: forbidData } = await post('/questions', questionsPayload[0], studentToken);
  result('POST /questions with STUDENT token (expect 403)', forbidStatus, 403, forbidData);

  // ── Test Creation ────────────────────────────────────────
  banner('PHASE 3 · Admin Test Template Creation');
  const { status: testStatus, data: testData } = await post('/tests', {
    title: 'E2E Sample Placement Test',
    questions: questionIds,
    duration: 30
  }, adminToken);
  result('POST /tests (create test with 3 questions)', testStatus, 201, {
    title: testData.test?.title,
    totalMarks: testData.test?.totalMarks,
    duration: testData.test?.duration,
    questionCount: testData.test?.questions?.length
  });
  const testId = testData.test?._id;

  // ── Student fetches test (correctAnswer stripped) ────────
  banner('PHASE 4 · Student Fetches Test (Anti-cheat Verification)');
  if (testId) {
    const { status: viewStatus, data: viewData } = await get(`/tests/${testId}`, studentToken);
    const qs = viewData.test?.questions || [];
    const hasCorrectAnswer = qs.some(q => q.correctAnswer !== undefined);
    result(`GET /tests/:id as student – correctAnswer stripped: ${!hasCorrectAnswer}`, viewStatus, 200, {
      title: viewData.test?.title,
      questionCount: qs.length,
      correctAnswerPresent: hasCorrectAnswer,
      sampleQuestion: qs[0]?.question
    });
  }

  // ── Test Submission ──────────────────────────────────────
  banner('PHASE 5 · Student Submits Test Answers');
  if (testId && questionIds.length > 0) {
    // Build answer array: get 1 right (Q1 correct), Q2 wrong, Q3 correct
    const answers = [
      { questionId: questionIds[0], selectedOption: '4' },         // correct (marks=5 after update)
      { questionId: questionIds[1], selectedOption: 'Queue' },      // wrong
      { questionId: questionIds[2], selectedOption: 'Cats have DNA' } // correct (marks=1)
    ];

    const { status: subStatus, data: subData } = await post('/results/submit', {
      testId,
      answers
    }, studentToken);
    result('POST /results/submit (2 correct, 1 wrong)', subStatus, 201, {
      score: subData.result?.score,
      totalMarks: subData.result?.totalMarks,
      percentage: subData.result?.percentage,
      categoryBreakdown: subData.result?.categoryBreakdown
    });
  }

  // ── My Results ───────────────────────────────────────────
  banner('PHASE 6 · Student Views Own Results');
  const { status: myStatus, data: myData } = await get('/results/my', studentToken);
  result('GET /results/my', myStatus, 200, {
    count: myData.count,
    latestTest: myData.results?.[0]?.test?.title,
    latestScore: myData.results?.[0]?.percentage + '%'
  });

  // ── Leaderboard ──────────────────────────────────────────
  banner('PHASE 7 · Leaderboard');
  const { status: lbStatus, data: lbData } = await get('/results/leaderboard', studentToken);
  result('GET /results/leaderboard', lbStatus, 200, {
    entriesReturned: lbData.leaderboard?.length,
    topEntry: lbData.leaderboard?.[0]
      ? { name: lbData.leaderboard[0].name, avgPercentage: lbData.leaderboard[0].avgPercentage }
      : 'none'
  });

  // ── Admin Platform Stats ─────────────────────────────────
  banner('PHASE 8 · Admin Platform Stats');
  const { status: statsStatus, data: statsData } = await get('/results/stats', adminToken);
  result('GET /results/stats (admin)', statsStatus, 200, statsData.stats);

  // ── Delete test (admin) ──────────────────────────────────
  banner('PHASE 9 · Admin Deletes Test Template');
  if (testId) {
    const { status: delStatus, data: delData } = await del(`/tests/${testId}`, adminToken);
    result('DELETE /tests/:id (admin)', delStatus, 200, { message: delData.message });
  }

  // ── Cleanup ──────────────────────────────────────────────
  await User.deleteMany({ email: { $in: testEmails } });
  await Question.deleteMany({ question: /E2E Test Question/ });
  await Result.deleteMany({});
  await mongoose.disconnect();

  console.log('\n' + '═'.repeat(60));
  console.log('  ✅  ALL END-TO-END FLOW TESTS COMPLETED');
  console.log('═'.repeat(60) + '\n');
  process.exit(0);
}

runFlowTests().catch(err => {
  console.error('❌ Test runner error:', err);
  mongoose.disconnect().then(() => process.exit(1));
});
