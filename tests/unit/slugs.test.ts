import { describe, expect, it } from 'vitest'
import { slugError, slugify } from '../../shared/slugs'

describe('slugError', () => {
  it.each(['cafeluna', 'cafe-luna', 'a1', 'andrea-v-2'])('accepts %s', s => {
    expect(slugError(s)).toBeNull()
  })
  it.each(['a', 'Cafe', 'cafe_luna', '-cafe', 'cafe-', 'cafe--luna', 'x'.repeat(41)])('rejects %s', s => {
    expect(slugError(s)).not.toBeNull()
  })
  it.each(['admin', 'api', 't'])('rejects reserved %s', s => {
    expect(slugError(s)).toMatch(/reserved/i)
  })
})

describe('slugify', () => {
  it('strips accents and joins words with hyphens', () => {
    expect(slugify('Café Luna')).toBe('cafe-luna')
    expect(slugify('  Andrea  Villanueva ')).toBe('andrea-villanueva')
    expect(slugify("Mang Inasal's #1 Branch!")).toBe('mang-inasal-s-1-branch')
  })
  it('falls back to "page" when nothing usable remains', () => {
    expect(slugify('☕️')).toBe('page')
    expect(slugify('')).toBe('page')
  })
  it('caps length at 40 without a trailing hyphen', () => {
    const s = slugify('word '.repeat(20))
    expect(s.length).toBeLessThanOrEqual(40)
    expect(s.endsWith('-')).toBe(false)
  })
  it('never returns a reserved slug', () => {
    expect(slugify('Admin')).toBe('admin-page')
  })
})
