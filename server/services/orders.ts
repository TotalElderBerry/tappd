import { asc, desc, eq, inArray } from 'drizzle-orm'
import { type Card, cards, type Customer, customers, type Order, orders, type TapPage, tapPages } from '../db/schema'
import type { Db, Executor } from '../db/types'
import { DEFAULT_ORDER_DESIGN, defaultCardDesign } from '../../shared/cardDesign'
import { generateCode } from '../../shared/codes'
import { type PackageKey, type Quote, QuoteError, getPackage, quote } from '../../shared/packages'
import { type CardPurpose, HEX_COLOR_RE, type OrderDesign, type OrderStatus, PURPOSE_LABELS } from '../../shared/types'
import { ServiceError } from './errors'
import { createTapPage } from './tapPages'

export interface CreateOrderInput {
  customerId: string
  packageKey: PackageKey
  cardCount?: number
  customPricePhp?: number
  notes?: string | null
}

export interface OrderDetail { order: Order; customer: Customer; cards: Card[]; tapPages: TapPage[] }

/** The Fully Tappd counter set (Google reviews, Instagram, Facebook, menu), then TikTok, repeated for bigger orders. */
const KIT_PURPOSES: readonly CardPurpose[] = ['google_review', 'instagram', 'facebook', 'menu', 'tiktok']

export async function allocateCodes(db: Executor, n: number, generate: () => string = generateCode): Promise<string[]> {
  const codes = new Set<string>()
  for (let attempt = 0; attempt < 10 && codes.size < n; attempt++) {
    const candidates: string[] = []
    for (let guard = 0; codes.size + candidates.length < n && guard < n * 50; guard++) {
      const c = generate()
      if (!codes.has(c) && !candidates.includes(c)) candidates.push(c)
    }
    if (!candidates.length) continue
    const taken = new Set((await db.select({ code: cards.code }).from(cards).where(inArray(cards.code, candidates))).map(r => r.code))
    for (const c of candidates) if (!taken.has(c)) codes.add(c)
  }
  if (codes.size < n) throw new ServiceError(500, 'Could not allocate unique card codes')
  return [...codes]
}

export async function createOrder(db: Db, input: CreateOrderInput, opts: { generate?: () => string } = {}): Promise<OrderDetail> {
  const def = getPackage(input.packageKey)
  if (!def) throw new ServiceError(400, 'Unknown package')
  let q: Quote
  try {
    q = quote(def.key, input.cardCount ?? def.minCards, input.customPricePhp)
  } catch (e) {
    if (e instanceof QuoteError) throw new ServiceError(400, e.message)
    throw e
  }

  const orderId = await db.transaction(async (tx) => {
    const [customer] = await tx.select({ id: customers.id }).from(customers).where(eq(customers.id, input.customerId))
    if (!customer) throw new ServiceError(404, 'Customer not found')
    const [order] = await tx.insert(orders).values({
      customerId: input.customerId,
      packageKey: def.key,
      cardCount: q.cardCount,
      pricePhp: q.pricePhp,
      regularPricePhp: q.regularPricePhp,
      notes: input.notes ?? null,
      design: { ...DEFAULT_ORDER_DESIGN },
    }).returning()
    const tapPage = def.includesTapPage ? await createTapPage(tx, { customerId: input.customerId, profileType: 'business' }) : null
    const codes = await allocateCodes(tx, q.cardCount, opts.generate)
    await tx.insert(cards).values(codes.map((code, i) => {
      const purpose: CardPurpose = def.line === 'website' ? 'website' : KIT_PURPOSES[i % KIT_PURPOSES.length]!
      const toTapPage = tapPage !== null && i === 0
      return {
        code,
        orderId: order!.id,
        position: i,
        label: toTapPage ? 'Tap Page card' : `${PURPOSE_LABELS[purpose]}${q.cardCount > 1 ? ` · card ${i + 1}` : ''}`,
        purpose,
        destinationType: toTapPage ? ('tap_page' as const) : ('none' as const),
        tapPageId: toTapPage ? tapPage.id : null,
        design: defaultCardDesign(purpose),
      }
    }))
    return order!.id
  })
  return getOrderDetail(db, orderId)
}

export async function getOrderDetail(db: Db, id: string): Promise<OrderDetail> {
  const [row] = await db.select({ order: orders, customer: customers }).from(orders)
    .innerJoin(customers, eq(orders.customerId, customers.id)).where(eq(orders.id, id))
  if (!row) throw new ServiceError(404, 'Order not found')
  const orderCards = await db.select().from(cards).where(eq(cards.orderId, id)).orderBy(asc(cards.position))
  const pages = await db.select().from(tapPages).where(eq(tapPages.customerId, row.customer.id)).orderBy(desc(tapPages.createdAt))
  return { order: row.order, customer: row.customer, cards: orderCards, tapPages: pages }
}

export async function listOrders(db: Db, filter: { status?: OrderStatus; customerId?: string } = {}) {
  const rows = await db.select({ order: orders, customerName: customers.name }).from(orders)
    .innerJoin(customers, eq(orders.customerId, customers.id))
    .where(filter.status ? eq(orders.status, filter.status) : filter.customerId ? eq(orders.customerId, filter.customerId) : undefined)
    .orderBy(desc(orders.createdAt)).limit(200)
  return rows.map(r => ({ ...r.order, customerName: r.customerName }))
}

export interface OrderPatch { status?: OrderStatus; notes?: string | null; design?: OrderDesign }

export async function updateOrder(db: Db, id: string, patch: OrderPatch): Promise<Order> {
  const [current] = await db.select().from(orders).where(eq(orders.id, id))
  if (!current) throw new ServiceError(404, 'Order not found')
  const set: Partial<typeof orders.$inferInsert> = {}
  if (patch.status !== undefined) {
    set.status = patch.status
    set.paidAt = patch.status === 'awaiting_payment' ? null : (current.paidAt ?? new Date())
  }
  if (patch.notes !== undefined) set.notes = patch.notes
  if (patch.design !== undefined) {
    if (!HEX_COLOR_RE.test(patch.design.color)) throw new ServiceError(400, 'Color must be a hex value like #5b3fd6')
    set.design = patch.design
  }
  const [row] = await db.update(orders).set(set).where(eq(orders.id, id)).returning()
  return row!
}
