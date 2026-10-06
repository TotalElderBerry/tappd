import { and, desc, eq, like, ne, or } from 'drizzle-orm'
import { customers, type TapPage, tapPages } from '../db/schema'
import type { Db, Executor } from '../db/types'
import { slugError, slugify } from '../../shared/slugs'
import { TAP_PAGE_TEMPLATES, newTapPageContent } from '../../shared/tapPage/templates'
import { HEX_COLOR_RE, type ProfileType, type TapPageContent, type TapPageView } from '../../shared/types'
import type { VCardInput } from '../../shared/vcard'
import { ServiceError } from './errors'

export async function uniqueSlug(db: Executor, base: string): Promise<string> {
  const rows = await db.select({ slug: tapPages.slug }).from(tapPages)
    .where(or(eq(tapPages.slug, base), like(tapPages.slug, `${base}-%`)))
  const taken = new Set(rows.map(r => r.slug))
  if (!taken.has(base)) return base
  for (let n = 2; ; n++) {
    const suffix = `-${n}`
    const s = base.slice(0, 40 - suffix.length).replace(/-+$/, '') + suffix
    if (!taken.has(s)) return s
  }
}

export async function createTapPage(
  db: Executor,
  input: { customerId: string; profileType: ProfileType; name?: string },
): Promise<TapPage> {
  const [customer] = await db.select({ name: customers.name }).from(customers).where(eq(customers.id, input.customerId))
  if (!customer) throw new ServiceError(404, 'Customer not found')
  const name = input.name ?? customer.name
  const slug = await uniqueSlug(db, slugify(name))
  const [row] = await db.insert(tapPages).values({
    customerId: input.customerId,
    slug,
    profileType: input.profileType,
    color: TAP_PAGE_TEMPLATES[input.profileType].color,
    content: newTapPageContent(input.profileType, name),
    published: false,
  }).returning()
  return row!
}

export interface TapPagePatch {
  slug?: string
  profileType?: ProfileType
  color?: string
  coverUrl?: string | null
  avatarUrl?: string | null
  showCover?: boolean
  showAvatar?: boolean
  published?: boolean
  content?: TapPageContent
}

export async function updateTapPage(db: Db, id: string, patch: TapPagePatch): Promise<TapPage> {
  if (patch.slug !== undefined) {
    const err = slugError(patch.slug)
    if (err) throw new ServiceError(400, err)
    const [clash] = await db.select({ id: tapPages.id }).from(tapPages).where(and(eq(tapPages.slug, patch.slug), ne(tapPages.id, id)))
    if (clash) throw new ServiceError(409, `The link /${patch.slug} is already taken`)
  }
  if (patch.color !== undefined && !HEX_COLOR_RE.test(patch.color)) {
    throw new ServiceError(400, 'Color must be a hex value like #3b2418')
  }
  const [row] = await db.update(tapPages).set(patch).where(eq(tapPages.id, id)).returning()
  if (!row) throw new ServiceError(404, 'Tap Page not found')
  return row
}

export async function getTapPage(db: Db, id: string): Promise<TapPage> {
  const [row] = await db.select().from(tapPages).where(eq(tapPages.id, id))
  if (!row) throw new ServiceError(404, 'Tap Page not found')
  return row
}

export async function listTapPages(db: Db): Promise<(TapPage & { customerName: string })[]> {
  const rows = await db.select({ page: tapPages, customerName: customers.name }).from(tapPages)
    .innerJoin(customers, eq(tapPages.customerId, customers.id)).orderBy(desc(tapPages.updatedAt))
  return rows.map(r => ({ ...r.page, customerName: r.customerName }))
}

export function toView(tp: TapPage): TapPageView {
  return {
    slug: tp.slug, profileType: tp.profileType, color: tp.color, coverUrl: tp.coverUrl, avatarUrl: tp.avatarUrl,
    showCover: tp.showCover, showAvatar: tp.showAvatar, content: tp.content,
  }
}

export async function getPublishedView(db: Db, slug: string): Promise<TapPageView | null> {
  const [row] = await db.select().from(tapPages).where(and(eq(tapPages.slug, slug), eq(tapPages.published, true)))
  return row ? toView(row) : null
}

export function tapPageVCardInput(view: TapPageView, base: string): VCardInput {
  const c = view.content
  return {
    kind: view.profileType === 'business' ? 'org' : 'individual',
    fullName: c.name,
    title: c.role || undefined,
    phones: [c.contact.phone],
    emails: [c.contact.email],
    url: `${base.replace(/\/+$/, '')}/${view.slug}`,
    address: c.contact.address || undefined,
  }
}
