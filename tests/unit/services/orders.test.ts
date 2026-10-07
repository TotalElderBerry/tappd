import { beforeEach, describe, expect, it } from 'vitest'
import { cards, orders } from '../../../server/db/schema'
import type { Db } from '../../../server/db/types'
import { allocateCodes, createOrder, updateOrder } from '../../../server/services/orders'
import { isValidCode } from '../../../shared/codes'
import { createTestDb } from '../../helpers/db'
import { makeCustomer, makeOrder } from '../../helpers/fixtures'

let db: Db
beforeEach(async () => { db = await createTestDb() })

describe('createOrder', () => {
  it('Fully Tappd: 4 unassigned cards in kit order, priced ₱2,000', async () => {
    const d = await makeOrder(db, 'fully_tappd')
    expect(d.order).toMatchObject({ packageKey: 'fully_tappd', cardCount: 4, pricePhp: 2000, regularPricePhp: 2792, status: 'awaiting_payment' })
    expect(d.cards.map(c => c.purpose)).toEqual(['google_review', 'instagram', 'facebook', 'menu'])
    expect(d.cards.every(c => c.destinationType === 'none' && isValidCode(c.code))).toBe(true)
    expect(new Set(d.cards.map(c => c.code)).size).toBe(4)
    expect(d.cards[0]!.design.headline).toBe('Review us')
    expect(d.order.design).toEqual({ color: '#5b3fd6', logoUrl: null, fontPreset: 'bricolage' })
  })

  it('Tap Page: creates an unpublished page and points card 1 at it', async () => {
    const d = await makeOrder(db, 'tap_page', 'Café Luna')
    expect(d.tapPages).toHaveLength(1)
    expect(d.tapPages[0]).toMatchObject({ slug: 'cafe-luna', published: false, profileType: 'business' })
    expect(d.cards[0]).toMatchObject({ destinationType: 'tap_page', tapPageId: d.tapPages[0]!.id, purpose: 'website' })
  })

  it('gives a second same-named page a -2 slug, and emoji names the fallback slug', async () => {
    await makeOrder(db, 'tap_page', 'Café Luna')
    const second = await makeOrder(db, 'tap_page', 'Café Luna')
    expect(second.tapPages[0]!.slug).toBe('cafe-luna-2')
    const emoji = await makeOrder(db, 'tap_page', '☕️')
    expect(emoji.tapPages[0]!.slug).toBe('page')
  })

  it('Tap Pack prices per card and rejects 4 cards', async () => {
    const c = await makeCustomer(db)
    expect((await createOrder(db, { customerId: c.id, packageKey: 'tap_pack', cardCount: 3 })).order.pricePhp).toBe(1644)
    await expect(createOrder(db, { customerId: c.id, packageKey: 'tap_pack', cardCount: 4 })).rejects.toMatchObject({ status: 400 })
  })

  it('Tappd Team requires a price', async () => {
    const c = await makeCustomer(db)
    await expect(createOrder(db, { customerId: c.id, packageKey: 'tappd_team', cardCount: 8 })).rejects.toMatchObject({ status: 400 })
    const d = await createOrder(db, { customerId: c.id, packageKey: 'tappd_team', cardCount: 8, customPricePhp: 3600 })
    expect(d.cards).toHaveLength(8)
    expect(d.order.regularPricePhp).toBeNull()
  })

  it('unknown customer: 404 and nothing written', async () => {
    await expect(createOrder(db, { customerId: '00000000-0000-0000-0000-000000000000', packageKey: 'first_tap' })).rejects.toMatchObject({ status: 404 })
    expect(await db.select().from(orders)).toHaveLength(0)
    expect(await db.select().from(cards)).toHaveLength(0)
  })
})

describe('allocateCodes', () => {
  it('skips codes already in the database and duplicates in the batch', async () => {
    const d = await makeOrder(db, 'first_tap')
    const taken = d.cards[0]!.code
    const seq = [taken, taken, 'bbbbbb', 'bbbbbb', 'cccccc']
    const out = await allocateCodes(db, 2, () => seq.shift()!)
    expect(out.sort()).toEqual(['bbbbbb', 'cccccc'])
  })
})

describe('updateOrder', () => {
  it('sets paidAt when paid and clears it when moved back', async () => {
    const d = await makeOrder(db, 'first_tap')
    const paid = await updateOrder(db, d.order.id, { status: 'paid' })
    expect(paid.paidAt).toBeInstanceOf(Date)
    const shipped = await updateOrder(db, d.order.id, { status: 'delivered' })
    expect(shipped.paidAt!.getTime()).toBe(paid.paidAt!.getTime())
    expect((await updateOrder(db, d.order.id, { status: 'awaiting_payment' })).paidAt).toBeNull()
  })

  it('rejects a bad design color', async () => {
    const d = await makeOrder(db, 'first_tap')
    await expect(updateOrder(db, d.order.id, { design: { color: 'red', logoUrl: null, fontPreset: 'bricolage' } })).rejects.toMatchObject({ status: 400 })
  })
})
