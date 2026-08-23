import type { SupabaseClient } from '@supabase/supabase-js'

export async function getCurrentUser(supabase: SupabaseClient) {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export function getProfile(supabase: SupabaseClient, id: string) {
  return supabase.from('profiles').select('*').eq('id', id).single()
}
