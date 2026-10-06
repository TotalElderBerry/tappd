import { beforeEach, describe, expect, it } from 'vitest'
import type { Db } from '../../../server/db/types'
import { createCustomer, getCustomerDetail, listCustomers, updateCustomer } from '../../../server/services/customers'
import { ServiceError } from '../../../server/services/errors'
import { createTestDb } from '../../helpers/db'
import { makeOrder } from '../../helpers/fixtures'

let db: Db
beforeEach(async () => { db = await createTestDb() })

describe('customers', () => {
  it('searches by name, contact, phone or email (case-insensitive)', async () => {
    await createCustomer(db, { name: 'Café Luna', phone: '+63 917 123 4567' })
    await createCustomer(db, { name: 'Kape Kita', email: 'hi@kapekita.ph' })
    expect((await listCustomers(db, 'luna')).map(c => c.name)).toEqual(['Café Luna'])
    expect((await listCustomers(db, '917')).map(c => c.name)).toEqual(['Café Luna'])
    expect((await listCustomers(db, 'KAPEKITA')).map(c => c.name)).toEqual(['Kape Kita'])
    expect(await listCustomers(db)).toHaveLength(2)
  })

  it('updates a customer and 404s on unknown ids', async () => {
    const c = await createCustomer(db, { name: 'Old' })
    expect((await updateCustomer(db, c.id, { name: 'New' })).name).toBe('New')
    await expect(updateCustomer(db, '00000000-0000-0000-0000-000000000000', { name: 'X' })).rejects.toMatchObject({ status: 404 })
  })

  it('detail includes orders and tap pages', async () => {
    const { customer } = await makeOrder(db, 'tap_page')
    const d = await getCustomerDetail(db, customer.id)
    expect(d.orders).toHaveLength(1)
    expect(d.tapPages).toHaveLength(1)
    await expect(getCustomerDetail(db, '00000000-0000-0000-0000-000000000000')).rejects.toBeInstanceOf(ServiceError)
  })
})
