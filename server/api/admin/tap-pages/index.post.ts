import { useDb } from '~~/server/db/client'
import { createTapPage } from '~~/server/services/tapPages'
import { createTapPageInput } from '#shared/schemas'

export default defineServiceHandler(async (event) => {
  const { customerId, template } = await readValidatedBody(event, createTapPageInput.parse)
  return createTapPage(useDb(), { customerId, profileType: template })
})
