import React, { useState, useEffect } from 'react';
import API from '../services/api';
import toast from 'react-hot-toast';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar, Legend 
} from 'recharts';
import { Award, Calendar, Percent, ShieldCheck, History, AlertCircle, Eye, X, CheckCircle2, XCircle } from 'lucide-react';

const StudentResults = () => {
  const [results, setResults] = useState([]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewingResult, setReviewingResult] = useState(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const [res, reportRes] = await Promise.all([
          API.get('/results/my'),
          API.get('/results/analytics').catch(() => null) // fail gracefully if Python app is not active yet
        ]);
        
        if (res.data.success) {
          setResults(res.data.results);
        }
        if (reportRes && reportRes.data?.success) {
          setReport(reportRes.data.report);
        }
      } catch (err) {
        toast.error('Failed to load results');
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, []);

  if (loading) {
    return <div className="text-center text-slate-450 py-12">Analyzing performance logs...</div>;
  }

  if (results.length === 0) {
    return (
      <div className="glass-card p-12 text-center text-slate-400 rounded-2xl flex flex-col items-center justify-center">
        <AlertCircle className="h-10 w-10 opacity-30 mb-2" />
        No results recorded. Attempt a practice test to unlock analytics.
      </div>
    );
  }

  // Formatting chart data for Progress Timeline
  const timelineData = [...results]
    .reverse() // show oldest to newest
    .map((r, idx) => ({
      name: `Test ${idx + 1}`,
      percentage: r.percentage,
      title: r.test?.title || 'Practice Test',
    }));

  // Formatting category accuracy aggregate data
  const categorySummary = {};
  results.forEach(res => {
    if (res.categoryBreakdown) {
      // Loop over categoryBreakdown keys
      Object.entries(res.categoryBreakdown).forEach(([catName, breakdown]) => {
        if (!categorySummary[catName]) {
          categorySummary[catName] = { score: 0, total: 0 };
        }
        categorySummary[catName].score += breakdown.score || 0;
        categorySummary[catName].total += breakdown.total || 0;
      });
    }
  });

  const categoryChartData = Object.entries(categorySummary).map(([name, data]) => ({
    name,
    accuracy: Number(((data.score / data.total) * 100).toFixed(1)),
    correct: data.score,
    total: data.total,
  }));

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Performance Analytics</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Review category-wise precision and overall development trends.
        </p>
      </div>

      {/* Python Placement readiness report */}
      {report && (
        <div className="glass-card p-6 rounded-2xl border border-primary-500/25 bg-gradient-to-tr from-primary-500/5 to-indigo-500/5 grid grid-cols-1 md:grid-cols-3 gap-6 shadow-sm">
          <div className="md:border-r border-slate-200 dark:border-slate-800 pr-0 md:pr-6 flex flex-col justify-center items-center text-center">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Placement Readiness</span>
            <h2 className="text-5xl font-extrabold mt-3 text-primary-505 dark:text-primary-400 font-mono">
              {report.placement_readiness_score}%
            </h2>
            <span className="mt-2 text-sm font-bold px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-950 text-primary-800 dark:text-primary-400 capitalize">
              {report.readiness_status} Status
            </span>
          </div>
          
          <div className="md:border-r border-slate-200 dark:border-slate-800 pr-0 md:pr-6 flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Strength & Improvement</span>
              <div className="mt-3 space-y-3">
                <div>
                  <span className="text-xs text-slate-400">Strong Categories:</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {report.strong_topics?.length > 0 ? (
                      report.strong_topics.map(t => (
                        <span key={t} className="px-2 py-0.5 text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-md">
                          {t}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-450 italic">None identified yet</span>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Weak Categories:</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {report.weak_topics?.length > 0 ? (
                      report.weak_topics.map(t => (
                        <span key={t} className="px-2 py-0.5 text-xs font-medium bg-red-500/10 text-red-650 dark:text-red-400 rounded-md">
                          {t}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-450 italic">None identified yet</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Key Recommendations</span>
              <ul className="mt-3 space-y-2 text-xs text-slate-650 dark:text-slate-350 list-disc list-inside">
                {report.recommendations?.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Chart Panel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Progress Timeline Chart */}
        <div className="glass-card p-6 rounded-2xl shadow-sm space-y-4">
          <h3 className="text-lg font-bold">Progress Timeline</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} />
                <Tooltip 
                  contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff' }}
                  labelFormatter={(value) => timelineData[value]?.title || value} 
                />
                <Line type="monotone" dataKey="percentage" stroke="#0ea5e9" strokeWidth={3} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category breakdown accuracy Bar Chart */}
        <div className="glass-card p-6 rounded-2xl shadow-sm space-y-4">
          <h3 className="text-lg font-bold">Category Accuracy (%)</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} />
                <Tooltip 
                  contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff' }}
                  formatter={(value) => [`${value}% Accuracy`, 'Score']}
                />
                <Bar dataKey="accuracy" fill="#6366f1" radius={[8, 8, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Results History log */}
      <div className="glass-card p-6 rounded-2xl shadow-sm space-y-6">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <History className="text-primary-505" />
          Test Logs
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/50 dark:bg-slate-900/50 text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <th className="py-4 px-6">Quiz Name</th>
                <th className="py-4 px-6">Attempt Date</th>
                <th className="py-4 px-6">Marks Secured</th>
                <th className="py-4 px-6">Accuracy</th>
                <th className="py-4 px-6">Evaluation</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-sm">
              {results.map((r) => (
                <tr key={r._id} className="hover:bg-slate-500/5 transition-colors">
                  <td className="py-4 px-6 font-semibold text-slate-800 dark:text-slate-200">
                    {r.test?.title || 'Practice Test'}
                  </td>
                  <td className="py-4 px-6 text-slate-400 flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(r.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-6 font-mono font-bold">
                    {r.score} / {r.totalMarks}
                  </td>
                  <td className="py-4 px-6 font-semibold text-primary-505 font-mono">
                    {r.percentage}%
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      r.percentage >= 50 
                        ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-400' 
                        : 'bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-400'
                    }`}>
                      {r.percentage >= 50 ? 'Cleared' : 'Needs Work'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button
                      onClick={() => setReviewingResult(r)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-350 hover:bg-primary-505 hover:text-white dark:hover:bg-primary-505 dark:hover:text-white transition-all shadow-sm"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Review Test
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      {reviewingResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm transition-all duration-300">
          <div className="glass-card w-full max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl flex flex-col shadow-2xl border border-slate-200/50 dark:border-slate-800/80 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-850 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/30">
              <div>
                <h3 className="font-extrabold text-xl text-slate-850 dark:text-slate-100">
                  Review: {reviewingResult.test?.title || 'Practice Test'}
                </h3>
                <div className="flex items-center gap-3 mt-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <span>Score: <strong className="font-mono text-slate-700 dark:text-slate-200">{reviewingResult.score} / {reviewingResult.totalMarks}</strong></span>
                  <span>•</span>
                  <span>Accuracy: <strong className="font-mono text-primary-505 dark:text-primary-400">{reviewingResult.percentage}%</strong></span>
                </div>
              </div>
              <button
                onClick={() => setReviewingResult(null)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 animate-fadeIn">
              {reviewingResult.answers.map((ans, idx) => {
                const questionObj = ans.question;
                if (!questionObj) {
                  return (
                    <div key={idx} className="p-4 rounded-xl border border-red-200 dark:border-red-955 bg-red-500/5 text-sm text-red-400 font-medium">
                      Question data is unavailable. (Selected Option: "{ans.selectedOption || 'None'}")
                    </div>
                  );
                }

                const isCorrect = ans.isCorrect;
                return (
                  <div 
                    key={idx} 
                    className={`p-6 rounded-2xl border transition-all ${
                      isCorrect 
                        ? 'border-emerald-500/20 bg-emerald-500/[0.02]' 
                        : 'border-red-500/20 bg-red-500/[0.02]'
                    }`}
                  >
                    {/* Header bar */}
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                          Q{idx + 1}
                        </span>
                        <span className="px-2 py-0.5 text-2xs font-bold rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">
                          {questionObj.category}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1.5">
                        {isCorrect ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-455 bg-emerald-100/50 dark:bg-emerald-950/30 px-2.5 py-0.5 rounded-full">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Correct (+{questionObj.marks} pts)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-red-650 dark:text-red-400 bg-red-100/50 dark:bg-red-950/30 px-2.5 py-0.5 rounded-full">
                            <XCircle className="h-3.5 w-3.5" />
                            Incorrect (0/{questionObj.marks} pts)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Question description */}
                    <h4 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-4">
                      {questionObj.question}
                    </h4>

                    {/* Options list */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {questionObj.options.map((opt, optIdx) => {
                        const letter = String.fromCharCode(65 + optIdx);
                        const isUserChoice = ans.selectedOption === opt;
                        const isCorrectAnswer = questionObj.correctAnswer === opt;
                        
                        let optStyle = 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350 bg-transparent';
                        let badgeStyle = 'bg-slate-100 dark:bg-slate-800 text-slate-400';

                        if (isCorrectAnswer) {
                          optStyle = 'border-emerald-500 bg-emerald-500/10 text-emerald-900 dark:text-emerald-300 font-bold';
                          badgeStyle = 'bg-emerald-500 text-white';
                        } else if (isUserChoice && !isCorrectAnswer) {
                          optStyle = 'border-red-500 bg-red-500/10 text-red-900 dark:text-red-300 font-bold';
                          badgeStyle = 'bg-red-500 text-white';
                        }

                        return (
                          <div
                            key={optIdx}
                            className={`flex items-center gap-3.5 p-3.5 rounded-xl border text-sm transition-all ${optStyle}`}
                          >
                            <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${badgeStyle}`}>
                              {letter}
                            </span>
                            <span className="flex-1">{opt}</span>
                            
                            {isCorrectAnswer && (
                              <span className="text-2xs font-extrabold uppercase bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded">
                                Correct Answer
                              </span>
                            )}
                            {isUserChoice && !isCorrectAnswer && (
                              <span className="text-2xs font-extrabold uppercase bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 px-2 py-0.5 rounded">
                                Your Choice
                              </span>
                            )}
                            {isUserChoice && isCorrectAnswer && (
                              <span className="text-2xs font-extrabold uppercase bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded">
                                Your Choice
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-850 flex justify-end bg-slate-50/50 dark:bg-slate-900/30">
              <button
                onClick={() => setReviewingResult(null)}
                className="px-5 py-2.5 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl text-sm font-semibold transition-all border border-slate-200 dark:border-slate-800"
              >
                Close Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentResults;
