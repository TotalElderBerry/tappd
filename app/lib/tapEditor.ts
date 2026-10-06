import { type InjectionKey, inject } from 'vue'
import type { LeafSection, ProfileType, TapIcon, TapPageContent } from '#shared/types'

export interface Draft {
  slug: string
  profileType: ProfileType
  color: string
  coverUrl: string | null
  avatarUrl: string | null
  showCover: boolean
  showAvatar: boolean
  content: TapPageContent
}

export const DRAFT_KEY: InjectionKey<Draft> = Symbol('tap-page-draft')

export function useDraft(): Draft {
  const d = inject(DRAFT_KEY)
  if (!d) throw new Error('useDraft() used outside the Tap Page editor')
  return d
}

/** The swatches from design/07-tap-page-sample.html */
export const SWATCHES = [['#3b2418', 'Espresso'], ['#0f5f57', 'Teal'], ['#1f3a8a', 'Navy'], ['#8a1c3c', 'Wine'], ['#5b3fd6', 'Tappd purple']] as const

export const ICON_LABELS: Record<TapIcon, string> = {
  call: 'Phone', chat: 'Chat', sms: 'Text', nav: 'Directions', mail: 'Email', star: 'Star', menu: 'Menu', truck: 'Delivery',
  cal: 'Calendar', home: 'Home', doc: 'Document', grid: 'Grid', cam: 'Instagram', like: 'Facebook', note: 'TikTok',
  people: 'Community', brief: 'LinkedIn', pin: 'Location', check: 'Check', award: 'Award',
}

export const SECTION_LABELS: Record<LeafSection['type'], string> = {
  links: 'Links', socials: 'Social links', tiles: 'Tiles (products, listings)', about: 'About',
  hours: 'Opening hours', location: 'Location', areas: 'Areas served',
}

export function newSection(type: LeafSection['type']): LeafSection {
  switch (type) {
    case 'links': return { type, title: 'Links', items: [{ icon: 'star', title: 'Leave us a Google review', sub: 'Takes 30 seconds', url: '', featured: true }] }
    case 'socials': return { type, title: 'Follow us', items: [{ icon: 'cam', label: 'Instagram', url: '' }] }
    case 'tiles': return { type, title: 'Favorites', art: 'food', items: [{ title: '', price: '', url: '', imageUrl: null }] }
    case 'about': return { type, title: 'About', text: '', chips: [] }
    case 'hours': return { type, title: 'Opening hours' }
    case 'location': return { type, title: 'Find us', line: '', sub: '', url: '' }
    case 'areas': return { type, title: 'Areas we serve', items: [] }
  }
}

export function moveItem<T>(arr: T[], i: number, dir: -1 | 1): void {
  const j = i + dir
  if (j < 0 || j >= arr.length) return
  ;[arr[i], arr[j]] = [arr[j]!, arr[i]!]
}
