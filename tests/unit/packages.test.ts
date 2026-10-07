import { describe, expect, it } from 'vitest'
import { PACKAGES, QuoteError, formatPeso, getPackage, quote } from '../../shared/packages'

describe('package catalog', () => {
  it('lists the seven packages from the pricing page', () => {
    expect(PACKAGES.map(p => p.key)).toEqual([
      'first_tap', 'tap_pack', 'fully_tappd', 'tappd_team', 'tap_page', 'launch_kit', 'custom_package',
    ])
  })

  it('only Tap Page includes a hosted Tap Page', () => {
    expect(PACKAGES.filter(p => p.includesTapPage).map(p => p.key)).toEqual(['tap_page'])
  })

  it('getPackage returns undefined for unknown keys', () => {
    expect(getPackage('nope')).toBeUndefined()
    expect(getPackage('fully_tappd')?.name).toBe('Fully Tappd')
    expect(getPackage('custom_package')?.name).toBe('Custom package')
  })
})

describe('quote', () => {
  it.each([
    ['first_tap', 1, 598, 698],
    ['tap_pack', 2, 1096, 1396],
    ['tap_pack', 3, 1644, 2094],
    ['fully_tappd', 4, 2000, 2792],
    ['tap_page', 1, 1498, 1798],
    ['launch_kit', 1, 3998, 4998],
  ] as const)('%s × %i = ₱%i (was ₱%i)', (key, n, now, was) => {
    expect(quote(key, n)).toEqual({ cardCount: n, pricePhp: now, regularPricePhp: was })
  })

  it('Tappd Team and Custom package use the admin price and have no regular price', () => {
    expect(quote('tappd_team', 12, 5400)).toEqual({ cardCount: 12, pricePhp: 5400, regularPricePhp: null })
    expect(quote('custom_package', 1, 15000)).toEqual({ cardCount: 1, pricePhp: 15000, regularPricePhp: null })
  })

  it.each([
    ['first_tap', 2],
    ['tap_pack', 1],
    ['tap_pack', 4],
    ['fully_tappd', 5],
    ['tappd_team', 5],
    ['launch_kit', 2],
    ['custom_package', 2],
  ] as const)('rejects %s with %i cards', (key, n) => {
    expect(() => quote(key, n, 1000)).toThrow(QuoteError)
  })

  it('custom-price packages require a positive whole-peso price', () => {
    expect(() => quote('tappd_team', 6)).toThrow(QuoteError)
    expect(() => quote('tappd_team', 6, 0)).toThrow(QuoteError)
    expect(() => quote('tappd_team', 6, 99.5)).toThrow(QuoteError)
    expect(() => quote('custom_package', 1)).toThrow(QuoteError)
  })

  it('rejects non-integer card counts', () => {
    expect(() => quote('tap_pack', 2.5)).toThrow(QuoteError)
  })
})

describe('formatPeso', () => {
  it('formats with peso sign and thousands separator', () => {
    expect(formatPeso(2500)).toBe('₱2,500')
    expect(formatPeso(599)).toBe('₱599')
  })
})
