import React, { useState, useEffect } from 'react';
import API from '../services/api';
import toast from 'react-hot-toast';
import { 
  FileText, Award, Percent, Code, 
  ArrowRight, Sparkles, TrendingUp, BookOpen 
} from 'lucide-react';
import { Link } from 'react-router-dom';

const StudentDashboard = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await API.get('/results/my');
        if (res.data.success) {
          setResults(res.data.results);
        }
      } catch (err) {
        toast.error('Failed to load performance metrics');
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
          ))}
        </div>
        <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
      </div>
    );
  }

  // Calculate student statistics
  const testsTaken = results.length;
  const avgPercentage = testsTaken > 0
    ? Number((results.reduce((sum, r) => sum + r.percentage, 0) / testsTaken).toFixed(2))
    : 0;
  
  const bestPercentage = testsTaken > 0
    ? Math.max(...results.map(r => r.percentage))
    : 0;

  const statItems = [
    { title: 'Exams Completed', value: testsTaken, icon: FileText, color: 'from-blue-500 to-indigo-600' },
    { title: 'Average Accuracy', value: `${avgPercentage}%`, icon: Percent, color: 'from-amber-500 to-orange-600' },
    { title: 'Personal Best', value: `${bestPercentage}%`, icon: Award, color: 'from-emerald-500 to-teal-600' },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="relative p-6 md:p-8 rounded-2xl overflow-hidden bg-gradient-to-r from-primary-600/10 to-indigo-600/10 dark:from-primary-950/40 dark:to-indigo-950/40 border border-primary-100 dark:border-primary-900/50">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold flex items-center gap-2">
              <Sparkles className="text-amber-500 fill-amber-500 h-7 w-7 animate-pulse" />
              Prepare for Placements
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xl">
              Sharpen your core aptitude and programming skills, attempt mocks, and get insights on your placement readiness.
            </p>
          </div>
          <div className="flex gap-3">
            <Link 
              to="/student/tests"
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary-500 to-indigo-600 text-white rounded-xl font-semibold shadow-md shadow-primary-500/15 hover:opacity-90 transition-all text-sm"
            >
              Take Aptitude Test
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {statItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="glass-card p-6 rounded-2xl shadow-sm relative overflow-hidden group">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">{item.title}</p>
                  <h3 className="text-3xl font-bold mt-2 font-mono">{item.value}</h3>
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-tr ${item.color} text-white shadow-md`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100 dark:bg-slate-800 group-hover:bg-primary-505 transition-all"></div>
            </div>
          );
        })}
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Practice Categories */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <BookOpen className="text-primary-555" />
            Prep Categories
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="glass-card p-5 rounded-2xl flex flex-col justify-between h-44 hover:border-primary-500 transition-all">
              <div>
                <span className="p-2.5 bg-blue-500/10 text-blue-500 rounded-lg inline-block font-bold text-xs uppercase tracking-wider mb-3">MCQ Aptitude</span>
                <h4 className="font-bold text-lg">Aptitude & Technical Tests</h4>
                <p className="text-slate-400 text-xs mt-1">Review math models, reasoning skills, and technical syntax.</p>
              </div>
              <Link to="/student/tests" className="text-sm font-semibold text-primary-505 dark:text-primary-400 flex items-center gap-1 mt-4 hover:opacity-85">
                Start tests
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="glass-card p-5 rounded-2xl flex flex-col justify-between h-44 hover:border-primary-500 transition-all">
              <div>
                <span className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-lg inline-block font-bold text-xs uppercase tracking-wider mb-3">Coding Practice</span>
                <h4 className="font-bold text-lg">Interactive Programming</h4>
                <p className="text-slate-400 text-xs mt-1">Solve programming puzzles using Monaco Editor.</p>
              </div>
              <Link to="/student/coding" className="text-sm font-semibold text-primary-505 dark:text-primary-400 flex items-center gap-1 mt-4 hover:opacity-85">
                Open editor
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Analytics Summary */}
        <div className="glass-card p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="text-primary-555" />
              Performance Trends
            </h3>
            {testsTaken === 0 ? (
              <p className="text-sm text-slate-400 mt-2">No data yet. Attempt a test to unlock charts and analytics.</p>
            ) : (
              <div className="space-y-4 mt-2">
                <p className="text-xs text-slate-400">
                  Your results indicate a progress average of <span className="font-semibold text-slate-700 dark:text-slate-205">{avgPercentage}%</span> across {testsTaken} exams.
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>Performance Target</span>
                    <span>{avgPercentage} / 100</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-primary-505 h-full" style={{ width: `${avgPercentage}%` }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <Link 
            to="/student/results" 
            className="w-full py-3 text-center border border-slate-200 dark:border-slate-850 hover:bg-slate-500/5 rounded-xl text-sm font-semibold mt-6 block transition-all"
          >
            Detailed Analytics Reports
          </Link>
        </div>

      </div>
    </div>
  );
};

export default StudentDashboard;
