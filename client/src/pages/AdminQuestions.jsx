import React, { useState, useEffect } from 'react';
import API from '../services/api';
import toast from 'react-hot-toast';
import { 
  Plus, Edit2, Trash2, Search, Filter, 
  ChevronLeft, ChevronRight, X, HelpCircle 
} from 'lucide-react';

const AdminQuestions = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(0);

  // Form states (Modal)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  // Form Fields
  const [questionText, setQuestionText] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [qCategory, setQCategory] = useState('Aptitude');
  const [qDifficulty, setQDifficulty] = useState('Medium');
  const [marks, setMarks] = useState(1);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const res = await API.get('/questions', {
        params: { search, category, difficulty, page, limit: 8 }
      });
      if (res.data.success) {
        setQuestions(res.data.questions);
        setTotalPages(res.data.pages);
        setTotalQuestions(res.data.total);
      }
    } catch (err) {
      toast.error('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [search, category, difficulty, page]);

  const openAddModal = () => {
    setIsEditing(false);
    setQuestionText('');
    setOptions(['', '', '', '']);
    setCorrectAnswer('');
    setQCategory('Aptitude');
    setQDifficulty('Medium');
    setMarks(1);
    setIsModalOpen(true);
  };

  const openEditModal = (q) => {
    setIsEditing(true);
    setCurrentId(q._id);
    setQuestionText(q.question);
    setOptions([...q.options]);
    setCorrectAnswer(q.correctAnswer);
    setQCategory(q.category);
    setQDifficulty(q.difficulty);
    setMarks(q.marks);
    setIsModalOpen(true);
  };

  const handleOptionChange = (idx, val) => {
    const newOptions = [...options];
    newOptions[idx] = val;
    setOptions(newOptions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!questionText || options.some(opt => !opt) || !correctAnswer) {
      toast.error('Please fill in all options and specify a correct answer');
      return;
    }
    
    // Validate correct answer is in options
    if (!options.includes(correctAnswer)) {
      toast.error('The correct answer MUST match one of the entered options exactly');
      return;
    }

    const payload = {
      question: questionText,
      options,
      correctAnswer,
      category: qCategory,
      difficulty: qDifficulty,
      marks
    };

    try {
      if (isEditing) {
        await API.put(`/questions/${currentId}`, payload);
        toast.success('Question updated successfully!');
      } else {
        await API.post('/questions', payload);
        toast.success('Question created successfully!');
      }
      setIsModalOpen(false);
      fetchQuestions();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      try {
        await API.delete(`/questions/${id}`);
        toast.success('Question deleted successfully!');
        fetchQuestions();
      } catch (err) {
        toast.error('Deletion failed');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Question Pool</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Total questions cataloged: <span className="font-semibold text-slate-800 dark:text-slate-200">{totalQuestions}</span>
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-505 hover:bg-primary-600 text-white rounded-xl font-medium transition-all shadow-md shadow-primary-500/10"
        >
          <Plus className="h-5 w-5" />
          Add Question
        </button>
      </div>

      {/* Filters bar */}
      <div className="glass-card p-4 rounded-xl flex flex-col md:flex-row gap-4 items-center">
        {/* Search */}
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search questions..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-transparent focus:outline-none focus:ring-2 focus:ring-primary-505 focus:border-transparent"
          />
        </div>

        {/* Category Dropdown */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="h-4 w-4 text-slate-400 hidden md:block" />
          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
            className="w-full md:w-44 px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-transparent text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="">All Categories</option>
            <option value="Aptitude">Aptitude</option>
            <option value="Logical">Logical</option>
            <option value="Verbal">Verbal</option>
            <option value="Technical">Technical</option>
          </select>
        </div>

        {/* Difficulty Dropdown */}
        <div className="w-full md:w-auto">
          <select
            value={difficulty}
            onChange={(e) => { setDifficulty(e.target.value); setPage(1); }}
            className="w-full md:w-44 px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-transparent text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="glass-card rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading questions database...</div>
        ) : questions.length === 0 ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center">
            <HelpCircle className="h-10 w-10 opacity-30 mb-2" />
            No matching questions found in the catalog.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/50 dark:bg-slate-900/50 text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <th className="py-4 px-6">Question</th>
                  <th className="py-4 px-6">Category</th>
                  <th className="py-4 px-6">Difficulty</th>
                  <th className="py-4 px-6">Marks</th>
                  <th className="py-4 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                {questions.map((q) => (
                  <tr key={q._id} className="hover:bg-slate-500/5 transition-all text-sm">
                    <td className="py-4 px-6 max-w-md font-medium text-slate-800 dark:text-slate-200 truncate">
                      {q.question}
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400">
                        {q.category}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        q.difficulty === 'Easy' 
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                          : q.difficulty === 'Medium'
                          ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400'
                          : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400'
                      }`}>
                        {q.difficulty}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-semibold font-mono">{q.marks} pts</td>
                    <td className="py-4 px-6 text-center space-x-2">
                      <button
                        onClick={() => openEditModal(q)}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-primary-505 rounded-lg transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(q._id)}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="px-6 py-4 flex items-center justify-between border-t border-slate-200 dark:border-slate-800">
            <span className="text-sm text-slate-400">
              Page <span className="font-semibold text-slate-700 dark:text-slate-350">{page}</span> of <span className="font-semibold">{totalPages}</span>
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-500/5 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-500/5 disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-650 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
            >
              <X className="h-5 w-5" />
            </button>
            
            <h2 className="text-xl font-bold mb-6">
              {isEditing ? 'Modify Question' : 'Catalog New Question'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5">Question Content</label>
                <textarea
                  required
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-transparent focus:outline-none focus:ring-2 focus:ring-primary-505"
                  rows="3"
                  placeholder="Type question detail here..."
                />
              </div>

              {/* Options */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold">Multiple Choices</label>
                {options.map((option, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <span className="font-semibold text-slate-450 font-mono text-xs w-6">{String.fromCharCode(65 + idx)})</span>
                    <input
                      type="text"
                      required
                      value={option}
                      onChange={(e) => handleOptionChange(idx, e.target.value)}
                      className="flex-1 px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-transparent focus:outline-none focus:ring-2 focus:ring-primary-505"
                      placeholder={`Option ${idx + 1}`}
                    />
                  </div>
                ))}
              </div>

              {/* Select Correct Answer */}
              <div>
                <label className="block text-sm font-semibold mb-1.5">Correct Answer</label>
                <select
                  required
                  value={correctAnswer}
                  onChange={(e) => setCorrectAnswer(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-505"
                >
                  <option value="">Select Option matching Correct Answer</option>
                  {options.map((opt, idx) => opt && (
                    <option key={idx} value={opt}>
                      {String.fromCharCode(65 + idx)}) {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Grid configs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Category</label>
                  <select
                    value={qCategory}
                    onChange={(e) => setQCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-505"
                  >
                    <option value="Aptitude">Aptitude</option>
                    <option value="Logical">Logical</option>
                    <option value="Verbal">Verbal</option>
                    <option value="Technical">Technical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Difficulty</label>
                  <select
                    value={qDifficulty}
                    onChange={(e) => setQDifficulty(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-505"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Marks weight</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={marks}
                    onChange={(e) => setMarks(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-transparent focus:outline-none focus:ring-2 focus:ring-primary-505"
                  />
                </div>
              </div>

              {/* Form buttons */}
              <div className="pt-4 flex justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
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
                  Save Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminQuestions;
