import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function ChatPage() {
  const supabase = createClient()
  
  // Try to find the general channel
  const { data: channels } = await supabase
    .from('channels')
    .select('id')
    .eq('name', 'general')
    .maybeSingle()

  if (channels?.id) {
    redirect(`/chat/${channels.id}`)
  }

  // Fallback: try to find any channel
  const { data: firstChannel } = await supabase
    .from('channels')
    .select('id')
    .limit(1)
    .maybeSingle()

  if (firstChannel?.id) {
    redirect(`/chat/${firstChannel.id}`)
  }

  // If no channels exist at all, return a warning instead of crashing
  return (
    <div className="flex flex-col items-center justify-center h-full bg-surface-3 p-6 text-center">
      <span className="text-4xl mb-4">💬</span>
      <h3 className="text-slate-200 font-semibold text-lg">No Channels Found</h3>
      <p className="text-slate-500 text-sm max-w-sm mt-1">
        The database does not have any channels configured. Please run the channel seeding SQL in your Supabase Dashboard to populate the default rooms.
      </p>
    </div>
  )
}
