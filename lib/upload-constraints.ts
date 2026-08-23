export const ALLOWED_BUCKETS = ['avatars', 'chat-images', 'notes', 'memories'] as const
export type Bucket = typeof ALLOWED_BUCKETS[number]

export const BUCKET_LIMITS: Record<Bucket, number> = {
  avatars: 2 * 1024 * 1024,
  'chat-images': 5 * 1024 * 1024,
  notes: 20 * 1024 * 1024,
  memories: 10 * 1024 * 1024,
}

export const ALLOWED_TYPES: Record<Bucket, string[]> = {
  avatars: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  'chat-images': ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  notes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  memories: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'],
}
