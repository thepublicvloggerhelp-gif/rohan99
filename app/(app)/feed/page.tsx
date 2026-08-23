'use client'

import { useContext, useEffect, useState } from 'react'
import { Loader2, Sparkles, Users, Zap } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Post } from '@/types'
import { AppCtx } from '@/lib/context'
import { usePresence } from '@/lib/presence'
import { FEED_PAGE_SIZE, fetchFeed, fetchPost } from '@/lib/feed'
import { PostComposer } from '@/components/feed/PostComposer'
import { PostCard } from '@/components/feed/PostCard'
import { getInitials } from '@/lib/utils'

export default function FeedPage() {
  const { profile } = useContext(AppCtx)
  const { presenceMap } = usePresence()

  const [posts, setPosts]       = useState<Post[]>([])
  const [loading, setLoading]   = useState(true)
  const [loadingMore, setMore]  = useState(false)
  const [hasMore, setHasMore]   = useState(true)
  const [error, setError]       = useState<string | null>(null)

  // ── Initial load ───────────────────────────────────────────────────────────
  useEffect(() => {
    fetchFeed()
      .then(rows => {
        setPosts(rows)
        setHasMore(rows.length === FEED_PAGE_SIZE)
      })
      .catch(err => setError(err.message ?? 'Could not load the feed'))
      .finally(() => setLoading(false))
  }, [])

  // ── Realtime: new posts, likes and comments from everyone else ─────────────
  useEffect(() => {
    if (!profile) return
    const supabase = createClient()

    const refreshPost = async (postId: string) => {
      try {
        const fresh = await fetchPost(postId)
        if (!fresh) return
        setPosts(prev => prev.map(p => (p.id === postId ? fresh : p)))
      } catch {
        /* transient fetch failures shouldn't break the feed */
      }
    }

    const channel = supabase
      .channel('feed:posts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, async ({ new: row }: any) => {
        if (row.author_id === profile.id) return // already added optimistically
        const fresh = await fetchPost(row.id)
        if (fresh) setPosts(prev => (prev.some(p => p.id === fresh.id) ? prev : [fresh, ...prev]))
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'posts' }, ({ old: row }: any) => {
        setPosts(prev => prev.filter(p => p.id !== row.id))
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'post_likes' }, ({ new: row, old: prevRow }: any) => {
        const postId = row?.post_id ?? prevRow?.post_id
        if (postId) refreshPost(postId)
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'post_comments' }, ({ new: row, old: prevRow }: any) => {
        const postId = row?.post_id ?? prevRow?.post_id
        if (postId) refreshPost(postId)
      })
      .subscribe()

    return () => { channel.unsubscribe() }
  }, [profile?.id])

  const loadMore = async () => {
    const oldest = posts[posts.length - 1]
    if (!oldest || loadingMore) return
    setMore(true)
    try {
      const rows = await fetchFeed(FEED_PAGE_SIZE, oldest.created_at)
      setPosts(prev => [...prev, ...rows.filter(r => !prev.some(p => p.id === r.id))])
      setHasMore(rows.length === FEED_PAGE_SIZE)
    } catch (err: any) {
      setError(err.message ?? 'Could not load more posts')
    } finally {
      setMore(false)
    }
  }

  const onlineFriends = Object.values(presenceMap).filter(p => p.user.id !== profile?.id)

  return (
    <div className="h-full overflow-y-auto scroll-area">
      <div className="max-w-[720px] mx-auto px-4 sm:px-6 py-6 pb-24 lg:pb-10">

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-100 tracking-tight uppercase">The Feed</h1>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
              {loading ? 'Loading…' : `${posts.length} post${posts.length === 1 ? '' : 's'} from the squad`}
            </p>
          </div>
        </div>

        {/* Who's around */}
        {onlineFriends.length > 0 && (
          <div className="glass-card rounded-2xl px-4 py-3 mb-5 flex items-center gap-3">
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <Users className="w-4 h-4 text-emerald-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Around now</span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              {onlineFriends.slice(0, 12).map(({ user, status }) => (
                <div key={user.id} className="relative flex-shrink-0" title={`${user.username} · ${status}`}>
                  <div className="w-8 h-8 rounded-xl overflow-hidden bg-blue-600/20 flex items-center justify-center">
                    {user.avatar_url
                      ? <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
                      : <span className="text-[11px] font-black text-blue-400">{getInitials(user.full_name || user.username)}</span>}
                  </div>
                  <span className={`status-dot absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 ${status}`} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Composer */}
        {profile && (
          <div className="mb-5">
            <PostComposer
              currentUser={profile}
              onPosted={post => setPosts(prev => [post, ...prev])}
            />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="glass-card rounded-2xl p-4 mb-5 border-red-500/30 text-sm text-red-300 font-semibold">
            {error}
          </div>
        )}

        {/* Posts */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="glass-card rounded-2xl p-4">
                <div className="flex gap-3 items-center">
                  <div className="w-10 h-10 rounded-xl shimmer bg-white/[0.04]" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-28 rounded shimmer bg-white/[0.04]" />
                    <div className="h-2.5 w-20 rounded shimmer bg-white/[0.04]" />
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="h-3 w-full rounded shimmer bg-white/[0.04]" />
                  <div className="h-3 w-4/5 rounded shimmer bg-white/[0.04]" />
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="relative mb-6">
              <div className="w-24 h-24 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
                <Zap className="w-10 h-10 text-slate-500" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shadow-md">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            </div>
            <h2 className="text-xl font-black text-slate-200 uppercase tracking-tight mb-2">The feed is quiet</h2>
            <p className="text-slate-500 text-sm max-w-xs leading-relaxed">
              Drop the first post — a photo, a rant, a plan for the weekend. Everyone will see it instantly.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {profile && posts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                currentUser={profile}
                onChange={updated => setPosts(prev => prev.map(p => (p.id === updated.id ? updated : p)))}
                onDeleted={id => setPosts(prev => prev.filter(p => p.id !== id))}
              />
            ))}

            {hasMore && (
              <button
                id="feed-load-more"
                onClick={loadMore}
                disabled={loadingMore}
                className="btn-secondary w-full py-3 text-sm"
              >
                {loadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {loadingMore ? 'Loading…' : 'Load older posts'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
