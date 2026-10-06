import { sql } from 'drizzle-orm'
import { boolean, check, index, integer, jsonb, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import type { CardDesign, CardVCard, OrderDesign, TapPageContent } from '../../shared/types'

const id = () => uuid('id').primaryKey().defaultRandom()
const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}

export const orderStatus = pgEnum('order_status', ['awaiting_payment', 'paid', 'in_production', 'delivered'])
export const cardPurpose = pgEnum('card_purpose', ['google_review', 'instagram', 'facebook', 'tiktok', 'menu', 'business_card', 'website', 'custom'])
export const destinationType = pgEnum('destination_type', ['none', 'url', 'tap_page', 'vcard'])
export const profileType = pgEnum('profile_type', ['business', 'personal'])
export const tapSource = pgEnum('tap_source', ['nfc', 'qr'])
export const tapDevice = pgEnum('tap_device', ['ios', 'android', 'other'])

export const admins = pgTable('admins', {
  id: id(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  ...timestamps,
})

export const customers = pgTable('customers', {
  id: id(),
  name: text('name').notNull(),
  contactName: text('contact_name'),
  phone: text('phone'),
  email: text('email'),
  facebook: text('facebook'),
  notes: text('notes'),
  ...timestamps,
})

export const tapPages = pgTable('tap_pages', {
  id: id(),
  customerId: uuid('customer_id').notNull().references(() => customers.id, { onDelete: 'cascade' }),
  slug: text('slug').notNull().unique(),
  profileType: profileType('profile_type').notNull().default('business'),
  color: text('color').notNull(),
  coverUrl: text('cover_url'),
  avatarUrl: text('avatar_url'),
  showCover: boolean('show_cover').notNull().default(true),
  showAvatar: boolean('show_avatar').notNull().default(true),
  published: boolean('published').notNull().default(false),
  content: jsonb('content').$type<TapPageContent>().notNull(),
  ...timestamps,
}, t => [index('tap_pages_customer_idx').on(t.customerId)])

export const orders = pgTable('orders', {
  id: id(),
  customerId: uuid('customer_id').notNull().references(() => customers.id, { onDelete: 'cascade' }),
  packageKey: text('package_key').notNull(),
  cardCount: integer('card_count').notNull(),
  pricePhp: integer('price_php').notNull(),
  regularPricePhp: integer('regular_price_php'),
  status: orderStatus('status').notNull().default('awaiting_payment'),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  notes: text('notes'),
  design: jsonb('design').$type<OrderDesign>().notNull(),
  ...timestamps,
}, t => [index('orders_customer_idx').on(t.customerId)])

export const cards = pgTable('cards', {
  id: id(),
  code: text('code').notNull().unique(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  position: integer('position').notNull().default(0),
  label: text('label').notNull(),
  purpose: cardPurpose('purpose').notNull(),
  destinationType: destinationType('destination_type').notNull().default('none'),
  destinationUrl: text('destination_url'),
  tapPageId: uuid('tap_page_id').references(() => tapPages.id, { onDelete: 'restrict' }),
  vcard: jsonb('vcard').$type<CardVCard>(),
  active: boolean('active').notNull().default(true),
  writtenAt: timestamp('written_at', { withTimezone: true }),
  design: jsonb('design').$type<CardDesign>().notNull(),
  designApprovedAt: timestamp('design_approved_at', { withTimezone: true }),
  ...timestamps,
}, t => [
  index('cards_order_idx').on(t.orderId),
  // spec §5 invariant: the field matching destination_type is set
  check('cards_destination_target', sql`(${t.destinationType} <> 'url' or ${t.destinationUrl} is not null) and (${t.destinationType} <> 'tap_page' or ${t.tapPageId} is not null) and (${t.destinationType} <> 'vcard' or ${t.vcard} is not null)`),
])

export const taps = pgTable('taps', {
  id: id(),
  cardId: uuid('card_id').notNull().references(() => cards.id, { onDelete: 'cascade' }),
  tappedAt: timestamp('tapped_at', { withTimezone: true }).notNull().defaultNow(),
  source: tapSource('source').notNull(),
  device: tapDevice('device').notNull(),
}, t => [index('taps_card_time_idx').on(t.cardId, t.tappedAt)])

export type Admin = typeof admins.$inferSelect
export type Customer = typeof customers.$inferSelect
export type TapPage = typeof tapPages.$inferSelect
export type Order = typeof orders.$inferSelect
export type Card = typeof cards.$inferSelect
export type Tap = typeof taps.$inferSelect
