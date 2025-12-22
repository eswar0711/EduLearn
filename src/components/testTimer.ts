// src/utils/testTimer.ts
import { supabase } from '../utils/supabaseClient';

export interface TestSession {
  id: string;
  assessment_id: string;
  student_id: string;
  started_at: string; // ISO timestamp
  duration_minutes: number;
  submitted_at: string | null;
  is_completed: boolean;
  created_at: string;
}

/**
 * Get existing test session or create a new one
 * ✅ Always checks database first
 */
export const getOrCreateTestSession = async (
  assessmentId: string,
  durationMinutes: number,
  studentId?: string
): Promise<TestSession> => {
  try {
    // ✅ FIX: Get current user first
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error('Not authenticated');
    }

    const userId = studentId || user.id;

    // ✅ FIX: Always check for existing session in database
    const { data: existingSession, } = await supabase
      .from('test_sessions')
      .select('*')
      .eq('assessment_id', assessmentId)
      .eq('student_id', userId)
      .eq('is_completed', false)
      .single();

    if (existingSession) {
      console.log('✅ Found existing test session:', existingSession.id);
      return existingSession;
    }

    // ✅ No existing session, create new one
    console.log('📝 Creating new test session...');
    const { data: newSession, error: createError } = await supabase
      .from('test_sessions')
      .insert({
        assessment_id: assessmentId,
        student_id: userId,
        duration_minutes: durationMinutes,
        started_at: new Date().toISOString(),
        is_completed: false,
      })
      .select()
      .single();

    if (createError || !newSession) {
      console.error('Create error:', createError);
      throw new Error('Failed to create test session');
    }

    console.log('✅ New test session created:', newSession.id);
    return newSession;
  } catch (error: any) {
    console.error('Error in getOrCreateTestSession:', error);
    throw error;
  }
};

/**
 * Calculate remaining time based on server-side started_at
 * ✅ Always uses database time, not local state
 */
export const calculateRemainingTime = (session: TestSession): number => {
  const startTime = new Date(session.started_at).getTime();
  const nowTime = new Date().getTime();
  const elapsedSeconds = Math.floor((nowTime - startTime) / 1000);
  const totalSeconds = session.duration_minutes * 60;
  const remaining = Math.max(0, totalSeconds - elapsedSeconds);

  return remaining;
};

/**
 * Mark test session as completed
 */
export const completeTestSession = async (sessionId: string): Promise<void> => {
  const { error } = await supabase
    .from('test_sessions')
    .update({
      is_completed: true,
      submitted_at: new Date().toISOString(),
    })
    .eq('id', sessionId);

  if (error) {
    console.error('Error completing session:', error);
    throw error;
  }

  console.log('✅ Test session marked as completed');
};

/**
 * Get test session by ID
 */
export const getTestSessionById = async (sessionId: string): Promise<TestSession | null> => {
  const { data, error } = await supabase
    .from('test_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (error) {
    console.error('Error fetching session:', error);
    return null;
  }

  return data;
};
