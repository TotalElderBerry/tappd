import { and, eq, gte, sql } from 'drizzle-orm'
import { cards, orders, taps } from '../db/schema'
import type { Db } from '../db/types'

export type TapDevice = 'ios' | 'android' | 'other'
export interface CardStats { total: number; last7: number; last30: number; nfc: number; qr: number }

const DAY = 86_400_000
const ago = (now: Date, days: number) => new Date(now.getTime() - days * DAY).toISOString()

export function detectDevice(ua: string): TapDevice {
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios'
  if (/Android/i.test(ua)) return 'android'
  return 'other'
}

export async function logTap(db: Db, cardId: string, t: { source: 'nfc' | 'qr'; userAgent: string; at?: Date }): Promise<void> {
  await db.insert(taps).values({ cardId, source: t.source, device: detectDevice(t.userAgent), tappedAt: t.at ?? new Date() })
}

export async function cardStats(db: Db, cardId: string, now = new Date()): Promise<CardStats> {
  const [r] = await db.select({
    total: sql<number>`count(*)::int`,
    last7: sql<number>`(count(*) filter (where ${taps.tappedAt} >= ${ago(now, 7)}::timestamptz))::int`,
    last30: sql<number>`(count(*) filter (where ${taps.tappedAt} >= ${ago(now, 30)}::timestamptz))::int`,
    nfc: sql<number>`(count(*) filter (where ${taps.source} = 'nfc'))::int`,
    qr: sql<number>`(count(*) filter (where ${taps.source} = 'qr'))::int`,
  }).from(taps).where(eq(taps.cardId, cardId))
  return r!
}

export async function dashboardCounts(db: Db, now = new Date()) {
  const count = sql<number>`count(*)::int`
  const [awaiting] = await db.select({ n: count }).from(orders).where(eq(orders.status, 'awaiting_payment'))
  const [production] = await db.select({ n: count }).from(orders).where(eq(orders.status, 'in_production'))
  const [unassigned] = await db.select({ n: count }).from(cards).where(and(eq(cards.destinationType, 'none'), eq(cards.active, true)))
  const [recent] = await db.select({ n: count }).from(taps).where(gte(taps.tappedAt, new Date(ago(now, 7))))
  return { awaitingPayment: awaiting!.n, inProduction: production!.n, unassignedCards: unassigned!.n, taps7d: recent!.n }
}
