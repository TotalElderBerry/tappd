import { z } from 'zod'
import { useDb } from '~~/server/db/client'
import { lookupCard } from '~~/server/services/cards'

const query = z.object({ code: z.string().trim().min(1).max(20) })

export default defineServiceHandler(async (event) => {
  const { code } = await getValidatedQuery(event, query.parse)
  const found = await lookupCard(useDb(), code)
  if (!found) throw createError({ statusCode: 404, statusMessage: `No card with code ${code}` })
  return found
})
