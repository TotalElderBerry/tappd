import { eq } from 'drizzle-orm'
import { admins } from '../db/schema'
import type { Db } from '../db/types'
import { hashAdminPassword, verifyAdminPassword } from './password'

export async function upsertAdmin(db: Db, a: { email: string; password: string; name: string }): Promise<void> {
  const email = a.email.trim().toLowerCase()
  const passwordHash = await hashAdminPassword(a.password)
  await db.insert(admins).values({ email, name: a.name, passwordHash })
    .onConflictDoUpdate({ target: admins.email, set: { name: a.name, passwordHash } })
}

export async function authenticateAdmin(db: Db, email: string, password: string) {
  const [a] = await db.select().from(admins).where(eq(admins.email, email.trim().toLowerCase()))
  if (!a) {
    await hashAdminPassword(password) // same work either way, so response time doesn't reveal which emails exist
    return null
  }
  return (await verifyAdminPassword(password, a.passwordHash)) ? { id: a.id, email: a.email, name: a.name } : null
}
