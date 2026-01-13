import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';


import { 
  Users, 
  Plus, 
  Search, 
  X, 
  Mail, 
  User as UserIcon, 
  Lock,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import type { User } from '../utils/supabaseClient';

interface FacultyStudentManagementProps {
  user: User;
}

interface StudentRecord {
  id: string;
  email: string;
  full_name: string;
  role: 'student';
  is_active: boolean;
  created_at: string;
}

interface AddStudentForm {
  email: string;
  password: string;
  full_name: string;
}

const FacultyStudentManagement: React.FC<FacultyStudentManagementProps> = () => {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modal & Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [addForm, setAddForm] = useState<AddStudentForm>({
    email: '',
    password: '',
    full_name: ''
  });
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    // Reset to page 1 when search changes
    setCurrentPage(1);

    if (searchQuery) {
      const filtered = students.filter(
        s => 
          s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
          s.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredStudents(filtered);
    } else {
      setFilteredStudents(students);
    }
  }, [searchQuery, students]);

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'student')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setStudents(data || []);
      setFilteredStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  // 🟢 SECURE IMPLEMENTATION
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setActionLoading(true);

    try {
      if (!addForm.email || !addForm.password || !addForm.full_name) {
        throw new Error('All fields are required');
      }
      if (addForm.password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      // 🚀 CALL EDGE FUNCTION (Secure Backend)
      // We reuse the same function you deployed for the Admin panel.
      const { data, error } = await supabase.functions.invoke('admin-user-manager', {
        body: {
          action: 'create_user',
          payload: {
            email: addForm.email,
            password: addForm.password,
            full_name: addForm.full_name,
            role: 'student' // 👈 Explicitly setting role to student
          }
        }
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      setSuccessMessage(`✅ Student "${addForm.full_name}" added successfully!`);
      setTimeout(() => setSuccessMessage(''), 3000);
      
      setShowAddModal(false);
      setAddForm({ email: '', password: '', full_name: '' });
      fetchStudents(); 

    } catch (error: any) {
      console.error('Error adding student:', error);
      setFormError(error.message || 'Failed to add student');
    } finally {
      setActionLoading(false);
    }
  };

  // --- Pagination Logic ---
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentStudents = filteredStudents.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <div className="flex-1 p-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Student Management</h2>
            <p className="text-gray-600">View and manage enrolled students</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="
              w-full sm:w-auto
              flex items-center justify-center gap-2
              px-5 py-2.5
              bg-gradient-to-r from-blue-600 to-red-500
              text-white font-semibold
              rounded-lg
              shadow-md
              hover:from-blue-700 hover:to-red-600
              hover:shadow-lg
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-blue-400
            "
          >
            <Plus className='w-5 h-5'/>
            Add Student
          </button>
        </div>

        {successMessage && (
          <div className="mb-6 p-4 bg-green-100 border border-green-200 text-green-700 rounded-lg flex items-center gap-2 animate-fade-in">
            <span>{successMessage}</span>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search students by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
          </div>
        </div>

        {/* Students Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          {filteredStudents.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center text-gray-500">
              <Users className="w-12 h-12 mb-4 text-gray-300" />
              <p className="text-lg font-medium">No students found</p>
              <p className="text-sm mt-1">Try adjusting your search or add a new student.</p>
            </div>
          ) : (
            <>
            {/* ===== Mobile Card View ===== */}
            <div className="md:hidden divide-y divide-gray-200">
              {currentStudents.map((student) => (
                <div key={student.id} className="p-4 flex items-start gap-4">
                  {/* Avatar */}
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                    {student.full_name.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">
                      {student.full_name}
                    </p>
                    <p className="text-sm text-gray-600 break-all">
                      {student.email}
                    </p>

                    <div className="mt-2 flex items-center gap-2 text-xs">
                      <span
                        className={`px-2 py-0.5 rounded-full font-medium ${
                          student.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {student.is_active ? 'Active' : 'Inactive'}
                      </span>

                      <span className="text-gray-400">
                        Joined: {new Date(student.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

              {/* ===== Desktop Table ===== */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {currentStudents.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm mr-3">
                              {student.full_name.charAt(0).toUpperCase()}
                            </div>
                            <div className="text-sm font-medium text-gray-900">{student.full_name}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {student.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {student.is_active ? (
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              Active
                            </span>
                          ) : (
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                              Inactive
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(student.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Footer */}
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
                
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <span>Rows per page:</span>
                    <select 
                      value={itemsPerPage} 
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="border border-gray-300 rounded px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                  <span className="hidden sm:inline">
                    Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredStudents.length)} of {filteredStudents.length} entries
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let p = i + 1;
                    if (totalPages > 5 && currentPage > 3) {
                       p = currentPage - 2 + i;
                    }
                    if (p > totalPages) return null;
                    
                    return (
                      <button
                        key={p}
                        onClick={() => handlePageChange(p)}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                          currentPage === p
                            ? 'bg-blue-600 text-white'
                            : 'hover:bg-gray-200 text-gray-700'
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden scale-100 transition-all">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-xl font-bold text-gray-800">Add New Student</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddStudent} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg flex items-start gap-2">
                    <span>⚠️</span>
                    <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={addForm.full_name}
                    onChange={(e) => setAddForm({ ...addForm, full_name: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="e.g. Student name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={addForm.email}
                    onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="student@college.edu"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={addForm.password}
                    onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="••••••••"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Must be at least 6 characters long</p>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                >
                  {actionLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Adding...
                    </>
                  ) : (
                    'Add Student'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyStudentManagement;