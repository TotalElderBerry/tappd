import { describe, expect, it } from 'vitest'
import { cardPatch, createOrderInput, customerInput, tapPageContent } from '../../shared/schemas'
import { TAP_PAGE_TEMPLATES, newTapPageContent } from '../../shared/tapPage/templates'

describe('tapPageContent', () => {
  it('accepts both templates and a fresh blank page', () => {
    expect(tapPageContent.safeParse(TAP_PAGE_TEMPLATES.business.content).success).toBe(true)
    expect(tapPageContent.safeParse(TAP_PAGE_TEMPLATES.personal.content).success).toBe(true)
    expect(tapPageContent.safeParse(newTapPageContent('business', 'X')).success).toBe(true)
  })

  it('rejects unsafe links and normalizes bare domains', () => {
    const c = structuredClone(TAP_PAGE_TEMPLATES.business.content)
    c.quick[0]!.url = 'javascript:alert(1)'
    expect(tapPageContent.safeParse(c).success).toBe(false)
    c.quick[0]!.url = 'instagram.com/cafeluna'
    expect(tapPageContent.parse(c).quick[0]!.url).toBe('https://instagram.com/cafeluna')
  })

  it('needs exactly 7 days and valid HH:MM times', () => {
    const c = structuredClone(TAP_PAGE_TEMPLATES.business.content)
    expect(tapPageContent.safeParse({ ...c, hours: c.hours.slice(0, 6) }).success).toBe(false)
    c.hours[0] = { open: '24:00', close: '25:00' }
    expect(tapPageContent.safeParse(c).success).toBe(false)
  })
})

describe('cardPatch', () => {
  it('normalizes url destinations and rejects unsafe or empty ones', () => {
    expect(cardPatch.parse({ destination: { type: 'url', url: 'cafeluna.ph/menu' } }).destination)
      .toEqual({ type: 'url', url: 'https://cafeluna.ph/menu' })
    expect(cardPatch.safeParse({ destination: { type: 'url', url: 'javascript:alert(1)' } }).success).toBe(false)
    expect(cardPatch.safeParse({ destination: { type: 'url', url: '' } }).success).toBe(false)
  })
})

describe('customerInput / createOrderInput', () => {
  it('turns blank optional fields into null', () => {
    expect(customerInput.parse({ name: ' Café Luna ', email: '' })).toMatchObject({ name: 'Café Luna', email: null })
  })
  it('rejects unknown packages', () => {
    expect(createOrderInput.safeParse({ customerId: crypto.randomUUID(), packageKey: 'gold' }).success).toBe(false)
  })
})
