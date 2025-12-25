import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { getCurrentUser } from './utils/auth';
import type { AuthUser } from './utils/auth';

// Pages
import LoginPage from './pages/LoginPage';

// Components - Faculty
import FacultyDashboard from './components/FacultyDashboard';
import AssessmentCreation from './components/AssessmentCreation';
import FacultyCourseMaterials from './components/FacultyCourseMaterials';

// Components - Student
import StudentDashboard from './components/StudentDashboard';
import TestTaking from './components/TestTaking';
import ResultsPage from './components/ResultsPage';
import CoursePage from './components/CoursePage';
import ScoreCalculatorModule from './components/ScoreCalculator/ScoreCalculatorModule';
import AIAssistantModule from './components/AIAssistant/AIAssistantModule';

// Components - User Settings
import {
  ChangePassword,
  UserProfile as UserProfileComponent,
} from './components/UserSettings';

// Components - Admin
import AdminDashboard from './components/Admin/AdminDashboardd';
import AdminUserManagement from './components/Admin/AdminUserManagement';
import AdminAnalytics from './components/Admin/AdminAnalytics';
import AdminSubmissions from './components/Admin/AdminSubmissions';

// Coding Practice Lab
import StudentCodingLabPage from './pages/CodingPractice/StudentCodingLabPage';
import FacultyCodingManagement from './pages/CodingPractice/FacultyCodingManagement';
import AdminCodingAnalytics from './pages/CodingPractice/AdminCodingAnalytics';
import SubmissionView from './pages/CodingPractice/SubmissionView';

// Test Results Pages
import ResultsSummary from './components/ResultsSummary';
import SessionLockGuard from './components/SessionLockGuard';

// Type conversion utility
const convertAuthUserToComponentUser = (authUser: AuthUser): any => {
  return {
    id: authUser.id,
    email: authUser.email,
    full_name: authUser.full_name,
    role: authUser.role,
    is_blocked: authUser.is_blocked,
    is_active: authUser.is_active,
    created_at: authUser.created_at,
  };
};

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
    <Router>
      <Routes>
        {/* ===== LOGIN ===== */}
        <Route
          path="/login"
          element={!user ? <LoginPage onLogin={checkUser} /> : <Navigate to="/" />}
        />

        {/* ===== ADMIN ===== */}
        <Route
          path="/admin"
          element={
            user && user.role === 'admin' ? (
              <AdminDashboard user={componentUser} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/admin/users"
          element={
            user && user.role === 'admin' ? (
              <AdminUserManagement user={componentUser} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/admin/analytics"
          element={
            user && user.role === 'admin' ? (
              <AdminAnalytics user={componentUser} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/admin/submissions"
          element={
            user && user.role === 'admin' ? (
              <AdminSubmissions user={user} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/admin/coding-analytics"
          element={
            user && user.role === 'admin' ? (
              <AdminCodingAnalytics />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* ===== CODING PRACTICE LAB ===== */}
        <Route
          path="/coding-lab"
          element={
            user && user.role === 'student' ? (
              <StudentCodingLabPage user={componentUser} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/coding-management"
          element={
            user && user.role === 'faculty' ? (
              <FacultyCodingManagement user={componentUser} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/submission/:id"
          element={user ? <SubmissionView /> : <Navigate to="/login" />}
        />

        {/* ===== MAIN DASHBOARD ===== */}
        <Route
          path="/"
          element={
            user ? (
              user.role === 'faculty' ? (
                <FacultyDashboard user={componentUser} />
              ) : user.role === 'admin' ? (
                <Navigate to="/admin" />
              ) : (
                <StudentDashboard user={componentUser} />
              )
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* ===== FACULTY ===== */}
        <Route
          path="/create-assessment"
          element={
            user && user.role === 'faculty' ? (
              <AssessmentCreation user={componentUser} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/course-materials"
          element={
            user && user.role === 'faculty' ? (
              <FacultyCourseMaterials user={componentUser} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* ===== STUDENT ===== */}
        {/* 🔒 TEST TAKING - PROTECTED WITH SESSION LOCK GUARD */}
        <Route
          path="/take-test/:assessmentId"
          element={
            user && user.role === 'student' ? (
              <SessionLockGuard>
                <TestTaking user={componentUser} />
              </SessionLockGuard>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route
          path="/courses"
          element={
            user && user.role === 'student' ? (
              <CoursePage user={componentUser} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/ai-assistant"
          element={
            user && user.role === 'student' ? (
              <AIAssistantModule user={componentUser} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/score-calculator"
          element={
            user && user.role === 'student' ? (
              <ScoreCalculatorModule />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* ===== RESULTS PAGES ===== */}
        {/* 📊 DETAILED RESULTS - Accessible from Dashboard after submission */}
        <Route
          path="/results/:submissionId"
          element={
            user ? <ResultsPage user={componentUser} /> : <Navigate to="/login" />
          }
        />

        {/* ✨ SUMMARY RESULTS - Shown immediately after submission (PASS/FAIL only) */}
        <Route
          path="/results-summary/:submissionId"
          element={
            user ? <ResultsSummary user={componentUser} /> : <Navigate to="/login" />
          }
        />

        {/* ===== USER SETTINGS ===== */}
        <Route
          path="/profile"
          element={user ? <UserProfileComponent /> : <Navigate to="/login" />}
        />
        <Route
          path="/change-password"
          element={user ? <ChangePassword /> : <Navigate to="/login" />}
        />

        {/* ===== CATCH-ALL ===== */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default App;
