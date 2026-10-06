import { expect, test } from '@playwright/test'
import { loginUi } from './helpers/auth'

test('edit a card design with live preview and record approval', async ({ page }) => {
  await loginUi(page)
  const customer = await (await page.request.post('/api/admin/customers', { data: { name: 'Design Test Café' } })).json()
  const order = await (await page.request.post('/api/admin/orders', { data: { customerId: customer.id, packageKey: 'first_tap' } })).json()
  const code = order.cards[0].code

  await page.goto(`/admin/orders/${order.order.id}?card=${order.cards[0].id}`)
  await page.getByRole('tab', { name: 'Design' }).click()
  const headline = page.locator('[data-side="front"] [data-role="headline"]')
  await expect(headline).toHaveText('Review us')
  await page.fill('#ds-headline', 'Rate us!')
  await expect(headline).toHaveText('Rate us!')
  await page.getByRole('button', { name: 'Save design' }).click()
  await page.getByRole('switch', { name: 'Customer approved this design' }).click()

  await page.goto(`/admin/orders/${order.order.id}/write`)
  await expect(page.locator(`[data-write="${code}"]`)).not.toContainText('Design not approved')
  const card = await (await page.request.get(`/api/admin/cards/${order.cards[0].id}`)).json()
  expect(card.card.design.headline).toBe('Rate us!')
})
