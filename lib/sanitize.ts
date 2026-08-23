export function sanitizeKey(rawPath: string): string {
  return rawPath
    .split('/')
    .map(segment => {
      const dotIdx = segment.lastIndexOf('.')
      let base = dotIdx !== -1 ? segment.substring(0, dotIdx) : segment
      const ext = dotIdx !== -1 ? segment.substring(dotIdx + 1) : ''

      base = base
        .normalize('NFKD')
        .replace(/[^\x00-\x7F]/g, '')
        .replace(/\s+/g, '_')
        .replace(/[^a-zA-Z0-9._\-]/g, '')
        .replace(/\.{2,}/g, '.')
        .replace(/^[._-]+|[._-]+$/g, '')
        .substring(0, 80)

      const cleanExt = ext
        .normalize('NFKD')
        .replace(/[^\x00-\x7F]/g, '')
        .replace(/[^a-zA-Z0-9]/g, '')
        .substring(0, 10)

      return cleanExt ? `${base}.${cleanExt}` : base
    })
    .filter(Boolean)
    .join('/')
}
