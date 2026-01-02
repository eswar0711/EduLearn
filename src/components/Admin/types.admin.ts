/**
 * Admin Module Type Definitions
 * Comprehensive types for admin features
 */

// ================================================================
// USER MANAGEMENT TYPES
// ================================================================

export interface AdminUser {
  id: string;
  full_name: string;
  email: string;
  role: 'admin' | 'faculty' | 'student';
  is_active: boolean;
  is_blocked: boolean;
  phone?: string;
  department?: string;
  profile_picture_url?: string;
  created_at: string;
  updated_at: string;
}

export interface UserFilter {
  role?: 'admin' | 'faculty' | 'student';
  status?: 'active' | 'blocked' | 'all';
  search?: string;
  department?: string;
}

// ================================================================
// ASSESSMENT TYPES
// ================================================================

export interface Assessment {
  id: string;
  faculty_id: string;
  subject: string;
  unit: string;
  title: string;
  description?: string;
  duration_minutes: number;
  total_marks: number;
  passing_marks?: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Question {
  id: string;
  assessment_id: string;
  type: 'MCQ' | 'Theory' | 'ShortAnswer';
  question_text: string;
  options?: string[];
  correct_answer?: string;
  marks: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  order: number;
  created_at: string;
}

export interface AssessmentStats {
  totalQuestions: number;
  totalMarks: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  submissionCount: number;
  passPercentage: number;
}

// ================================================================
// SUBMISSION TYPES
// ================================================================

export interface Submission {
  id: string;
  assessment_id: string;
  student_id: string;
  student_name: string;
  student_email: string;
  answers: Record<string, string>;
  mcq_score: number | null;
  theory_score: number | null;
  total_score: number | null;
  status: 'Unattempted' | 'In Progress' | 'Completed' | 'Graded';
  grade?: string;
  submitted_at: string;
  faculty_feedback?: string;
  faculty_rating?: number;
  is_auto_submitted: boolean;
  test_session_id?: string;
}

export interface SubmissionFilter {
  assessment_id?: string;
  student_id?: string;
  status?: string;
  graded?: 'all' | 'graded' | 'ungraded';
  search?: string;
}

export interface GradeSubmission {
  submissionId: string;
  mcq_score: number;
  theory_score: number;
  total_score: number;
  faculty_feedback: string;
  faculty_rating: number;
}

// ================================================================
// ANALYTICS TYPES
// ================================================================

export interface AnalyticsData {
  subjectPerformance: SubjectPerformance[];
  roleDistribution: RoleDistribution[];
  monthlySubmissions: MonthlySubmission[];
  assessmentDifficulty: AssessmentDifficulty[];
  overallStats?: OverallStats;
}

export interface SubjectPerformance {
  subject: string;
  avgScore: number;
  submissionCount: number;
  highestScore?: number;
  lowestScore?: number;
  passRate?: number;
}

export interface RoleDistribution {
  role: string;
  count: number;
  percentage?: number;
}

export interface MonthlySubmission {
  month: string;
  count: number;
  passed: number;
  failed: number;
}

export interface AssessmentDifficulty {
  title: string;
  avgScore: number;
  submissionCount: number;
  passRate?: number;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
}

export interface OverallStats {
  totalUsers: number;
  totalAssessments: number;
  totalSubmissions: number;
  averageScore: number;
  passRate: number;
  activeUsers: number;
}

// ================================================================
// DASHBOARD TYPES
// ================================================================

export interface DashboardCard {
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon?: string;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string[];
  borderColor?: string;
  fill?: boolean;
}

// ================================================================
// FILTER & PAGINATION TYPES
// ================================================================

export interface PaginationOptions {
  page: number;
  limit: number;
  total?: number;
  totalPages?: number;
}

export interface SortOptions {
  field: string;
  order: 'asc' | 'desc';
}

export interface FilterOptions {
  search?: string;
  filters?: Record<string, any>;
  sort?: SortOptions;
  pagination?: PaginationOptions;
}

// ================================================================
// REPORT TYPES
// ================================================================

export interface ExportReport {
  type: 'excel' | 'pdf' | 'csv';
  title: string;
  data: any[];
  filename?: string;
  columns?: string[];
}

export interface ReportConfig {
  includeOverview: boolean;
  includeDetails: boolean;
  includeCharts: boolean;
  dateRange?: {
    startDate: string;
    endDate: string;
  };
}

// ================================================================
// NOTIFICATION & ALERT TYPES
// ================================================================

export interface AdminNotification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  link?: string;
}

export interface AlertConfig {
  enabled: boolean;
  type: 'submission' | 'grading' | 'system';
  threshold?: number;
}

// ================================================================
// RESPONSE TYPES
// ================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> extends ApiResponse {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ================================================================
// EXPORT ALL TYPES
// ================================================================

// export default {
//   AdminUser,
//   UserFilter,
//   Assessment,
//   Question,
//   AssessmentStats,
//   Submission,
//   SubmissionFilter,
//   GradeSubmission,
//   AnalyticsData,
//   SubjectPerformance,
//   RoleDistribution,
//   MonthlySubmission,
//   AssessmentDifficulty,
//   OverallStats,
//   DashboardCard,
//   ChartData,
//   ChartDataset,
//   PaginationOptions,
//   SortOptions,
//   FilterOptions,
//   ExportReport,
//   ReportConfig,
//   AdminNotification,
//   AlertConfig,
//   ApiResponse,
//   PaginatedResponse
// };