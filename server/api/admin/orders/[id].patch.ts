import { useDb } from '~~/server/db/client'
import { updateOrder } from '~~/server/services/orders'
import { orderPatch } from '#shared/schemas'

export default defineServiceHandler(async (event) => updateOrder(useDb(), routeId(event), await readValidatedBody(event, orderPatch.parse)))
