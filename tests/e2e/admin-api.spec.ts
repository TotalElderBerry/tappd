import { expect, test } from '@playwright/test'

const login = (request: import('@playwright/test').APIRequestContext) =>
  request.post('/api/auth/login', { data: { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD } })

test('admin API requires a session', async ({ request }) => {
  expect((await request.get('/api/admin/customers')).status()).toBe(401)
  expect((await request.get('/api/admin/dashboard')).status()).toBe(401)
})

test('login rejects a wrong password', async ({ request }) => {
  const res = await request.post('/api/auth/login', { data: { email: process.env.ADMIN_EMAIL, password: 'nope' } })
  expect(res.status()).toBe(401)
})

test('customer → order → card destination → tap is counted', async ({ request }) => {
  expect((await login(request)).ok()).toBe(true)

  const customer = await (await request.post('/api/admin/customers', { data: { name: 'E2E Flow Café' } })).json()
  const detail = await (await request.post('/api/admin/orders', { data: { customerId: customer.id, packageKey: 'tap_pack', cardCount: 3 } })).json()
  expect(detail.cards).toHaveLength(3)
  expect(detail.order.pricePhp).toBe(1647)

  const card = detail.cards[0]
  const ok = await request.patch(`/api/admin/cards/${card.id}`, { data: { destination: { type: 'url', url: 'example.com/menu' } } })
  expect((await ok.json()).destinationUrl).toBe('https://example.com/menu')
  const bad = await request.patch(`/api/admin/cards/${card.id}`, { data: { destination: { type: 'url', url: 'javascript:alert(1)' } } })
  expect(bad.status()).toBe(400)

  const tap = await request.get(`/t/${card.code}?s=qr`, { maxRedirects: 0 })
  expect(tap.status()).toBe(302)
  await expect.poll(async () => (await (await request.get(`/api/admin/cards/${card.id}`)).json()).stats.qr).toBe(1)

  const found = await (await request.get(`/api/admin/cards/lookup?code=${card.code.toUpperCase()}`)).json()
  expect(found).toEqual({ id: card.id, orderId: detail.order.id })
})

test('bad ids are 404, not server errors', async ({ request }) => {
  await login(request)
  expect((await request.get('/api/admin/orders/not-a-uuid')).status()).toBe(404)
  expect((await request.get('/api/admin/orders/00000000-0000-4000-8000-000000000000')).status()).toBe(404)
})
