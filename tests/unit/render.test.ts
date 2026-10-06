import { describe, expect, it } from 'vitest'
import { TAP_PAGE_TEMPLATES } from '../../shared/tapPage/templates'
import { accentCss, contactLines, pageClass, renderContent, renderCover, renderIdCol } from '../../shared/tapPage/render'
import type { TapPageView } from '../../shared/types'

const OPEN_TUE = new Date('2026-10-06T01:30:00Z') // Tue 9:30 AM Manila

const view = (type: 'business' | 'personal' = 'business', patch: Partial<TapPageView> = {}): TapPageView => ({
  slug: 'cafeluna', profileType: type, color: TAP_PAGE_TEMPLATES[type].color, coverUrl: null, avatarUrl: null,
  showCover: true, showAvatar: true, content: structuredClone(TAP_PAGE_TEMPLATES[type].content), ...patch,
})

describe('renderContent', () => {
  it('renders links with data-href and the featured class', () => {
    const html = renderContent(view(), OPEN_TUE)
    expect(html).toContain('<button class="lk feature" type="button" data-href="https://g.page/r/cafeluna/review">')
    expect(html).toContain('<section class="sect"><h2>Follow us</h2>')
  })

  it('omits data-href for empty and unsafe URLs', () => {
    const v = view()
    const links = v.content.sections[0]!
    if (links.type !== 'links') throw new Error('expected links')
    links.items[0]!.url = 'javascript:alert(1)'
    const html = renderContent(v, OPEN_TUE)
    expect(html).not.toContain('javascript:')
    expect(html).toContain('<button class="tile" type="button"><div class="ph"') // tiles have url ''
  })

  it('marks today in the hours list, Monday first', () => {
    const html = renderContent(view(), OPEN_TUE)
    expect(html).toContain('<summary><span>Today · 7:00 AM – 9:00 PM</span>')
    expect(html).toContain('<li class=""><span>Monday</span><span>7:00 AM – 9:00 PM</span></li><li class="today"><span>Tuesday</span>')
  })

  it('renders an uploaded tile photo instead of placeholder art', () => {
    const v = view()
    const tiles = v.content.sections[2]!
    if (tiles.type !== 'tiles') throw new Error('expected tiles')
    tiles.items[0]!.imageUrl = 'https://blob.example/latte.jpg'
    expect(renderContent(v, OPEN_TUE)).toContain('<img src="https://blob.example/latte.jpg" alt=""')
  })

  it('renders nothing for a page without sections', () => {
    const v = view()
    v.content.sections = []
    expect(renderContent(v, OPEN_TUE)).toBe('')
  })
})

describe('renderIdCol', () => {
  it('shows open status, escaped name and the save note', () => {
    const v = view()
    v.content.name = 'Café <Luna>'
    const html = renderIdCol(v, OPEN_TUE)
    expect(html).toContain('<h1>Café &lt;Luna&gt;</h1>')
    expect(html).toContain('<span class="status open"><span class="dot"></span><b>Open now</b><span>· until 9:00 PM</span></span>')
    expect(html).toContain(`<p class="save-note">Adds Café Luna to your phone's contacts in one tap</p>`)
    expect(html).toContain('data-href="tel:+639171234567"')
  })

  it('renders a sparse page: no quick actions, closed every day', () => {
    const v = view()
    v.content.quick = []
    v.content.hours = Array.from({ length: 7 }, () => ({ open: null, close: null }))
    const html = renderIdCol(v, OPEN_TUE)
    expect(html).toContain('<nav class="quick" aria-label="Quick actions"></nav>')
    expect(html).toContain('<b>Closed</b><span></span>')
  })

  it('shows the role line for personal pages', () => {
    expect(renderIdCol(view('personal'), OPEN_TUE)).toContain('<p class="role">Licensed Real Estate Broker</p>')
  })
})

describe('cover, classes, accent, contact', () => {
  it('uses the sample SVG cover unless a cover is uploaded', () => {
    expect(renderCover(view())).toContain('id="beans"')
    expect(renderCover(view('business', { coverUrl: 'https://b/x.jpg"><script>' }))).toContain('<img src="https://b/x.jpg&quot;&gt;&lt;script&gt;" alt="">')
    expect(renderCover(view())).toContain('<button class="share" type="button" id="share" aria-label="Share this page">')
  })

  it('maps show toggles to nocover / noavatar', () => {
    expect(pageClass(view())).toBe('page')
    expect(pageClass(view('business', { showCover: false, showAvatar: false }))).toBe('page nocover noavatar')
  })

  it('computes the 07 accent-soft colors and rejects non-hex input', () => {
    const css = accentCss('#3b2418')
    expect(css).toContain('--accent:#3b2418;--accent-soft:rgb(235,233,232)')
    expect(css).toContain('color-mix(in srgb, #3b2418 30%, #1a1816)')
    expect(accentCss('red;}body{display:none')).toContain('--accent:#5b3fd6')
  })

  it('lists non-empty contact lines', () => {
    const c = view().content
    c.contact.email = ''
    expect(contactLines(c)).toEqual(['+63 917 123 4567', 'Cebu IT Park, Lahug, Cebu City'])
  })
})
