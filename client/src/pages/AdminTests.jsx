import React, { useState, useEffect } from 'react';
import API from '../services/api';
import toast from 'react-hot-toast';
import { Plus, Trash2, Clock, Award, X, FileText, CheckSquare, Square } from 'lucide-react';

const AdminTests = () => {
  const [tests, setTests] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form Fields
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState(30);
  const [selectedQuestions, setSelectedQuestions] = useState([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [testsRes, questionsRes] = await Promise.all([
        API.get('/tests'),
        API.get('/questions?limit=100') // fetch questions to select from
      ]);
      if (testsRes.data.success) setTests(testsRes.data.tests);
      if (questionsRes.data.success) setQuestions(questionsRes.data.questions);
    } catch (err) {
      toast.error('Failed to load page data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddModal = () => {
    setTitle('');
    setDuration(30);
    setSelectedQuestions([]);
    setIsModalOpen(true);
  };

  const handleToggleQuestion = (id) => {
    if (selectedQuestions.includes(id)) {
      setSelectedQuestions(selectedQuestions.filter(qId => qId !== id));
    } else {
      setSelectedQuestions([...selectedQuestions, id]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || selectedQuestions.length === 0 || !duration) {
      toast.error('Please name the test, specify duration, and check at least 1 question');
      return;
    }

    try {
      const res = await API.post('/tests', {
        title,
        duration: Number(duration),
        questions: selectedQuestions
      });
      if (res.data.success) {
        toast.success('Test created successfully!');
        setIsModalOpen(false);
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Test creation failed');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this test template?')) {
      try {
        await API.delete(`/tests/${id}`);
        toast.success('Test deleted successfully!');
        fetchData();
      } catch (err) {
        toast.error('Deletion failed');
      }
    }
  };

  // Calculate live sum of selected question marks
  const totalSelectedMarks = questions
    .filter(q => selectedQuestions.includes(q._id))
    .reduce((sum, q) => sum + q.marks, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Test Blueprints</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Bundle existing MCQs into timed assessments for student preparation.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-505 hover:bg-primary-600 text-white rounded-xl font-medium transition-all shadow-md shadow-primary-500/10"
        >
          <Plus className="h-5 w-5" />
          Create Test Template
        </button>
      </div>

      {/* List Grid */}
      {loading ? (
        <div className="text-center text-slate-400 py-12">Loading test configurations...</div>
      ) : tests.length === 0 ? (
        <div className="glass-card p-12 text-center text-slate-400 flex flex-col items-center justify-center rounded-2xl">
          <FileText className="h-10 w-10 opacity-30 mb-2" />
          No test templates have been created yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tests.map((test) => (
            <div key={test._id} className="glass-card p-6 rounded-2xl shadow-sm flex flex-col justify-between hover:shadow-md transition-all relative overflow-hidden group">
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 group-hover:text-primary-555 dark:group-hover:text-primary-400 transition-colors">
                  {test.title}
                </h3>
                <div className="mt-4 flex items-center gap-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {test.duration} Min
                  </span>
                  <span className="flex items-center gap-1">
                    <Award className="h-4 w-4" />
                    {test.totalMarks} Points
                  </span>
                  <span className="font-mono text-primary-505 dark:text-primary-400 font-bold bg-primary-500/5 px-2 py-0.5 rounded-md">
                    {test.questions?.length} MCQs
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-850 flex justify-between items-center">
                <span className="text-xs text-slate-400">Created by {test.createdBy?.name || 'Admin'}</span>
                <button
                  onClick={() => handleDelete(test._id)}
                  className="p-2 text-slate-450 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Test Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-650 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
            >
              <X className="h-5 w-5" />
            </button>
            
            <h2 className="text-xl font-bold mb-4">Create Test Template</h2>

            <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Test Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-transparent focus:outline-none focus:ring-2 focus:ring-primary-505"
                    placeholder="e.g. Technical Aptitude Test 1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Duration (minutes)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-transparent focus:outline-none focus:ring-2 focus:ring-primary-505"
                  />
                </div>
              </div>

              {/* Select questions */}
              <div className="flex-1 flex flex-col min-h-0 border border-slate-250 dark:border-slate-800 rounded-xl overflow-hidden">
                <div className="bg-slate-100/50 dark:bg-slate-900/50 px-4 py-3 flex justify-between items-center border-b border-slate-200 dark:border-slate-800">
                  <span className="text-sm font-bold">Select Questions from Catalog</span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary-105 text-primary-800 dark:bg-primary-950/50 dark:text-primary-400">
                    Selected: {selectedQuestions.length} Questions ({totalSelectedMarks} Marks)
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-850 p-2 space-y-1">
                  {questions.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-8">No questions cataloged yet. Please create questions first.</p>
                  ) : (
                    questions.map((q) => {
                      const isSelected = selectedQuestions.includes(q._id);
                      return (
                        <div 
                          key={q._id}
                          onClick={() => handleToggleQuestion(q._id)}
                          className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-slate-500/5 transition-all text-sm ${
                            isSelected ? 'bg-primary-500/5 border-l-4 border-primary-505 pl-2' : ''
                          }`}
                        >
                          <div>
                            {isSelected ? (
                              <CheckSquare className="h-5 w-5 text-primary-505" />
                            ) : (
                              <Square className="h-5 w-5 text-slate-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate text-slate-800 dark:text-slate-200">{q.question}</p>
                            <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-400 font-semibold uppercase tracking-wider">
                              <span className="text-slate-350">{q.category}</span>
                              <span>•</span>
                              <span className="text-slate-350">{q.difficulty}</span>
                              <span>•</span>
                              <span className="text-primary-505 dark:text-primary-400">{q.marks} pts</span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-3 flex justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-500/5 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-primary-505 hover:bg-primary-600 text-white font-medium transition-colors"
                >
                  Save Test
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTests;
