import { expect, test } from '@playwright/test'
import { loginUi } from './helpers/auth'

test('create a customer and a Fully Tappd order from the UI', async ({ page }) => {
  await loginUi(page)
  await page.goto('/admin/customers')
  await page.getByRole('button', { name: 'New customer' }).click()
  await page.fill('#c-name', 'UI Flow Bakery')
  await page.getByRole('button', { name: 'Create customer' }).click()
  await expect(page.getByRole('heading', { name: 'UI Flow Bakery' })).toBeVisible()

  await page.getByRole('link', { name: 'New order' }).click()
  await page.click('[data-package="tap_pack"]')
  await page.getByRole('button', { name: '3', exact: true }).click()
  await expect(page.getByTestId('quote')).toHaveText('₱1,644 (regular ₱2,094)')
  await page.click('[data-package="fully_tappd"]')
  await expect(page.getByTestId('quote')).toHaveText('₱2,000 (regular ₱2,792)')
  await page.getByRole('button', { name: 'Create order' }).click()

  await expect(page.getByRole('heading', { name: 'Fully Tappd · 4 cards' })).toBeVisible()
  await expect(page.locator('[data-card]')).toHaveCount(4)
  await page.click('[data-status="paid"]')
  await expect(page.locator('[data-status="paid"]')).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByText(/^Paid \d/)).toBeVisible()
})

test('orders list filters by status', async ({ page }) => {
  await loginUi(page)
  await page.goto('/admin/orders?status=in_production')
  await expect(page.getByText('No orders yet')).toBeVisible()
})
