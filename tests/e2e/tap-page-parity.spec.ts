import { test } from '@playwright/test'
import { expectSameAsDesign, openDesign, settle } from './helpers/parity'

const CASES = [['cafeluna', 'business'], ['andrea', 'personal']] as const

for (const [slug, type] of CASES) {
  for (const vp of [{ width: 375, height: 812 }, { width: 1280, height: 900 }]) {
    test(`/${slug} matches design/07 (${type}) at ${vp.width}px`, async ({ page }, testInfo) => {
      await page.setViewportSize(vp)
      await openDesign(page, 'design/07-tap-page-sample.html')
      if (type === 'personal') await page.click('.seg button[data-type="personal"]')
      await page.addStyleTag({ content: '.ctrls{display:none!important}' }) // demo-only strip (spec §2.1)
      const designShot = await page.screenshot({ fullPage: true })
      await page.goto(`/${slug}`)
      await settle(page)
      await expectSameAsDesign(page, testInfo, `tap-${slug}-${vp.width}.png`, designShot)
    })
  }
}
