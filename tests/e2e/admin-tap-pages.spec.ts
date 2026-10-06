import { expect, test } from '@playwright/test'
import { loginUi } from './helpers/auth'

async function newPage(page: import('@playwright/test').Page, name: string, template: 'business' | 'personal') {
  const customer = await (await page.request.post('/api/admin/customers', { data: { name } })).json()
  return (await page.request.post('/api/admin/tap-pages', { data: { customerId: customer.id, template } })).json()
}

test('edit with live preview, handle a taken slug, publish, and see it live', async ({ page }) => {
  await loginUi(page)
  const tp = await newPage(page, 'Editor Test Studio', 'personal')
  await page.goto(`/admin/tap-pages/${tp.id}`)
  const preview = page.frameLocator('iframe[title="Tap Page preview"]')
  await expect(preview.locator('#idcol h1')).toHaveText('Editor Test Studio')

  await page.fill('#tp-tagline', 'Portraits and brand shoots in Cebu')
  await expect(preview.locator('.tagline')).toHaveText('Portraits and brand shoots in Cebu')

  await page.fill('#tp-slug', 'andrea')
  await page.getByRole('button', { name: 'Save changes' }).click()
  await expect(page.getByText('The link /andrea is already taken')).toBeVisible()

  await page.fill('#tp-slug', 'editor-test-studio')
  await page.getByRole('button', { name: 'Save changes' }).click()
  await expect(page.getByRole('button', { name: 'Saved' })).toBeVisible()
  expect((await page.request.get('/editor-test-studio')).status()).toBe(404)

  await page.getByRole('switch', { name: 'Published' }).click()
  await expect(page.getByText('Tap Page is live')).toBeVisible()
  const live = await page.request.get('/editor-test-studio')
  expect(live.status()).toBe(200)
  expect(await live.text()).toContain('Portraits and brand shoots in Cebu')
})

test('leaving with unsaved edits asks first and keeps them on cancel', async ({ page }) => {
  await loginUi(page)
  const tp = await newPage(page, 'Unsaved Edits Shop', 'business')
  await page.goto(`/admin/tap-pages/${tp.id}`)
  await page.fill('#tp-tagline', 'Not saved yet')
  let asked = ''
  page.once('dialog', (d) => { asked = d.message(); void d.dismiss() })
  await page.getByRole('link', { name: 'Orders', exact: true }).click()
  await expect.poll(() => asked).toContain('unsaved')
  await expect(page).toHaveURL(new RegExp(`/admin/tap-pages/${tp.id}$`))
  await expect(page.locator('#tp-tagline')).toHaveValue('Not saved yet')
})

test('closing a day updates the preview hours', async ({ page }) => {
  await loginUi(page)
  const tp = await newPage(page, 'Hours Test Shop', 'business')
  await page.goto(`/admin/tap-pages/${tp.id}`)
  await page.getByRole('tab', { name: 'Hours' }).click()
  await page.getByRole('switch', { name: 'Monday closed' }).click()
  const preview = page.frameLocator('iframe[title="Tap Page preview"]')
  await expect(preview.locator('details.hours li', { hasText: 'Monday' })).toContainText('Closed')
})
