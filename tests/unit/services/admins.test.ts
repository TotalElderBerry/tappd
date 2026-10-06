import { beforeEach, describe, expect, it } from 'vitest'
import type { Db } from '../../../server/db/types'
import { admins } from '../../../server/db/schema'
import { authenticateAdmin, upsertAdmin } from '../../../server/services/admins'
import { hashAdminPassword, verifyAdminPassword } from '../../../server/services/password'
import { createTestDb } from '../../helpers/db'

describe('password hashing', () => {
  it('verifies the right password only', async () => {
    const h = await hashAdminPassword('s3cret-pass')
    expect(h.startsWith('scrypt$')).toBe(true)
    expect(await verifyAdminPassword('s3cret-pass', h)).toBe(true)
    expect(await verifyAdminPassword('wrong', h)).toBe(false)
    expect(await verifyAdminPassword('s3cret-pass', 'garbage')).toBe(false)
  })

  it('salts each hash', async () => {
    expect(await hashAdminPassword('x')).not.toBe(await hashAdminPassword('x'))
  })
})

describe('admins', () => {
  let db: Db
  beforeEach(async () => { db = await createTestDb() })

  it('upserts by lowercased email and authenticates', async () => {
    await upsertAdmin(db, { email: 'Admin@Tappd.ph', password: 'one', name: 'A' })
    await upsertAdmin(db, { email: 'admin@tappd.ph', password: 'two', name: 'B' })
    expect(await db.select().from(admins)).toHaveLength(1)
    expect(await authenticateAdmin(db, 'ADMIN@tappd.ph ', 'two')).toMatchObject({ email: 'admin@tappd.ph', name: 'B' })
    expect(await authenticateAdmin(db, 'admin@tappd.ph', 'one')).toBeNull()
    expect(await authenticateAdmin(db, 'nobody@tappd.ph', 'two')).toBeNull()
  })
})
