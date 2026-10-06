import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { splitDesign } from '../../shared/designSource'

const read = (p: string) => readFileSync(p, 'utf8')

describe('splitDesign', () => {
  it('splits the marketing site', () => {
    const d = splitDesign(read('design/05-website.html'))
    expect(d.title).toBe('Tappd')
    expect(d.fontsHref).toMatch(/^https:\/\/fonts\.googleapis\.com\/css2\?family=Bricolage/)
    expect(d.css).toContain('--brand:#5b3fd6')
    expect(d.css).not.toContain('<style>')
    expect(d.body.startsWith('<nav aria-label="Main">')).toBe(true)
    expect(d.body.endsWith('</footer>')).toBe(true)
    expect(d.script).toContain('const tabs=')
  })

  it('splits the Tap Page sample', () => {
    const d = splitDesign(read('design/07-tap-page-sample.html'))
    expect(d.title).toBe('Tap Page Sample')
    expect(d.css).toContain('.page{max-width:460px')
  })

  it('throws on HTML without style or script', () => {
    expect(() => splitDesign('<p>nope</p>')).toThrow()
  })
})
