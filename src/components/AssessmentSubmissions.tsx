import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import type { Question, Submission } from '../utils/supabaseClient';
import { X, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';

interface SubmissionWithUser extends Submission {
  student_name?: string;
  student_email?: string;
  assessment_title?: string;
}

interface AssessmentSubmissionsProps {
  assessmentId: string;
  onClose: () => void;
}

const AssessmentSubmissions: React.FC<AssessmentSubmissionsProps> = ({
  assessmentId,
  onClose,
}) => {
  const [submissions, setSubmissions] = useState<SubmissionWithUser[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [editScores, setEditScores] = useState<Record<string, string>>({});
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [assessmentId]);

  const fetchData = async () => {
    setLoading(true);

    // Fetch assessment title
    const { data: assessmentData } = await supabase
      .from('assessments')
      .select('title')
      .eq('id', assessmentId)
      .single();

    // Fetch submissions for this assessment
    const { data: subs, error: subsError } = await supabase
      .from('submissions')
      .select('*')
      .eq('assessment_id', assessmentId);

    if (subsError) {
      console.error('Error fetching submissions:', subsError);
      setLoading(false);
      return;
    }

    // Fetch student info for each submission
    const submissionsWithUsers: SubmissionWithUser[] = [];

    if (subs) {
      for (const sub of subs) {
        const { data: userData } = await supabase
          .from('users')
          .select('full_name, email')
          .eq('id', sub.student_id)
          .single();

        submissionsWithUsers.push({
          ...sub,
          student_name: userData?.full_name || 'Student',
          student_email: userData?.email || '-',
          assessment_title: assessmentData?.title || 'Assessment',
        });
      }
    }

    setSubmissions(submissionsWithUsers);

    // Fetch questions for this assessment
    const { data: qs } = await supabase
      .from('questions')
      .select('*')
      .eq('assessment_id', assessmentId);

    setQuestions(qs || []);
    setLoading(false);
  };

  const handleScoreChange = (submissionId: string, value: string) => {
    setEditScores((prev) => ({ ...prev, [submissionId]: value }));
  };

  const saveTheoryScore = async (submissionId: string) => {
    const score = Number(editScores[submissionId]);
    if (isNaN(score)) {
      toast.error('Please enter a valid number');
      return;
    }

    const { error } = await supabase
      .from('submissions')
      .update({ theory_score: score })
      .eq('id', submissionId);

    if (error) {
      console.error('Error saving score:', error);
      toast.error('Error saving score');
      return;
    }

    toast.success('Score saved successfully!');
    fetchData(); // Refresh data
  };

  const getTheoryQuestions = () => {
    return questions.filter((q) => q.type === 'Theory');
  };

  const getTheoryAnswers = (sub: SubmissionWithUser) => {
    const theoryQs = getTheoryQuestions();
    return theoryQs.map((q) => ({
      questionText: q.question_text,
      maxMarks: q.marks,
      studentAnswer: sub.answers[q.id] || 'No answer provided',
    }));
  };

  const getTotalTheoryMarks = () => {
    return getTheoryQuestions().reduce((sum, q) => sum + q.marks, 0);
  };

  const downloadExcel = async () => {
    if (submissions.length === 0) {
      toast.warning('No submissions to export');
      return;
    }

    setIsExporting(true);

    try {
      const assessmentTitle = submissions[0]?.assessment_title || 'Assessment';

      // Create Summary Sheet Data
      const summaryData = submissions.map((sub) => ({
        'Student Name': sub.student_name || '-',
        'Student Email': sub.student_email || '-',
        'Submission Date': sub.submitted_at
          ? new Date(sub.submitted_at).toLocaleString('en-IN')
          : '-',
        'MCQ Score': sub.mcq_score || 0,
        'Total Score': sub.total_score || 0,
        'Theory Score': sub.theory_score || 0,
         'Status': sub.theory_score === null ? 'Pending' : 'Graded',
      }));

      // Create Detailed Sheet Data
      const detailedData: any[] = [];

      submissions.forEach((sub, idx) => {
        // Add student header
        detailedData.push({
          'Student Name': sub.student_name,
          'Email': sub.student_email,
          'Submitted': sub.submitted_at
            ? new Date(sub.submitted_at).toLocaleString('en-IN')
            : '-',
          'MCQ Score': sub.mcq_score || 0,
          'Total Score': sub.total_score || 0,
        });

        // Add empty row
        detailedData.push({});

        // Add theory questions and answers
        const theoryAnswers = getTheoryAnswers(sub);
        if (theoryAnswers.length > 0) {
          theoryAnswers.forEach((answer, qIdx) => {
            detailedData.push({
              'Question Number': `Q${qIdx + 1}`,
              'Question': answer.questionText,
              'Max Marks': answer.maxMarks,
              'Student Answer': answer.studentAnswer,
            });
          });
        } else {
          detailedData.push({
            'Question Number': 'N/A',
            'Question': 'No theory questions in this assessment',
          });
        }

        // Add separator
        if (idx < submissions.length - 1) {
          detailedData.push({});
        }
      });

      // Create workbook
      const wb = XLSX.utils.book_new();

      // Add Summary Sheet
      const summarySheet = XLSX.utils.json_to_sheet(summaryData);
      summarySheet['!cols'] = [
        { wch: 25 },
        { wch: 30 },
        { wch: 20 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
      ];
      XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

      // Add Detailed Sheet
      const detailedSheet = XLSX.utils.json_to_sheet(detailedData);
      detailedSheet['!cols'] = [
        { wch: 18 },
        { wch: 50 },
        { wch: 12 },
        { wch: 40 },
        { wch: 12 },
      ];
      XLSX.utils.book_append_sheet(wb, detailedSheet, 'Detailed Answers');

      // Generate filename with assessment name and date
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `${assessmentTitle}_Submissions_${dateStr}.xlsx`;

      // Save file
      XLSX.writeFile(wb, filename);

      toast.success(`Excel file "${filename}" downloaded successfully!`, {
        position: 'top-right',
        autoClose: 4000,
      });
    } catch (error) {
      console.error('Error exporting Excel:', error);
      toast.error('Failed to export Excel file', {
        position: 'top-right',
        autoClose: 4000,
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Assessment Submissions</h2>
            <p className="text-sm text-gray-600 mt-1">
              {submissions.length} student{submissions.length !== 1 ? 's' : ''} submitted
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={downloadExcel}
              disabled={isExporting || submissions.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Download submissions as Excel"
            >
              {isExporting ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Download Excel
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-8 text-gray-600">Loading submissions...</div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              No submissions yet for this assessment.
            </div>
          ) : (
            <div className="space-y-6">
              {submissions.map((sub) => (
                <div
                  key={sub.id}
                  className="bg-gray-50 rounded-lg border border-gray-200 p-6"
                >
                  {/* Student Info */}
                  <div className="flex items-start justify-between mb-4 pb-4 border-b border-gray-300">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        {sub.student_name}
                      </h3>
                      <p className="text-sm text-gray-600">{sub.student_email}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Submitted: {new Date(sub.submitted_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">MCQ Score</div>
                      <div className="text-2xl font-bold text-green-600">{sub.mcq_score}</div>
                    </div>
                  </div>

                  {/* Theory Questions & Answers */}
                  {getTheoryAnswers(sub).length > 0 ? (
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-700">Theory Answers:</h4>
                      {getTheoryAnswers(sub).map((item, idx) => (
                        <div key={idx} className="bg-white rounded p-4 border border-gray-200">
                          <div className="font-medium text-gray-800 mb-2">
                            Q{idx + 1}: {item.questionText}
                            <span className="ml-2 text-sm text-gray-500">
                              (Max: {item.maxMarks} marks)
                            </span>
                          </div>
                          <div className="text-gray-700 bg-gray-50 p-3 rounded border border-gray-200">
                            {item.studentAnswer}
                          </div>
                        </div>
                      ))}

                      {/* Grading Section */}
                      <div className="flex items-center gap-4 mt-4 bg-blue-50 p-4 rounded border border-blue-200">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Theory Score (Max: {getTotalTheoryMarks()})
                          </label>
                          <input
                            type="number"
                            min="0"
                            max={getTotalTheoryMarks()}
                            value={
                              editScores[sub.id] !== undefined
                                ? editScores[sub.id]
                                : sub.theory_score ?? ''
                            }
                            onChange={(e) => handleScoreChange(sub.id, e.target.value)}
                            className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter marks"
                          />
                        </div>
                        <button
                          onClick={() => saveTheoryScore(sub.id)}
                          className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                        >
                          Save Score
                        </button>
                        <div className="text-sm">
                          <span className="font-medium">Status: </span>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              sub.theory_score === null
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-green-100 text-green-700'
                            }`}
                          >
                            {sub.theory_score === null ? 'Pending' : 'Graded'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-600 text-sm">No theory questions in this assessment.</div>
                  )}

                  {/* Total Score */}
                  <div className="mt-4 pt-4 border-t border-gray-300 flex justify-between items-center">
                    <span className="font-medium text-gray-700">Total Score:</span>
                    <span className="text-xl font-bold text-blue-600">{sub.total_score}%</span>
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

export default AssessmentSubmissions;