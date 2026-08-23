import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MessageSquare } from 'lucide-react'
import { getErrorMessage, logError } from '@/lib/errors'

export default async function ChatPage() {
  const supabase = createClient()
  
  // Try to find the general channel
  const { data: channels, error: channelError } = await supabase
    .from('channels')
    .select('id')
    .eq('name', 'general')
    .maybeSingle()

  if (channels?.id) {
    redirect(`/chat/${channels.id}`)
  }
  if (channelError) logError('general channel lookup', channelError)

  // Fallback: try to find any channel
  const { data: firstChannel, error: firstChannelError } = await supabase
    .from('channels')
    .select('id')
    .limit(1)
    .maybeSingle()

  if (firstChannel?.id) {
    redirect(`/chat/${firstChannel.id}`)
  }
  if (firstChannelError) logError('fallback channel lookup', firstChannelError)

  // If no channels exist at all, return a warning instead of crashing
  return (
    <div className="flex flex-col items-center justify-center h-full bg-surface-3 p-6 text-center">
      <MessageSquare className="w-12 h-12 text-slate-600 mb-4" />
      <h3 className="text-slate-200 font-bold text-lg">No Channels Found</h3>
      <p className="text-slate-500 text-sm max-w-sm mt-1">
        {channelError || firstChannelError
          ? getErrorMessage(channelError ?? firstChannelError)
          : 'The database does not have any channels configured. Please run the channel seeding SQL in your Supabase Dashboard to populate the default rooms.'}
      </p>
    </div>
  )
}
