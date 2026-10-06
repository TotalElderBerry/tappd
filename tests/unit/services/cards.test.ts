import { beforeEach, describe, expect, it } from 'vitest'
import type { Db } from '../../../server/db/types'
import { lookupCard, resolveCard, updateCard } from '../../../server/services/cards'
import { updateTapPage } from '../../../server/services/tapPages'
import { createTestDb } from '../../helpers/db'
import { makeOrder } from '../../helpers/fixtures'

let db: Db
beforeEach(async () => { db = await createTestDb() })

const BASE = 'https://tappd.ph/'
const vcard = { fullName: 'Andrea Villanueva', title: 'Broker', org: '', phones: ['+63 918 234 5678'], emails: [], url: '', address: '' }

describe('resolveCard', () => {
  it('unknown or malformed codes are not found', async () => {
    expect(await resolveCard(db, 'zzzzzz', BASE)).toEqual({ kind: 'not_found' })
    expect(await resolveCard(db, '../etc', BASE)).toEqual({ kind: 'not_found' })
  })

  it('unassigned and inactive cards are not set up', async () => {
    const { cards } = await makeOrder(db, 'first_tap')
    expect(await resolveCard(db, cards[0]!.code, BASE)).toEqual({ kind: 'not_set_up' })
    await updateCard(db, cards[0]!.id, { destination: { type: 'url', url: 'https://g.page/r/x' }, active: false })
    expect(await resolveCard(db, cards[0]!.code, BASE)).toEqual({ kind: 'not_set_up' })
  })

  it('url cards redirect, and uppercase codes resolve too', async () => {
    const { cards } = await makeOrder(db, 'first_tap')
    await updateCard(db, cards[0]!.id, { destination: { type: 'url', url: 'https://g.page/r/x' } })
    const expected = { kind: 'redirect', location: 'https://g.page/r/x', cardId: cards[0]!.id }
    expect(await resolveCard(db, cards[0]!.code, BASE)).toEqual(expected)
    expect(await resolveCard(db, cards[0]!.code.toUpperCase(), BASE)).toEqual(expected)
  })

  it('tap_page cards redirect to base/slug only when published', async () => {
    const d = await makeOrder(db, 'tap_page', 'Café Luna')
    const code = d.cards[0]!.code
    expect(await resolveCard(db, code, BASE)).toEqual({ kind: 'not_set_up' })
    await updateTapPage(db, d.tapPages[0]!.id, { published: true })
    expect(await resolveCard(db, code, BASE)).toMatchObject({ kind: 'redirect', location: 'https://tappd.ph/cafe-luna' })
  })

  it('vcard cards return a contact file', async () => {
    const { cards } = await makeOrder(db, 'first_tap')
    await updateCard(db, cards[0]!.id, { destination: { type: 'vcard', vcard } })
    const r = await resolveCard(db, cards[0]!.code, BASE)
    expect(r).toMatchObject({ kind: 'vcard', filename: 'andrea-villanueva.vcf' })
    expect(r.kind === 'vcard' && r.body).toContain('FN:Andrea Villanueva')
  })
})

describe('updateCard', () => {
  it('switching destination type clears the previous target', async () => {
    const d = await makeOrder(db, 'tap_page')
    const card = await updateCard(db, d.cards[0]!.id, { destination: { type: 'url', url: 'https://cafeluna.ph' } })
    expect(card).toMatchObject({ destinationType: 'url', destinationUrl: 'https://cafeluna.ph', tapPageId: null, vcard: null })
  })

  it('normalizes bare domains and rejects unsafe URLs', async () => {
    const { cards } = await makeOrder(db, 'first_tap')
    expect((await updateCard(db, cards[0]!.id, { destination: { type: 'url', url: 'instagram.com/cafeluna' } })).destinationUrl)
      .toBe('https://instagram.com/cafeluna')
    await expect(updateCard(db, cards[0]!.id, { destination: { type: 'url', url: 'javascript:alert(1)' } })).rejects.toMatchObject({ status: 400 })
  })

  it("only accepts the order customer's Tap Pages", async () => {
    const mine = await makeOrder(db, 'tap_page', 'Café Luna')
    const theirs = await makeOrder(db, 'tap_page', 'Kape Kita')
    await expect(updateCard(db, mine.cards[0]!.id, { destination: { type: 'tap_page', tapPageId: theirs.tapPages[0]!.id } }))
      .rejects.toMatchObject({ status: 400 })
  })

  it('a Unicode link redirects with an ASCII-only Location', async () => {
    const { cards } = await makeOrder(db, 'first_tap')
    await updateCard(db, cards[0]!.id, { destination: { type: 'url', url: 'https://www.google.com/maps/place/咖啡' } })
    const r = await resolveCard(db, cards[0]!.code, BASE)
    expect(r).toMatchObject({ kind: 'redirect', location: 'https://www.google.com/maps/place/%E5%92%96%E5%95%A1' })
  })

  it('requires a name on vCards', async () => {
    const { cards } = await makeOrder(db, 'first_tap')
    await expect(updateCard(db, cards[0]!.id, { destination: { type: 'vcard', vcard: { ...vcard, fullName: ' ' } } })).rejects.toMatchObject({ status: 400 })
  })

  it('approved / written keep their first timestamp and clear on false', async () => {
    const { cards } = await makeOrder(db, 'first_tap')
    const a = await updateCard(db, cards[0]!.id, { approved: true, written: true })
    const b = await updateCard(db, cards[0]!.id, { approved: true, written: true })
    expect(b.designApprovedAt!.getTime()).toBe(a.designApprovedAt!.getTime())
    expect(b.writtenAt!.getTime()).toBe(a.writtenAt!.getTime())
    const c = await updateCard(db, cards[0]!.id, { approved: false, written: false })
    expect(c.designApprovedAt).toBeNull()
    expect(c.writtenAt).toBeNull()
  })

  it('404s on unknown cards', async () => {
    await expect(updateCard(db, '00000000-0000-0000-0000-000000000000', { label: 'x' })).rejects.toMatchObject({ status: 404 })
  })
})

describe('lookupCard', () => {
  it('finds by code, case-insensitively', async () => {
    const d = await makeOrder(db, 'first_tap')
    expect(await lookupCard(db, ` ${d.cards[0]!.code.toUpperCase()} `)).toEqual({ id: d.cards[0]!.id, orderId: d.order.id })
    expect(await lookupCard(db, 'zzzzzz')).toBeNull()
  })
})
