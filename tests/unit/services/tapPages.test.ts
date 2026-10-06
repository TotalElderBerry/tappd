import { beforeEach, describe, expect, it } from 'vitest'
import type { Db } from '../../../server/db/types'
import { getPublishedView, tapPageVCardInput, updateTapPage } from '../../../server/services/tapPages'
import { createTestDb } from '../../helpers/db'
import { makeOrder } from '../../helpers/fixtures'

let db: Db
let pageId: string
beforeEach(async () => {
  db = await createTestDb()
  pageId = (await makeOrder(db, 'tap_page', 'Café Luna')).tapPages[0]!.id
})

describe('tap pages', () => {
  it('rejects reserved, malformed and taken slugs', async () => {
    await expect(updateTapPage(db, pageId, { slug: 'admin' })).rejects.toMatchObject({ status: 400 })
    await expect(updateTapPage(db, pageId, { slug: 'Cafe Luna' })).rejects.toMatchObject({ status: 400 })
    const other = (await makeOrder(db, 'tap_page', 'Kape Kita')).tapPages[0]!
    await expect(updateTapPage(db, other.id, { slug: 'cafe-luna' })).rejects.toMatchObject({ status: 409 })
    expect((await updateTapPage(db, pageId, { slug: 'cafe-luna' })).slug).toBe('cafe-luna')
  })

  it('rejects colors that are not 6-digit hex', async () => {
    await expect(updateTapPage(db, pageId, { color: 'url(x)' })).rejects.toMatchObject({ status: 400 })
  })

  it('only published pages have a public view', async () => {
    expect(await getPublishedView(db, 'cafe-luna')).toBeNull()
    await updateTapPage(db, pageId, { published: true })
    const v = await getPublishedView(db, 'cafe-luna')
    expect(v).toMatchObject({ slug: 'cafe-luna', profileType: 'business', showCover: true })
    expect(v!.content.name).toBe('Café Luna')
  })

  it('builds vCard input from the page', async () => {
    await updateTapPage(db, pageId, { published: true })
    const v = (await getPublishedView(db, 'cafe-luna'))!
    v.content.contact = { phone: '+63 917 123 4567', email: 'hello@cafeluna.ph', address: 'IT Park' }
    expect(tapPageVCardInput(v, 'https://tappd.ph/')).toEqual({
      kind: 'org', fullName: 'Café Luna', title: undefined, phones: ['+63 917 123 4567'], emails: ['hello@cafeluna.ph'],
      url: 'https://tappd.ph/cafe-luna', address: 'IT Park',
    })
  })
})
