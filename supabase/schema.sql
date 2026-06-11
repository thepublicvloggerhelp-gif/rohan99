-- ============================================================
-- YPSdudes – Complete Supabase Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- for text search

-- ─────────────────────────────────────────────────────────────
-- ENUMS
-- ─────────────────────────────────────────────────────────────

CREATE TYPE user_role   AS ENUM ('admin', 'student');
CREATE TYPE user_status AS ENUM ('pending', 'approved', 'banned', 'rejected');
CREATE TYPE stream_type AS ENUM ('JEE', 'NEET');
CREATE TYPE subject_type AS ENUM ('Physics', 'Chemistry', 'Mathematics', 'Biology');
CREATE TYPE note_type   AS ENUM ('pdf', 'image');
CREATE TYPE notif_type  AS ENUM ('announcement', 'test', 'admin', 'general');
CREATE TYPE option_type AS ENUM ('A', 'B', 'C', 'D');

-- ─────────────────────────────────────────────────────────────
-- PROFILES
-- ─────────────────────────────────────────────────────────────

CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL UNIQUE,
  username      TEXT NOT NULL UNIQUE,
  full_name     TEXT NOT NULL,
  avatar_url    TEXT,
  stream        stream_type NOT NULL,
  role          user_role   NOT NULL DEFAULT 'student',
  status        user_status NOT NULL DEFAULT 'approved',
  bio           TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT username_length CHECK (char_length(username) >= 3 AND char_length(username) <= 20),
  CONSTRAINT username_format CHECK (username ~ '^[a-zA-Z0-9_]+$')
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─────────────────────────────────────────────────────────────
-- CHANNELS
-- ─────────────────────────────────────────────────────────────

CREATE TABLE channels (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name             TEXT NOT NULL UNIQUE,
  description      TEXT,
  category         TEXT NOT NULL DEFAULT 'general',
  is_announcement  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default channels
INSERT INTO channels (name, description, category, is_announcement) VALUES
  ('general',          'General discussions',           'General',  FALSE),
  ('jee-discussion',   'JEE prep discussions',          'JEE',      FALSE),
  ('neet-discussion',  'NEET prep discussions',         'NEET',     FALSE),
  ('physics',          'Physics help and discussion',   'Subjects', FALSE),
  ('chemistry',        'Chemistry help and discussion', 'Subjects', FALSE),
  ('mathematics',      'Maths help and discussion',     'Subjects', FALSE),
  ('biology',          'Biology help and discussion',   'Subjects', FALSE),
  ('announcements',    'Important announcements',       'General',  TRUE);

-- ─────────────────────────────────────────────────────────────
-- MESSAGES
-- ─────────────────────────────────────────────────────────────

CREATE TABLE messages (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id    UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  sender_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content       TEXT NOT NULL CHECK (char_length(content) <= 2000),
  image_url     TEXT,
  reply_to_id   UUID REFERENCES messages(id) ON DELETE SET NULL,
  is_deleted    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER messages_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_messages_channel ON messages(channel_id, created_at DESC);
CREATE INDEX idx_messages_sender  ON messages(sender_id);

-- Full text search on messages
CREATE INDEX idx_messages_fts ON messages USING GIN(to_tsvector('english', content));

-- ─────────────────────────────────────────────────────────────
-- MESSAGE REACTIONS
-- ─────────────────────────────────────────────────────────────

CREATE TABLE message_reactions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id    UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  emoji         TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)
);

CREATE INDEX idx_reactions_message ON message_reactions(message_id);

-- ─────────────────────────────────────────────────────────────
-- PINNED MESSAGES
-- ─────────────────────────────────────────────────────────────

CREATE TABLE pinned_messages (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id    UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  message_id    UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  pinned_by     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(channel_id, message_id)
);

-- ─────────────────────────────────────────────────────────────
-- DIRECT MESSAGES
-- ─────────────────────────────────────────────────────────────

CREATE TABLE dm_conversations (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE dm_participants (
  conversation_id  UUID NOT NULL REFERENCES dm_conversations(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE direct_messages (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id  UUID NOT NULL REFERENCES dm_conversations(id) ON DELETE CASCADE,
  sender_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content          TEXT NOT NULL CHECK (char_length(content) <= 2000),
  image_url        TEXT,
  is_deleted       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_dm_conversation ON direct_messages(conversation_id, created_at DESC);

-- Helper: find or create DM conversation between two users
CREATE OR REPLACE FUNCTION get_or_create_dm(user_a UUID, user_b UUID)
RETURNS UUID AS $$
DECLARE
  conv_id UUID;
BEGIN
  SELECT dmp1.conversation_id INTO conv_id
  FROM dm_participants dmp1
  JOIN dm_participants dmp2 ON dmp1.conversation_id = dmp2.conversation_id
  WHERE dmp1.user_id = user_a AND dmp2.user_id = user_b
  LIMIT 1;

  IF conv_id IS NULL THEN
    INSERT INTO dm_conversations DEFAULT VALUES RETURNING id INTO conv_id;
    INSERT INTO dm_participants(conversation_id, user_id) VALUES (conv_id, user_a), (conv_id, user_b);
  END IF;

  RETURN conv_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────
-- TESTS
-- ─────────────────────────────────────────────────────────────

CREATE TABLE tests (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title             TEXT NOT NULL,
  description       TEXT,
  subject           subject_type NOT NULL,
  stream            stream_type  NOT NULL,
  chapter           TEXT NOT NULL,
  duration_minutes  INTEGER NOT NULL DEFAULT 30 CHECK (duration_minutes > 0),
  total_marks       INTEGER NOT NULL DEFAULT 0,
  is_published      BOOLEAN NOT NULL DEFAULT FALSE,
  created_by        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER tests_updated_at
  BEFORE UPDATE ON tests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_tests_stream_subject ON tests(stream, subject, is_published);

-- ─────────────────────────────────────────────────────────────
-- QUESTIONS
-- ─────────────────────────────────────────────────────────────

CREATE TABLE questions (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_id          UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  question_text    TEXT NOT NULL,
  option_a         TEXT NOT NULL,
  option_b         TEXT NOT NULL,
  option_c         TEXT NOT NULL,
  option_d         TEXT NOT NULL,
  correct_option   option_type NOT NULL,
  marks            INTEGER NOT NULL DEFAULT 4,
  explanation      TEXT,
  order_index      INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_questions_test ON questions(test_id, order_index);

-- Auto-update total_marks when questions change
CREATE OR REPLACE FUNCTION sync_test_marks()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE tests SET total_marks = (
    SELECT COALESCE(SUM(marks), 0) FROM questions WHERE test_id = COALESCE(NEW.test_id, OLD.test_id)
  ) WHERE id = COALESCE(NEW.test_id, OLD.test_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER questions_sync_marks
  AFTER INSERT OR UPDATE OR DELETE ON questions
  FOR EACH ROW EXECUTE FUNCTION sync_test_marks();

-- ─────────────────────────────────────────────────────────────
-- TEST ATTEMPTS
-- ─────────────────────────────────────────────────────────────

CREATE TABLE test_attempts (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_id        UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  user_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  score          INTEGER NOT NULL DEFAULT 0,
  total_marks    INTEGER NOT NULL DEFAULT 0,
  accuracy       NUMERIC(5,2) NOT NULL DEFAULT 0,
  time_taken     INTEGER NOT NULL DEFAULT 0, -- seconds
  completed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_attempts_user ON test_attempts(user_id, completed_at DESC);
CREATE INDEX idx_attempts_test ON test_attempts(test_id);

CREATE TABLE attempt_answers (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attempt_id       UUID NOT NULL REFERENCES test_attempts(id) ON DELETE CASCADE,
  question_id      UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  selected_option  option_type,
  is_correct       BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_answers_attempt ON attempt_answers(attempt_id);

-- ─────────────────────────────────────────────────────────────
-- NOTES
-- ─────────────────────────────────────────────────────────────

CREATE TABLE notes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title           TEXT NOT NULL,
  description     TEXT,
  subject         subject_type NOT NULL,
  file_url        TEXT NOT NULL,
  file_type       note_type NOT NULL,
  file_size       BIGINT NOT NULL DEFAULT 0,
  uploaded_by     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  download_count  INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notes_subject ON notes(subject, created_at DESC);

-- ─────────────────────────────────────────────────────────────
-- NOTIFICATIONS
-- ─────────────────────────────────────────────────────────────

CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  type        notif_type NOT NULL DEFAULT 'general',
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  link        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, created_at DESC);

-- ─────────────────────────────────────────────────────────────
-- LEADERBOARD VIEW
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW leaderboard AS
SELECT
  p.id          AS user_id,
  p.username,
  p.full_name,
  p.avatar_url,
  p.stream,
  COALESCE(SUM(ta.score), 0)                             AS total_score,
  COALESCE(AVG(ta.accuracy), 0)                          AS avg_accuracy,
  COUNT(ta.id)                                           AS attempts_count,
  RANK() OVER (ORDER BY COALESCE(SUM(ta.score), 0) DESC) AS rank
FROM profiles p
LEFT JOIN test_attempts ta ON ta.user_id = p.id
WHERE p.status = 'approved' AND p.role = 'student'
GROUP BY p.id, p.username, p.full_name, p.avatar_url, p.stream;

-- ─────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────

ALTER TABLE profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels          ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages          ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pinned_messages   ENABLE ROW LEVEL SECURITY;
ALTER TABLE dm_conversations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE dm_participants   ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_messages   ENABLE ROW LEVEL SECURITY;
ALTER TABLE tests             ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_attempts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempt_answers   ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes             ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications     ENABLE ROW LEVEL SECURITY;

-- Helper: is current user admin?
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin' AND status = 'approved'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper: is current user approved?
CREATE OR REPLACE FUNCTION is_approved()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND status = 'approved'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper: is current user a participant in the given DM conversation?
CREATE OR REPLACE FUNCTION is_dm_participant(conv_id UUID, u_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM dm_participants
    WHERE conversation_id = conv_id AND user_id = u_id
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- ── PROFILES ──
CREATE POLICY "profiles_read_all"   ON profiles FOR SELECT USING (is_approved() OR id = auth.uid());
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (id = auth.uid() OR is_admin());
CREATE POLICY "profiles_delete_admin" ON profiles FOR DELETE USING (is_admin());

-- ── CHANNELS ──
CREATE POLICY "channels_read"   ON channels FOR SELECT USING (is_approved());
CREATE POLICY "channels_admin"  ON channels FOR ALL    USING (is_admin());

-- ── MESSAGES ──
CREATE POLICY "messages_read"   ON messages FOR SELECT USING (is_approved());
CREATE POLICY "messages_insert" ON messages FOR INSERT WITH CHECK (is_approved() AND sender_id = auth.uid());
CREATE POLICY "messages_delete" ON messages FOR DELETE USING (sender_id = auth.uid() OR is_admin());
CREATE POLICY "messages_update" ON messages FOR UPDATE USING (sender_id = auth.uid() OR is_admin());

-- ── REACTIONS ──
CREATE POLICY "reactions_read"   ON message_reactions FOR SELECT USING (is_approved());
CREATE POLICY "reactions_insert" ON message_reactions FOR INSERT WITH CHECK (is_approved() AND user_id = auth.uid());
CREATE POLICY "reactions_delete" ON message_reactions FOR DELETE USING (user_id = auth.uid() OR is_admin());

-- ── PINNED MESSAGES ──
CREATE POLICY "pinned_read"  ON pinned_messages FOR SELECT USING (is_approved());
CREATE POLICY "pinned_admin" ON pinned_messages FOR ALL    USING (is_admin());

-- ── DM ──
CREATE POLICY "dm_conv_select" ON dm_conversations FOR SELECT USING (
  is_dm_participant(id, auth.uid())
);
CREATE POLICY "dm_conv_insert" ON dm_conversations FOR INSERT WITH CHECK (is_approved());

CREATE POLICY "dm_part_select" ON dm_participants FOR SELECT USING (
  is_dm_participant(conversation_id, auth.uid())
);
CREATE POLICY "dm_part_insert" ON dm_participants FOR INSERT WITH CHECK (is_approved());

CREATE POLICY "dm_msg_select" ON direct_messages FOR SELECT USING (
  is_dm_participant(conversation_id, auth.uid())
);
CREATE POLICY "dm_msg_insert" ON direct_messages FOR INSERT WITH CHECK (
  is_approved() AND sender_id = auth.uid() AND
  is_dm_participant(conversation_id, auth.uid())
);
CREATE POLICY "dm_msg_delete" ON direct_messages FOR DELETE USING (sender_id = auth.uid() OR is_admin());

-- ── TESTS ──
CREATE POLICY "tests_read_published" ON tests FOR SELECT USING (is_approved() AND (is_published OR is_admin()));
CREATE POLICY "tests_admin"          ON tests FOR ALL    USING (is_admin());

-- ── QUESTIONS ──
CREATE POLICY "questions_read" ON questions FOR SELECT USING (
  is_approved() AND EXISTS (SELECT 1 FROM tests WHERE id = questions.test_id AND is_published)
  OR is_admin()
);
CREATE POLICY "questions_admin" ON questions FOR ALL USING (is_admin());

-- ── TEST ATTEMPTS ──
CREATE POLICY "attempts_own"  ON test_attempts FOR SELECT USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "attempts_insert" ON test_attempts FOR INSERT WITH CHECK (is_approved() AND user_id = auth.uid());

-- ── ATTEMPT ANSWERS ──
CREATE POLICY "answers_own" ON attempt_answers FOR SELECT USING (
  EXISTS (SELECT 1 FROM test_attempts WHERE id = attempt_answers.attempt_id AND (user_id = auth.uid() OR is_admin()))
);
CREATE POLICY "answers_insert" ON attempt_answers FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM test_attempts WHERE id = attempt_answers.attempt_id AND user_id = auth.uid())
);

-- ── NOTES ──
CREATE POLICY "notes_read"   ON notes FOR SELECT USING (is_approved());
CREATE POLICY "notes_insert" ON notes FOR INSERT WITH CHECK (is_approved() AND uploaded_by = auth.uid());
CREATE POLICY "notes_delete" ON notes FOR DELETE USING (uploaded_by = auth.uid() OR is_admin());

-- ── NOTIFICATIONS ──
CREATE POLICY "notif_own"    ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "notif_update" ON notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "notif_admin"  ON notifications FOR ALL    USING (is_admin());

-- ─────────────────────────────────────────────────────────────
-- REALTIME
-- ─────────────────────────────────────────────────────────────

ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE message_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE direct_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- ─────────────────────────────────────────────────────────────
-- STORAGE BUCKETS
-- ─────────────────────────────────────────────────────────────

-- Run these in Supabase Dashboard > Storage or via API:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('chat-images', 'chat-images', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('notes', 'notes', true);

-- Storage RLS (paste in Storage > Policies):
-- avatars: Anyone can read; authenticated users can upload own files
-- chat-images: Approved users can read/upload
-- notes: Approved users can read/upload; owners/admins can delete

-- ─────────────────────────────────────────────────────────────
-- AUTH SIGNUP TRIGGER (AUTOMATIC PROFILE CREATION)
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, full_name, stream, avatar_url, role, status)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    COALESCE((new.raw_user_meta_data->>'stream')::public.stream_type, 'JEE'::public.stream_type),
    new.raw_user_meta_data->>'avatar_url',
    'student',
    'approved'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
