import { describe, expect, it } from 'vitest'
import { defaultCardDesign, templateForPurpose } from '../../shared/cardDesign'

describe('card design defaults', () => {
  it.each([
    ['google_review', 'review'], ['instagram', 'follow'], ['facebook', 'follow'], ['tiktok', 'follow'],
    ['menu', 'menu'], ['business_card', 'business_card'], ['website', 'custom'], ['custom', 'custom'],
  ] as const)('%s → %s template', (p, t) => {
    expect(templateForPurpose(p)).toBe(t)
  })

  it('review cards default to "Review us" with the strip on', () => {
    expect(defaultCardDesign('google_review')).toEqual({ template: 'review', headline: 'Review us', subtext: '', showStrip: true })
  })
})
