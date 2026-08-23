const FALLBACK_MESSAGE = 'Something went wrong'

export function getErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message) return err.message
  if (typeof err === 'string' && err) return err
  if (err && typeof err === 'object' && 'message' in err) {
    const message = (err as { message?: unknown }).message
    if (typeof message === 'string' && message) return message
  }
  return FALLBACK_MESSAGE
}

export function logError(context: string, err: unknown): void {
  console.error(`[${context}]`, err)
}
