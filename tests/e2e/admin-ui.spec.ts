import { expect, test } from '@playwright/test'
import { loginUi } from './helpers/auth'

test('admin pages redirect to login when signed out', async ({ page }) => {
  await page.goto('/admin/orders')
  await expect(page).toHaveURL(/\/admin\/login$/)
})

test('wrong password shows an error', async ({ page }) => {
  await page.goto('/admin/login')
  await page.fill('#email', process.env.ADMIN_EMAIL!)
  await page.fill('#password', 'wrong-password')
  await page.click('button[type=submit]')
  await expect(page.getByRole('alert')).toHaveText('Invalid email or password')
})

test('dashboard shows counts and recent orders', async ({ page }) => {
  await loginUi(page)
  await expect(page.locator('[data-tile="Awaiting payment"]')).toBeVisible()
  await expect(page.getByText('Demo Bistro').first()).toBeVisible()
})
