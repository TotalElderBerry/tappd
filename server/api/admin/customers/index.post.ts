import { useDb } from '~~/server/db/client'
import { createCustomer } from '~~/server/services/customers'
import { customerInput } from '#shared/schemas'

export default defineServiceHandler(async (event) => {
  return createCustomer(useDb(), await readValidatedBody(event, customerInput.parse))
})
