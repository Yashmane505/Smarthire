import React, { useState, useEffect } from 'react';
import API from '../services/api';
import toast from 'react-hot-toast';
import { 
  Users, BookOpen, FileCheck, Percent, 
  ArrowRight, PlusCircle, CheckCircle2, History 
} from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTests: 0,
    totalSubmissions: 0,
    averagePercentage: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await API.get('/results/stats');
        if (res.data.success) {
          setStats(res.data.stats);
          setRecentActivity(res.data.recentActivity || []);
        }
      } catch (err) {
        toast.error('Failed to load admin stats');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
          ))}
        </div>
        <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
      </div>
    );
  }

  const statItems = [
    { title: 'Total Students', value: stats.totalStudents, icon: Users, color: 'from-blue-500 to-sky-600' },
    { title: 'Test Templates', value: stats.totalTests, icon: BookOpen, color: 'from-violet-500 to-indigo-600' },
    { title: 'Test Submissions', value: stats.totalSubmissions, icon: FileCheck, color: 'from-emerald-500 to-teal-600' },
    { title: 'Average Score', value: `${stats.averagePercentage}%`, icon: Percent, color: 'from-amber-500 to-orange-600' },
  ];

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Overview</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Monitor exam registrations, question metrics, and student test completion benchmarks.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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

      {/* Main Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Quick Management Links */}
        <div className="glass-card p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <PlusCircle className="text-primary-505" />
              Administrative Actions
            </h3>
            <p className="text-slate-400 text-sm mb-6">
              Access utilities to modify question repositories or design new student prep questionnaires.
            </p>
          </div>
          <div className="space-y-4">
            <Link 
              to="/admin/questions" 
              className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-primary-505 dark:hover:border-primary-500 hover:bg-primary-500/5 transition-all group"
            >
              <div>
                <span className="font-semibold block">Question Repository</span>
                <span className="text-xs text-slate-400">Add, edit, or delete practice MCQ questions.</span>
              </div>
              <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-primary-505 transition-all group-hover:translate-x-1" />
            </Link>
            <Link 
              to="/admin/tests" 
              className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-primary-505 dark:hover:border-primary-500 hover:bg-primary-500/5 transition-all group"
            >
              <div>
                <span className="font-semibold block">Create Test Templates</span>
                <span className="text-xs text-slate-400">Bundle questions into timed exams.</span>
              </div>
              <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-primary-505 transition-all group-hover:translate-x-1" />
            </Link>
          </div>
        </div>

        {/* Recent Submissions Activity */}
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <History className="text-primary-505" />
            Recent Student Submissions
          </h3>
          {recentActivity.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-slate-400 text-sm">
              <CheckCircle2 className="h-8 w-8 mb-2 opacity-50" />
              No submissions recorded yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-850">
              {recentActivity.map((activity) => (
                <div key={activity._id} className="py-4 flex items-center justify-between first:pt-0 last:pb-0">
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 capitalize">
                      {activity.student?.name}
                    </p>
                    <p className="text-xs text-slate-400">
                      Completed test: <span className="text-slate-300 font-medium">{activity.test?.title}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                      activity.percentage >= 50 
                        ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-400' 
                        : 'bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-400'
                    }`}>
                      {activity.percentage}%
                    </span>
                    <p className="text-xs text-slate-400 mt-1 font-mono">
                      {activity.score} / {activity.totalMarks} Marks
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
