import { describe, expect, it } from 'vitest'
import { admins, customers } from '../../server/db/schema'
import { E2E_CODES, E2E_URL, seed } from '../../server/db/seed'
import { resolveCard } from '../../server/services/cards'
import { getPublishedView } from '../../server/services/tapPages'
import { createTestDb } from '../helpers/db'

const admin = { email: 'admin@tappd.ph', password: 'pw', name: 'Admin' }

describe('seed', () => {
  it('creates the two sample Tap Pages and the e2e cards', async () => {
    const db = await createTestDb()
    expect(await seed(db, { reset: false, admin })).toEqual({ skipped: false })
    expect((await getPublishedView(db, 'cafeluna'))?.content.name).toBe('Café Luna')
    expect((await getPublishedView(db, 'andrea'))?.profileType).toBe('personal')
    expect(await getPublishedView(db, 'draft-page')).toBeNull()
    const base = 'http://localhost:3100'
    expect(await resolveCard(db, E2E_CODES.url, base)).toMatchObject({ kind: 'redirect', location: E2E_URL })
    expect(await resolveCard(db, E2E_CODES.tapPage, base)).toMatchObject({ kind: 'redirect', location: `${base}/cafeluna` })
    expect(await resolveCard(db, E2E_CODES.andrea, base)).toMatchObject({ kind: 'redirect', location: `${base}/andrea` })
    expect(await resolveCard(db, E2E_CODES.vcard, base)).toMatchObject({ kind: 'vcard' })
    expect(await resolveCard(db, E2E_CODES.none, base)).toEqual({ kind: 'not_set_up' })
    expect(await resolveCard(db, E2E_CODES.inactive, base)).toEqual({ kind: 'not_set_up' })
  })

  it('skips demo data when customers exist, and reset wipes first', async () => {
    const db = await createTestDb()
    await seed(db, { reset: false, admin })
    expect(await seed(db, { reset: false, admin })).toEqual({ skipped: true })
    expect(await seed(db, { reset: true, admin })).toEqual({ skipped: false })
    expect(await db.select().from(admins)).toHaveLength(1)
    expect((await db.select().from(customers)).map(c => c.name).sort()).toEqual(['Andrea Villanueva', 'Café Luna', 'Demo Bistro'])
  })
})
