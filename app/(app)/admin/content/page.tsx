'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Trash2, Megaphone, FileText, MessageSquare, Send } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatRelativeTime, getSubjectIcon } from '@/lib/utils'
import { toast } from 'sonner'

type Tab = 'announcements' | 'notes' | 'messages'

export default function AdminContentPage() {
  const supabase = createClient()
  const [tab,        setTab]       = useState<Tab>('announcements')
  const [notes,      setNotes]     = useState<any[]>([])
  const [messages,   setMessages]  = useState<any[]>([])
  const [users,      setUsers]     = useState<any[]>([])
  const [annTitle,   setAnnTitle]  = useState('')
  const [annMsg,     setAnnMsg]    = useState('')
  const [annTarget,  setAnnTarget] = useState<'all' | 'JEE' | 'NEET'>('all')
  const [sending,    setSending]   = useState(false)

  useEffect(() => {
    const loadNotes = async () => {
      const { data } = await supabase.from('notes').select('*, uploader:profiles!uploaded_by(username)').order('created_at', { ascending: false }).limit(50)
      if (data) setNotes(data)
    }
    const loadMessages = async () => {
      const { data } = await supabase.from('messages').select('*, sender:profiles!sender_id(username), channel:channels(name)').eq('is_deleted', false).order('created_at', { ascending: false }).limit(100)
      if (data) setMessages(data)
    }
    const loadUsers = async () => {
      const { data } = await supabase.from('profiles').select('id, stream').eq('status', 'approved')
      if (data) setUsers(data)
    }
    loadNotes(); loadMessages(); loadUsers()
  }, [])

  const deleteNote = async (noteId: string) => {
    if (!confirm('Delete this note?')) return
    await supabase.from('notes').delete().eq('id', noteId)
    setNotes(prev => prev.filter(n => n.id !== noteId))
    toast.success('Note deleted')
  }

  const deleteMessage = async (msgId: string) => {
    await supabase.from('messages').update({ is_deleted: true }).eq('id', msgId)
    setMessages(prev => prev.filter(m => m.id !== msgId))
    toast.success('Message deleted')
  }

  const sendAnnouncement = async () => {
    if (!annTitle.trim() || !annMsg.trim()) { toast.error('Fill in title and message'); return }
    setSending(true)
    try {
      const targetUsers = annTarget === 'all' ? users : users.filter((u: any) => u.stream === annTarget)
      const rows = targetUsers.map((u: any) => ({
        user_id: u.id, title: annTitle, message: annMsg, type: 'announcement'
      }))
      if (rows.length === 0) { toast.error('No users to notify'); return }
      const { error } = await supabase.from('notifications').insert(rows)
      if (error) { toast.error(error.message); return }

      // Also post to #announcements channel
      const { data: ch } = await supabase.from('channels').select('id').eq('name', 'announcements').single()
      const { data: { user } } = await supabase.auth.getUser()
      if (ch && user) {
        await supabase.from('messages').insert({
          channel_id: ch.id, sender_id: user.id,
          content: `📢 **${annTitle}**\n\n${annMsg}`,
        })
      }

      setAnnTitle(''); setAnnMsg('')
      toast.success(`Announcement sent to ${rows.length} user(s)`)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="overflow-y-auto scroll-area h-full p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin" className="btn-ghost p-1.5"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="text-xl font-bold text-slate-100">Content Moderation</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { id: 'announcements', label: 'Announcements', icon: Megaphone },
            { id: 'notes',         label: 'Notes',          icon: FileText },
            { id: 'messages',      label: 'Messages',       icon: MessageSquare },
          ].map(t => (
            <button key={t.id} id={`content-tab-${t.id}`} onClick={() => setTab(t.id as Tab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${tab === t.id ? 'bg-brand-500/20 border-brand-500/40 text-brand-300' : 'border-white/10 text-slate-400 hover:border-white/20'}`}>
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>

        {/* Announcements */}
        {tab === 'announcements' && (
          <div className="glass-card rounded-2xl p-6">
            <h3 className="font-semibold text-slate-200 mb-4 flex items-center gap-2"><Megaphone className="w-4 h-4 text-brand-400" /> Send Announcement</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Title</label>
                <input value={annTitle} onChange={e => setAnnTitle(e.target.value)} placeholder="Announcement title..." className="input-base" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Message</label>
                <textarea value={annMsg} onChange={e => setAnnMsg(e.target.value)} rows={4} placeholder="Write your announcement..." className="input-base resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Send to</label>
                <div className="flex gap-3">
                  {[{ value: 'all', label: 'All Students' }, { value: 'JEE', label: 'JEE Only' }, { value: 'NEET', label: 'NEET Only' }].map(o => (
                    <label key={o.value} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" value={o.value} checked={annTarget === o.value} onChange={() => setAnnTarget(o.value as any)} className="w-4 h-4 accent-brand-500" />
                      <span className="text-sm text-slate-300">{o.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <button id="send-announcement-btn" onClick={sendAnnouncement} disabled={sending} className="btn-primary">
                <Send className="w-4 h-4" /> {sending ? 'Sending...' : 'Send Announcement'}
              </button>
            </div>
          </div>
        )}

        {/* Notes moderation */}
        {tab === 'notes' && (
          <div className="space-y-3">
            {notes.length === 0 ? (
              <div className="text-center py-12 text-slate-500"><FileText className="w-8 h-8 mx-auto mb-2 opacity-50" /><p>No notes uploaded</p></div>
            ) : notes.map(note => (
              <div key={note.id} className="glass-card rounded-xl flex items-center gap-3 px-4 py-3">
                <span className="text-xl">{getSubjectIcon(note.subject)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">{note.title}</p>
                  <p className="text-xs text-slate-500">{note.subject} · by @{note.uploader?.username} · {formatRelativeTime(note.created_at)}</p>
                </div>
                <a href={note.file_url} target="_blank" rel="noreferrer" className="btn-ghost text-xs">View</a>
                <button id={`delete-note-${note.id}`} onClick={() => deleteNote(note.id)} className="btn-danger text-xs py-1.5 px-3">Delete</button>
              </div>
            ))}
          </div>
        )}

        {/* Messages moderation */}
        {tab === 'messages' && (
          <div className="space-y-2">
            {messages.length === 0 ? (
              <div className="text-center py-12 text-slate-500"><MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" /><p>No messages</p></div>
            ) : messages.map(msg => (
              <div key={msg.id} className="glass-card rounded-xl flex items-start gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-semibold text-brand-400">@{msg.sender?.username}</span>
                    <span className="text-xs text-slate-500">#{msg.channel?.name}</span>
                    <span className="text-xs text-slate-600">{formatRelativeTime(msg.created_at)}</span>
                  </div>
                  <p className="text-sm text-slate-300 line-clamp-2">{msg.content}</p>
                </div>
                <button id={`delete-msg-${msg.id}`} onClick={() => deleteMessage(msg.id)} className="btn-danger text-xs py-1 px-2 flex-shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
