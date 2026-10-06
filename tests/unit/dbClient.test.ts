import { describe, expect, it } from 'vitest'
import { isLocalUrl } from '../../server/db/client'

describe('isLocalUrl', () => {
  it('treats localhost Postgres URLs as local (node-postgres driver)', () => {
    expect(isLocalUrl('postgresql://postgres:postgres@127.0.0.1:5439/postgres')).toBe(true)
    expect(isLocalUrl('postgres://u:p@localhost:5432/db')).toBe(true)
  })

  it('treats Neon and malformed URLs as remote (Neon driver)', () => {
    expect(isLocalUrl('postgresql://u:p@ep-cool-1.ap-southeast-1.aws.neon.tech/neondb?sslmode=require')).toBe(false)
    expect(isLocalUrl('not a url')).toBe(false)
  })
})
