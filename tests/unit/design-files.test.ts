import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

// The two design files are the source of truth (spec §2.1). If this fails, a design file was edited.
const PINNED: Record<string, string> = {
  'design/05-website.html': 'b1f69838e79e528035a036c5fd9b31ccd21f1582deea0351350df66624333f97',
  'design/07-tap-page-sample.html': '7fb1763736f69285378c9cc6f6f61f26150a0f1c565aede0e1b5c55d9511e22b',
}

describe('design files', () => {
  for (const [path, hash] of Object.entries(PINNED)) {
    it(`${path} is unchanged`, () => {
      const text = readFileSync(path, 'utf8').replace(/\r\n/g, '\n')
      expect(createHash('sha256').update(text).digest('hex')).toBe(hash)
    })
  }
})
