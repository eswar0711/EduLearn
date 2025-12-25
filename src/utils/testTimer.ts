import { supabase } from '../utils/supabaseClient';

export interface TestSession {
  id: string;
  assessment_id: string;
  student_id: string;
  started_at: string;
  duration_minutes: number;
  submitted_at: string | null;
  is_completed: boolean;
  created_at: string;

  // NEW: optional lock fields (present after DB migration)
  is_locked?: boolean;
  locked_at?: string | null;
  completed_at?: string | null;
  submission_id?: string | null;
}

export interface TestDraft {
  id: string;
  test_session_id: string;
  answers: Record<string, string>;
  last_updated_at: string;
}

/**
 * Get existing test session or create a new one
 */
export const getOrCreateTestSession = async (
  assessmentId: string,
  durationMinutes: number,
  studentId?: string
): Promise<TestSession> => {
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error('Not authenticated');
    }

    const userId = studentId || user.id;

    console.log('🔍 Checking for existing test session...');

    const { data: existingSession, error: fetchError } = await supabase
      .from('test_sessions')
      .select('*')
      .eq('assessment_id', assessmentId)
      .eq('student_id', userId)
      .eq('is_completed', false)
      // also ensure not locked, if column exists
      .or('is_locked.is.null,is_locked.eq.false')
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError) {
      console.error('❌ Fetch error:', fetchError);
      throw fetchError;
    }

    if (existingSession) {
      console.log('✅ Found existing session:', existingSession.id);
      console.log(`⏱️ Started at: ${existingSession.started_at}`);
      return existingSession as TestSession;
    }

    console.log('📝 No existing session found, creating new one...');

    const { data: newSession, error: createError } = await supabase
      .from('test_sessions')
      .insert({
        assessment_id: assessmentId,
        student_id: userId,
        duration_minutes: durationMinutes,
        started_at: new Date().toISOString(),
        is_completed: false,
        // lock fields default to unlocked
        is_locked: false,
      })
      .select()
      .single();

    if (createError || !newSession) {
      console.error('❌ Create error:', createError);
      throw new Error('Failed to create test session');
    }

    console.log('✅ New test session created:', newSession.id);
    return newSession as TestSession;
  } catch (error: any) {
    console.error('❌ Error in getOrCreateTestSession:', error);
    throw error;
  }
};

/**
 * Load draft answers for a test session
 */
export const loadDraftAnswers = async (
  sessionId: string
): Promise<Record<string, string>> => {
  try {
    console.log('📥 Loading draft answers...');

    const { data: draft, error } = await supabase
      .from('test_drafts')
      .select('answers')
      .eq('test_session_id', sessionId)
      .maybeSingle();

    if (error) {
      console.warn('⚠️ Could not load draft:', error);
      return {};
    }

    if (draft?.answers) {
      console.log(
        '✅ Draft answers loaded:',
        Object.keys(draft.answers).length,
        'answers'
      );
      return draft.answers as Record<string, string>;
    }

    console.log('📝 No draft found, starting fresh');
    return {};
  } catch (error) {
    console.error('❌ Error loading draft:', error);
    return {};
  }
};

/**
 * Save draft answers to database
 */
export const saveDraftAnswers = async (
  sessionId: string,
  answers: Record<string, string>
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('test_drafts')
      .upsert(
        {
          test_session_id: sessionId,
          answers: answers,
          last_updated_at: new Date().toISOString(),
        },
        { onConflict: 'test_session_id' }
      );

    if (error) {
      console.warn('⚠️ Could not save draft:', error);
      return;
    }

    console.log('💾 Draft answers saved');
  } catch (error) {
    console.error('❌ Error saving draft:', error);
  }
};

/**
 * Delete draft answers (after successful submission)
 */
export const deleteDraftAnswers = async (
  sessionId: string
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('test_drafts')
      .delete()
      .eq('test_session_id', sessionId);

    if (error) {
      console.warn('⚠️ Could not delete draft:', error);
      return;
    }

    console.log('🗑️ Draft answers deleted');
  } catch (error) {
    console.error('❌ Error deleting draft:', error);
  }
};

/**
 * Calculate remaining time based on server started_at
 */
export const calculateRemainingTime = (session: TestSession): number => {
  try {
    const startTime = new Date(session.started_at).getTime();
    const nowTime = Date.now();
    const elapsedMs = nowTime - startTime;
    const elapsedSeconds = Math.floor(elapsedMs / 1000);
    const totalSeconds = session.duration_minutes * 60;
    const remaining = Math.max(0, totalSeconds - elapsedSeconds);

    return remaining;
  } catch (error) {
    console.error('❌ Error calculating time:', error);
    return 0;
  }
};

/**
 * Mark test session as completed
 */
export const completeTestSession = async (
  sessionId: string
): Promise<void> => {
  const { error } = await supabase
    .from('test_sessions')
    .update({
      is_completed: true,
      submitted_at: new Date().toISOString(),
    })
    .eq('id', sessionId);

  if (error) {
    console.error('❌ Error completing session:', error);
    throw error;
  }

  console.log('✅ Test session completed');
};

/**
 * 🔒 Lock test session immediately after submission
 * (exported to fix the `lockTestSession` import error)
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
      completed_at: new Date().toISOString(),
    })
    .eq('id', sessionId);

  if (error) {
    console.error('❌ Error locking session:', error);
    throw error;
  }

  console.log('🔒 Test session locked:', sessionId);
};

/**
 * Get test session by ID
 */
export const getTestSessionById = async (
  sessionId: string
): Promise<TestSession | null> => {
  try {
    const { data, error } = await supabase
      .from('test_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error) {
      console.error('❌ Error fetching session:', error);
      return null;
    }

    return data as TestSession;
  } catch (error) {
    console.error('❌ Fetch error:', error);
    return null;
  }
};
