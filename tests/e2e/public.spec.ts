import { expect, test } from '@playwright/test'
import { E2E_CODES, E2E_URL } from '../../server/db/seed'

test.describe('card links', () => {
  test('url card: 302 to the destination, never cached', async ({ request }) => {
    const res = await request.get(`/t/${E2E_CODES.url}`, { maxRedirects: 0 })
    expect(res.status()).toBe(302)
    expect(res.headers().location).toBe(E2E_URL)
    expect(res.headers()['cache-control']).toBe('no-store')
  })

  test('uppercase codes resolve', async ({ request }) => {
    const res = await request.get(`/t/${E2E_CODES.url.toUpperCase()}`, { maxRedirects: 0 })
    expect(res.status()).toBe(302)
  })

  test('tap page card redirects to /cafeluna', async ({ request, baseURL }) => {
    const res = await request.get(`/t/${E2E_CODES.tapPage}`, { maxRedirects: 0 })
    expect(res.status()).toBe(302)
    expect(res.headers().location).toBe(`${baseURL}/cafeluna`)
  })

  test('vcard card downloads a contact file', async ({ request }) => {
    const res = await request.get(`/t/${E2E_CODES.vcard}`, { maxRedirects: 0 })
    expect(res.status()).toBe(200)
    expect(res.headers()['content-type']).toContain('text/vcard')
    expect(await res.text()).toContain('FN:Rico Dela Cruz')
  })

  for (const code of [E2E_CODES.none, E2E_CODES.inactive]) {
    test(`card ${code} shows the not-set-up page`, async ({ request }) => {
      const res = await request.get(`/t/${code}`, { maxRedirects: 0 })
      expect(res.status()).toBe(200)
      expect(res.headers()['cache-control']).toBe('no-store')
      expect(await res.text()).toContain("This card isn't set up yet")
    })
  }

  test('unknown code is a branded 404', async ({ request }) => {
    const res = await request.get('/t/zzzzzz', { maxRedirects: 0 })
    expect(res.status()).toBe(404)
    expect(await res.text()).toContain('Card not found')
  })
})

test("the marketing page's sample Tap Page link opens /cafeluna", async ({ request }) => {
  const res = await request.get('/07-tap-page-sample.html', { maxRedirects: 0 })
  expect(res.status()).toBe(302)
  expect(res.headers().location).toBe('/cafeluna')
})

test.describe('tap pages', () => {
  test('published page renders with its name as title', async ({ page }) => {
    await page.goto('/cafeluna')
    await expect(page.locator('#idcol h1')).toHaveText('Café Luna')
    await expect(page).toHaveTitle('Café Luna')
    await expect(page.locator('.ctrls')).toHaveCount(0)
  })

  test('unpublished and unknown pages are 404', async ({ request }) => {
    expect((await request.get('/draft-page')).status()).toBe(404)
    expect((await request.get('/no-such-page')).status()).toBe(404)
  })

  test('contact.vcf downloads the page contact', async ({ request }) => {
    const res = await request.get('/cafeluna/contact.vcf')
    expect(res.headers()['content-type']).toContain('text/vcard')
    expect(res.headers()['content-disposition']).toContain('cafe-luna.vcf')
    expect(await res.text()).toContain('X-ABShowAs:COMPANY')
  })

  test('save-contact sheet uses the approved copy and closes with Escape', async ({ page }) => {
    await page.goto('/cafeluna')
    await page.click('#save')
    await expect(page.locator('#sheet')).toBeVisible()
    await expect(page.locator('#sheet p')).toHaveText("This downloads a contact card that opens straight in your phone's Contacts app.")
    await page.keyboard.press('Escape')
    await expect(page.locator('#sheet')).toBeHidden()
  })

  test('links open their real URL in a new tab', async ({ page, context }) => {
    await context.route('https://g.page/**', r => r.fulfill({ body: 'ok' }))
    await page.goto('/cafeluna')
    const [popup] = await Promise.all([context.waitForEvent('page'), page.click('.lk.feature')])
    await popup.waitForLoadState()
    expect(popup.url()).toBe('https://g.page/r/cafeluna/review')
  })

  test('tap pages never load Tailwind', async ({ request }) => {
    const html = await (await request.get('/cafeluna')).text()
    expect(html).not.toContain('--tw-')
  })
})
