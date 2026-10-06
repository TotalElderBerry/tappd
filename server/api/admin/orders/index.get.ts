import { z } from 'zod'
import { useDb } from '~~/server/db/client'
import { listOrders } from '~~/server/services/orders'
import { ORDER_STATUSES } from '#shared/types'

const query = z.object({ status: z.enum(ORDER_STATUSES).optional(), customerId: z.uuid().optional() })

export default defineServiceHandler(async (event) => listOrders(useDb(), await getValidatedQuery(event, query.parse)))
