import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import { migrate } from 'drizzle-orm/pglite/migrator'
import * as schema from '../../server/db/schema'
import type { Db } from '../../server/db/types'

/** Fresh in-memory Postgres with all migrations applied. */
export async function createTestDb(): Promise<Db> {
  const db = drizzle(new PGlite(), { schema })
  await migrate(db, { migrationsFolder: 'server/db/migrations' })
  return db as unknown as Db
}
