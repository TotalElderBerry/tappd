import { describe, expect, it } from 'vitest'
import { CODE_ALPHABET, CODE_LENGTH, chipUrl, generateCode, isValidCode, qrUrl } from '../../shared/codes'

describe('card codes', () => {
  it('alphabet has no look-alike characters', () => {
    for (const ch of '0o1li') expect(CODE_ALPHABET).not.toContain(ch)
    expect(CODE_ALPHABET).toHaveLength(31)
  })

  it('generates 6 characters from the alphabet', () => {
    for (let i = 0; i < 500; i++) {
      const c = generateCode()
      expect(c).toHaveLength(CODE_LENGTH)
      expect(isValidCode(c)).toBe(true)
    }
  })

  it('skips biased bytes (>= 248) instead of wrapping them', () => {
    const queue = [255, 250, 248, 0, 1, 2, 3, 4, 5]
    const fake = (n: number) => Uint8Array.from(queue.splice(0, n))
    expect(generateCode(fake)).toBe(CODE_ALPHABET.slice(0, 6))
  })

  it('isValidCode rejects wrong length and characters', () => {
    expect(isValidCode('x7k2qm')).toBe(true)
    expect(isValidCode('x7k2q')).toBe(false)
    expect(isValidCode('x7k2qo')).toBe(false)
    expect(isValidCode('X7K2QM')).toBe(false)
  })

  it('builds chip and QR URLs without double slashes', () => {
    expect(chipUrl('https://tappd.ph/', 'x7k2qm')).toBe('https://tappd.ph/t/x7k2qm')
    expect(qrUrl('https://tappd.ph', 'x7k2qm')).toBe('https://tappd.ph/t/x7k2qm?s=qr')
  })
})
