import { expect, test } from '@playwright/test'
import { loginUi } from './helpers/auth'

async function newOrder(page: import('@playwright/test').Page) {
  const r = page.request
  const customer = await (await r.post('/api/admin/customers', { data: { name: `Cards Test ${Date.now()}` } })).json()
  return (await r.post('/api/admin/orders', { data: { customerId: customer.id, packageKey: 'first_tap' } })).json()
}

test('set a link in the card editor and the chip URL redirects there', async ({ page }) => {
  await loginUi(page)
  const order = await newOrder(page)
  const code = order.cards[0].code
  await page.goto(`/admin/orders/${order.order.id}`)
  await page.click(`[data-card="${code}"]`)
  await page.getByRole('combobox', { name: 'Destination type' }).click()
  await page.getByRole('option', { name: 'A link' }).click()
  await page.fill('#cd-url', 'instagram.com/cardstest')
  await page.getByRole('button', { name: 'Save card' }).click()
  await expect(page.locator(`[data-card="${code}"]`)).toContainText('https://instagram.com/cardstest')

  await page.getByRole('tab', { name: 'Programming' }).click()
  await expect(page.getByTestId('chip-url')).toHaveText(new RegExp(`/t/${code}$`))
  const res = await page.request.get(`/t/${code}`, { maxRedirects: 0 })
  expect(res.headers().location).toBe('https://instagram.com/cardstest')
})

test('header lookup opens the card, and Write chips tracks progress', async ({ page }) => {
  await loginUi(page)
  const order = await newOrder(page)
  const code = order.cards[0].code
  await page.fill('input[aria-label="Find a card by code"]', code.toUpperCase())
  await page.getByRole('button', { name: 'Find card' }).click()
  await expect(page.getByRole('heading', { name: new RegExp(code) })).toBeVisible()

  await page.goto(`/admin/orders/${order.order.id}/write`)
  await expect(page.getByTestId('base-url')).toContainText("This isn't https://tappd.ph")
  await expect(page.locator(`[data-write="${code}"]`)).toContainText('No destination')
  await page.locator(`[data-write="${code}"] [role="switch"]`).click()
  await expect(page.getByText('1 of 1 written')).toBeVisible()
})
