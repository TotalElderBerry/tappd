import { Pool, neonConfig } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-serverless'
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres'
import pg from 'pg'
import ws from 'ws'
import * as schema from './schema'
import type { Db } from './types'

/** localhost URLs (e2e PGlite server, local Postgres) use node-postgres; everything else is Neon. */
export function isLocalUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname
    return host === 'localhost' || host === '127.0.0.1'
  } catch {
    return false
  }
}

export function createDb(url: string): Db {
  if (isLocalUrl(url)) {
    // PGlite's socket server serves one connection at a time.
    const pool = new pg.Pool({ connectionString: url, max: 1 })
    // An idle connection dropped by the server must not crash the process; the pool reconnects on next use.
    pool.on('error', err => console.error('[tappd] database connection dropped:', err.message))
    return drizzlePg(pool, { schema }) as unknown as Db
  }
  neonConfig.webSocketConstructor = ws
  return drizzle(new Pool({ connectionString: url }), { schema }) as unknown as Db
}

/** Closes the connection pool behind a Db created by createDb (scripts and test setup). */
export async function closeDb(db: Db): Promise<void> {
  await (db as unknown as { $client: { end: () => Promise<void> } }).$client.end()
}

let db: Db | undefined

export function useDb(): Db {
  if (!db) {
    const url = process.env.DATABASE_URL
    if (!url) throw new Error('DATABASE_URL is not set')
    db = createDb(url)
  }
  return db
}
