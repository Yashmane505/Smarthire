import React, { useState, useEffect, useRef } from 'react';
import API from '../services/api';
import toast from 'react-hot-toast';
import { Clock, Play, AlertCircle, ChevronLeft, ChevronRight, CheckCircle, Award } from 'lucide-react';

const StudentTests = () => {
  const [tests, setTests] = useState([]);
  const [activeTest, setActiveTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]); // [{ questionId, selectedOption }]
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [testActive, setTestActive] = useState(false);

  // Timer state
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const res = await API.get('/tests');
        if (res.data.success) {
          setTests(res.data.tests);
        }
      } catch (err) {
        toast.error('Failed to load tests');
      } finally {
        setLoading(false);
      }
    };
    fetchTests();
  }, []);

  // Before unload handler to warn user
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (testActive) {
        e.preventDefault();
        e.returnValue = 'Warning: Leaving this page will submit your test immediately.';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [testActive]);

  // Timer effect
  useEffect(() => {
    if (testActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleAutoSubmit();
            return 0;
          }
          // Save timer state in localStorage
          localStorage.setItem(`test_timer_${activeTest._id}`, prev - 1);
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [testActive, timeLeft]);

  const startTest = async (test) => {
    setLoading(true);
    try {
      const res = await API.get(`/tests/${test._id}`);
      if (res.data.success) {
        const fetchedTest = res.data.test;
        setActiveTest(fetchedTest);
        setQuestions(fetchedTest.questions);
        
        // Restore progress if exists in localStorage
        const savedAnswers = localStorage.getItem(`test_answers_${fetchedTest._id}`);
        const savedTime = localStorage.getItem(`test_timer_${fetchedTest._id}`);
        
        if (savedAnswers) {
          setAnswers(JSON.parse(savedAnswers));
        } else {
          setAnswers(fetchedTest.questions.map(q => ({ questionId: q._id, selectedOption: '' })));
        }

        if (savedTime) {
          setTimeLeft(Number(savedTime));
        } else {
          setTimeLeft(fetchedTest.duration * 60);
        }

        setCurrentIdx(0);
        setTestActive(true);
      }
    } catch (err) {
      toast.error('Failed to load test questions');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (option) => {
    const updated = answers.map((a, idx) => {
      if (idx === currentIdx) {
        return { ...a, selectedOption: option };
      }
      return a;
    });
    setAnswers(updated);
    // Save to localStorage
    localStorage.setItem(`test_answers_${activeTest._id}`, JSON.stringify(updated));
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const submitAnswersPayload = async (finalAnswers) => {
    try {
      setLoading(true);
      const res = await API.post('/results/submit', {
        testId: activeTest._id,
        answers: finalAnswers
      });
      if (res.data.success) {
        toast.success('Test submitted successfully!');
        // Clean up localStorage
        localStorage.removeItem(`test_answers_${activeTest._id}`);
        localStorage.removeItem(`test_timer_${activeTest._id}`);
        
        // Reset states
        setTestActive(false);
        setActiveTest(null);
        setQuestions([]);
        setAnswers([]);
      }
    } catch (err) {
      toast.error('Failed to submit test');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoSubmit = () => {
    toast.error('Time limit reached! Submitting automatically.');
    // Pull latest answers directly from state/ref
    setAnswers((currentAnswers) => {
      submitAnswersPayload(currentAnswers);
      return currentAnswers;
    });
  };

  const handleManualSubmit = () => {
    if (window.confirm('Are you sure you want to finish and submit your test?')) {
      submitAnswersPayload(answers);
    }
  };

  if (loading && !testActive) {
    return <div className="text-center text-slate-450 py-12">Loading tests...</div>;
  }

  // Active Exam View
  if (testActive && activeTest) {
    const currentQuestion = questions[currentIdx];
    const userChoice = answers[currentIdx]?.selectedOption;

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Timer Bar */}
        <div className="glass-card px-6 py-4 rounded-2xl flex justify-between items-center shadow-sm">
          <div>
            <h2 className="font-bold text-lg">{activeTest.title}</h2>
            <p className="text-xs text-slate-400">Question {currentIdx + 1} of {questions.length}</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-900 rounded-xl font-bold font-mono">
            <Clock className={`h-5 w-5 ${timeLeft < 60 ? 'text-red-500 animate-pulse' : 'text-primary-505'}`} />
            <span className={timeLeft < 60 ? 'text-red-500' : ''}>{formatTime(timeLeft)}</span>
          </div>
        </div>

        {/* Exam Split */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Question View */}
          <div className="lg:col-span-3 glass-card p-6 rounded-2xl space-y-6 flex flex-col justify-between min-h-[400px]">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400">
                  {currentQuestion.category}
                </span>
                <span className="text-sm font-semibold font-mono text-slate-400">{currentQuestion.marks} pts</span>
              </div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                {currentQuestion.question}
              </h3>

              {/* Options */}
              <div className="space-y-3 pt-4">
                {currentQuestion.options.map((opt, idx) => {
                  const letter = String.fromCharCode(65 + idx);
                  const isSelected = userChoice === opt;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectOption(opt)}
                      className={`w-full text-left flex items-center gap-4 p-4 rounded-xl border transition-all ${
                        isSelected 
                          ? 'border-primary-500 bg-primary-500/5 text-primary-900 dark:text-primary-200 font-semibold' 
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-500/5 text-slate-700 dark:text-slate-350'
                      }`}
                    >
                      <span className={`flex h-6 w-6 items-center justify-center rounded-lg text-xs font-bold ${
                        isSelected ? 'bg-primary-505 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                      }`}>
                        {letter}
                      </span>
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Navigation buttons */}
            <div className="flex justify-between items-center pt-6 border-t border-slate-150 dark:border-slate-850">
              <button
                onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
                disabled={currentIdx === 0}
                className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-500/5 rounded-xl disabled:opacity-40"
              >
                <ChevronLeft className="h-5 w-5" />
                Previous
              </button>
              
              {currentIdx === questions.length - 1 ? (
                <button
                  onClick={handleManualSubmit}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-90 text-white rounded-xl font-bold shadow-md shadow-emerald-500/10"
                >
                  <CheckCircle className="h-5 w-5" />
                  Submit Exam
                </button>
              ) : (
                <button
                  onClick={() => setCurrentIdx(prev => Math.min(questions.length - 1, prev + 1))}
                  className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-500/5 rounded-xl"
                >
                  Next
                  <ChevronRight className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          {/* Quick-Nav Grid Indicator */}
          <div className="glass-card p-4 rounded-2xl h-fit space-y-4">
            <h4 className="font-bold text-sm">Exam Status</h4>
            <div className="grid grid-cols-4 gap-2">
              {questions.map((_, idx) => {
                const isAnswered = answers[idx]?.selectedOption !== '';
                const isActive = currentIdx === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => setCurrentIdx(idx)}
                    className={`h-9 w-9 rounded-lg font-bold font-mono text-xs flex items-center justify-center border transition-all ${
                      isActive 
                        ? 'border-primary-505 bg-primary-505 text-white ring-2 ring-primary-505/20' 
                        : isAnswered 
                        ? 'border-slate-300 dark:border-slate-700 bg-primary-500/10 text-primary-600 dark:text-primary-400' 
                        : 'border-slate-200 dark:border-slate-850 hover:bg-slate-500/5 text-slate-400'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
            <div className="pt-4 border-t border-slate-100 dark:border-slate-850 text-xs space-y-2 text-slate-400">
              <div className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 rounded bg-primary-500/20 border border-primary-500"></span>
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 rounded bg-transparent border border-slate-200 dark:border-slate-800"></span>
                <span>Unattempted</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Lists of available tests
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Practice Tests</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Select a test configuration below to begin. Tests are timed and must be completed in one sitting.
        </p>
      </div>

      {tests.length === 0 ? (
        <div className="glass-card p-12 text-center text-slate-400 rounded-2xl flex flex-col items-center justify-center">
          <AlertCircle className="h-10 w-10 opacity-30 mb-2" />
          No practice tests are currently scheduled by administrator.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tests.map((test) => (
            <div key={test._id} className="glass-card p-6 rounded-2xl flex flex-col justify-between hover:shadow-md transition-all group">
              <div>
                <h3 className="text-lg font-bold group-hover:text-primary-505 dark:group-hover:text-primary-400 transition-colors">
                  {test.title}
                </h3>
                <div className="mt-4 flex items-center gap-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {test.duration} Min
                  </span>
                  <span className="flex items-center gap-1 font-mono">
                    <Award className="h-4 w-4" />
                    {test.totalMarks} Points
                  </span>
                </div>
              </div>
              <button
                onClick={() => startTest(test)}
                className="mt-6 w-full flex items-center justify-center gap-2 py-3 bg-slate-100 dark:bg-slate-900 group-hover:bg-primary-505 group-hover:text-white rounded-xl font-semibold transition-all text-sm shadow-sm"
              >
                <Play className="h-4 w-4 fill-current" />
                Start Assessment
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentTests;
