import { type Page, expect } from '@playwright/test'

export async function loginUi(page: Page) {
  await page.goto('/admin/login')
  await page.fill('#email', process.env.ADMIN_EMAIL!)
  await page.fill('#password', process.env.ADMIN_PASSWORD!)
  await page.click('button[type=submit]')
  await expect(page.getByRole('heading', { name: 'Home' })).toBeVisible()
}
