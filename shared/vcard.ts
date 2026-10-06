import { slugify } from './slugs'

export interface VCardInput {
  kind: 'individual' | 'org'
  fullName: string
  title?: string
  org?: string
  phones?: string[]
  emails?: string[]
  url?: string
  address?: string
  photo?: { base64: string; type: 'JPEG' | 'PNG' }
}

const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;')

function fold(line: string): string {
  if (line.length <= 75) return line
  const out = [line.slice(0, 75)]
  for (let i = 75; i < line.length; i += 74) out.push(' ' + line.slice(i, i + 74))
  return out.join('\r\n')
}

export function buildVCard(v: VCardInput): string {
  const out: string[] = ['BEGIN:VCARD', 'VERSION:3.0']
  if (v.kind === 'individual') {
    const parts = v.fullName.trim().split(/\s+/)
    const family = parts.length > 1 ? parts.pop()! : ''
    out.push(`N:${esc(family)};${esc(parts.join(' '))};;;`)
  } else {
    out.push('N:;;;;')
  }
  out.push(`FN:${esc(v.fullName)}`)
  const org = v.kind === 'org' ? v.fullName : v.org
  if (org) out.push(`ORG:${esc(org)}`)
  if (v.kind === 'org') out.push('X-ABShowAs:COMPANY')
  if (v.title) out.push(`TITLE:${esc(v.title)}`)
  for (const p of v.phones ?? []) if (p.trim()) out.push(`TEL;TYPE=CELL:${esc(p.trim())}`)
  for (const e of v.emails ?? []) if (e.trim()) out.push(`EMAIL;TYPE=INTERNET:${esc(e.trim())}`)
  if (v.url) out.push(`URL:${v.url}`)
  if (v.address) out.push(`ADR;TYPE=WORK:;;${esc(v.address)};;;;`)
  if (v.photo) out.push(`PHOTO;ENCODING=b;TYPE=${v.photo.type}:${v.photo.base64}`)
  out.push('END:VCARD')
  return out.map(fold).join('\r\n') + '\r\n'
}

export function vcardFilename(name: string): string {
  const s = slugify(name)
  return `${s === 'page' ? 'contact' : s}.vcf`
}
