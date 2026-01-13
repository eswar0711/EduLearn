import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { AlertCircle } from 'lucide-react';
import PremiumLoader from '../layouts/PremiumLoader';

interface SessionLockGuardProps {
  children: React.ReactNode;
}

/**
 * SessionLockGuard prevents access to tests that are already locked/completed
 */
const SessionLockGuard: React.FC<SessionLockGuardProps> = ({ children }) => {
  const navigate = useNavigate();
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const [isAllowed, setIsAllowed] = useState(true);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    checkSessionStatus();
  }, [assessmentId]);

  const checkSessionStatus = async () => {
    try {
      if (!assessmentId) {
        setIsAllowed(true);
        setLoading(false);
        return;
      }

      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        setIsAllowed(false);
        setErrorMsg('Not authenticated');
        setLoading(false);
        return;
      }

      // Check if there's an existing LOCKED session for this assessment
      const { data: lockedSession, error } = await supabase
        .from('test_sessions')
        .select('id, is_locked')
        .eq('assessment_id', assessmentId)
        .eq('student_id', user.id)
        .eq('is_locked', true)
        .maybeSingle();

      if (error) {
        console.warn('⚠️ Error checking lock status:', error);
        setIsAllowed(true); // Allow on error
        setLoading(false);
        return;
      }

      if (lockedSession && lockedSession.is_locked) {
        setErrorMsg('❌ This test has already been submitted and locked. You cannot retake it.');
        setIsAllowed(false);
        setLoading(false);
        return;
      }

      setIsAllowed(true);
      setLoading(false);
    } catch (error: any) {
      console.error('Error checking session:', error);
      setIsAllowed(true); // Allow on error
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <PremiumLoader message="Verifying session..." />
      </div>
    );
  }

  if (!isAllowed) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">{errorMsg || 'You do not have access to this test.'}</p>
          <button
            onClick={() => navigate('/', { replace: true })}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default SessionLockGuard;
