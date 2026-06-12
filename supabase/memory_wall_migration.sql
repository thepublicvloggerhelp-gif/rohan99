-- ═══════════════════════════════════════════════════════════════════
-- MEMORY WALL — Supabase SQL Migration
-- Run this in your Supabase SQL editor (Dashboard → SQL Editor → New query)
-- ═══════════════════════════════════════════════════════════════════

-- ── 1. TABLES ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS memories (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  photo_url    TEXT NOT NULL,
  caption      TEXT,
  uploaded_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  taken_at     DATE,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS memory_tags (
  memory_id  UUID REFERENCES memories(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (memory_id, user_id)
);

CREATE TABLE IF NOT EXISTS memory_reactions (
  memory_id  UUID REFERENCES memories(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  emoji      TEXT NOT NULL,
  PRIMARY KEY (memory_id, user_id)
);

-- ── 2. ROW LEVEL SECURITY ─────────────────────────────────────────────────────

ALTER TABLE memories         ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_tags      ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_reactions ENABLE ROW LEVEL SECURITY;

-- memories: authenticated users can read all
CREATE POLICY "Authenticated users can read memories"
  ON memories FOR SELECT
  TO authenticated
  USING (true);

-- memories: authenticated users can insert their own
CREATE POLICY "Authenticated users can insert memories"
  ON memories FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = uploaded_by);

-- memories: only the uploader can delete their own
CREATE POLICY "Uploader can delete their own memory"
  ON memories FOR DELETE
  TO authenticated
  USING (auth.uid() = uploaded_by);

-- memory_tags: authenticated users can read all
CREATE POLICY "Authenticated users can read memory_tags"
  ON memory_tags FOR SELECT
  TO authenticated
  USING (true);

-- memory_tags: authenticated users can insert tags
CREATE POLICY "Authenticated users can insert memory_tags"
  ON memory_tags FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- memory_tags: uploader can delete tags (via cascade from memories delete)
CREATE POLICY "Authenticated users can delete their own tags"
  ON memory_tags FOR DELETE
  TO authenticated
  USING (true);

-- memory_reactions: authenticated users can read all
CREATE POLICY "Authenticated users can read memory_reactions"
  ON memory_reactions FOR SELECT
  TO authenticated
  USING (true);

-- memory_reactions: authenticated users can insert/upsert reactions
CREATE POLICY "Authenticated users can insert memory_reactions"
  ON memory_reactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- memory_reactions: users can delete their own reaction
CREATE POLICY "Users can delete their own reaction"
  ON memory_reactions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ── 3. STORAGE BUCKET ────────────────────────────────────────────────────────
-- After running the SQL above, go to:
--   Supabase Dashboard → Storage → New Bucket
--   Name: memories
--   Public: YES (toggle on)
--   Then add the policy below:

-- Storage RLS for memories bucket (run in SQL editor after creating bucket):
INSERT INTO storage.buckets (id, name, public)
VALUES ('memories', 'memories', true)
ON CONFLICT (id) DO UPDATE SET public = true;

CREATE POLICY "Authenticated users can upload memories"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'memories');

CREATE POLICY "Public read access for memories"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'memories');

CREATE POLICY "Users can delete their own memory photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'memories' AND auth.uid()::text = (storage.foldername(name))[1]);
