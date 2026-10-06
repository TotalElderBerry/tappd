import { desc, eq, ilike, or } from 'drizzle-orm'
import { type Customer, customers, orders, tapPages } from '../db/schema'
import type { Db } from '../db/types'
import { ServiceError } from './errors'

export interface CustomerInput {
  name: string
  contactName?: string | null
  phone?: string | null
  email?: string | null
  facebook?: string | null
  notes?: string | null
}

export async function createCustomer(db: Db, input: CustomerInput): Promise<Customer> {
  const [row] = await db.insert(customers).values(input).returning()
  return row!
}

export async function updateCustomer(db: Db, id: string, input: Partial<CustomerInput>): Promise<Customer> {
  const [row] = await db.update(customers).set(input).where(eq(customers.id, id)).returning()
  if (!row) throw new ServiceError(404, 'Customer not found')
  return row
}

export async function listCustomers(db: Db, search?: string): Promise<Customer[]> {
  const q = search?.trim()
  const like = `%${q}%`
  const where = q
    ? or(ilike(customers.name, like), ilike(customers.contactName, like), ilike(customers.phone, like), ilike(customers.email, like))
    : undefined
  return db.select().from(customers).where(where).orderBy(desc(customers.createdAt)).limit(200)
}

export async function getCustomerDetail(db: Db, id: string) {
  const [customer] = await db.select().from(customers).where(eq(customers.id, id))
  if (!customer) throw new ServiceError(404, 'Customer not found')
  const customerOrders = await db.select().from(orders).where(eq(orders.customerId, id)).orderBy(desc(orders.createdAt))
  const pages = await db.select().from(tapPages).where(eq(tapPages.customerId, id)).orderBy(desc(tapPages.createdAt))
  return { customer, orders: customerOrders, tapPages: pages }
}
