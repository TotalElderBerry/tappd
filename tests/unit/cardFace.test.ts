import { describe, expect, it } from 'vitest'
import { DEFAULT_ORDER_DESIGN, defaultCardDesign, handleFromUrl, inkFor, resolveCardFace } from '../../shared/cardDesign'

describe('inkFor', () => {
  it('uses white on dark brand colors and dark ink on light ones', () => {
    expect(inkFor('#5b3fd6')).toBe('#ffffff')
    expect(inkFor('#3b2418')).toBe('#ffffff')
    expect(inkFor('#ffd23f')).toBe('#17152a')
    expect(inkFor('#ffffff')).toBe('#17152a')
  })
})

describe('handleFromUrl', () => {
  it.each([
    ['https://instagram.com/cafeluna', '@cafeluna'],
    ['https://www.tiktok.com/@cafeluna/', '@cafeluna'],
    ['https://facebook.com/groups/cafeluna?ref=x', '@cafeluna'],
    ['https://g.page', ''],
    ['not a url', ''],
  ])('%s → %s', (url, handle) => expect(handleFromUrl(url)).toBe(handle))
})

describe('resolveCardFace', () => {
  it('follow cards show the handle from the destination', () => {
    const face = resolveCardFace(DEFAULT_ORDER_DESIGN, { design: defaultCardDesign('instagram'), purpose: 'instagram', destinationUrl: 'https://instagram.com/cafeluna', vcard: null }, 'Café Luna')
    expect(face).toMatchObject({ template: 'follow', headline: 'Follow us', handle: '@cafeluna', name: 'Café Luna', color: '#5b3fd6', ink: '#ffffff' })
  })

  it('business cards use the vCard name and lines', () => {
    const face = resolveCardFace(DEFAULT_ORDER_DESIGN, {
      design: defaultCardDesign('business_card'), purpose: 'business_card', destinationUrl: null,
      vcard: { fullName: 'Rico Dela Cruz', title: 'Owner', org: '', phones: ['+63 917 555 0101'], emails: [''], url: '', address: '' },
    }, 'Demo Bistro')
    expect(face.name).toBe('Rico Dela Cruz')
    expect(face.lines).toEqual(['Owner', '+63 917 555 0101'])
  })

  it('falls back to the default color and font for bad input', () => {
    const face = resolveCardFace({ color: 'red', logoUrl: null, fontPreset: 'nope' as never }, { design: defaultCardDesign('menu'), purpose: 'menu', destinationUrl: null, vcard: null }, 'X')
    expect(face.color).toBe('#5b3fd6')
    expect(face.fontDisplay).toContain('Bricolage')
  })
})
