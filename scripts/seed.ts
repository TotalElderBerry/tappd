import { config } from 'dotenv'
import { createDb } from '../server/db/client'
import { seed } from '../server/db/seed'

const args = process.argv.slice(2)
const envFile = args.includes('--env') ? args[args.indexOf('--env') + 1] : '.env'
config({ path: envFile, override: true })

const reset = args.includes('--reset')
const { DATABASE_URL, ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME = 'Tappd Admin', ALLOW_DB_RESET } = process.env

if (!DATABASE_URL || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error(`Missing DATABASE_URL, ADMIN_EMAIL or ADMIN_PASSWORD in ${envFile}`)
  process.exit(1)
}
if (reset && ALLOW_DB_RESET !== '1') {
  console.error('Refusing to wipe the database: set ALLOW_DB_RESET=1 (never on production)')
  process.exit(1)
}

const result = await seed(createDb(DATABASE_URL), { reset, admin: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD, name: ADMIN_NAME } })
console.log(result.skipped ? 'Admin updated. Demo data already present, left as is.' : 'Seeded admin and demo data.')
process.exit(0)
