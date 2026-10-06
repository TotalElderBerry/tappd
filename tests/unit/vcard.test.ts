import { describe, expect, it } from 'vitest'
import { buildVCard, vcardFilename } from '../../shared/vcard'

const lines = (s: string) => s.split('\r\n')

describe('buildVCard', () => {
  it('builds a 3.0 card for a person with CRLF endings', () => {
    const v = buildVCard({
      kind: 'individual', fullName: 'Andrea Villanueva', title: 'Licensed Real Estate Broker', org: 'Villanueva Realty',
      phones: ['+63 918 234 5678'], emails: ['andrea@villanuevarealty.ph'], url: 'https://tappd.ph/andrea', address: 'Cebu City',
    })
    expect(lines(v)).toEqual([
      'BEGIN:VCARD',
      'VERSION:3.0',
      'N:Villanueva;Andrea;;;',
      'FN:Andrea Villanueva',
      'ORG:Villanueva Realty',
      'TITLE:Licensed Real Estate Broker',
      'TEL;TYPE=CELL:+63 918 234 5678',
      'EMAIL;TYPE=INTERNET:andrea@villanuevarealty.ph',
      'URL:https://tappd.ph/andrea',
      'ADR;TYPE=WORK:;;Cebu City;;;;',
      'END:VCARD',
      '',
    ])
  })

  it('marks businesses as companies and omits empty fields', () => {
    const v = buildVCard({ kind: 'org', fullName: 'Café Luna', phones: [''], emails: [] })
    expect(lines(v)).toEqual(['BEGIN:VCARD', 'VERSION:3.0', 'N:;;;;', 'FN:Café Luna', 'ORG:Café Luna', 'X-ABShowAs:COMPANY', 'END:VCARD', ''])
  })

  it('escapes commas, semicolons, backslashes and newlines', () => {
    const v = buildVCard({ kind: 'org', fullName: 'A, B; C\\D', address: 'Line 1\nLine 2' })
    expect(v).toContain('FN:A\\, B\\; C\\\\D')
    expect(v).toContain('ADR;TYPE=WORK:;;Line 1\\nLine 2;;;;')
  })

  it('folds long lines at 75 characters with CRLF + space', () => {
    const v = buildVCard({ kind: 'org', fullName: 'X', photo: { base64: 'A'.repeat(200), type: 'JPEG' } })
    const photo = lines(v).filter(l => l.startsWith('PHOTO') || l.startsWith(' '))
    expect(photo[0]).toHaveLength(75)
    expect(photo.slice(1).every(l => l.startsWith(' ') && l.length <= 75)).toBe(true)
    expect(photo.map((l, i) => (i ? l.slice(1) : l)).join('')).toBe('PHOTO;ENCODING=b;TYPE=JPEG:' + 'A'.repeat(200))
  })
})

describe('vcardFilename', () => {
  it('slugifies the name', () => {
    expect(vcardFilename('Café Luna')).toBe('cafe-luna.vcf')
    expect(vcardFilename('☕️')).toBe('contact.vcf')
  })
})
