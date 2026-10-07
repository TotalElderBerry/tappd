import { expect, test } from '@playwright/test'
import { FROZEN, expectSameAsDesign, openDesign, settle } from './helpers/parity'

for (const vp of [{ width: 375, height: 812 }, { width: 1280, height: 900 }]) {
  test(`marketing page matches design/05 at ${vp.width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize(vp)
    await openDesign(page, 'design/05-website.html')
    const designShot = await page.screenshot({ fullPage: true })
    await page.clock.setFixedTime(FROZEN)
    await page.goto('/')
    await settle(page)
    await expectSameAsDesign(page, testInfo, `marketing-${vp.width}.png`, designShot)
  })
}

test('marketing script runs: tabs and Tap Pack picker', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle('Tappd')
  await page.click('#tab-web')
  await expect(page.locator('#pane-web')).toBeVisible()
  await page.click('#tab-cards')
  await page.click('.qty-pick button[data-n="3"]')
  await expect(page.locator('#pk-now')).toHaveText('₱1,644')
})

test('marketing page never loads Tailwind', async ({ request }) => {
  const html = await (await request.get('/')).text()
  expect(html).not.toContain('--tw-')
  expect(html).not.toMatch(/tailwindcss/i)
})
