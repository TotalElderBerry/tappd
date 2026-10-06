import type { Db } from '../../server/db/types'
import type { PackageKey } from '../../shared/packages'
import { createCustomer } from '../../server/services/customers'
import { createOrder } from '../../server/services/orders'

export const makeCustomer = (db: Db, name = 'Café Luna') => createCustomer(db, { name })

export async function makeOrder(db: Db, packageKey: PackageKey = 'fully_tappd', customerName = 'Café Luna') {
  const customer = await makeCustomer(db, customerName)
  return createOrder(db, { customerId: customer.id, packageKey })
}
