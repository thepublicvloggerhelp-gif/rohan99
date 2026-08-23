import { createClient } from '@/lib/supabase/client'
import { Post, PostComment } from '@/types'

export const FEED_PAGE_SIZE = 20

export const MOODS = [
  { value: 'chilling',  label: 'Chilling',   emoji: '😎' },
  { value: 'grinding',  label: 'Grinding',   emoji: '📚' },
  { value: 'hyped',     label: 'Hyped',      emoji: '🔥' },
  { value: 'sleepy',    label: 'Sleepy',     emoji: '😴' },
  { value: 'hungry',    label: 'Hungry',     emoji: '🍕' },
  { value: 'bored',     label: 'Bored',      emoji: '🥲' },
] as const

export type MoodValue = typeof MOODS[number]['value']

export function moodMeta(mood: string | null) {
  if (!mood) return null
  return MOODS.find(m => m.value === mood) ?? null
}

const AUTHOR_FIELDS = 'id, username, full_name, avatar_url, stream, role'

export const POST_SELECT = `
  *,
  author:profiles!author_id(${AUTHOR_FIELDS}),
  likes:post_likes(post_id, user_id),
  comments:post_comments(id, post_id, author_id, content, created_at, author:profiles!author_id(${AUTHOR_FIELDS}))
`

export const MAX_POST_LENGTH    = 1000
export const MAX_COMMENT_LENGTH = 500

/** Number of likes on a post, tolerating a missing join. */
export function likeCount(post: Post): number {
  return post.likes?.length ?? 0
}

/** Whether the given user has liked the post. */
export function hasLiked(post: Post, userId: string): boolean {
  return (post.likes ?? []).some(l => l.user_id === userId)
}

/** Comments sorted oldest → newest, tolerating a missing join. */
export function sortedComments(post: Post): PostComment[] {
  return [...(post.comments ?? [])].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )
}

/** A post is publishable when it has text or an image. */
export function canPublish(content: string, imageUrl: string | null): boolean {
  return content.trim().length > 0 || !!imageUrl
}

/** Fetches the newest posts with authors, likes and comments joined. */
export async function fetchFeed(limit: number = FEED_PAGE_SIZE, before?: string): Promise<Post[]> {
  const supabase = createClient()
  let query = supabase
    .from('posts')
    .select(POST_SELECT)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (before) query = query.lt('created_at', before)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as Post[]
}

/** Fetches a single post with its joins — used to hydrate realtime inserts. */
export async function fetchPost(postId: string): Promise<Post | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('posts')
    .select(POST_SELECT)
    .eq('id', postId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return (data as unknown as Post) ?? null
}

/** Creates a post and returns it with joins populated. */
export async function createPost(input: {
  authorId: string
  content: string
  imageUrl?: string | null
  mood?: string | null
}): Promise<Post> {
  const content = input.content.trim().slice(0, MAX_POST_LENGTH)
  const imageUrl = input.imageUrl ?? null

  if (!canPublish(content, imageUrl)) {
    throw new Error('Write something or add a photo first')
  }

  const supabase = createClient()
  const { data, error } = await supabase
    .from('posts')
    .insert({
      author_id: input.authorId,
      content,
      image_url: imageUrl,
      mood:      input.mood ?? null,
    })
    .select(POST_SELECT)
    .single()

  if (error) throw new Error(error.message)
  return data as unknown as Post
}

/** Adds or removes the current user's like. Returns the resulting like state. */
export async function toggleLike(postId: string, userId: string, liked: boolean): Promise<boolean> {
  const supabase = createClient()

  if (liked) {
    const { error } = await supabase
      .from('post_likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId)
    if (error) throw new Error(error.message)
    return false
  }

  const { error } = await supabase
    .from('post_likes')
    .upsert({ post_id: postId, user_id: userId }, { onConflict: 'post_id,user_id' })
  if (error) throw new Error(error.message)
  return true
}

/** Adds a comment and returns it with its author joined. */
export async function addComment(postId: string, authorId: string, content: string): Promise<PostComment> {
  const trimmed = content.trim().slice(0, MAX_COMMENT_LENGTH)
  if (!trimmed) throw new Error('Comment cannot be empty')

  const supabase = createClient()
  const { data, error } = await supabase
    .from('post_comments')
    .insert({ post_id: postId, author_id: authorId, content: trimmed })
    .select(`id, post_id, author_id, content, created_at, author:profiles!author_id(${AUTHOR_FIELDS})`)
    .single()

  if (error) throw new Error(error.message)
  return data as unknown as PostComment
}

export async function deletePost(postId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('posts').delete().eq('id', postId)
  if (error) throw new Error(error.message)
}

export async function deleteComment(commentId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('post_comments').delete().eq('id', commentId)
  if (error) throw new Error(error.message)
}

/** Uploads a post image through the secure server route and returns its public URL. */
export async function uploadPostImage(file: File, userId: string): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('bucket', 'posts')
  formData.append('path', `${userId}/${Date.now()}-${file.name}`)

  const res  = await fetch('/api/upload', { method: 'POST', body: formData })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? 'Upload failed')
  return json.publicUrl as string
}
