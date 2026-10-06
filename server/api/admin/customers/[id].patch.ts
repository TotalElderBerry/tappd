import { useDb } from '~~/server/db/client'
import { updateCustomer } from '~~/server/services/customers'
import { customerPatch } from '#shared/schemas'

export default defineServiceHandler(async (event) => {
  return updateCustomer(useDb(), routeId(event), await readValidatedBody(event, customerPatch.parse))
})
