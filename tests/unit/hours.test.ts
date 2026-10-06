import { describe, expect, it } from 'vitest'
import { type DayHours, computeStatus, fmtTime, manilaNow, rangeLabel } from '../../shared/hours'

const h = (open: string | null, close: string | null): DayHours => ({ open, close })
// Café Luna (07 sample): Sun 8–20, Mon–Thu 7–21, Fri 7–22, Sat 8–22
const LUNA: DayHours[] = [h('08:00', '20:00'), h('07:00', '21:00'), h('07:00', '21:00'), h('07:00', '21:00'), h('07:00', '21:00'), h('07:00', '22:00'), h('08:00', '22:00')]
// Andrea (07 sample): Sun closed, Mon–Fri 9–18, Sat 10–16
const ANDREA: DayHours[] = [h(null, null), h('09:00', '18:00'), h('09:00', '18:00'), h('09:00', '18:00'), h('09:00', '18:00'), h('09:00', '18:00'), h('10:00', '16:00')]

// 2026-10-06 is a Tuesday. Manila is UTC+8 (no DST).
describe('manilaNow', () => {
  it('converts to Manila weekday and minutes', () => {
    expect(manilaNow(new Date('2026-10-06T01:30:00Z'))).toEqual({ dayIndex: 2, minutes: 9 * 60 + 30 })
    expect(manilaNow(new Date('2026-10-05T16:00:00Z'))).toEqual({ dayIndex: 2, minutes: 0 })
  })
})

describe('fmtTime', () => {
  it.each([['00:00', '12:00 AM'], ['07:00', '7:00 AM'], ['07:30', '7:30 AM'], ['12:00', '12:00 PM'], ['13:05', '1:05 PM']])('%s → %s', (a, b) => {
    expect(fmtTime(a)).toBe(b)
  })
})

describe('rangeLabel', () => {
  it('formats open days with an en dash and closed days as Closed', () => {
    expect(rangeLabel(h('07:00', '21:00'))).toBe('7:00 AM – 9:00 PM')
    expect(rangeLabel(h(null, null))).toBe('Closed')
    expect(rangeLabel(h('09:00', '09:00'))).toBe('Closed')
  })
})

describe('computeStatus', () => {
  it('open now, until closing', () => {
    expect(computeStatus(LUNA, new Date('2026-10-06T01:30:00Z'))).toEqual({ open: true, dayIndex: 2, next: '· until 9:00 PM' })
  })
  it('before opening today', () => {
    expect(computeStatus(LUNA, new Date('2026-10-05T22:15:00Z'))).toEqual({ open: false, dayIndex: 2, next: '· back at 7:00 AM' })
  })
  it('after closing, back tomorrow', () => {
    expect(computeStatus(LUNA, new Date('2026-10-06T14:00:00Z'))).toEqual({ open: false, dayIndex: 2, next: '· back tomorrow 7:00 AM' })
  })
  it('skips closed days and names the weekday', () => {
    // Saturday 2026-10-10 17:00 Manila: Sat closes 16:00, Sun closed, Mon 9:00
    expect(computeStatus(ANDREA, new Date('2026-10-10T09:00:00Z'))).toEqual({ open: false, dayIndex: 6, next: '· back Monday 9:00 AM' })
  })
  it('handles half-hour opening', () => {
    const hrs = LUNA.map((d, i) => (i === 2 ? h('07:30', '21:00') : d))
    expect(computeStatus(hrs, new Date('2026-10-05T23:15:00Z')).next).toBe('· back at 7:30 AM')
    expect(computeStatus(hrs, new Date('2026-10-05T23:30:00Z')).open).toBe(true)
  })
  it('closing at midnight (00:00) means open until end of day', () => {
    const hrs = LUNA.map(() => h('07:00', '00:00'))
    expect(rangeLabel(hrs[2])).toBe('7:00 AM – 12:00 AM')
    // Tue 10:00 PM Manila
    expect(computeStatus(hrs, new Date('2026-10-06T14:00:00Z'))).toEqual({ open: true, dayIndex: 2, next: '· until 12:00 AM' })
  })

  it('overnight hours (18:00–02:00) stay open past midnight', () => {
    const bar = LUNA.map(() => h('18:00', '02:00'))
    expect(rangeLabel(bar[2])).toBe('6:00 PM – 2:00 AM')
    // Wed 1:00 AM Manila: still inside Tuesday's opening
    expect(computeStatus(bar, new Date('2026-10-06T17:00:00Z'))).toEqual({ open: true, dayIndex: 3, next: '· until 2:00 AM' })
    // Wed 3:00 AM Manila: closed, opens again this evening
    expect(computeStatus(bar, new Date('2026-10-06T19:00:00Z'))).toEqual({ open: false, dayIndex: 3, next: '· back at 6:00 PM' })
    // Tue 11:00 PM Manila: open
    expect(computeStatus(bar, new Date('2026-10-06T15:00:00Z')).open).toBe(true)
  })

  it('closed every day: closed with no "back" text', () => {
    expect(computeStatus(Array.from({ length: 7 }, () => h(null, null)), new Date('2026-10-06T01:30:00Z'))).toEqual({ open: false, dayIndex: 2, next: '' })
  })
})
