import { z } from 'zod'
import { useDb } from '~~/server/db/client'
import { listCustomers } from '~~/server/services/customers'

const query = z.object({ search: z.string().max(100).optional() })

export default defineServiceHandler(async (event) => {
  const { search } = await getValidatedQuery(event, query.parse)
  return listCustomers(useDb(), search)
})
