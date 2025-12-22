CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. USERS TABLE
-- ============================================
-- Note: Supabase Auth handles authentication
-- This table extends auth.users with additional profile data
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('faculty', 'student')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can view their own profile"
  ON public.users
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id);

-- ============================================
-- 2. ASSESSMENTS TABLE
-- ============================================
CREATE TABLE public.assessments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  faculty_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  subject TEXT NOT NULL,
  unit TEXT NOT NULL,
  title TEXT NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for assessments
CREATE POLICY "Faculty can view their own assessments"
  ON public.assessments
  FOR SELECT
  USING (auth.uid() = faculty_id);

CREATE POLICY "Faculty can create assessments"
  ON public.assessments
  FOR INSERT
  WITH CHECK (auth.uid() = faculty_id);

CREATE POLICY "Students can view all assessments"
  ON public.assessments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'student'
    )
  );

-- ============================================
-- 3. QUESTIONS TABLE
-- ============================================
CREATE TABLE public.questions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  assessment_id UUID REFERENCES public.assessments(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('MCQ', 'Theory')),
  question_text TEXT NOT NULL,
  options JSONB, -- For MCQ: ["Option A", "Option B", "Option C", "Option D"]
  correct_answer TEXT, -- For MCQ: the correct option text or index
  marks INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for questions
CREATE POLICY "Faculty can manage questions for their assessments"
  ON public.questions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.assessments
      WHERE assessments.id = questions.assessment_id
      AND assessments.faculty_id = auth.uid()
    )
  );

CREATE POLICY "Students can view questions for assessments"
  ON public.questions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'student'
    )
  );

-- ============================================
-- 4. SUBMISSIONS TABLE
-- ============================================
CREATE TABLE public.submissions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  assessment_id UUID REFERENCES public.assessments(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  answers JSONB NOT NULL, -- {question_id: answer_text}
  mcq_score INTEGER DEFAULT 0,
  theory_score INTEGER DEFAULT NULL, -- NULL until faculty grades
  total_score INTEGER DEFAULT 0,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(assessment_id, student_id) -- One submission per student per assessment
);

-- Enable Row Level Security
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for submissions
CREATE POLICY "Students can create their own submissions"
  ON public.submissions
  FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can view their own submissions"
  ON public.submissions
  FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Faculty can view submissions for their assessments"
  ON public.submissions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.assessments
      WHERE assessments.id = submissions.assessment_id
      AND assessments.faculty_id = auth.uid()
    )
  );

CREATE POLICY "Faculty can update submissions for their assessments"
  ON public.submissions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.assessments
      WHERE assessments.id = submissions.assessment_id
      AND assessments.faculty_id = auth.uid()
    )
  );

-- ============================================
-- 5. INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_assessments_faculty_id ON public.assessments(faculty_id);
CREATE INDEX idx_questions_assessment_id ON public.questions(assessment_id);
CREATE INDEX idx_submissions_assessment_id ON public.submissions(assessment_id);
CREATE INDEX idx_submissions_student_id ON public.submissions(student_id);

-- ============================================
-- 6. HELPER FUNCTION: Auto-insert user profile after signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create user profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();