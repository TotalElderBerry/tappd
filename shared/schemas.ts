import { z } from 'zod'
import { PACKAGE_KEYS, type PackageKey } from './packages'
import { CARD_PURPOSES, HEX_COLOR_RE, ORDER_STATUSES, QUICK_ICONS, TAP_ICONS } from './types'
import { isAllowedUrl, normalizeUrl } from './urls'

const URL_HINT = 'Use a full link like https://… (or tel:, sms:, mailto:, viber:)'
const optText = (max: number) => z.string().trim().max(max).transform(s => (s === '' ? null : s)).nullable().optional()
const text = (max: number) => z.string().max(max)

/** Optional link: '' (no action) or an allowed URL; bare domains get https://. */
export const linkUrl = z.string().max(2000).transform(normalizeUrl).refine(u => u === '' || isAllowedUrl(u), URL_HINT)
const requiredUrl = z.string().max(2000).transform(normalizeUrl).refine(isAllowedUrl, URL_HINT)
const hex = z.string().regex(HEX_COLOR_RE, 'Use a hex color like #3b2418')
const imageUrl = z.string().max(2000).refine(u => /^https?:\/\//.test(u) && isAllowedUrl(u), 'Image must be a web link').nullable()

export const customerInput = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
  contactName: optText(120),
  phone: optText(40),
  email: optText(200),
  facebook: optText(200),
  notes: optText(2000),
})
export const customerPatch = customerInput.partial()

export const createOrderInput = z.object({
  customerId: z.uuid(),
  packageKey: z.enum(PACKAGE_KEYS as [PackageKey, ...PackageKey[]]),
  cardCount: z.int().positive().optional(),
  customPricePhp: z.int().positive().optional(),
  notes: optText(2000),
})

export const orderDesign = z.object({ color: hex, logoUrl: imageUrl, fontPreset: z.enum(['bricolage', 'jakarta', 'serif']) })
export const orderPatch = z.object({ status: z.enum(ORDER_STATUSES).optional(), notes: optText(2000), design: orderDesign.optional() })

export const cardVCard = z.object({
  fullName: z.string().trim().min(1, 'Name is required').max(120),
  title: z.string().trim().max(120),
  org: z.string().trim().max(120),
  phones: z.array(z.string().trim().max(40)).max(3),
  emails: z.array(z.string().trim().max(200)).max(3),
  url: linkUrl,
  address: z.string().trim().max(300),
})

export const destination = z.discriminatedUnion('type', [
  z.object({ type: z.literal('none') }),
  z.object({ type: z.literal('url'), url: requiredUrl }),
  z.object({ type: z.literal('tap_page'), tapPageId: z.uuid() }),
  z.object({ type: z.literal('vcard'), vcard: cardVCard }),
])

export const cardDesign = z.object({
  template: z.enum(['review', 'follow', 'menu', 'business_card', 'custom']),
  headline: z.string().trim().max(60),
  subtext: z.string().trim().max(80),
  showStrip: z.boolean(),
})

export const cardPatch = z.object({
  label: z.string().trim().min(1).max(80).optional(),
  purpose: z.enum(CARD_PURPOSES).optional(),
  active: z.boolean().optional(),
  destination: destination.optional(),
  design: cardDesign.optional(),
  approved: z.boolean().optional(),
  written: z.boolean().optional(),
})

const icon = z.enum(TAP_ICONS)
const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:MM').nullable()
const leafOptions = [
  z.object({ type: z.literal('links'), title: text(60), items: z.array(z.object({ icon, title: text(80), sub: text(120), url: linkUrl, featured: z.boolean() })).max(12) }),
  z.object({ type: z.literal('socials'), title: text(60), items: z.array(z.object({ icon, label: text(40), url: linkUrl })).max(12) }),
  z.object({ type: z.literal('tiles'), title: text(60), art: z.enum(['food', 'homes']), items: z.array(z.object({ title: text(80), price: text(30), url: linkUrl, imageUrl })).max(12) }),
  z.object({ type: z.literal('about'), title: text(60), text: text(1200), chips: z.array(z.object({ icon, text: text(60) })).max(8) }),
  z.object({ type: z.literal('hours'), title: text(60) }),
  z.object({ type: z.literal('location'), title: text(60), line: text(120), sub: text(160), url: linkUrl }),
  z.object({ type: z.literal('areas'), title: text(60), items: z.array(text(60)).max(20) }),
] as const
const leaf = z.discriminatedUnion('type', [...leafOptions])
const section = z.discriminatedUnion('type', [...leafOptions, z.object({ type: z.literal('duo'), items: z.tuple([leaf, leaf]) })])

export const tapPageContent = z.object({
  name: z.string().max(120).trim().min(1, 'Name is required'),
  first: text(60),
  role: text(120),
  tagline: text(300),
  facts: z.array(z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('status') }),
    z.object({ kind: z.literal('icon'), icon, text: text(80) }),
    z.object({ kind: z.literal('rating'), text: text(80) }),
  ])).max(6),
  hours: z.array(z.object({ open: hhmm, close: hhmm })).length(7),
  statusWords: z.tuple([text(30), text(30)]),
  quick: z.array(z.object({ icon: z.enum(QUICK_ICONS), label: text(20), url: linkUrl })).max(4),
  contact: z.object({ phone: text(40), email: text(200), address: text(300) }),
  sections: z.array(section).max(20),
})

export const createTapPageInput = z.object({ customerId: z.uuid(), template: z.enum(['business', 'personal']) })

export const tapPagePatch = z.object({
  slug: z.string().trim().optional(),
  profileType: z.enum(['business', 'personal']).optional(),
  color: hex.optional(),
  coverUrl: imageUrl.optional(),
  avatarUrl: imageUrl.optional(),
  showCover: z.boolean().optional(),
  showAvatar: z.boolean().optional(),
  published: z.boolean().optional(),
  content: tapPageContent.optional(),
})
