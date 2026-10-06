import { useDb } from '~~/server/db/client'
import { createOrder } from '~~/server/services/orders'
import { createOrderInput } from '#shared/schemas'

export default defineServiceHandler(async (event) => createOrder(useDb(), await readValidatedBody(event, createOrderInput.parse)))
