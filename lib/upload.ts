/**
 * Uploads a file via the secure server-side /api/upload route.
 * Returns the public URL on success, or throws an error.
 */
export async function uploadFile(
  file: File,
  bucket: 'avatars' | 'chat-images' | 'notes',
  path?: string
): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('bucket', bucket)
  if (path) formData.append('path', path)

  const res = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  })

  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? 'Upload failed')
  return json.publicUrl as string
}
