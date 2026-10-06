import { eq } from 'drizzle-orm'
import { beforeEach, describe, expect, it } from 'vitest'
import { cards, customers, orders } from '../../server/db/schema'
import type { Db } from '../../server/db/types'
import { createTestDb } from '../helpers/db'

let db: Db
let orderId: string

beforeEach(async () => {
  db = await createTestDb()
  const [c] = await db.insert(customers).values({ name: 'Café Luna' }).returning()
  const [o] = await db.insert(orders).values({
    customerId: c!.id, packageKey: 'first_tap', cardCount: 1, pricePhp: 599, regularPricePhp: 699,
    design: { color: '#5b3fd6', logoUrl: null, fontPreset: 'bricolage' },
  }).returning()
  orderId = o!.id
})

const design = { template: 'review', headline: 'Review us', subtext: '', showStrip: true } as const

describe('schema', () => {
  it('stores and reads a card with jsonb design', async () => {
    await db.insert(cards).values({ code: 'x7k2qm', orderId, label: 'Review', purpose: 'google_review', design })
    const [row] = await db.select().from(cards).where(eq(cards.code, 'x7k2qm'))
    expect(row!.destinationType).toBe('none')
    expect(row!.design.headline).toBe('Review us')
    expect(row!.active).toBe(true)
  })

  it('rejects a url card without a url', async () => {
    await expect(db.insert(cards).values({ code: 'x7k2qm', orderId, label: 'R', purpose: 'google_review', design, destinationType: 'url' }))
      .rejects.toThrow()
  })

  it('rejects duplicate codes', async () => {
    await db.insert(cards).values({ code: 'x7k2qm', orderId, label: 'A', purpose: 'custom', design })
    await expect(db.insert(cards).values({ code: 'x7k2qm', orderId, label: 'B', purpose: 'custom', design })).rejects.toThrow()
  })
})
