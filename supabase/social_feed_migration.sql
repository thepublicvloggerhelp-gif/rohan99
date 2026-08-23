-- ═══════════════════════════════════════════════════════════════════
-- SOCIAL FEED — Supabase SQL Migration
-- Run this in your Supabase SQL editor (Dashboard → SQL Editor → New query)
-- ═══════════════════════════════════════════════════════════════════

-- ── 1. TABLES ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS posts (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content     TEXT NOT NULL DEFAULT '',
  image_url   TEXT,
  mood        TEXT,
  is_deleted  BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at  TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT posts_not_empty CHECK (length(trim(content)) > 0 OR image_url IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS post_likes (
  post_id     UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);

CREATE TABLE IF NOT EXISTS post_comments (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id     UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT post_comments_not_empty CHECK (length(trim(content)) > 0)
);

CREATE INDEX IF NOT EXISTS posts_created_at_idx        ON posts (created_at DESC);
CREATE INDEX IF NOT EXISTS posts_author_idx            ON posts (author_id);
CREATE INDEX IF NOT EXISTS post_likes_post_idx         ON post_likes (post_id);
CREATE INDEX IF NOT EXISTS post_comments_post_idx      ON post_comments (post_id, created_at);

-- ── 2. ROW LEVEL SECURITY ─────────────────────────────────────────────────────

ALTER TABLE posts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

-- posts
DROP POLICY IF EXISTS "Authenticated users can read posts" ON posts;
CREATE POLICY "Authenticated users can read posts"
  ON posts FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can create their own posts" ON posts;
CREATE POLICY "Users can create their own posts"
  ON posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Authors can update their own posts" ON posts;
CREATE POLICY "Authors can update their own posts"
  ON posts FOR UPDATE TO authenticated
  USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Authors and admins can delete posts" ON posts;
CREATE POLICY "Authors and admins can delete posts"
  ON posts FOR DELETE TO authenticated
  USING (
    auth.uid() = author_id
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- post_likes
DROP POLICY IF EXISTS "Authenticated users can read post_likes" ON post_likes;
CREATE POLICY "Authenticated users can read post_likes"
  ON post_likes FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can like posts" ON post_likes;
CREATE POLICY "Users can like posts"
  ON post_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove their own like" ON post_likes;
CREATE POLICY "Users can remove their own like"
  ON post_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- post_comments
DROP POLICY IF EXISTS "Authenticated users can read post_comments" ON post_comments;
CREATE POLICY "Authenticated users can read post_comments"
  ON post_comments FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can comment on posts" ON post_comments;
CREATE POLICY "Users can comment on posts"
  ON post_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Comment authors and admins can delete comments" ON post_comments;
CREATE POLICY "Comment authors and admins can delete comments"
  ON post_comments FOR DELETE TO authenticated
  USING (
    auth.uid() = author_id
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- ── 3. REALTIME ──────────────────────────────────────────────────────────────
-- Feed updates (new posts, likes, comments) stream to every open client.

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE posts;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE post_likes;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE post_comments;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- ── 4. STORAGE BUCKET ────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public)
VALUES ('posts', 'posts', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Authenticated users can upload post images" ON storage.objects;
CREATE POLICY "Authenticated users can upload post images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'posts');

DROP POLICY IF EXISTS "Public read access for post images" ON storage.objects;
CREATE POLICY "Public read access for post images"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'posts');

DROP POLICY IF EXISTS "Users can delete their own post images" ON storage.objects;
CREATE POLICY "Users can delete their own post images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'posts' AND auth.uid()::text = (storage.foldername(name))[1]);
