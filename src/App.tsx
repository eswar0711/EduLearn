import React, { useEffect, useState } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { getCurrentUser } from './utils/auth';
import type { AuthUser } from './utils/auth';


import DashboardLayout from './layouts/DashboardLayout';

// Pages / Components (same imports as you have)
import LoginPage from './pages/LoginPage';
import CodingProblemPage from './pages/CodingPractice/CodingProblemPage';
import FacultyDashboard from './components/FacultyDashboard';
import AssessmentCreation from './components/AssessmentCreation';
import FacultyCourseMaterials from './components/FacultyCourseMaterials';
import StudentDashboard from './components/StudentDashboard';
import TestTaking from './components/TestTaking';
import ResultsPage from './components/ResultsPage';
import CoursePage from './components/CoursePage';
import ScoreCalculatorModule from './components/ScoreCalculator/ScoreCalculatorModule';
import AIAssistantModule from './components/AIAssistant/AIAssistantModule';
import {
  ChangePassword,
  UserProfile as UserProfileComponent,
} from './components/UserSettings';
import AdminDashboard from './components/Admin/AdminDashboardd';
import AdminUserManagement from './components/Admin/AdminUserManagement';
import AdminAnalytics from './components/Admin/AdminAnalytics';
import AdminSubmissions from './components/Admin/AdminSubmissions';
import StudentCodingLabPage from './pages/CodingPractice/StudentCodingLabPage';
import FacultyCodingManagement from './pages/CodingPractice/FacultyCodingManagement';
import AdminCodingAnalytics from './pages/CodingPractice/AdminCodingAnalytics';
import SubmissionView from './pages/CodingPractice/SubmissionView';
import ResultsSummary from './components/ResultsSummary';
import SessionLockGuard from './components/SessionLockGuard';
import FacultyStudentManagement from './components/FacultyStudentManagement';
import { ToastContainer } from 'react-toastify';

const convertAuthUserToComponentUser = (authUser: AuthUser): any => ({
  id: authUser.id,
  email: authUser.email,
  full_name: authUser.full_name,
  role: authUser.role,
  is_blocked: authUser.is_blocked,
  is_active: authUser.is_active,
  created_at: authUser.created_at,
});

const App: React.FC = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('❌ Error checking user:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  const componentUser = user ? convertAuthUserToComponentUser(user) : null;

  return (

    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        {/* LOGIN (no layout) */}
        <Route
          path="/login"
          element={!user ? <LoginPage onLogin={checkUser} /> : <Navigate to="/" />}
        />

        {/* ADMIN routes (with layout) */}
        <Route
          path="/admin"
          element={
            user && user.role === 'admin' ? (
              <DashboardLayout user={componentUser}>
                <AdminDashboard user={componentUser} />
              </DashboardLayout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/admin/users"
          element={
            user && user.role === 'admin' ? (
              <DashboardLayout user={componentUser}>
                <AdminUserManagement user={componentUser} />
              </DashboardLayout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/admin/analytics"
          element={
            user && user.role === 'admin' ? (
              <DashboardLayout user={componentUser}>
                <AdminAnalytics user={componentUser} />
              </DashboardLayout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/admin/submissions"
          element={
            user && user.role === 'admin' ? (
              <DashboardLayout user={componentUser}>
                <AdminSubmissions user={user} />
              </DashboardLayout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/admin/coding-analytics"
          element={
            user && user.role === 'admin' ? (
              <DashboardLayout user={componentUser}>
                <AdminCodingAnalytics />
              </DashboardLayout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* CODING PRACTICE LAB (student / faculty) */}
        <Route
          path="/coding-lab"
          element={
            user && user.role === 'student' ? (
              <DashboardLayout user={componentUser}>
                <StudentCodingLabPage user={componentUser} />
              </DashboardLayout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
  path="/coding-lab/:problemId"
  element={
    componentUser?.role === 'student' ? (
      // <DashboardLayout user={componentUser}>
        <CodingProblemPage user={componentUser} />
      // </DashboardLayout>
    ) : (
      <Navigate to="/login" replace />
    )
  }
/>

        <Route
          path="/coding-management"
          element={
            user && user.role === 'faculty' ? (
              <DashboardLayout user={componentUser}>
                <FacultyCodingManagement user={componentUser} />
              </DashboardLayout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/submission/:id"
          element={
            user ? (
              <DashboardLayout user={componentUser!}>
                <SubmissionView />
              </DashboardLayout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* MAIN DASHBOARD (role-based) */}
        <Route
          path="/"
          element={
            user ? (
              user.role === 'faculty' ? (
                <DashboardLayout user={componentUser}>
                  <FacultyDashboard user={componentUser} />
                </DashboardLayout>
              ) : user.role === 'admin' ? (
                <Navigate to="/admin" />
              ) : (
                <DashboardLayout user={componentUser}>
                  <StudentDashboard user={componentUser} />
                </DashboardLayout>
              )
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* FACULTY */}
        <Route
          path="/create-assessment"
          element={
            user && user.role === 'faculty' ? (
              <DashboardLayout user={componentUser}>
                <AssessmentCreation user={componentUser} />
              </DashboardLayout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/course-materials"
          element={
            user && user.role === 'faculty' ? (
              <DashboardLayout user={componentUser}>
                <FacultyCourseMaterials user={componentUser} />
              </DashboardLayout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route
          path="/faculty/student"
          element={
            user && user.role === 'faculty' ? (
              <DashboardLayout user={componentUser}>
                <FacultyStudentManagement user={componentUser} />
              </DashboardLayout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />


        {/* STUDENT */}
        <Route
          path="/take-test/:assessmentId"
          element={
            user && user.role === 'student' ? (
              // <DashboardLayout user={componentUser}>
                <SessionLockGuard>
                  <TestTaking user={componentUser} />
                </SessionLockGuard>
              // </DashboardLayout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/courses"
          element={
            user && user.role === 'student' ? (
              <DashboardLayout user={componentUser}>
                <CoursePage user={componentUser} />
              </DashboardLayout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/ai-assistant"
          element={
            user && user.role === 'student' ? (
              //<DashboardLayout user={componentUser}>
                <AIAssistantModule user={componentUser} />
             // </DashboardLayout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/score-calculator"
          element={
            user && user.role === 'student' ? (
              <DashboardLayout user={componentUser}>
                <ScoreCalculatorModule />
              </DashboardLayout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* RESULTS */}
        <Route
          path="/results/:submissionId"
          element={
            user ? (
              <DashboardLayout user={componentUser!}>
                <ResultsPage user={componentUser} />
              </DashboardLayout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/results-summary/:submissionId"
          element={
            user ? (
              <DashboardLayout user={componentUser!}>
                <ResultsSummary user={componentUser} />
              </DashboardLayout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* USER SETTINGS */}
        <Route
          path="/profile"
          element={
            user ? (
              <DashboardLayout user={componentUser!}>
                <UserProfileComponent />
              </DashboardLayout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/change-password"
          element={
            user ? (
              <DashboardLayout user={componentUser!}>
                <ChangePassword />
              </DashboardLayout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* CATCH-ALL */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
          <ToastContainer position="bottom-right" autoClose={2000} />
    </Router>
  );
};

export default App;
