-- Supabase Database Schema for EOTC Timirit Organizer Portal
-- This schema supports the existing TypeScript types and enables admin content management

-- Do not manage JWT secrets in checked-in SQL schema files.

-- Create custom types
CREATE TYPE question_type AS ENUM (
  'multiple-choice',
  'short-answer', 
  'reflection',
  'feedback-open',
  'attendance'
);

CREATE TYPE attendance_choice AS ENUM (
  'in-person',
  'online', 
  'maybe',
  'cannot-attend'
);

-- ============================================================================
-- CONTENT TABLES (managed by organizers)
-- ============================================================================

-- Main weekly classes table
CREATE TABLE weekly_classes (
  id TEXT PRIMARY KEY,
  date DATE NOT NULL,
  topic TEXT,
  topic_en TEXT,
  topic_am TEXT,
  speaker TEXT NOT NULL,
  amharic_summary TEXT NOT NULL,
  english_summary TEXT NOT NULL,
  main_points JSONB NOT NULL DEFAULT '[]',
  key_points JSONB NOT NULL DEFAULT '[]', -- Array of strings
  verses JSONB DEFAULT '[]', -- Array of strings
  youtube_url TEXT,
  audio_url TEXT,
  audio_title TEXT,
  audio_title_en TEXT,
  audio_title_am TEXT,
  audio_note TEXT,
  audio_note_en TEXT,
  audio_note_am TEXT,
  lesson_media_enabled BOOLEAN DEFAULT true,
  teaching_notes TEXT,
  teaching_notes_en TEXT,
  teaching_notes_am TEXT,
  advanced_practice_url TEXT,
  feedback_summary TEXT,
  attendance_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Mezmurs table (each weekly class has exactly 2)
CREATE TABLE mezmurs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  weekly_class_id TEXT NOT NULL REFERENCES weekly_classes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  title_en TEXT,
  title_am TEXT,
  transliteration TEXT,
  lyrics TEXT,
  lyrics_en TEXT,
  lyrics_am TEXT,
  note_en TEXT,
  note_am TEXT,
  youtube_url TEXT,
  audio_url TEXT,
  order_index INTEGER NOT NULL CHECK (order_index IN (0, 1)), -- First or second mezmur
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  
  UNIQUE(weekly_class_id, order_index) -- Ensure exactly 2 mezmurs per class
);

-- Questions table
CREATE TABLE questions (
  id TEXT PRIMARY KEY,
  weekly_class_id TEXT NOT NULL REFERENCES weekly_classes(id) ON DELETE CASCADE,
  type question_type NOT NULL,
  prompt TEXT,
  prompt_en TEXT,
  prompt_am TEXT,
  helper_text TEXT,
  helper_text_en TEXT,
  helper_text_am TEXT,
  placeholder TEXT,
  placeholder_en TEXT,
  placeholder_am TEXT,
  correct_index INTEGER, -- Only for multiple-choice questions
  explanation TEXT,
  explanation_en TEXT,
  explanation_am TEXT,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Multiple choice options (for multiple-choice questions)
CREATE TABLE multiple_choice_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  option_text TEXT,
  option_text_en TEXT,
  option_text_am TEXT,
  option_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  
  UNIQUE(question_id, option_index)
);

-- Attendance options (for attendance questions)
CREATE TABLE attendance_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  value attendance_choice NOT NULL,
  label TEXT,
  label_en TEXT,
  label_am TEXT,
  option_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  
  UNIQUE(question_id, option_index)
);

-- Upcoming Timirit preview
CREATE TABLE upcoming_timirit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scheduled_date DATE NOT NULL,
  topic_preview TEXT,
  topic_preview_en TEXT,
  topic_preview_am TEXT,
  note TEXT,
  note_en TEXT,
  note_am TEXT,
  main_points JSONB NOT NULL DEFAULT '[]',
  lesson_youtube_url TEXT,
  lesson_audio_url TEXT,
  lesson_audio_title TEXT,
  lesson_audio_title_en TEXT,
  lesson_audio_title_am TEXT,
  lesson_note TEXT,
  lesson_note_en TEXT,
  lesson_note_am TEXT,
  weekly_knowledge_content TEXT,
  weekly_knowledge_content_en TEXT,
  weekly_knowledge_content_am TEXT,
  weekly_knowledge_image_url TEXT,
  key_verse TEXT,
  key_verse_en TEXT,
  key_verse_am TEXT,
  organizer_note TEXT,
  organizer_note_en TEXT,
  organizer_note_am TEXT,
  advanced_practice_url TEXT,
  class_summary_content TEXT,
  class_summary_content_en TEXT,
  class_summary_content_am TEXT,
  publication_status TEXT NOT NULL DEFAULT 'draft' CHECK (publication_status IN ('draft', 'published')),
  is_active BOOLEAN DEFAULT true, -- Only one should be active at a time
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  created_by UUID REFERENCES auth.users(id)
);

-- Upcoming mezmurs (2 per upcoming timirit)
CREATE TABLE upcoming_mezmurs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upcoming_timirit_id UUID NOT NULL REFERENCES upcoming_timirit(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  title_en TEXT,
  title_am TEXT,
  transliteration TEXT,
  lyrics TEXT,
  lyrics_en TEXT,
  lyrics_am TEXT,
  note_en TEXT,
  note_am TEXT,
  youtube_url TEXT,
  audio_url TEXT,
  order_index INTEGER NOT NULL CHECK (order_index IN (0, 1)),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  
  UNIQUE(upcoming_timirit_id, order_index)
);

-- Weekly knowledge card content
CREATE TABLE weekly_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  title_en TEXT,
  title_am TEXT,
  subtitle TEXT,
  subtitle_en TEXT,
  subtitle_am TEXT,
  content TEXT,
  content_en TEXT,
  content_am TEXT,
  extra_note TEXT,
  extra_note_en TEXT,
  extra_note_am TEXT,
  image_url TEXT,
  button_text TEXT,
  button_text_en TEXT,
  button_text_am TEXT,
  button_link TEXT,
  content_type TEXT NOT NULL DEFAULT 'Knowledge',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'hidden')),
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  created_by UUID REFERENCES auth.users(id)
);

-- ============================================================================
-- USER RESPONSE TABLES (public submissions)
-- ============================================================================

-- Store user responses to questions
CREATE TABLE user_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  weekly_class_id TEXT NOT NULL REFERENCES weekly_classes(id),
  question_id TEXT NOT NULL REFERENCES questions(id),
  user_fingerprint TEXT, -- Anonymous fingerprint to group responses by user
  response_text TEXT, -- For text-based answers
  selected_option_index INTEGER, -- For multiple choice
  attendance_choice attendance_choice, -- For attendance questions
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  
  -- Prevent duplicate responses from same user for same question
  UNIQUE(weekly_class_id, question_id, user_fingerprint)
);

-- ============================================================================
-- ADMIN/ORGANIZER USER MANAGEMENT
-- ============================================================================

-- Extend the auth.users with profile information
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT DEFAULT 'organizer' CHECK (role IN ('organizer', 'admin')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Anonymous feedback and topic suggestions
CREATE TABLE anonymous_feedback_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL CHECK (category IN (
    'Website feedback',
    'Teaching feedback',
    'Topic suggestion',
    'Prayer / support note',
    'General message'
  )),
  subject TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Hashed rate-limit ledger for the anonymous feedback form
CREATE TABLE anonymous_feedback_rate_limits (
  identifier_hash TEXT PRIMARY KEY,
  window_started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  submission_count INTEGER NOT NULL DEFAULT 0,
  blocked_until TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Weekly classes indexes
CREATE INDEX idx_weekly_classes_date ON weekly_classes(date DESC);
CREATE INDEX idx_weekly_classes_created_at ON weekly_classes(created_at DESC);
CREATE INDEX idx_weekly_knowledge_status_active ON weekly_knowledge(status, is_active, updated_at DESC);

-- Questions indexes
CREATE INDEX idx_questions_weekly_class ON questions(weekly_class_id, order_index);

-- User responses indexes
CREATE INDEX idx_user_responses_weekly_class ON user_responses(weekly_class_id);
CREATE INDEX idx_user_responses_question ON user_responses(question_id);
CREATE INDEX idx_user_responses_submitted_at ON user_responses(submitted_at DESC);
CREATE INDEX idx_anonymous_feedback_submissions_created_at ON anonymous_feedback_submissions(created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE weekly_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE mezmurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE multiple_choice_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE upcoming_timirit ENABLE ROW LEVEL SECURITY;
ALTER TABLE upcoming_mezmurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE anonymous_feedback_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE anonymous_feedback_rate_limits ENABLE ROW LEVEL SECURITY;

-- Public read access for content tables (no authentication required)
CREATE POLICY "Public can read weekly classes" ON weekly_classes FOR SELECT USING (true);
CREATE POLICY "Public can read mezmurs" ON mezmurs FOR SELECT USING (true);
CREATE POLICY "Public can read questions" ON questions FOR SELECT USING (true);
CREATE POLICY "Public can read multiple choice options" ON multiple_choice_options FOR SELECT USING (true);
CREATE POLICY "Public can read attendance options" ON attendance_options FOR SELECT USING (true);
CREATE POLICY "Public can read upcoming timirit" ON upcoming_timirit FOR SELECT USING (true);
CREATE POLICY "Public can read upcoming mezmurs" ON upcoming_mezmurs FOR SELECT USING (true);
CREATE POLICY "Public can read weekly knowledge" ON weekly_knowledge FOR SELECT USING (true);

-- Public can submit responses
CREATE POLICY "Public can insert responses" ON user_responses FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can read aggregated responses" ON user_responses FOR SELECT USING (true);

-- Only authenticated organizers can modify content
CREATE POLICY "Organizers can manage weekly classes" ON weekly_classes FOR ALL USING (
  auth.role() = 'authenticated' AND 
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_active = true)
);

CREATE POLICY "Organizers can manage mezmurs" ON mezmurs FOR ALL USING (
  auth.role() = 'authenticated' AND 
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_active = true)
);

CREATE POLICY "Organizers can manage questions" ON questions FOR ALL USING (
  auth.role() = 'authenticated' AND 
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_active = true)
);

CREATE POLICY "Organizers can manage multiple choice options" ON multiple_choice_options FOR ALL USING (
  auth.role() = 'authenticated' AND 
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_active = true)
);

CREATE POLICY "Organizers can manage attendance options" ON attendance_options FOR ALL USING (
  auth.role() = 'authenticated' AND 
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_active = true)
);

CREATE POLICY "Organizers can manage upcoming timirit" ON upcoming_timirit FOR ALL USING (
  auth.role() = 'authenticated' AND 
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_active = true)
);

CREATE POLICY "Organizers can manage upcoming mezmurs" ON upcoming_mezmurs FOR ALL USING (
  auth.role() = 'authenticated' AND 
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_active = true)
);

CREATE POLICY "Organizers can manage weekly knowledge" ON weekly_knowledge FOR ALL USING (
  auth.role() = 'authenticated' AND
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_active = true)
);

-- User profiles management
CREATE POLICY "Users can read own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Authenticated users can read active profiles" ON user_profiles FOR SELECT USING (
  auth.role() = 'authenticated' AND is_active = true
);

CREATE POLICY "Organizers can read anonymous feedback" ON anonymous_feedback_submissions FOR SELECT USING (
  auth.role() = 'authenticated' AND
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_active = true)
);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables with updated_at
CREATE TRIGGER update_weekly_classes_updated_at BEFORE UPDATE ON weekly_classes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_mezmurs_updated_at BEFORE UPDATE ON mezmurs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON questions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_upcoming_timirit_updated_at BEFORE UPDATE ON upcoming_timirit FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_weekly_knowledge_updated_at BEFORE UPDATE ON weekly_knowledge FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FUNCTIONS FOR ANALYTICS
-- ============================================================================

-- Function to get organizer dashboard data
CREATE OR REPLACE FUNCTION get_organizer_analytics(target_week_id TEXT)
RETURNS TABLE (
  week_id TEXT,
  week_label TEXT,
  total_responses BIGINT,
  reviewed_or_watched BIGINT,
  most_missed_question_id TEXT,
  most_missed_question_label TEXT,
  miss_rate_percent INTEGER,
  top_unclear_topics JSONB,
  language_difficulty_avg NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH question_stats AS (
    SELECT 
      q.id,
      q.prompt,
      COUNT(ur.id) as total_answers,
      COUNT(ur.id) FILTER (WHERE q.type = 'multiple-choice' AND ur.selected_option_index != q.correct_index) as incorrect_answers
    FROM questions q
    LEFT JOIN user_responses ur ON ur.question_id = q.id
    WHERE q.weekly_class_id = target_week_id
    GROUP BY q.id, q.prompt, q.correct_index
  ),
  most_missed AS (
    SELECT 
      id as question_id,
      prompt,
      CASE 
        WHEN total_answers > 0 THEN ROUND((incorrect_answers * 100.0 / total_answers)::numeric)
        ELSE 0
      END as miss_percentage
    FROM question_stats
    WHERE total_answers > 0
    ORDER BY miss_percentage DESC, total_answers DESC
    LIMIT 1
  )
  SELECT 
    target_week_id,
    TO_CHAR((SELECT date FROM weekly_classes WHERE id = target_week_id), 'Mon DD'),
    COUNT(DISTINCT ur.user_fingerprint),
    COUNT(DISTINCT ur.user_fingerprint), -- Assuming all responders reviewed/watched
    COALESCE(mm.question_id, ''),
    COALESCE(mm.prompt, ''),
    COALESCE(mm.miss_percentage::INTEGER, 0),
    COALESCE(
      (SELECT jsonb_agg(DISTINCT ur.response_text) 
       FROM user_responses ur 
       JOIN questions q ON q.id = ur.question_id 
       WHERE q.weekly_class_id = target_week_id 
       AND q.type = 'feedback-open' 
       AND ur.response_text IS NOT NULL 
       AND ur.response_text != ''), 
      '[]'::jsonb
    ),
    3.0::NUMERIC -- Mock average for now
  FROM user_responses ur
  JOIN questions q ON q.id = ur.question_id
  LEFT JOIN most_missed mm ON true
  WHERE q.weekly_class_id = target_week_id
  GROUP BY mm.question_id, mm.prompt, mm.miss_percentage;
END;
$$ LANGUAGE plpgsql;

-- Function to get attendance summary for next week
CREATE OR REPLACE FUNCTION get_attendance_summary(target_week_id TEXT)
RETURNS TABLE (
  attendance_choice attendance_choice,
  choice_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ur.attendance_choice,
    COUNT(*) as choice_count
  FROM user_responses ur
  JOIN questions q ON q.id = ur.question_id
  WHERE q.weekly_class_id = target_week_id 
  AND q.type = 'attendance'
  AND ur.attendance_choice IS NOT NULL
  GROUP BY ur.attendance_choice;
END;
$$ LANGUAGE plpgsql;