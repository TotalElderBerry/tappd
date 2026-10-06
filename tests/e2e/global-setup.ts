import { PGlite } from '@electric-sql/pglite'
import { PGLiteSocketServer } from '@electric-sql/pglite-socket'
import { config } from 'dotenv'
import { migrate as migrateNeon } from 'drizzle-orm/neon-serverless/migrator'
import { migrate as migratePg } from 'drizzle-orm/node-postgres/migrator'
import { closeDb, createDb, isLocalUrl } from '../../server/db/client'
import { seed } from '../../server/db/seed'

export default async function globalSetup() {
  config({ path: '.env.test', override: true })
  const { DATABASE_URL, ALLOW_DB_RESET, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env
  if (!DATABASE_URL) throw new Error('.env.test needs DATABASE_URL (local PGlite URL or a Neon test branch)')
  if (ALLOW_DB_RESET !== '1') throw new Error('.env.test needs ALLOW_DB_RESET=1 — e2e tests wipe the database')
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) throw new Error('.env.test needs ADMIN_EMAIL and ADMIN_PASSWORD')

  // Local URL: run an in-memory Postgres (PGlite) for the whole test run. It lives in this runner process.
  let server: PGLiteSocketServer | undefined
  if (isLocalUrl(DATABASE_URL)) {
    const u = new URL(DATABASE_URL)
    server = new PGLiteSocketServer({ db: await PGlite.create(), host: u.hostname, port: Number(u.port || 5432) })
    await server.start()
  }

  const db = createDb(DATABASE_URL)
  const migrationsFolder = 'server/db/migrations'
  if (isLocalUrl(DATABASE_URL)) await migratePg(db as never, { migrationsFolder })
  else await migrateNeon(db as never, { migrationsFolder })
  await seed(db, { reset: true, admin: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD, name: 'E2E Admin' } })
  await closeDb(db) // free the single PGlite connection for the app server

  return async () => { await server?.stop() }
}
