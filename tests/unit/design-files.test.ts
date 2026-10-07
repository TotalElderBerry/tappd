import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

// The two design files are the source of truth (spec §2.1). If this fails, a design file was edited.
const PINNED: Record<string, string> = {
  'design/05-website.html': '359afc4648b8b69f63a7444584c5170de5f1c9c7cb687a35ca1998ce5bfe80f3',
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
