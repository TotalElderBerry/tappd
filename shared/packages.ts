export type PackageKey =
  | 'first_tap' | 'tap_pack' | 'fully_tappd' | 'tappd_team'
  | 'tap_page' | 'launch_kit' | 'fully_online'
export type PackageLine = 'cards' | 'website'

export interface PackageDef {
  key: PackageKey
  line: PackageLine
  name: string
  summary: string
  minCards: number
  /** null = no upper bound (Tappd Team) */
  maxCards: number | null
  includesTapPage: boolean
  yearlyFeePhp: number | null
  /** Admin types the price (custom quote) */
  customPrice: boolean
}

export interface Quote { cardCount: number; pricePhp: number; regularPricePhp: number | null }

export class QuoteError extends Error {}

interface PriceRule { now: (n: number) => number; was: (n: number) => number }

// Mirrors design/05-website.html pricing (spec §4).
const PRICES: Partial<Record<PackageKey, PriceRule>> = {
  first_tap: { now: () => 599, was: () => 699 },
  tap_pack: { now: n => 549 * n, was: n => 699 * n },
  fully_tappd: { now: () => 2500, was: () => 3495 },
  tap_page: { now: () => 1499, was: () => 1799 },
  launch_kit: { now: () => 5999, was: () => 7999 },
  fully_online: { now: () => 13999, was: () => 17999 },
}

export const PACKAGES: readonly PackageDef[] = [
  { key: 'first_tap', line: 'cards', name: 'First Tap', summary: '1 card', minCards: 1, maxCards: 1, includesTapPage: false, yearlyFeePhp: null, customPrice: false },
  { key: 'tap_pack', line: 'cards', name: 'Tap Pack', summary: '2 to 4 cards', minCards: 2, maxCards: 4, includesTapPage: false, yearlyFeePhp: null, customPrice: false },
  { key: 'fully_tappd', line: 'cards', name: 'Fully Tappd', summary: '5-card kit', minCards: 5, maxCards: 5, includesTapPage: false, yearlyFeePhp: null, customPrice: false },
  { key: 'tappd_team', line: 'cards', name: 'Tappd Team', summary: '6+ cards, branches or staff', minCards: 6, maxCards: null, includesTapPage: false, yearlyFeePhp: null, customPrice: true },
  { key: 'tap_page', line: 'website', name: 'Tap Page', summary: '1-page profile + 1 card', minCards: 1, maxCards: 1, includesTapPage: true, yearlyFeePhp: 499, customPrice: false },
  { key: 'launch_kit', line: 'website', name: 'Launch Kit', summary: 'Custom landing page + 2 cards', minCards: 2, maxCards: 2, includesTapPage: false, yearlyFeePhp: 2499, customPrice: false },
  { key: 'fully_online', line: 'website', name: 'Fully Online', summary: 'Up to 5-page site + 5-card kit', minCards: 5, maxCards: 5, includesTapPage: false, yearlyFeePhp: 3999, customPrice: false },
]

export const PACKAGE_KEYS = PACKAGES.map(p => p.key) as readonly PackageKey[]

export function getPackage(key: string): PackageDef | undefined {
  return PACKAGES.find(p => p.key === key)
}

export function quote(key: PackageKey, cardCount: number, customPricePhp?: number): Quote {
  const def = getPackage(key)
  if (!def) throw new QuoteError(`Unknown package: ${key}`)
  if (!Number.isInteger(cardCount) || cardCount < def.minCards || (def.maxCards !== null && cardCount > def.maxCards)) {
    const range = def.maxCards === null ? `${def.minCards}+` : def.minCards === def.maxCards ? `${def.minCards}` : `${def.minCards}–${def.maxCards}`
    throw new QuoteError(`${def.name} takes ${range} cards`)
  }
  if (def.customPrice) {
    if (customPricePhp === undefined || !Number.isInteger(customPricePhp) || customPricePhp <= 0) {
      throw new QuoteError(`${def.name} needs a price in whole pesos`)
    }
    return { cardCount, pricePhp: customPricePhp, regularPricePhp: null }
  }
  const rule = PRICES[key]!
  return { cardCount, pricePhp: rule.now(cardCount), regularPricePhp: rule.was(cardCount) }
}

export function formatPeso(n: number): string {
  return '₱' + n.toLocaleString('en-PH')
}
