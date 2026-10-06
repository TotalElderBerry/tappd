import { describe, expect, it } from 'vitest'
import { TAP_PAGE_TEMPLATES, forEachUrl, newTapPageContent } from '../../shared/tapPage/templates'
import { isAllowedUrl } from '../../shared/urls'

describe('Tap Page templates', () => {
  it.each(['business', 'personal'] as const)('%s has 7 days of hours', t => {
    expect(TAP_PAGE_TEMPLATES[t].content.hours).toHaveLength(7)
  })

  it.each(['business', 'personal'] as const)('%s only uses empty or allowed URLs', t => {
    const urls: string[] = []
    forEachUrl(TAP_PAGE_TEMPLATES[t].content, u => urls.push(u))
    expect(urls.length).toBeGreaterThan(5)
    for (const u of urls) expect(u === '' || isAllowedUrl(u)).toBe(true)
  })

  it('keeps the 07 sample colors', () => {
    expect(TAP_PAGE_TEMPLATES.business.color).toBe('#3b2418')
    expect(TAP_PAGE_TEMPLATES.personal.color).toBe('#1f3a8a')
  })
})

describe('newTapPageContent', () => {
  it('sets the name, blanks contact details and every URL', () => {
    const c = newTapPageContent('business', 'Kape Kita')
    expect(c.name).toBe('Kape Kita')
    expect(c.first).toBe('Kape Kita')
    expect(c.tagline).toBe('')
    expect(c.contact).toEqual({ phone: '', email: '', address: '' })
    const urls: string[] = []
    forEachUrl(c, u => urls.push(u))
    expect(urls.every(u => u === '')).toBe(true)
  })

  it('uses the first word as "first" for personal pages', () => {
    expect(newTapPageContent('personal', 'Maria Santos').first).toBe('Maria')
  })

  it('does not mutate the template', () => {
    newTapPageContent('business', 'X')
    expect(TAP_PAGE_TEMPLATES.business.content.name).toBe('Café Luna')
    expect(TAP_PAGE_TEMPLATES.business.content.quick[0]!.url).toBe('tel:+639171234567')
  })
})
