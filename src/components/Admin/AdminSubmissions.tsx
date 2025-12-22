import React, { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabaseClient';
import NavigationSidebar from '../NavigationSidebar';
import {
  Download,
  Search,
  Star,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';


interface AdminSubmissionsProps {
  user: any;
}


interface Submission {
  id: string;
  assessment_id: string;
  student_id: string;
  student_name: string;
  student_email: string;
  assessment_title: string;
  submitted_at: string;
  answers: any;
  test_session_id: string | null;
  mcq_score: number | null;
  theory_score: number | null;
  total_score: number | null;
  faculty_feedback: string;
  faculty_rating: number | null;
  is_auto_submitted: boolean;
}


interface GradeForm {
  submissionId: string;
  mcq_score: number;
  theory_score: number;
  total_score: number;
  faculty_feedback: string;
  faculty_rating: number;
}


const AdminSubmissions: React.FC<AdminSubmissionsProps> = ({ user }) => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [gradedFilter, setGradedFilter] = useState<'all' | 'graded' | 'ungraded'>('all');
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [gradeForm, setGradeForm] = useState<GradeForm>({
    submissionId: '',
    mcq_score: 0,
    theory_score: 0,
    total_score: 0,
    faculty_feedback: '',
    faculty_rating: 0
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // ✨ PAGINATION STATES
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10; // Show 10 items per page


  useEffect(() => {
    fetchSubmissions();
  }, []);


  useEffect(() => {
    filterSubmissions();
    setCurrentPage(1); // Reset to page 1 when filters change
  }, [submissions, searchQuery, gradedFilter]);


  const fetchSubmissions = async () => {
    try {
      console.log('📝 Fetching all submissions...');


      const { data, error } = await supabase
        .from('submissions')
        .select(`
          *,
          assessments:assessment_id(title),
          users:student_id(full_name, email)
        `)
        .order('submitted_at', { ascending: false });


      if (error) {
        console.error('❌ Error fetching submissions:', error);
        return;
      }


      // Transform data to match our interface
      const transformedData = data?.map((submission: any) => ({
        id: submission.id,
        assessment_id: submission.assessment_id,
        student_id: submission.student_id,
        student_name: submission.users?.full_name || 'Unknown',
        student_email: submission.users?.email || 'Unknown',
        assessment_title: submission.assessments?.title || 'Unknown',
        submitted_at: submission.submitted_at,
        answers: submission.answers,
        test_session_id: submission.test_session_id,
        mcq_score: submission.mcq_score,
        theory_score: submission.theory_score,
        total_score: submission.total_score,
        faculty_feedback: submission.faculty_feedback || '',
        faculty_rating: submission.faculty_rating,
        is_auto_submitted: submission.is_auto_submitted
      })) || [];


      console.log('✓ Fetched submissions:', transformedData);
      setSubmissions(transformedData);
    } catch (error) {
      console.error('❌ Error:', error);
    } finally {
      setLoading(false);
    }
  };


  const filterSubmissions = () => {
    let filtered = [...submissions];


    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        s =>
          s.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.student_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.assessment_title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }


    // Graded filter
    if (gradedFilter === 'graded') {
      filtered = filtered.filter(s => s.faculty_rating !== null);
    } else if (gradedFilter === 'ungraded') {
      filtered = filtered.filter(s => s.faculty_rating === null);
    }


    setFilteredSubmissions(filtered);
  };


  // ✨ PAGINATION CALCULATIONS
  const totalPages = Math.ceil(filteredSubmissions.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedSubmissions = filteredSubmissions.slice(startIndex, endIndex);


  // ✨ PAGINATION HANDLERS
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };


  const submitGrade = async () => {
    try {
      setActionLoading(true);


      if (gradeForm.total_score < 0 || gradeForm.total_score > 100) {
        alert('⚠️ Total score must be between 0-100');
        setActionLoading(false);
        return;
      }


      console.log('📊 Submitting grade for submission:', gradeForm.submissionId);


      const { error } = await supabase
        .from('submissions')
        .update({
          mcq_score: gradeForm.mcq_score,
          theory_score: gradeForm.theory_score,
          total_score: gradeForm.total_score,
          faculty_feedback: gradeForm.faculty_feedback,
          faculty_rating: gradeForm.faculty_rating
        })
        .eq('id', gradeForm.submissionId);


      if (error) {
        console.error('❌ Error grading submission:', error);
        alert(`Failed to grade: ${error.message}`);
        return;
      }


      console.log('✓ Grade submitted successfully');
      setSuccessMessage('✅ Submission graded successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);


      // Update local state
      setSubmissions(submissions.map(s =>
        s.id === gradeForm.submissionId
          ? {
              ...s,
              mcq_score: gradeForm.mcq_score,
              theory_score: gradeForm.theory_score,
              total_score: gradeForm.total_score,
              faculty_feedback: gradeForm.faculty_feedback,
              faculty_rating: gradeForm.faculty_rating
            }
          : s
      ));


      setShowGradeModal(false);
      setSelectedSubmission(null);
      setGradeForm({ submissionId: '', mcq_score: 0, theory_score: 0, total_score: 0, faculty_feedback: '', faculty_rating: 0 });
    } catch (error) {
      console.error('❌ Error:', error);
      alert(error instanceof Error ? error.message : 'Something went wrong');
    } finally {
      setActionLoading(false);
    }
  };


  const downloadSubmission = (submission: Submission) => {
    if (!submission.answers) {
      alert('⚠️ No answers attached to this submission');
      return;
    }


    // Create downloadable JSON file
    const dataStr = JSON.stringify(submission.answers, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `submission_${submission.student_name}_${submission.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };


  const isGraded = (submission: Submission) => submission.faculty_rating !== null;


  if (loading) {
    return (
      <div className="flex">
        <NavigationSidebar user={user} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-lg text-gray-600">Loading submissions...</div>
        </div>
      </div>
    );
  }


  return (
    <div className="flex bg-gray-50 min-h-screen">
      <NavigationSidebar user={user} />


      <div className="flex-1 p-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Student Submissions</h2>
          <p className="text-gray-600">View and grade all student submissions</p>
        </div>


        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 p-4 bg-green-100 border border-green-200 rounded-lg text-green-700">
            {successMessage}
          </div>
        )}


        {/* Filters */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by student, email, or assessment..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>


            {/* Graded Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter</label>
              <select
                value={gradedFilter}
                onChange={(e) => setGradedFilter(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Submissions</option>
                <option value="graded">Graded Only</option>
                <option value="ungraded">Ungraded Only</option>
              </select>
            </div>
          </div>
        </div>


        {/* Submissions Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <p className="text-sm text-gray-600">
              Showing {startIndex + 1}-{Math.min(endIndex, filteredSubmissions.length)} of {filteredSubmissions.length} submissions (Page {currentPage} of {totalPages})
            </p>
          </div>


          {filteredSubmissions.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">No submissions found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Student</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Assessment</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">MCQ</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Theory</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Total</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Rating</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Submitted</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {paginatedSubmissions.map((submission) => (
                      <tr key={submission.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium">
                          <div>
                            <p className="text-gray-800">{submission.student_name}</p>
                            <p className="text-gray-500 text-xs">{submission.student_email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {submission.assessment_title}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {submission.mcq_score !== null ? (
                            <span className="font-medium text-blue-600">{submission.mcq_score}</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {submission.theory_score !== null ? (
                            <span className="font-medium text-purple-600">{submission.theory_score}</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {submission.total_score !== null ? (
                            <span className="font-medium text-green-600">{submission.total_score}/100</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {isGraded(submission) ? (
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              <span className="font-medium text-yellow-600">{submission.faculty_rating}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">Not Graded</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(submission.submitted_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm space-x-2">
                          <button
                            onClick={() => {
                              setSelectedSubmission(submission);
                            }}
                            className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
                          >
                            View
                          </button>
                          <button
                            onClick={() => {
                              setSelectedSubmission(submission);
                              setGradeForm({
                                submissionId: submission.id,
                                mcq_score: submission.mcq_score || 0,
                                theory_score: submission.theory_score || 0,
                                total_score: submission.total_score || 0,
                                faculty_feedback: submission.faculty_feedback || '',
                                faculty_rating: submission.faculty_rating || 0
                              });
                              setShowGradeModal(true);
                            }}
                            className="text-green-600 hover:text-green-700 font-medium hover:underline"
                          >
                            Grade
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ✨ PAGINATION CONTROLS */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Total: {filteredSubmissions.length} submissions
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Previous Button */}
                  <button
                    onClick={goToPreviousPage}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>

                  {/* Page Numbers */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => goToPage(page)}
                        className={`px-3 py-2 rounded-lg transition-colors ${
                          currentPage === page
                            ? 'bg-blue-600 text-white font-medium'
                            : 'border border-gray-300 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  {/* Next Button */}
                  <button
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>


      {/* View Submission Modal */}
      {selectedSubmission && !showGradeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-96 overflow-y-auto">
            {/* Header */}
            <div className="px-8 py-6 border-b border-gray-200 flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-bold text-gray-800">{selectedSubmission.student_name}</h3>
                <p className="text-sm text-gray-500 mt-1">{selectedSubmission.assessment_title}</p>
              </div>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>


            {/* Body */}
            <div className="px-8 py-6 space-y-4">
              {/* Submission Details */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">Submitted:</span>
                  <span className="text-gray-600">{new Date(selectedSubmission.submitted_at).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">Auto Submitted:</span>
                  <span className="text-gray-600">{selectedSubmission.is_auto_submitted ? 'Yes' : 'No'}</span>
                </div>
              </div>


              {/* Scores Display */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                  <p className="text-xs font-medium text-gray-600 mb-1">MCQ Score</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {selectedSubmission.mcq_score !== null ? selectedSubmission.mcq_score : '-'}
                  </p>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                  <p className="text-xs font-medium text-gray-600 mb-1">Theory Score</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {selectedSubmission.theory_score !== null ? selectedSubmission.theory_score : '-'}
                  </p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <p className="text-xs font-medium text-gray-600 mb-1">Total</p>
                  <p className="text-2xl font-bold text-green-600">
                    {selectedSubmission.total_score !== null ? `${selectedSubmission.total_score}/100` : '-'}
                  </p>
                </div>
              </div>


              {/* Submitted Answers */}
              {selectedSubmission.answers && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Submitted Answers</label>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto max-h-48 text-xs font-mono">
                    <pre>{JSON.stringify(selectedSubmission.answers, null, 2)}</pre>
                  </div>
                </div>
              )}


              {/* Faculty Feedback */}
              {selectedSubmission.faculty_feedback && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Faculty Feedback</label>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-gray-700">
                    {selectedSubmission.faculty_feedback}
                  </div>
                </div>
              )}


              {/* Download Button */}
              {selectedSubmission.answers && (
                <button
                  onClick={() => downloadSubmission(selectedSubmission)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <Download className="w-4 h-4" />
                  Download Answers
                </button>
              )}
            </div>


            {/* Footer */}
            <div className="px-8 py-4 bg-gray-50 border-t border-gray-200 rounded-b-xl flex gap-2">
              <button
                onClick={() => {
                  setSelectedSubmission(null);
                  setShowGradeModal(false);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors font-medium"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setGradeForm({
                    submissionId: selectedSubmission.id,
                    mcq_score: selectedSubmission.mcq_score || 0,
                    theory_score: selectedSubmission.theory_score || 0,
                    total_score: selectedSubmission.total_score || 0,
                    faculty_feedback: selectedSubmission.faculty_feedback || '',
                    faculty_rating: selectedSubmission.faculty_rating || 0
                  });
                  setShowGradeModal(true);
                }}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Grade This
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Grade Modal */}
      {showGradeModal && selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="px-8 py-6 border-b border-gray-200 sticky top-0 bg-white">
              <h3 className="text-2xl font-bold text-gray-800">Grade Submission</h3>
              <p className="text-sm text-gray-500 mt-1">{selectedSubmission.student_name}</p>
            </div>


            {/* Body */}
            <div className="px-8 py-6 space-y-4">
              {/* MCQ Score Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">MCQ Score</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={gradeForm.mcq_score}
                  onChange={(e) => setGradeForm({ ...gradeForm, mcq_score: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter MCQ score"
                />
              </div>


              {/* Theory Score Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Theory Score</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={gradeForm.theory_score}
                  onChange={(e) => setGradeForm({ ...gradeForm, theory_score: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter theory score"
                />
              </div>


              {/* Total Score Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Total Score (0-100)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={gradeForm.total_score}
                  onChange={(e) => setGradeForm({ ...gradeForm, total_score: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter total score"
                />
              </div>


              {/* Rating Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rating (1-5)</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setGradeForm({ ...gradeForm, faculty_rating: star })}
                      className={`p-2 rounded-lg transition-colors ${
                        gradeForm.faculty_rating >= star
                          ? 'bg-yellow-100 text-yellow-600'
                          : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>


              {/* Faculty Feedback */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Faculty Feedback</label>
                <textarea
                  value={gradeForm.faculty_feedback}
                  onChange={(e) => setGradeForm({ ...gradeForm, faculty_feedback: e.target.value })}
                  placeholder="Enter feedback for the student..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
            </div>


            {/* Footer */}
            <div className="px-8 py-4 bg-gray-50 border-t border-gray-200 rounded-b-xl flex gap-2 sticky bottom-0">
              <button
                onClick={() => {
                  setShowGradeModal(false);
                  setGradeForm({ submissionId: '', mcq_score: 0, theory_score: 0, total_score: 0, faculty_feedback: '', faculty_rating: 0 });
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={submitGrade}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? 'Saving...' : 'Save Grade'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


export default AdminSubmissions;