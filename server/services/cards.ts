import { eq } from 'drizzle-orm'
import { type Card, cards, type Order, orders, tapPages } from '../db/schema'
import type { Db } from '../db/types'
import { isValidCode } from '../../shared/codes'
import type { CardDesign, CardPurpose, CardVCard } from '../../shared/types'
import { isAllowedUrl, normalizeUrl } from '../../shared/urls'
import { buildVCard, vcardFilename } from '../../shared/vcard'
import { ServiceError } from './errors'
import { type CardStats, cardStats } from './taps'

export type Destination =
  | { type: 'none' }
  | { type: 'url'; url: string }
  | { type: 'tap_page'; tapPageId: string }
  | { type: 'vcard'; vcard: CardVCard }

export interface CardPatch {
  label?: string
  purpose?: CardPurpose
  active?: boolean
  destination?: Destination
  design?: CardDesign
  approved?: boolean
  written?: boolean
}

export type Resolution =
  | { kind: 'redirect'; location: string; cardId: string }
  | { kind: 'vcard'; body: string; filename: string; cardId: string }
  | { kind: 'not_found' }
  | { kind: 'not_set_up' }

export async function updateCard(db: Db, id: string, patch: CardPatch): Promise<Card> {
  const [current] = await db.select({ card: cards, customerId: orders.customerId }).from(cards)
    .innerJoin(orders, eq(cards.orderId, orders.id)).where(eq(cards.id, id))
  if (!current) throw new ServiceError(404, 'Card not found')

  const set: Partial<typeof cards.$inferInsert> = {}
  if (patch.label !== undefined) set.label = patch.label
  if (patch.purpose !== undefined) set.purpose = patch.purpose
  if (patch.active !== undefined) set.active = patch.active
  if (patch.design !== undefined) set.design = patch.design
  if (patch.approved !== undefined) set.designApprovedAt = patch.approved ? (current.card.designApprovedAt ?? new Date()) : null
  if (patch.written !== undefined) set.writtenAt = patch.written ? (current.card.writtenAt ?? new Date()) : null

  if (patch.destination) {
    const d = patch.destination
    // spec §5 invariant: only the field matching destination_type stays set
    Object.assign(set, { destinationType: d.type, destinationUrl: null, tapPageId: null, vcard: null })
    if (d.type === 'url') {
      const url = normalizeUrl(d.url)
      if (!isAllowedUrl(url)) throw new ServiceError(400, 'Enter a full link, e.g. https://g.page/r/…')
      set.destinationUrl = url
    } else if (d.type === 'tap_page') {
      const [tp] = await db.select({ id: tapPages.id, customerId: tapPages.customerId }).from(tapPages).where(eq(tapPages.id, d.tapPageId))
      if (!tp || tp.customerId !== current.customerId) throw new ServiceError(400, "Pick one of this customer's Tap Pages")
      set.tapPageId = tp.id
    } else if (d.type === 'vcard') {
      if (!d.vcard.fullName.trim()) throw new ServiceError(400, 'A contact card needs a name')
      set.vcard = d.vcard
    }
  }

  const [row] = await db.update(cards).set(set).where(eq(cards.id, id)).returning()
  return row!
}

export async function resolveCard(db: Db, rawCode: string, base: string): Promise<Resolution> {
  const code = rawCode.trim().toLowerCase()
  if (!isValidCode(code)) return { kind: 'not_found' }
  const [row] = await db.select({ card: cards, slug: tapPages.slug, published: tapPages.published }).from(cards)
    .leftJoin(tapPages, eq(cards.tapPageId, tapPages.id)).where(eq(cards.code, code))
  if (!row) return { kind: 'not_found' }
  const { card } = row
  if (!card.active) return { kind: 'not_set_up' }
  switch (card.destinationType) {
    case 'url':
      return { kind: 'redirect', location: card.destinationUrl!, cardId: card.id }
    case 'tap_page':
      return row.published && row.slug
        ? { kind: 'redirect', location: `${base.replace(/\/+$/, '')}/${row.slug}`, cardId: card.id }
        : { kind: 'not_set_up' }
    case 'vcard': {
      const v = card.vcard!
      const body = buildVCard({ kind: 'individual', fullName: v.fullName, title: v.title, org: v.org, phones: v.phones, emails: v.emails, url: v.url, address: v.address })
      return { kind: 'vcard', body, filename: vcardFilename(v.fullName), cardId: card.id }
    }
    default:
      return { kind: 'not_set_up' }
  }
}

export async function lookupCard(db: Db, code: string): Promise<{ id: string; orderId: string } | null> {
  const [row] = await db.select({ id: cards.id, orderId: cards.orderId }).from(cards).where(eq(cards.code, code.trim().toLowerCase()))
  return row ?? null
}

export async function getCardDetail(db: Db, id: string, now = new Date()): Promise<{ card: Card; order: Order; stats: CardStats }> {
  const [row] = await db.select({ card: cards, order: orders }).from(cards).innerJoin(orders, eq(cards.orderId, orders.id)).where(eq(cards.id, id))
  if (!row) throw new ServiceError(404, 'Card not found')
  return { ...row, stats: await cardStats(db, id, now) }
}
