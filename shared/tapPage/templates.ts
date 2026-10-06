import type { DayHours } from '../hours'
import type { ProfileType, Section, TapPageContent } from '../types'

const h = (open: string | null, close: string | null): DayHours => ({ open, close })

export const TAP_PAGE_TEMPLATES: Record<ProfileType, { color: string; content: TapPageContent }> = {
  business: {
    color: '#3b2418',
    content: {
      name: 'Café Luna',
      first: 'Café Luna',
      role: '',
      tagline: 'Specialty coffee, pastries and all-day brunch in the heart of IT Park.',
      facts: [{ kind: 'status' }, { kind: 'icon', icon: 'pin', text: 'IT Park, Cebu City' }, { kind: 'rating', text: '4.8 on Google' }],
      hours: [h('08:00', '20:00'), h('07:00', '21:00'), h('07:00', '21:00'), h('07:00', '21:00'), h('07:00', '21:00'), h('07:00', '22:00'), h('08:00', '22:00')],
      statusWords: ['Open now', 'Closed'],
      quick: [
        { icon: 'call', label: 'Call', url: 'tel:+639171234567' },
        { icon: 'chat', label: 'Message', url: 'https://m.me/cafeluna' },
        { icon: 'nav', label: 'Directions', url: 'https://maps.google.com/?q=Cebu+IT+Park,+Lahug,+Cebu+City' },
        { icon: 'mail', label: 'Email', url: 'mailto:hello@cafeluna.ph' },
      ],
      contact: { phone: '+63 917 123 4567', email: 'hello@cafeluna.ph', address: 'Cebu IT Park, Lahug, Cebu City' },
      sections: [
        { type: 'links', title: 'Links', items: [
          { icon: 'star', title: 'Leave us a Google review', sub: 'Takes 30 seconds. It helps us a lot!', url: 'https://g.page/r/cafeluna/review', featured: true },
          { icon: 'menu', title: 'View our menu', sub: 'Coffee, pastries and brunch', url: 'https://cafeluna.ph/menu', featured: false },
          { icon: 'truck', title: 'Order for delivery', sub: 'GrabFood · foodpanda', url: 'https://food.grab.com/ph/en/', featured: false },
          { icon: 'cal', title: 'Book a table', sub: 'For groups of 6 or more', url: 'https://m.me/cafeluna', featured: false },
        ] },
        { type: 'socials', title: 'Follow us', items: [
          { icon: 'cam', label: 'Instagram', url: 'https://instagram.com/cafeluna' },
          { icon: 'like', label: 'Facebook', url: 'https://facebook.com/cafeluna' },
          { icon: 'note', label: 'TikTok', url: 'https://tiktok.com/@cafeluna' },
          { icon: 'people', label: 'Community', url: 'https://facebook.com/groups/cafeluna' },
        ] },
        { type: 'tiles', title: 'Customer favorites', art: 'food', items: [
          { title: 'Spanish latte', price: '₱165', url: '', imageUrl: null },
          { title: 'Butter croissant', price: '₱120', url: '', imageUrl: null },
          { title: 'Luna brunch plate', price: '₱325', url: '', imageUrl: null },
        ] },
        { type: 'duo', items: [
          { type: 'hours', title: 'Opening hours' },
          { type: 'location', title: 'Find us', line: 'Ground floor, Luna Building', sub: 'Cebu IT Park, Lahug, Cebu City', url: 'https://maps.google.com/?q=Cebu+IT+Park,+Lahug,+Cebu+City' },
        ] },
      ],
    },
  },
  personal: {
    color: '#1f3a8a',
    content: {
      name: 'Andrea Villanueva',
      first: 'Andrea',
      role: 'Licensed Real Estate Broker',
      tagline: 'Helping Cebu families and investors find the right home, from first viewing to turnover.',
      facts: [{ kind: 'status' }, { kind: 'icon', icon: 'pin', text: 'Metro Cebu' }, { kind: 'icon', icon: 'award', text: 'PRC-licensed' }],
      hours: [h(null, null), h('09:00', '18:00'), h('09:00', '18:00'), h('09:00', '18:00'), h('09:00', '18:00'), h('09:00', '18:00'), h('10:00', '16:00')],
      statusWords: ['Available now', 'Away'],
      quick: [
        { icon: 'call', label: 'Call', url: 'tel:+639182345678' },
        { icon: 'sms', label: 'Text', url: 'sms:+639182345678' },
        { icon: 'chat', label: 'Viber', url: 'viber://chat?number=%2B639182345678' },
        { icon: 'mail', label: 'Email', url: 'mailto:andrea@villanuevarealty.ph' },
      ],
      contact: { phone: '+63 918 234 5678', email: 'andrea@villanuevarealty.ph', address: 'Villanueva Realty · Cebu City' },
      sections: [
        { type: 'about', title: 'About me', text: "I've spent 8 years matching buyers with homes and condos across Metro Cebu. I handle the paperwork, bank financing and turnover, so you can focus on picking the right place.", chips: [
          { icon: 'award', text: 'PRC-licensed broker' }, { icon: 'check', text: '8 years in real estate' }, { icon: 'people', text: '120+ families helped' },
        ] },
        { type: 'links', title: 'Work with me', items: [
          { icon: 'cal', title: 'Book a free consultation', sub: '30 minutes, online or in person', url: 'https://calendly.com/andrea-villanueva', featured: true },
          { icon: 'home', title: 'View my current listings', sub: 'Condos, house and lots, lots', url: 'https://villanuevarealty.ph/listings', featured: false },
          { icon: 'grid', title: 'Past projects', sub: "Homes I've helped close", url: 'https://villanuevarealty.ph/projects', featured: false },
          { icon: 'doc', title: 'Download my profile', sub: 'PDF · 1 page', url: 'https://villanuevarealty.ph/andrea.pdf', featured: false },
        ] },
        { type: 'tiles', title: 'Featured listings', art: 'homes', items: [
          { title: '2BR townhouse, Talamban', price: '₱6.8M', url: '', imageUrl: null },
          { title: 'Studio condo, IT Park', price: '₱3.2M', url: '', imageUrl: null },
          { title: 'House & lot, Liloan', price: '₱4.5M', url: '', imageUrl: null },
        ] },
        { type: 'socials', title: 'Connect', items: [
          { icon: 'brief', label: 'LinkedIn', url: 'https://linkedin.com/in/andreavillanueva' },
          { icon: 'like', label: 'Facebook', url: 'https://facebook.com/andreavillanuevarealty' },
          { icon: 'cam', label: 'Instagram', url: 'https://instagram.com/andrea.homes' },
        ] },
        { type: 'duo', items: [
          { type: 'hours', title: 'Availability' },
          { type: 'areas', title: 'Areas I serve', items: ['Cebu City', 'Mandaue', 'Lapu-Lapu', 'Talisay', 'Consolacion', 'Liloan'] },
        ] },
      ],
    },
  },
}

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T

function mapSectionUrls(s: Section, fn: (url: string) => string): void {
  switch (s.type) {
    case 'links': s.items.forEach(i => { i.url = fn(i.url) }); break
    case 'socials': s.items.forEach(i => { i.url = fn(i.url) }); break
    case 'tiles': s.items.forEach(i => { i.url = fn(i.url) }); break
    case 'location': s.url = fn(s.url); break
    case 'duo': s.items.forEach(x => mapSectionUrls(x, fn)); break
  }
}

/** Visits every URL in the content (quick actions and section items). */
export function forEachUrl(c: TapPageContent, fn: (url: string) => void): void {
  const copy = clone(c)
  copy.quick.forEach(q => fn(q.url))
  copy.sections.forEach(s => mapSectionUrls(s, u => { fn(u); return u }))
}

/** Template structure with the customer's name; contact details and URLs blank so nothing from the sample leaks. */
export function newTapPageContent(type: ProfileType, name: string): TapPageContent {
  const c = clone(TAP_PAGE_TEMPLATES[type].content)
  c.name = name
  c.first = type === 'business' ? name : (name.trim().split(/\s+/)[0] ?? name)
  c.tagline = ''
  c.contact = { phone: '', email: '', address: '' }
  c.quick.forEach(q => { q.url = '' })
  c.sections.forEach(s => mapSectionUrls(s, () => ''))
  return c
}
