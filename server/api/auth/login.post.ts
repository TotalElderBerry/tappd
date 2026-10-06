import { z } from 'zod'
import { useDb } from '~~/server/db/client'
import { authenticateAdmin } from '~~/server/services/admins'

const body = z.object({ email: z.string().trim().min(1).max(200), password: z.string().min(1).max(200) })

export default defineEventHandler(async (event) => {
  const { email, password } = await readValidatedBody(event, body.parse)
  const admin = await authenticateAdmin(useDb(), email, password)
  if (!admin) throw createError({ statusCode: 401, statusMessage: 'Invalid email or password' })
  await setUserSession(event, { user: admin })
  return { ok: true }
})
