-- Data Migration Script: Populate Supabase with existing mock data
-- Run this after the schema is set up

-- ============================================================================
-- MIGRATE WEEKLY CLASSES
-- ============================================================================

-- Insert weekly classes from mock data
INSERT INTO weekly_classes (id, date, topic, speaker, amharic_summary, english_summary, key_points, verses, youtube_url, feedback_summary, attendance_summary)
VALUES
  (
    '2026-04-01',
    '2026-04-01',
    'The Good Shepherd and care for the flock',
    'Dn. Daniel T.',
    'የመጽሐፍ ቅዱስ መዝሙር በእርሱ እንደ በግ እንደምንመራ ተነጋገርን። እግዚአብሔር እንዴት በዕለት ተወልዶ በሰው ልጆች ዘንድ ይገኛል ተመለከትን።',
    'In this Ethiopian Orthodox Tewahedo Timirit we contemplated Our Lord as the Good Shepherd of the flock of His One Holy Church, guided by the Gospel of John and the Psalms of Prophet-King David.',
    '[
      "Discerning Christ's voice grows through prayer, fasting, and the Holy Communion received in the communion of the Church.",
      "The Shepherd's patience toward the sheep who arrive late reflects the mercy shown in the lives of the Holy Fathers and Mothers.",
      "The Divine Liturgy, Scripture, and patristic teaching together guard us from wandering alone outside the fold."
    ]'::jsonb,
    '["John 10:11-16", "Psalm 23"]'::jsonb,
    '',
    'Families asked for a slower walk through how the shepherd image applies inside the Divine Liturgy.',
    'Most responses expect in-person presence; a few households requested the Meet link for illness.'
  ),
  (
    '2026-04-08',
    '2026-04-08',
    'Forgiveness and the heart''s healing',
    'Memhir Kidan',
    'የሰው ልጅ ልብ እግዚአብሔርን በመውደድ እንዴት ይፈወዳል እና ቅዱስ አባቶች ምሕረትን እንዴት አስተምረውናል ተወያይን።',
    'We studied forgiveness as a gift of the Holy Trinity and a cross-bearing path within the Ethiopian Orthodox Tewahedo Church, hearing the Lord''s prayer in Matthew and the counsels of the Holy Fathers on mercy.',
    '[
      "Forgiveness flows first from God's compassion, then becomes our ascetic labor with the blessing of a spiritual father.",
      "Guarding the heart from bitterness belongs to the same fasts and prostrations that soften the soul toward neighbors.",
      "Holy Confession in the Church is healing oil, not a courtroom sentence."
    ]'::jsonb,
    '["Matthew 6:14-15", "Colossians 3:12-13"]'::jsonb,
    '',
    'Several notes asked how to forgive when trust is wounded — plan a short word on remembrance vs. hatred.',
    'Online intentions rose slightly because of night-shift work schedules.'
  ),
  (
    '2026-04-15',
    '2026-04-15',
    'Growing in theosis through liturgical life',
    'Fr. Michael Z.',
    'በቅዱሳን አባቶች ትምህርት የሰው ልጅ እንዴት በወሳኝ ጊዜያት እግዚአብሔር ጋር እንደሚባዳ እንጂ አይቀርም ተዳሰን።',
    'We explored the Orthodox teaching on theosis (deification) through the liturgical life of the Church, hearing from the Divine Liturgy and the Fathers on how we become "partakers of the divine nature."',
    '[
      "Theosis is not earning salvation but cooperating with grace already freely given.",
      "The Divine Liturgy is our workshop for theosis, not a mere ritual to observe.",
      "Fasting, prayer, and almsgiving prepare the heart to receive what God offers."
    ]'::jsonb,
    '["2 Peter 1:3-4", "Philippians 2:12-13"]'::jsonb,
    '',
    'Questions about the balance between grace and effort — suggest a brief follow-up on synergy.',
    'Strong in-person turnout with younger families engaging more in discussion.'
  );

-- ============================================================================
-- MIGRATE MEZMURS
-- ============================================================================

-- Insert mezmurs for each weekly class
INSERT INTO mezmurs (weekly_class_id, title, transliteration, lyrics, youtube_url, order_index)
VALUES
  -- Week 1 mezmurs
  ('2026-04-01', 'የጎረስ መዝሙር', 'Ye-Goros Mezmur', 'Placeholder lyrics — replace with liturgical text from your choir.', 'https://www.youtube.com/watch?v=placeholder1', 0),
  ('2026-04-01', 'መዝሙር ዘማርያም', 'Mezmur ze-Mariyam', 'Placeholder lyrics — replace with liturgical text from your choir.', NULL, 1),
  
  -- Week 2 mezmurs
  ('2026-04-08', 'እግዚአብሔር ሆይ ይቅር በለኝ', 'Igziabhier Hoy yiqer belagn', 'Placeholder lyrics — replace with liturgical text from your choir.', NULL, 0),
  ('2026-04-08', 'ዘእግዚአብሔር አምላክ', 'Ze-Igziabhier Amlak', NULL, 'https://www.youtube.com/watch?v=placeholder2', 1),
  
  -- Week 3 mezmurs
  ('2026-04-15', 'ወልደ ጊዮርጊስ', 'Welde Giyorgis', 'Placeholder lyrics — replace with liturgical text from your choir.', NULL, 0),
  ('2026-04-15', 'በስመ አብ', 'Beseme Ab', 'Placeholder lyrics — replace with liturgical text from your choir.', 'https://www.youtube.com/watch?v=placeholder3', 1);

-- ============================================================================
-- MIGRATE QUESTIONS
-- ============================================================================

-- Week 1 Questions
INSERT INTO questions (id, weekly_class_id, type, prompt, helper_text, correct_index, explanation, order_index)
VALUES
  ('2026-04-01-q1', '2026-04-01', 'multiple-choice', 'According to the Gospel of John, how do Christ''s sheep know Him?', 'Choose the answer closest to the Holy Gospel we heard.', 1, 'Christ unites His flock to Himself through the Church''s preaching, Mysteries, and obedience of faith — not through self-chosen isolation.', 0),
  ('2026-04-01-q2', '2026-04-01', 'multiple-choice', 'Which image best matches Psalm 23''s consolation for the faithful?', NULL, 1, 'Prophet David sings of the Lord who feeds, guides, and anoints His people — the same mercy we taste mystically in the Holy Eucharist.', 1),
  ('2026-04-01-q3', '2026-04-01', 'reflection', 'Where can you show Christ-like gentleness to a brother or sister this week?', 'One humble sentence is enough.', NULL, NULL, 2),
  ('2026-04-01-q4', '2026-04-01', 'feedback-open', 'What was unclear or needs more explanation?', 'Teachers use this only to prepare a merciful review next Tuesday.', NULL, NULL, 3),
  ('2026-04-01-q5', '2026-04-01', 'attendance', 'Are you likely to attend next Tuesday?', NULL, NULL, NULL, 4);

-- Week 1 Multiple Choice Options
INSERT INTO multiple_choice_options (question_id, option_text, option_index)
VALUES
  ('2026-04-01-q1', 'They rely only on private opinions', 0),
  ('2026-04-01-q1', 'They hear His voice in the life of the Church and follow Him', 1),
  ('2026-04-01-q1', 'They never grow tired', 2),
  ('2026-04-01-q1', 'They avoid the Divine Liturgy', 3),
  
  ('2026-04-01-q2', 'A harsh accuser', 0),
  ('2026-04-01-q2', 'A shepherd who leads beside still waters', 1),
  ('2026-04-01-q2', 'A stranger who hides', 2),
  ('2026-04-01-q2', 'A voice without the Church', 3);

-- Week 1 Attendance Options
INSERT INTO attendance_options (question_id, value, label, option_index)
VALUES
  ('2026-04-01-q5', 'in-person', 'In person', 0),
  ('2026-04-01-q5', 'online', 'Online', 1),
  ('2026-04-01-q5', 'maybe', 'Maybe', 2),
  ('2026-04-01-q5', 'cannot-attend', 'Cannot attend', 3);

-- Week 2 Questions
INSERT INTO questions (id, weekly_class_id, type, prompt, helper_text, correct_index, explanation, order_index)
VALUES
  ('2026-04-08-q1', '2026-04-08', 'multiple-choice', 'In Matthew 6, forgiveness is tied to which habit?', NULL, 1, 'In the Lord''s Prayer we ask the Father to forgive us as we forgive — the Church teaches this as a whole way of life, not a slogan.', 0),
  ('2026-04-08-q2', '2026-04-08', 'multiple-choice', 'In this week''s teaching, a "healed heart" chiefly means…', NULL, 1, 'The heart receives strength from Christ to imitate His mercy — not a denial of memory or emotions, but their transformation.', 1),
  ('2026-04-08-q3', '2026-04-08', 'reflection', 'Name someone toward whom you could practice mercy this week.', 'A single name or relationship is enough.', NULL, NULL, 2),
  ('2026-04-08-q4', '2026-04-08', 'short-answer', 'What questions do you still carry about forgiveness?', NULL, NULL, NULL, 3),
  ('2026-04-08-q5', '2026-04-08', 'attendance', 'Will you attend next Tuesday''s Timirit?', NULL, NULL, NULL, 4);

-- Week 2 Multiple Choice Options
INSERT INTO multiple_choice_options (question_id, option_text, option_index)
VALUES
  ('2026-04-08-q1', 'Pride', 0),
  ('2026-04-08-q1', 'Prayer', 1),
  ('2026-04-08-q1', 'Ignoring others', 2),
  ('2026-04-08-q1', 'Avoiding church', 3),
  
  ('2026-04-08-q2', 'Never remembering any sorrow', 0),
  ('2026-04-08-q2', 'Being strengthened by grace to show mercy like Christ', 1),
  ('2026-04-08-q2', 'Avoiding confession', 2),
  ('2026-04-08-q2', 'Trusting only private feelings', 3);

-- Week 2 Attendance Options
INSERT INTO attendance_options (question_id, value, label, option_index)
VALUES
  ('2026-04-08-q5', 'in-person', 'In person', 0),
  ('2026-04-08-q5', 'online', 'Online', 1),
  ('2026-04-08-q5', 'maybe', 'Maybe', 2),
  ('2026-04-08-q5', 'cannot-attend', 'Cannot attend', 3);

-- Week 3 Questions
INSERT INTO questions (id, weekly_class_id, type, prompt, helper_text, correct_index, explanation, order_index)
VALUES
  ('2026-04-15-q1', '2026-04-15', 'multiple-choice', 'According to tonight''s teaching, theosis means:', NULL, 2, 'Theosis is becoming like God by grace, not by nature — a gift that transforms us when we cooperate with divine love.', 0),
  ('2026-04-15-q2', '2026-04-15', 'multiple-choice', 'The Divine Liturgy helps with theosis by:', NULL, 0, 'The Liturgy isn''t entertainment but God''s workshop — Christ makes us partakers of His divine life through the Eucharist and liturgical prayer.', 1),
  ('2026-04-15-q3', '2026-04-15', 'reflection', 'How might you prepare your heart for next Sunday''s Liturgy?', 'One practical step this week.', NULL, NULL, 2),
  ('2026-04-15-q4', '2026-04-15', 'feedback-open', 'What was unclear about theosis or grace?', 'Help us clarify in future teachings.', NULL, NULL, 3),
  ('2026-04-15-q5', '2026-04-15', 'attendance', 'Next Tuesday participation:', NULL, NULL, NULL, 4);

-- Week 3 Multiple Choice Options
INSERT INTO multiple_choice_options (question_id, option_text, option_index)
VALUES
  ('2026-04-15-q1', 'Becoming God by nature', 0),
  ('2026-04-15-q1', 'Earning salvation through works', 1),
  ('2026-04-15-q1', 'Becoming like God by grace', 2),
  ('2026-04-15-q1', 'Avoiding all earthly concerns', 3),
  
  ('2026-04-15-q2', 'Giving us Christ''s divine life', 0),
  ('2026-04-15-q2', 'Providing entertainment', 1),
  ('2026-04-15-q2', 'Replacing personal prayer', 2),
  ('2026-04-15-q2', 'Avoiding the need for fasting', 3);

-- Week 3 Attendance Options
INSERT INTO attendance_options (question_id, value, label, option_index)
VALUES
  ('2026-04-15-q5', 'in-person', 'In person', 0),
  ('2026-04-15-q5', 'online', 'Online', 1),
  ('2026-04-15-q5', 'maybe', 'Maybe', 2),
  ('2026-04-15-q5', 'cannot-attend', 'Cannot attend', 3);

-- ============================================================================
-- MIGRATE UPCOMING TIMIRIT
-- ============================================================================

INSERT INTO upcoming_timirit (scheduled_date, topic_preview, note, is_active)
VALUES (
  '2026-04-22',
  'The Mother of God in the teaching of the Ethiopian Orthodox Tewahedo Church',
  'We will hear from the Divine Liturgy, the Synaxarium, and the Fathers on how the Theotokos is honored rightly in our Church.',
  true
);

-- Get the ID of the upcoming timirit we just inserted
INSERT INTO upcoming_mezmurs (upcoming_timirit_id, title, transliteration, lyrics, order_index)
SELECT 
  ut.id,
  'ወላዲተ አምላክ',
  'Waladite Amlak',
  'Lyrics to be confirmed with your mezmur leaders.',
  0
FROM upcoming_timirit ut WHERE ut.is_active = true
UNION ALL
SELECT 
  ut.id,
  'ዘድንግል ማርያም',
  'Ze-Dengel Mariyam',
  'Lyrics to be confirmed with your mezmur leaders.',
  1
FROM upcoming_timirit ut WHERE ut.is_active = true;

-- ============================================================================
-- SAMPLE USER RESPONSES (for testing analytics)
-- ============================================================================

-- Insert some sample responses to test the analytics functions
INSERT INTO user_responses (weekly_class_id, question_id, user_fingerprint, selected_option_index, response_text, attendance_choice)
VALUES
  -- Week 1 responses
  ('2026-04-01', '2026-04-01-q1', 'user1', 1, NULL, NULL),
  ('2026-04-01', '2026-04-01-q2', 'user1', 0, NULL, NULL), -- Wrong answer
  ('2026-04-01', '2026-04-01-q3', 'user1', NULL, 'With my family during dinner conversations', NULL),
  ('2026-04-01', '2026-04-01-q4', 'user1', NULL, 'How the shepherd image applies during liturgy', NULL),
  ('2026-04-01', '2026-04-01-q5', 'user1', NULL, NULL, 'in-person'),
  
  ('2026-04-01', '2026-04-01-q1', 'user2', 1, NULL, NULL),
  ('2026-04-01', '2026-04-01-q2', 'user2', 1, NULL, NULL), -- Correct answer
  ('2026-04-01', '2026-04-01-q3', 'user2', NULL, 'Being more patient with coworkers', NULL),
  ('2026-04-01', '2026-04-01-q5', 'user2', NULL, NULL, 'online'),
  
  -- Week 2 responses
  ('2026-04-08', '2026-04-08-q1', 'user1', 1, NULL, NULL),
  ('2026-04-08', '2026-04-08-q2', 'user1', 1, NULL, NULL),
  ('2026-04-08', '2026-04-08-q3', 'user1', NULL, 'My neighbor who plays loud music', NULL),
  ('2026-04-08', '2026-04-08-q4', 'user1', NULL, 'How to forgive when someone is not sorry', NULL),
  ('2026-04-08', '2026-04-08-q5', 'user1', NULL, NULL, 'in-person'),
  
  ('2026-04-08', '2026-04-08-q1', 'user3', 0, NULL, NULL), -- Wrong answer
  ('2026-04-08', '2026-04-08-q2', 'user3', 1, NULL, NULL),
  ('2026-04-08', '2026-04-08-q4', 'user3', NULL, 'The difference between forgiving and trusting again', NULL),
  ('2026-04-08', '2026-04-08-q5', 'user3', NULL, NULL, 'maybe');

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Uncomment to verify data was inserted correctly:

-- SELECT 'Weekly Classes:', COUNT(*) FROM weekly_classes;
-- SELECT 'Mezmurs:', COUNT(*) FROM mezmurs;
-- SELECT 'Questions:', COUNT(*) FROM questions;  
-- SELECT 'Multiple Choice Options:', COUNT(*) FROM multiple_choice_options;
-- SELECT 'Attendance Options:', COUNT(*) FROM attendance_options;
-- SELECT 'User Responses:', COUNT(*) FROM user_responses;
-- SELECT 'Upcoming Timirit:', COUNT(*) FROM upcoming_timirit;

-- Test analytics function:
-- SELECT * FROM get_organizer_analytics('2026-04-01');
-- SELECT * FROM get_attendance_summary('2026-04-01');

-- ============================================================================
-- OPTIONAL ANONYMOUS FEEDBACK TABLES
-- ============================================================================

-- These tables support the public anonymous feedback form. Create them before
-- deploying the anonymous-feedback Edge Function.

CREATE TABLE IF NOT EXISTS anonymous_feedback_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL CHECK (category IN (
    'Website feedback',
    'Teaching feedback',
    'Future topic suggestion',
    'General note'
  )),
  subject TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS anonymous_feedback_rate_limits (
  identifier_hash TEXT PRIMARY KEY,
  window_started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  submission_count INTEGER NOT NULL DEFAULT 0,
  blocked_until TIMESTAMP WITH TIME ZONE
);

ALTER TABLE anonymous_feedback_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE anonymous_feedback_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_anonymous_feedback_submissions_created_at
  ON anonymous_feedback_submissions(created_at DESC);

DROP POLICY IF EXISTS "Organizers can read anonymous feedback" ON anonymous_feedback_submissions;
CREATE POLICY "Organizers can read anonymous feedback" ON anonymous_feedback_submissions FOR SELECT USING (
  auth.role() = 'authenticated' AND
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_active = true)
);