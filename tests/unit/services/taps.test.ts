import { beforeEach, describe, expect, it } from 'vitest'
import type { Db } from '../../../server/db/types'
import { updateCard } from '../../../server/services/cards'
import { updateOrder } from '../../../server/services/orders'
import { cardStats, dashboardCounts, detectDevice, logTap } from '../../../server/services/taps'
import { createTestDb } from '../../helpers/db'
import { makeOrder } from '../../helpers/fixtures'

let db: Db
beforeEach(async () => { db = await createTestDb() })

const NOW = new Date('2026-10-06T04:00:00Z')
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86_400_000)

describe('detectDevice', () => {
  it.each([
    ['Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)', 'ios'],
    ['Mozilla/5.0 (Linux; Android 14; SM-S918B)', 'android'],
    ['Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'other'],
    ['', 'other'],
  ] as const)('%s → %s', (ua, device) => expect(detectDevice(ua)).toBe(device))
})

describe('cardStats', () => {
  it('counts total, 7/30-day windows and NFC vs QR', async () => {
    const { cards } = await makeOrder(db, 'first_tap')
    const id = cards[0]!.id
    await logTap(db, id, { source: 'qr', userAgent: 'iPhone', at: daysAgo(1) })
    await logTap(db, id, { source: 'nfc', userAgent: 'Android', at: daysAgo(10) })
    await logTap(db, id, { source: 'nfc', userAgent: '', at: daysAgo(40) })
    expect(await cardStats(db, id, NOW)).toEqual({ total: 3, last7: 1, last30: 2, nfc: 2, qr: 1 })
  })

  it('is all zeros for an untapped card', async () => {
    const { cards } = await makeOrder(db, 'first_tap')
    expect(await cardStats(db, cards[0]!.id, NOW)).toEqual({ total: 0, last7: 0, last30: 0, nfc: 0, qr: 0 })
  })
})

describe('dashboardCounts', () => {
  it('counts orders by status, unassigned active cards and recent taps', async () => {
    const a = await makeOrder(db, 'fully_tappd')
    const b = await makeOrder(db, 'first_tap', 'Kape Kita')
    await updateOrder(db, b.order.id, { status: 'in_production' })
    await updateCard(db, a.cards[0]!.id, { destination: { type: 'url', url: 'https://g.page/r/x' } })
    await updateCard(db, a.cards[1]!.id, { active: false })
    await logTap(db, a.cards[0]!.id, { source: 'nfc', userAgent: '', at: daysAgo(2) })
    await logTap(db, a.cards[0]!.id, { source: 'nfc', userAgent: '', at: daysAgo(9) })
    expect(await dashboardCounts(db, NOW)).toEqual({ awaitingPayment: 1, inProduction: 1, unassignedCards: 3, taps7d: 1 })
  })
})
