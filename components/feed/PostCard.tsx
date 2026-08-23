'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Heart, Loader2, MessageCircle, MoreHorizontal, Send, Trash2 } from 'lucide-react'
import { Post, PostComment, Profile } from '@/types'
import {
  MAX_COMMENT_LENGTH, addComment, deleteComment, deletePost,
  hasLiked, likeCount, moodMeta, sortedComments, toggleLike,
} from '@/lib/feed'
import { usePresence } from '@/lib/presence'
import { cn, formatRelativeTime, getInitials } from '@/lib/utils'
import { toast } from 'sonner'

interface Props {
  post: Post
  currentUser: Profile
  onChange: (post: Post) => void
  onDeleted: (postId: string) => void
}

function Avatar({ url, name, size = 40 }: { url?: string | null; name: string; size?: number }) {
  return (
    <div
      className="rounded-xl overflow-hidden flex-shrink-0 bg-blue-600/20 flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {url ? (
        <Image src={url} alt={name} width={size} height={size} className="object-cover w-full h-full" />
      ) : (
        <span className="font-black text-blue-400" style={{ fontSize: size / 2.9 }}>{getInitials(name)}</span>
      )}
    </div>
  )
}

export function PostCard({ post, currentUser, onChange, onDeleted }: Props) {
  const { presenceMap } = usePresence()
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [draft, setDraft]     = useState('')
  const [sending, setSending] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const author   = post.author
  const liked    = hasLiked(post, currentUser.id)
  const likes    = likeCount(post)
  const comments = useMemo(() => sortedComments(post), [post])
  const mood     = moodMeta(post.mood)
  const canDelete = post.author_id === currentUser.id || currentUser.role === 'admin'
  const authorStatus = author ? presenceMap[author.id]?.status : undefined

  const toggleLikeOptimistic = async () => {
    const next = liked
      ? (post.likes ?? []).filter(l => l.user_id !== currentUser.id)
      : [...(post.likes ?? []), { post_id: post.id, user_id: currentUser.id }]

    onChange({ ...post, likes: next })

    try {
      await toggleLike(post.id, currentUser.id, liked)
    } catch (err: any) {
      onChange(post) // revert
      toast.error(err.message ?? 'Could not update your like')
    }
  }

  const submitComment = async () => {
    const text = draft.trim()
    if (!text || sending) return
    setSending(true)
    try {
      const comment = await addComment(post.id, currentUser.id, text)
      onChange({ ...post, comments: [...(post.comments ?? []), comment] })
      setDraft('')
    } catch (err: any) {
      toast.error(err.message ?? 'Could not post your comment')
    } finally {
      setSending(false)
    }
  }

  const removeComment = async (comment: PostComment) => {
    onChange({ ...post, comments: (post.comments ?? []).filter(c => c.id !== comment.id) })
    try {
      await deleteComment(comment.id)
    } catch (err: any) {
      toast.error(err.message ?? 'Could not delete the comment')
    }
  }

  const removePost = async () => {
    if (!confirm('Delete this post? This cannot be undone.')) return
    onDeleted(post.id)
    try {
      await deletePost(post.id)
      toast.success('Post deleted')
    } catch (err: any) {
      toast.error(err.message ?? 'Could not delete the post')
    }
  }

  return (
    <article id={`post-${post.id}`} className="glass-card rounded-2xl overflow-hidden">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 pt-4">
        <div className="relative">
          <Avatar url={author?.avatar_url} name={author?.full_name || author?.username || '?'} />
          {authorStatus && (
            <span className={cn('status-dot absolute -bottom-0.5 -right-0.5 w-3 h-3', authorStatus)} />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={`/profile/${post.author_id}`}
              className="text-sm font-bold text-slate-100 hover:text-blue-400 transition-colors truncate"
            >
              {author?.full_name || author?.username || 'Someone'}
            </Link>
            {author?.role === 'admin' && <span className="badge-admin">Admin</span>}
            {mood && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400">
                <span>{mood.emoji}</span> feeling {mood.label.toLowerCase()}
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 font-semibold">
            @{author?.username ?? 'unknown'} · {formatRelativeTime(post.created_at)}
          </p>
        </div>

        {canDelete && (
          <div className="relative flex-shrink-0">
            <button
              id={`post-menu-${post.id}`}
              onClick={() => setMenuOpen(v => !v)}
              className="btn-ghost px-2 py-1.5"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            {menuOpen && (
              <div
                className="absolute right-0 top-full mt-1 z-20 w-40 p-1 rounded-xl border border-white/[0.08] shadow-2xl"
                style={{ background: 'var(--bg-elevated)' }}
              >
                <button
                  id={`delete-post-${post.id}`}
                  onClick={() => { setMenuOpen(false); removePost() }}
                  className="flex items-center gap-2 w-full px-2.5 py-2 rounded-lg text-sm font-semibold text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete post
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Body */}
      {post.content && (
        <p className="px-4 pt-3 text-[15px] leading-relaxed text-slate-200 whitespace-pre-wrap break-words">
          {post.content}
        </p>
      )}

      {post.image_url && (
        <div className="mt-3 border-y border-white/[0.05] bg-black/30">
          <img src={post.image_url} alt="Post" loading="lazy" className="w-full max-h-[560px] object-contain" />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 px-3 py-2.5">
        <button
          id={`like-post-${post.id}`}
          onClick={toggleLikeOptimistic}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold transition-all duration-150 active:scale-95',
            liked ? 'text-red-400 bg-red-500/10' : 'text-slate-400 hover:text-red-400 hover:bg-red-500/10'
          )}
        >
          <Heart className={cn('w-[18px] h-[18px] transition-transform', liked && 'fill-red-500 text-red-500 like-pop')} />
          {likes > 0 && <span className="tabular-nums">{likes}</span>}
        </button>

        <button
          id={`comments-post-${post.id}`}
          onClick={() => setCommentsOpen(v => !v)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold transition-all duration-150 active:scale-95',
            commentsOpen ? 'text-blue-400 bg-blue-500/10' : 'text-slate-400 hover:text-blue-400 hover:bg-blue-500/10'
          )}
        >
          <MessageCircle className="w-[18px] h-[18px]" />
          {comments.length > 0 && <span className="tabular-nums">{comments.length}</span>}
        </button>
      </div>

      {/* Comments */}
      {commentsOpen && (
        <div className="border-t border-white/[0.06] px-4 py-3 space-y-3">
          {comments.length === 0 && (
            <p className="text-xs text-slate-500 font-semibold">No comments yet — be the first.</p>
          )}

          {comments.map(comment => (
            <div key={comment.id} className="flex gap-2.5 group">
              <Avatar url={comment.author?.avatar_url} name={comment.author?.full_name || comment.author?.username || '?'} size={28} />
              <div className="min-w-0 flex-1">
                <div className="rounded-xl px-3 py-2 bg-white/[0.04] border border-white/[0.06]">
                  <p className="text-[11px] font-bold text-slate-400">
                    @{comment.author?.username ?? 'unknown'}
                    <span className="text-slate-600 font-semibold"> · {formatRelativeTime(comment.created_at)}</span>
                  </p>
                  <p className="text-sm text-slate-200 whitespace-pre-wrap break-words">{comment.content}</p>
                </div>
              </div>
              {(comment.author_id === currentUser.id || currentUser.role === 'admin') && (
                <button
                  onClick={() => removeComment(comment)}
                  className="msg-action self-start"
                  title="Delete comment"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}

          {/* Composer */}
          <div className="flex gap-2.5 items-center pt-1">
            <Avatar url={currentUser.avatar_url} name={currentUser.full_name || currentUser.username} size={28} />
            <input
              id={`comment-input-${post.id}`}
              value={draft}
              onChange={e => setDraft(e.target.value.slice(0, MAX_COMMENT_LENGTH))}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitComment() } }}
              placeholder="Write a comment…"
              className="input-base py-2 text-sm flex-1"
            />
            <button
              id={`comment-send-${post.id}`}
              onClick={submitComment}
              disabled={!draft.trim() || sending}
              className="btn-primary px-3 py-2"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}
    </article>
  )
}
