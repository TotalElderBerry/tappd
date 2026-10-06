import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { type Page, type TestInfo, expect } from '@playwright/test'

/** Tuesday 9:30 AM in Manila: Café Luna open, Andrea available. */
export const FROZEN = new Date('2026-10-06T01:30:00Z')

// The design files are fragments published inside a standard document skeleton. Nuxt renders the same skeleton.
const SKELETON = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">'

export async function settle(page: Page) {
  await page.waitForLoadState('networkidle')
  await page.evaluate(() => document.fonts.ready)
}

export async function openDesign(page: Page, file: string) {
  await page.clock.setFixedTime(FROZEN)
  await page.setContent(SKELETON + readFileSync(file, 'utf8'), { waitUntil: 'networkidle' })
  await settle(page)
}

/** Stores the design screenshot as the expected snapshot, then compares the app page against it. */
export async function expectSameAsDesign(page: Page, testInfo: TestInfo, name: string, designShot: Buffer) {
  const path = testInfo.snapshotPath(name)
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, designShot)
  expect(await page.screenshot({ fullPage: true })).toMatchSnapshot(name, { maxDiffPixelRatio: 0.01 })
}
