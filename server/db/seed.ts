import { sql } from 'drizzle-orm'
import { generateCode } from '../../shared/codes'
import { TAP_PAGE_TEMPLATES } from '../../shared/tapPage/templates'
import { upsertAdmin } from '../services/admins'
import { updateCard } from '../services/cards'
import { createCustomer } from '../services/customers'
import { createOrder } from '../services/orders'
import { createTapPage, updateTapPage } from '../services/tapPages'
import { customers } from './schema'
import type { Db } from './types'

/** Fixed codes the e2e tests rely on. All use the card-code alphabet. */
export const E2E_CODES = { url: 'testur', tapPage: 'testtp', andrea: 'testan', vcard: 'testvc', none: 'testnn', inactive: 'testxx' } as const
export const E2E_URL = 'https://g.page/r/cafeluna/review'

const fromList = (list: string[]) => () => list.shift() ?? generateCode()

export async function seed(db: Db, opts: { reset: boolean; admin: { email: string; password: string; name: string } }) {
  if (opts.reset) await db.execute(sql`truncate table taps, cards, orders, tap_pages, customers, admins cascade`)
  await upsertAdmin(db, opts.admin)
  const [existing] = await db.select({ id: customers.id }).from(customers).limit(1)
  if (existing) return { skipped: true }

  const luna = await createCustomer(db, { name: 'Café Luna', contactName: 'Luna Reyes', phone: '+63 917 123 4567', email: 'hello@cafeluna.ph', facebook: 'facebook.com/cafeluna' })
  const lunaOrder = await createOrder(db, { customerId: luna.id, packageKey: 'tap_page' }, { generate: fromList([E2E_CODES.tapPage]) })
  await updateTapPage(db, lunaOrder.tapPages[0]!.id, { slug: 'cafeluna', published: true, ...TAP_PAGE_TEMPLATES.business })

  const andrea = await createCustomer(db, { name: 'Andrea Villanueva', phone: '+63 918 234 5678', email: 'andrea@villanuevarealty.ph' })
  const andreaOrder = await createOrder(db, { customerId: andrea.id, packageKey: 'tap_page' }, { generate: fromList([E2E_CODES.andrea]) })
  await updateTapPage(db, andreaOrder.tapPages[0]!.id, { slug: 'andrea', published: true, profileType: 'personal', ...TAP_PAGE_TEMPLATES.personal })

  const bistro = await createCustomer(db, { name: 'Demo Bistro', notes: 'Demo customer with one order per package' })
  const kit = await createOrder(db, { customerId: bistro.id, packageKey: 'fully_tappd' }, {
    generate: fromList([E2E_CODES.url, E2E_CODES.vcard, E2E_CODES.none, E2E_CODES.inactive]),
  })
  await updateCard(db, kit.cards[0]!.id, { destination: { type: 'url', url: E2E_URL } })
  await updateCard(db, kit.cards[1]!.id, {
    label: 'Owner business card', purpose: 'business_card',
    destination: { type: 'vcard', vcard: { fullName: 'Rico Dela Cruz', title: 'Owner', org: 'Demo Bistro', phones: ['+63 917 555 0101'], emails: ['rico@demobistro.ph'], url: '', address: 'Cebu City' } },
  })
  await updateCard(db, kit.cards[3]!.id, { destination: { type: 'url', url: 'https://tiktok.com/@demobistro' }, active: false })
  for (const packageKey of ['first_tap', 'tap_pack', 'launch_kit'] as const) {
    await createOrder(db, { customerId: bistro.id, packageKey })
  }
  await createOrder(db, { customerId: bistro.id, packageKey: 'custom_package', customPricePhp: 15000 })
  await createOrder(db, { customerId: bistro.id, packageKey: 'tappd_team', cardCount: 8, customPricePhp: 3600 })
  await createTapPage(db, { customerId: bistro.id, profileType: 'business', name: 'Draft Page' })
  return { skipped: false }
}
