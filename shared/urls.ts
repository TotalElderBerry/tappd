export const ALLOWED_SCHEMES = ['https:', 'http:', 'tel:', 'sms:', 'mailto:', 'viber:'] as const

export function isAllowedUrl(s: string): boolean {
  let u: URL
  try {
    u = new URL(s.trim())
  } catch {
    return false
  }
  if (!(ALLOWED_SCHEMES as readonly string[]).includes(u.protocol)) return false
  if ((u.protocol === 'https:' || u.protocol === 'http:') && !u.hostname) return false
  return true
}

/**
 * Adds https:// to bare domains like "instagram.com/cafeluna", then stores allowed URLs in canonical
 * WHATWG form (percent-encoded path, punycode host, control characters removed) so they are safe in a
 * Location header and a vCard line. Anything else is returned trimmed, unchanged, for validation to reject.
 */
export function normalizeUrl(s: string): string {
  let t = s.trim()
  if (!t) return ''
  if (!/^[a-z][a-z0-9+.-]*:/i.test(t) && /^[\w-]+(\.[\w-]+)+(\/|$|\?|#)/.test(t)) t = `https://${t}`
  if (!isAllowedUrl(t)) return t
  const u = new URL(t)
  // Keep "https://cafeluna.ph" as typed instead of the canonical "https://cafeluna.ph/".
  const bareOrigin = u.pathname === '/' && !u.search && !u.hash && !t.endsWith('/')
  return bareOrigin ? u.href.slice(0, -1) : u.href
}
