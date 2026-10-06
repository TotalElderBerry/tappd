import { describe, expect, it } from 'vitest'
import { isAllowedUrl, normalizeUrl } from '../../shared/urls'

describe('isAllowedUrl', () => {
  it.each([
    'https://g.page/r/cafeluna/review',
    'http://cafeluna.ph',
    'tel:+639171234567',
    'sms:+639182345678',
    'mailto:hello@cafeluna.ph',
    'viber://chat?number=%2B639182345678',
  ])('allows %s', u => expect(isAllowedUrl(u)).toBe(true))

  it.each([
    'javascript:alert(1)',
    ' JavaScript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'cafeluna.ph',
    'https://',
    'ftp://files.example.com',
    '',
  ])('rejects %s', u => expect(isAllowedUrl(u)).toBe(false))
})

describe('normalizeUrl', () => {
  it('adds https:// to bare domains', () => {
    expect(normalizeUrl('instagram.com/cafeluna')).toBe('https://instagram.com/cafeluna')
    expect(normalizeUrl('  www.cafeluna.ph ')).toBe('https://www.cafeluna.ph')
  })
  it('leaves URLs with a scheme alone (trimmed)', () => {
    expect(normalizeUrl(' tel:+639171234567 ')).toBe('tel:+639171234567')
    expect(normalizeUrl('javascript:alert(1)')).toBe('javascript:alert(1)')
  })
  it('stores allowed URLs in canonical, header-safe form', () => {
    expect(normalizeUrl('https://www.google.com/maps/place/咖啡')).toBe('https://www.google.com/maps/place/%E5%92%96%E5%95%A1')
    expect(normalizeUrl('https://cafeluna.ph/Café')).toBe('https://cafeluna.ph/Caf%C3%A9')
    expect(normalizeUrl('https://cafeluna.ph/a\nb')).toBe('https://cafeluna.ph/ab')
    expect(normalizeUrl('cafeluna.ph/menu')).toBe('https://cafeluna.ph/menu')
  })

  it('leaves empty strings empty', () => {
    expect(normalizeUrl('  ')).toBe('')
  })
})
