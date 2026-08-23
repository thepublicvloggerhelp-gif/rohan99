import type { SupabaseClient } from '@supabase/supabase-js'
import type { Profile } from '@/types'

export async function getCurrentUser(supabase: SupabaseClient) {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export function getProfile(supabase: SupabaseClient, id: string, columns = '*') {
  return supabase
    .from('profiles')
    .select(columns)
    .eq('id', id)
    .single() as unknown as PromiseLike<{ data: Profile | null; error: unknown }>
}
