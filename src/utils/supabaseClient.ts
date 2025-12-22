import { createClient } from '@supabase/supabase-js';

// ================================================================
// ENV CONFIG
// ================================================================

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY;

// Validate
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('❌ Missing Supabase configuration in .env');
}

if (!supabaseServiceKey) {
  console.warn('⚠️ SERVICE_ROLE key missing — Admin features disabled');
}

// ================================================================
// CREATE CLIENTS
// ================================================================

// Normal client (RLS enabled)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client (RLS bypassed) — only if key exists
export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
  : null;

// ================================================================
// DATABASE TYPES FOR TYPESCRIPT
// ================================================================

export interface User {
  id: string;
  full_name: string;
  email: string;
  role: 'faculty' | 'student' | 'admin';
  created_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'faculty' | 'student' | 'admin';
  phone?: string;
  department?: string;
  profile_picture_url?: string;
  is_active: boolean;
  is_blocked: boolean;
  bio?: string;
  created_at: string;
  updated_at: string;
}

export interface Assessment {
  id: string;
  faculty_id: string;
  subject: string;
  unit: string;
  title: string;
  duration_minutes: number;
  created_at: string;
}

export interface Question {
  id: string;
  assessment_id: string;
  type: 'MCQ' | 'Theory';
  question_text: string;
  options?: string[];
  correct_answer?: string;
  marks: number;
  created_at: string;
}

export interface Submission {
  id: string;
  assessment_id: string;
  student_id: string;
  answers: Record<string, string>;
  mcq_score: number;
  theory_score: number | null;
  total_score: number;
  submitted_at: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  semester: number;
  department: string;
  description: string | null;
  created_at: string;
}

export interface CourseMaterial {
  id: string;
  subject_id: string;
  faculty_id: string;
  title: string;
  description: string | null;
  file_url: string;
  file_name: string;
  file_size: number | null;
  file_type: string | null;
  material_type: 'pdf' | 'syllabus' | 'notes' | 'assignment';
  semester: number;
  created_at: string;
  updated_at: string;
}

export interface StudentEnrollment {
  id: string;
  student_id: string;
  subject_id: string;
  semester: number;
  enrolled_at: string;
}
