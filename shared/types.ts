import type { DayHours } from './hours'

export type CardPurpose = 'google_review' | 'instagram' | 'facebook' | 'tiktok' | 'menu' | 'business_card' | 'website' | 'custom'
export const CARD_PURPOSES: readonly CardPurpose[] = ['google_review', 'instagram', 'facebook', 'tiktok', 'menu', 'business_card', 'website', 'custom']
export const PURPOSE_LABELS: Record<CardPurpose, string> = {
  google_review: 'Google review', instagram: 'Instagram', facebook: 'Facebook', tiktok: 'TikTok',
  menu: 'Menu online', business_card: 'Business card', website: 'Website', custom: 'Custom',
}

export type DestinationType = 'none' | 'url' | 'tap_page' | 'vcard'

export type OrderStatus = 'awaiting_payment' | 'paid' | 'in_production' | 'delivered'
export const ORDER_STATUSES: readonly OrderStatus[] = ['awaiting_payment', 'paid', 'in_production', 'delivered']
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  awaiting_payment: 'Awaiting payment', paid: 'Paid', in_production: 'In production', delivered: 'Delivered',
}

export type FontPreset = 'bricolage' | 'jakarta' | 'serif'
export interface OrderDesign { color: string; logoUrl: string | null; fontPreset: FontPreset }

export type CardTemplate = 'review' | 'follow' | 'menu' | 'business_card' | 'custom'
export interface CardDesign { template: CardTemplate; headline: string; subtext: string; showStrip: boolean }

export interface CardVCard {
  fullName: string; title: string; org: string; phones: string[]; emails: string[]; url: string; address: string
}

export type ProfileType = 'business' | 'personal'

export const TAP_ICONS = ['call', 'chat', 'sms', 'nav', 'mail', 'star', 'menu', 'truck', 'cal', 'home', 'doc', 'grid', 'cam', 'like', 'note', 'people', 'brief', 'pin', 'check', 'award'] as const
export type TapIcon = (typeof TAP_ICONS)[number]
export const QUICK_ICONS = ['call', 'sms', 'chat', 'nav', 'mail'] as const
export type QuickIcon = (typeof QUICK_ICONS)[number]

export type Fact = { kind: 'status' } | { kind: 'icon'; icon: TapIcon; text: string } | { kind: 'rating'; text: string }
export interface QuickAction { icon: QuickIcon; label: string; url: string }
export interface LinkItem { icon: TapIcon; title: string; sub: string; url: string; featured: boolean }
export interface SocialItem { icon: TapIcon; label: string; url: string }
export interface TileItem { title: string; price: string; url: string; imageUrl: string | null }
export interface Chip { icon: TapIcon; text: string }

export type LeafSection =
  | { type: 'links'; title: string; items: LinkItem[] }
  | { type: 'socials'; title: string; items: SocialItem[] }
  | { type: 'tiles'; title: string; art: 'food' | 'homes'; items: TileItem[] }
  | { type: 'about'; title: string; text: string; chips: Chip[] }
  | { type: 'hours'; title: string }
  | { type: 'location'; title: string; line: string; sub: string; url: string }
  | { type: 'areas'; title: string; items: string[] }
export type Section = LeafSection | { type: 'duo'; items: [LeafSection, LeafSection] }

/** Shaped like a PROFILES entry in design/07-tap-page-sample.html, with real URLs. */
export interface TapPageContent {
  name: string
  first: string
  role: string
  tagline: string
  facts: Fact[]
  /** 7 entries, index 0 = Sunday */
  hours: DayHours[]
  statusWords: [string, string]
  quick: QuickAction[]
  contact: { phone: string; email: string; address: string }
  sections: Section[]
}

export interface TapPageView {
  slug: string
  profileType: ProfileType
  color: string
  coverUrl: string | null
  avatarUrl: string | null
  showCover: boolean
  showAvatar: boolean
  content: TapPageContent
}

export const HEX_COLOR_RE = /^#[0-9a-f]{6}$/i
