/** No 0/o, 1/l/i — codes are sometimes read off a card and typed by hand. */
export const CODE_ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789'
export const CODE_LENGTH = 6
const CODE_RE = /^[a-hjkmnp-z2-9]{6}$/
// Largest multiple of 31 below 256; bytes at or above it are skipped to avoid modulo bias.
const LIMIT = 248

const cryptoBytes = (n: number) => crypto.getRandomValues(new Uint8Array(n))

export function generateCode(randomBytes: (n: number) => Uint8Array = cryptoBytes): string {
  let out = ''
  while (out.length < CODE_LENGTH) {
    for (const b of randomBytes(CODE_LENGTH)) {
      if (b >= LIMIT) continue
      out += CODE_ALPHABET[b % CODE_ALPHABET.length]
      if (out.length === CODE_LENGTH) break
    }
  }
  return out
}

export function isValidCode(s: string): boolean {
  return CODE_RE.test(s)
}

const trimBase = (base: string) => base.replace(/\/+$/, '')

export function chipUrl(base: string, code: string): string {
  return `${trimBase(base)}/t/${code}`
}

export function qrUrl(base: string, code: string): string {
  return `${chipUrl(base, code)}?s=qr`
}
