import { describe, expect, it } from 'vitest'
import { PACKAGES, QuoteError, formatPeso, getPackage, quote } from '../../shared/packages'

describe('package catalog', () => {
  it('lists the seven packages from the pricing page', () => {
    expect(PACKAGES.map(p => p.key)).toEqual([
      'first_tap', 'tap_pack', 'fully_tappd', 'tappd_team', 'tap_page', 'launch_kit', 'fully_online',
    ])
  })

  it('only Tap Page includes a hosted Tap Page', () => {
    expect(PACKAGES.filter(p => p.includesTapPage).map(p => p.key)).toEqual(['tap_page'])
  })

  it('getPackage returns undefined for unknown keys', () => {
    expect(getPackage('nope')).toBeUndefined()
    expect(getPackage('fully_tappd')?.name).toBe('Fully Tappd')
  })
})

describe('quote', () => {
  it.each([
    ['first_tap', 1, 599, 699],
    ['tap_pack', 2, 1098, 1398],
    ['tap_pack', 3, 1647, 2097],
    ['tap_pack', 4, 2196, 2796],
    ['fully_tappd', 5, 2500, 3495],
    ['tap_page', 1, 1499, 1799],
    ['launch_kit', 2, 5999, 7999],
    ['fully_online', 5, 13999, 17999],
  ] as const)('%s × %i = ₱%i (was ₱%i)', (key, n, now, was) => {
    expect(quote(key, n)).toEqual({ cardCount: n, pricePhp: now, regularPricePhp: was })
  })

  it('Tappd Team uses the admin price and has no regular price', () => {
    expect(quote('tappd_team', 12, 5400)).toEqual({ cardCount: 12, pricePhp: 5400, regularPricePhp: null })
  })

  it.each([
    ['first_tap', 2],
    ['tap_pack', 1],
    ['tap_pack', 5],
    ['fully_tappd', 4],
    ['tappd_team', 5],
    ['launch_kit', 3],
  ] as const)('rejects %s with %i cards', (key, n) => {
    expect(() => quote(key, n, 1000)).toThrow(QuoteError)
  })

  it('Tappd Team requires a positive whole-peso price', () => {
    expect(() => quote('tappd_team', 6)).toThrow(QuoteError)
    expect(() => quote('tappd_team', 6, 0)).toThrow(QuoteError)
    expect(() => quote('tappd_team', 6, 99.5)).toThrow(QuoteError)
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
