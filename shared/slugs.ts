export const RESERVED_SLUGS: ReadonlySet<string> = new Set([
  'admin', 'api', 't', '_nuxt', '_preview', 'favicon.ico', 'robots.txt', 'sitemap.xml',
])
const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/
// Combining diacritical marks left behind by NFKD (é → e + ◌́)
const DIACRITICS = new RegExp('[\\u0300-\\u036f]', 'g')

export function slugError(s: string): string | null {
  if (RESERVED_SLUGS.has(s)) return `"${s}" is reserved`
  if (s.length < 2 || s.length > 40) return 'Use 2 to 40 characters'
  if (!SLUG_RE.test(s)) return 'Use lowercase letters, numbers and single hyphens'
  return null
}

export function slugify(name: string): string {
  let s = name
    .normalize('NFKD')
    .replace(DIACRITICS, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/, '')
  if (s.length < 2) s = 'page'
  if (RESERVED_SLUGS.has(s)) s = `${s}-page`
  return s
}
