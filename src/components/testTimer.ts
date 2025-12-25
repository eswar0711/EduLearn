import { supabase } from '../utils/supabaseClient';

export interface TestSession {
  id: string;
  assessment_id: string;
  student_id: string;
  started_at: string;
  duration_minutes: number;
  is_locked: boolean;
  submission_id: string | null;
}

/**
 * Get or create a test session for a student
 */
export const getOrCreateTestSession = async (
  assessmentId: string,
  durationMinutes: number
): Promise<TestSession> => {
  const userId = (await supabase.auth.getUser()).data.user?.id;

  if (!userId) {
    throw new Error('User not authenticated');
  }

  // Check if session already exists
  const { data: existingSession } = await supabase
    .from('test_sessions')
    .select('*')
    .eq('assessment_id', assessmentId)
    .eq('student_id', userId)
    .single();

  if (existingSession && !existingSession.is_locked) {
    return existingSession;
  }

  // Create new session
  const { data: newSession, error } = await supabase
    .from('test_sessions')
    .insert({
      assessment_id: assessmentId,
      student_id: userId,
      started_at: new Date().toISOString(),
      duration_minutes: durationMinutes,
      is_locked: false,
    })
    .select()
    .single();

  if (error || !newSession) {
    throw new Error(`Failed to create test session: ${error?.message}`);
  }

  return newSession;
};

/**
 * Calculate remaining time for a test session
 */
export const calculateRemainingTime = (session: TestSession): number => {
  const startTime = new Date(session.started_at).getTime();
  const durationMs = session.duration_minutes * 60 * 1000;
  const elapsedMs = Date.now() - startTime;
  const remainingMs = durationMs - elapsedMs;

  return Math.max(0, Math.floor(remainingMs / 1000));
};

/**
 * Mark test session as completed
 */
export const completeTestSession = async (sessionId: string): Promise<void> => {
  const { error } = await supabase
    .from('test_sessions')
    .update({ completed_at: new Date().toISOString() })
    .eq('id', sessionId);

  if (error) {
    throw new Error(`Failed to complete test session: ${error.message}`);
  }
};

/**
 * 🔒 LOCK TEST SESSION - Prevents re-access to test
 * This is called immediately after submission
 */
export const lockTestSession = async (
  sessionId: string,
  submissionId: string
): Promise<void> => {
  const { error } = await supabase
    .from('test_sessions')
    .update({
      is_locked: true,
      submission_id: submissionId,
      locked_at: new Date().toISOString(),
    })
    .eq('id', sessionId);

  if (error) {
    console.error('❌ Failed to lock test session:', error);
    throw new Error(`Failed to lock test session: ${error.message}`);
  }

  console.log('🔒 Test session locked:', sessionId);
};

/**
 * Load draft answers for a test session
 */
export const loadDraftAnswers = async (
  sessionId: string
): Promise<Record<string, string>> => {
  const { data, error } = await supabase
    .from('test_draft_answers')
    .select('answers')
    .eq('session_id', sessionId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return {};
  }

  return data.answers || {};
};

/**
 * Save draft answers for a test session
 */
export const saveDraftAnswers = async (
  sessionId: string,
  answers: Record<string, string>
): Promise<void> => {
  // Check if draft exists
  const { data: existingDraft } = await supabase
    .from('test_draft_answers')
    .select('id')
    .eq('session_id', sessionId)
    .single();

  if (existingDraft) {
    // Update existing draft
    const { error } = await supabase
      .from('test_draft_answers')
      .update({
        answers: answers,
        updated_at: new Date().toISOString(),
      })
      .eq('session_id', sessionId);

    if (error) {
      console.error('❌ Failed to update draft answers:', error);
    }
  } else {
    // Create new draft
    const { error } = await supabase
      .from('test_draft_answers')
      .insert({
        session_id: sessionId,
        answers: answers,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error('❌ Failed to save draft answers:', error);
    }
  }
};

/**
 * Delete draft answers when test is submitted
 */
export const deleteDraftAnswers = async (sessionId: string): Promise<void> => {
  const { error } = await supabase
    .from('test_draft_answers')
    .delete()
    .eq('session_id', sessionId);

  if (error) {
    console.error('❌ Failed to delete draft answers:', error);
  }
};

/**
 * Check if a test session is locked
 */
export const isTestSessionLocked = async (sessionId: string): Promise<boolean> => {
  const { data } = await supabase
    .from('test_sessions')
    .select('is_locked')
    .eq('id', sessionId)
    .single();

  return data?.is_locked ?? false;
};