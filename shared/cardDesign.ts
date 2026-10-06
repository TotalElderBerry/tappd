import { type CardDesign, type CardPurpose, type CardTemplate, type CardVCard, type FontPreset, HEX_COLOR_RE, type OrderDesign } from './types'

export const CARD_TEMPLATES: readonly { key: CardTemplate; label: string }[] = [
  { key: 'review', label: 'Review us' },
  { key: 'follow', label: 'Follow us' },
  { key: 'menu', label: 'Menu' },
  { key: 'business_card', label: 'Business card' },
  { key: 'custom', label: 'Custom' },
]

export const FONT_PRESETS: Record<FontPreset, { label: string; display: string; body: string }> = {
  bricolage: { label: 'Bold & modern', display: '"Bricolage Grotesque", Arial, sans-serif', body: 'Figtree, Arial, sans-serif' },
  jakarta: { label: 'Clean & friendly', display: '"Plus Jakarta Sans", Arial, sans-serif', body: '"Plus Jakarta Sans", Arial, sans-serif' },
  serif: { label: 'Classic serif', display: 'Georgia, "Times New Roman", serif', body: 'Georgia, "Times New Roman", serif' },
}

export const DEFAULT_ORDER_DESIGN: OrderDesign = { color: '#5b3fd6', logoUrl: null, fontPreset: 'bricolage' }

const TEMPLATE_BY_PURPOSE: Record<CardPurpose, CardTemplate> = {
  google_review: 'review', instagram: 'follow', facebook: 'follow', tiktok: 'follow',
  menu: 'menu', business_card: 'business_card', website: 'custom', custom: 'custom',
}

const HEADLINE_BY_PURPOSE: Record<CardPurpose, string> = {
  google_review: 'Review us', instagram: 'Follow us', facebook: 'Like our page', tiktok: 'Watch us on TikTok',
  menu: 'See our menu', business_card: 'Save my contact', website: 'Visit our website', custom: 'Tap me',
}

export const templateForPurpose = (p: CardPurpose): CardTemplate => TEMPLATE_BY_PURPOSE[p]
export const defaultHeadline = (p: CardPurpose): string => HEADLINE_BY_PURPOSE[p]

export function defaultCardDesign(p: CardPurpose): CardDesign {
  return { template: templateForPurpose(p), headline: defaultHeadline(p), subtext: '', showStrip: true }
}

export interface CardFace {
  template: CardTemplate
  purpose: CardPurpose
  headline: string
  subtext: string
  showStrip: boolean
  color: string
  /** Text color on the brand block, picked for contrast */
  ink: '#ffffff' | '#17152a'
  logoUrl: string | null
  fontDisplay: string
  fontBody: string
  name: string
  lines: string[]
  handle: string
}

const luminance = (hex: string) => {
  const n = Number.parseInt(hex.slice(1), 16)
  const [r, g, b] = [n >> 16, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!
}

export function inkFor(hex: string): '#ffffff' | '#17152a' {
  const l = luminance(hex)
  const onWhite = 1.05 / (l + 0.05)
  const onDark = (l + 0.05) / (luminance('#17152a') + 0.05)
  return onWhite >= onDark ? '#ffffff' : '#17152a'
}

export function handleFromUrl(url: string): string {
  try {
    const seg = new URL(url).pathname.split('/').filter(Boolean).pop()
    return seg ? `@${seg.replace(/^@/, '')}` : ''
  } catch {
    return ''
  }
}

export function resolveCardFace(
  order: OrderDesign,
  card: { design: CardDesign; purpose: CardPurpose; destinationUrl: string | null; vcard: CardVCard | null },
  businessName: string,
): CardFace {
  const color = HEX_COLOR_RE.test(order.color) ? order.color : DEFAULT_ORDER_DESIGN.color
  const font = FONT_PRESETS[order.fontPreset] ?? FONT_PRESETS.bricolage
  const isBusinessCard = card.design.template === 'business_card'
  const v = card.vcard
  return {
    template: card.design.template,
    purpose: card.purpose,
    headline: card.design.headline,
    subtext: card.design.subtext,
    showStrip: card.design.showStrip,
    color,
    ink: inkFor(color),
    logoUrl: order.logoUrl,
    fontDisplay: font.display,
    fontBody: font.body,
    name: isBusinessCard && v?.fullName ? v.fullName : businessName,
    lines: isBusinessCard && v ? [v.title, v.phones[0] ?? '', v.emails[0] ?? ''].filter(Boolean) : [],
    handle: card.design.template === 'follow' && card.destinationUrl ? handleFromUrl(card.destinationUrl) : '',
  }
}
