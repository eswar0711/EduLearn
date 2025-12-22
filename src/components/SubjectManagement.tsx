// src/components/SubjectManagement.tsx
import React, { useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { Plus, X } from 'lucide-react';

interface SubjectManagementProps {
  onSubjectAdded: () => void;
}

const SubjectManagement: React.FC<SubjectManagementProps> = ({ onSubjectAdded }) => {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [semester, setSemester] = useState<number>(1);
  const [department, setDepartment] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('subjects')
        .insert({
          name,
          code: code.toUpperCase(),
          semester,
          department,
          description: description || null,
        });

      if (error) throw error;

      alert('Subject added successfully!');
      
      // Reset form
      setName('');
      setCode('');
      setSemester(1);
      setDepartment('');
      setDescription('');
      setShowForm(false);
      
      // Notify parent to refresh subjects list
      onSubjectAdded();
    } catch (error) {
      console.error('Error adding subject:', error);
      alert('Error adding subject. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium mb-6"
      >
        <Plus className="w-4 h-4" />
        Add New Subject
      </button>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Add New Subject</h3>
        <button
          onClick={() => setShowForm(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Subject Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Data Structures"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Subject Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g., CS201"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Semester */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Semester <span className="text-red-500">*</span>
            </label>
            <select
              value={semester}
              onChange={(e) => setSemester(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                <option key={sem} value={sem}>Semester {sem}</option>
              ))}
            </select>
          </div>

          {/* Department */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Department <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="e.g., Computer Science"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description (Optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of the subject..."
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Add Subject'}
          </button>
          <button
            type="button"
            onClick={() => setShowForm(false)}
            className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default SubjectManagement;
