import { computeStatus, rangeLabel, WEEKDAYS } from '../hours'
import { HEX_COLOR_RE, type LeafSection, type Section, type TapPageContent, type TapPageView } from '../types'
import { isAllowedUrl } from '../urls'

// Port of design/07-tap-page-sample.html render functions. SVG strings are copied verbatim from the design file.

export const esc = (s: unknown): string =>
  String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

const P = (d: string) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`
export const IC: Record<string, string> = {
  call: P('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>'),
  chat: P('<path d="M12 3C7 3 3 6.6 3 11c0 2.5 1.3 4.7 3.3 6.2V21l3.3-1.8c.8.2 1.6.3 2.4.3 5 0 9-3.6 9-8s-4-8.5-9-8.5z"/>'),
  sms: P('<rect x="3" y="4" width="18" height="13" rx="3"/><path d="M8 21l3-4M8 10h8M8 13h5"/>'),
  nav: P('<path d="M3 11l18-8-8 18-2-8z"/>'),
  mail: P('<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M4 7l8 6 8-6"/>'),
  star: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 3l2.7 5.5 6 .9-4.4 4.2 1 6-5.3-2.8-5.3 2.8 1-6L3.3 9.4l6-.9z"/></svg>',
  menu: P('<path d="M5 3h11l3 3v15H5z"/><path d="M8.5 9h7M8.5 12.5h7M8.5 16h4.5"/>'),
  truck: P('<path d="M3 7h11v9H3z"/><path d="M14 10h4l3 3v3h-7"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>'),
  cal: P('<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>'),
  home: P('<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>'),
  doc: P('<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 13h6M9 17h6"/>'),
  grid: P('<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>'),
  cam: P('<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/>'),
  like: P('<path d="M7 10v11H3V10zM7 20h9.5a2 2 0 0 0 2-1.6l1.4-6A2 2 0 0 0 18 10h-5V6a2 2 0 0 0-2-2l-4 6"/>'),
  note: P('<path d="M9 18V6l10-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/>'),
  people: P('<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M15 14.5c3 0 6 1.8 6 5"/>'),
  brief: P('<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18"/>'),
  pin: P('<path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>'),
  check: P('<path d="M20 6L9 17l-5-5"/>'),
  award: P('<circle cx="12" cy="9" r="6"/><path d="M8.5 14L7 21l5-3 5 3-1.5-7"/>'),
  share: P('<path d="M12 3v12"/><path d="M7 8l5-5 5 5"/><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/>'),
  save: P('<circle cx="10" cy="8" r="4"/><path d="M3 20c0-3.5 3-6 7-6s7 2.5 7 6"/><path d="M19 8v6M16 11h6"/>'),
  chev: P('<path d="M9 6l6 6-6 6"/>'),
  down: P('<path d="M6 9l6 6 6-6"/>'),
}
const WINDOWS = Array.from({ length: 40 }, (_, i) => `<rect x="${640 + (i % 4) * 16}" y="${64 + Math.floor(i / 4) * 18}" width="8" height="8"/>`).join('')
const COVERS = {
  business: `<svg viewBox="0 0 1080 260" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><pattern id="beans" width="46" height="46" patternUnits="userSpaceOnUse" patternTransform="rotate(-18)"><ellipse cx="14" cy="14" rx="7" ry="10" fill="rgba(255,255,255,.08)"/><path d="M14 5c-3 5 3 13 0 18" stroke="rgba(0,0,0,.18)" stroke-width="1.6" fill="none"/><ellipse cx="37" cy="36" rx="6" ry="9" fill="rgba(255,255,255,.06)"/></pattern><radialGradient id="glow" cx=".8" cy=".2" r=".9"><stop offset="0" stop-color="rgba(255,214,150,.45)"/><stop offset="1" stop-color="rgba(255,214,150,0)"/></radialGradient></defs><rect width="1080" height="260" fill="var(--accent)"/><rect width="1080" height="260" fill="url(#beans)"/><rect width="1080" height="260" fill="url(#glow)"/><g transform="translate(560 30)"><g fill="none" stroke="rgba(255,255,255,.55)" stroke-width="3" stroke-linecap="round"><path d="M24 70c0-10 8-10 8-20s-8-10-8-20"/><path d="M46 70c0-10 8-10 8-20s-8-10-8-20"/></g><path d="M-4 84h80v34a40 40 0 0 1-40 40 40 40 0 0 1-40-40z" fill="rgba(255,255,255,.9)"/><path d="M76 94h12a14 14 0 0 1 0 28h-13" fill="none" stroke="rgba(255,255,255,.9)" stroke-width="7"/></g></svg>`,
  personal: `<svg viewBox="0 0 1080 260" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="sky" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="rgba(255,255,255,.08)"/><stop offset="1" stop-color="rgba(0,0,0,.35)"/></linearGradient></defs><rect width="1080" height="260" fill="var(--accent)"/><rect width="1080" height="260" fill="url(#sky)"/><g fill="rgba(255,255,255,.10)"><rect x="560" y="90" width="60" height="170"/><rect x="630" y="50" width="80" height="210"/><rect x="720" y="110" width="50" height="150"/><rect x="780" y="70" width="70" height="190"/><rect x="860" y="130" width="60" height="130"/><rect x="930" y="40" width="90" height="220"/></g><g fill="rgba(255,255,255,.18)">${WINDOWS}</g><circle cx="200" cy="-40" r="220" fill="rgba(255,255,255,.06)"/></svg>`,
}
const AVATARS = {
  business: `<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="24" fill="var(--accent)"/><path d="M16 21h14v6a7 7 0 0 1-7 7 7 7 0 0 1-7-7z" fill="#fff"/><path d="M30 23h2a3 3 0 0 1 0 6h-2" fill="none" stroke="#fff" stroke-width="2"/><path d="M20 18c0-2 2-2 2-4M25 18c0-2 2-2 2-4" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>`,
  personal: `<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="24" fill="var(--accent-soft)"/><circle cx="24" cy="19" r="8" fill="var(--accent)"/><path d="M9 42c2-9 8-13 15-13s13 4 15 13" fill="var(--accent)"/></svg>`,
}
const FOOD: [string, string][] = [
  ['#e8d9c8', '<path d="M10 18h24v8a12 12 0 0 1-24 0z" fill="#fff"/><path d="M34 21h3a4 4 0 0 1 0 8h-3" fill="none" stroke="#fff" stroke-width="3"/><path d="M16 14c0-3 3-3 3-6M23 14c0-3 3-3 3-6" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round"/>'],
  ['#efd9a8', '<path d="M8 30c2-10 10-16 16-16s14 6 16 16c-5 3-11 4-16 4s-11-1-16-4z" fill="#fff"/><path d="M16 22l4 8M24 18v12M32 22l-4 8" stroke="#efd9a8" stroke-width="2.4" stroke-linecap="round"/>'],
  ['#dce3cf', '<ellipse cx="24" cy="30" rx="16" ry="8" fill="#fff"/><circle cx="24" cy="26" r="6" fill="#f4c542"/>'],
]
const HOMES: [string, string][] = [
  ['#d9e4ee', '<path d="M8 24l16-12 16 12v14H8z" fill="#fff"/><rect x="20" y="28" width="8" height="10" fill="#d9e4ee"/>'],
  ['#e6dfee', '<rect x="12" y="10" width="24" height="28" fill="#fff"/><g fill="#e6dfee"><rect x="16" y="14" width="5" height="5"/><rect x="27" y="14" width="5" height="5"/><rect x="16" y="23" width="5" height="5"/><rect x="27" y="23" width="5" height="5"/></g>'],
  ['#e3eadb', '<path d="M6 26l12-9 12 9v12H6z" fill="#fff"/><path d="M26 22l8-6 8 6v16H30" fill="#fff" opacity=".8"/>'],
]
const ART = { food: FOOD, homes: HOMES }
const MAP_SVG = '<svg viewBox="0 0 460 130" preserveAspectRatio="xMidYMid slice"><rect width="460" height="130" fill="var(--soft)"/><g stroke="var(--line)" stroke-width="10" fill="none"><path d="M-10 90L470 60"/><path d="M120 -10L160 140"/><path d="M320 -10L290 140"/></g><g stroke="var(--line)" stroke-width="4" fill="none"><path d="M-10 30L470 20"/><path d="M40 -10L60 140"/><path d="M400 -10L420 140"/></g><circle cx="230" cy="62" r="26" fill="var(--accent)" opacity=".15"/><path d="M230 72s-12-10-12-20a12 12 0 0 1 24 0c0 10-12 20-12 20z" fill="var(--accent)"/><circle cx="230" cy="52" r="4.5" fill="#fff"/></svg>'

/** ` data-href="…"` for an allowed URL; empty for blank or unsafe URLs (button then does nothing). */
const href = (url: string) => (url && isAllowedUrl(url) ? ` data-href="${esc(url.trim())}"` : '')
const icon = (k: string) => IC[k] ?? ''

export function renderStatus(c: TapPageContent, now: Date) {
  const st = computeStatus(c.hours, now)
  return { ...st, html: `<span class="dot"></span><b>${esc(st.open ? c.statusWords[0] : c.statusWords[1])}</b><span>${esc(st.next)}</span>` }
}

function sectHTML(s: Section | LeafSection, c: TapPageContent, now: Date): string {
  switch (s.type) {
    case 'links':
      return `<section class="sect"><h2>${esc(s.title)}</h2><div class="links">${s.items.map(it => `<button class="lk${it.featured ? ' feature' : ''}" type="button"${href(it.url)}><span class="i">${icon(it.icon)}</span><span><b>${esc(it.title)}</b><small>${esc(it.sub)}</small></span><span class="chev">${IC.chev}</span></button>`).join('')}</div></section>`
    case 'socials':
      return `<section class="sect"><h2>${esc(s.title)}</h2><div class="socials">${s.items.map(it => `<button class="so" type="button"${href(it.url)}>${icon(it.icon)}${esc(it.label)}</button>`).join('')}</div></section>`
    case 'tiles': {
      const art = ART[s.art] ?? FOOD
      return `<section class="sect"><h2>${esc(s.title)}</h2><div class="tiles">${s.items.map((it, i) => {
        const [bg, svg] = art[i % art.length]!
        const ph = it.imageUrl
          ? `<img src="${esc(it.imageUrl)}" alt="" style="width:100%;height:100%;object-fit:cover;display:block">`
          : `<svg viewBox="0 0 48 48" aria-hidden="true">${svg}</svg>`
        return `<button class="tile" type="button"${href(it.url)}><div class="ph" style="background:${bg}">${ph}</div><div class="t"><b>${esc(it.title)}</b><span>${esc(it.price)}</span></div></button>`
      }).join('')}</div></section>`
    }
    case 'about':
      return `<section class="sect about"><h2>${esc(s.title)}</h2><p>${esc(s.text)}</p><div class="chips">${s.chips.map(ch => `<span class="chip">${icon(ch.icon)}${esc(ch.text)}</span>`).join('')}</div></section>`
    case 'hours': {
      const st = computeStatus(c.hours, now)
      const H = c.hours
      return `<section class="sect"><h2>${esc(s.title)}</h2><details class="hours"><summary><span>Today · ${rangeLabel(H[st.dayIndex])}</span>${IC.down}</summary><ul>${[1, 2, 3, 4, 5, 6, 0].map(i => `<li class="${i === st.dayIndex ? 'today' : ''}"><span>${WEEKDAYS[i]}</span><span>${rangeLabel(H[i])}</span></li>`).join('')}</ul></details></section>`
    }
    case 'location':
      return `<section class="sect"><h2>${esc(s.title)}</h2><div class="loc"><div class="map" aria-hidden="true">${MAP_SVG}</div><div class="body"><p>${esc(s.line)}<small>${esc(s.sub)}</small></p><button class="pillbtn" type="button"${href(s.url)}>Open map</button></div></div></section>`
    case 'areas':
      return `<section class="sect"><h2>${esc(s.title)}</h2><div class="areas">${s.items.map(a => `<span class="chip">${IC.pin}${esc(a)}</span>`).join('')}</div></section>`
    case 'duo':
      return `<div class="duo">${s.items.map(x => sectHTML(x, c, now)).join('')}</div>`
  }
  return ''
}

export function renderCover(v: TapPageView): string {
  const art = v.coverUrl ? `<img src="${esc(v.coverUrl)}" alt="">` : COVERS[v.profileType]
  return art + `<button class="share" type="button" id="share" aria-label="Share this page">${IC.share}</button>`
}

export function renderAvatarInner(v: TapPageView): string {
  return v.avatarUrl ? `<img src="${esc(v.avatarUrl)}" alt="Profile photo">` : AVATARS[v.profileType]
}

export function renderIdCol(v: TapPageView, now: Date): string {
  const c = v.content
  const st = renderStatus(c, now)
  const facts = c.facts.map(f => f.kind === 'status'
    ? `<span class="status ${st.open ? 'open' : 'closed'}">${st.html}</span>`
    : `<span>${f.kind === 'rating' ? '<span style="color:#e0a100" aria-hidden="true">★</span>' : icon(f.icon)}${esc(f.text)}</span>`).join('')
  return `<div class="head"><div class="avatar" id="avatar">${renderAvatarInner(v)}</div>
    <div class="ident"><h1>${esc(c.name)}</h1>${c.role ? `<p class="role">${esc(c.role)}</p>` : ''}<p class="tagline">${esc(c.tagline)}</p><div class="facts">${facts}</div></div></div>
    <nav class="quick" aria-label="Quick actions">${c.quick.map(q => `<button class="qa" type="button"${href(q.url)}><span class="i">${icon(q.icon)}</span>${esc(q.label)}</button>`).join('')}</nav>
    <button class="save" type="button" id="save">${IC.save}Save contact</button>
    <p class="save-note">Adds ${esc(c.first)} to your phone's contacts in one tap</p>`
}

export function renderContent(v: TapPageView, now: Date): string {
  return v.content.sections.map(s => sectHTML(s, v.content, now)).join('')
}

export function pageClass(v: TapPageView): string {
  return ['page', !v.showCover && 'nocover', !v.showAvatar && 'noavatar'].filter(Boolean).join(' ')
}

const mix = (hex: string, t: number) => {
  const n = Number.parseInt(hex.slice(1), 16)
  const m = (x: number) => Math.round(x + (255 - x) * t)
  return `rgb(${m(n >> 16)},${m((n >> 8) & 255)},${m(n & 255)})`
}

/** Same values 07's setColor() computes, as CSS so it applies before any script runs. `html:root` outranks the design file's `:root`. */
export function accentCss(color: string): string {
  const hex = HEX_COLOR_RE.test(color) ? color : '#5b3fd6'
  const dark = `color-mix(in srgb, ${hex} 30%, #1a1816)`
  return `html:root{--accent:${hex};--accent-soft:${mix(hex, 0.9)}}`
    + `@media (prefers-color-scheme:dark){html:root:not([data-theme="light"]){--accent-soft:${dark}}}`
    + `html:root[data-theme="dark"]{--accent-soft:${dark}}`
}

export function contactLines(c: TapPageContent): string[] {
  return [c.contact.phone, c.contact.email, c.contact.address].filter(s => s.trim() !== '')
}
