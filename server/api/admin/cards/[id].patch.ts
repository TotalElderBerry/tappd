import { useDb } from '~~/server/db/client'
import { updateCard } from '~~/server/services/cards'
import { cardPatch } from '#shared/schemas'

export default defineServiceHandler(async (event) => updateCard(useDb(), routeId(event), await readValidatedBody(event, cardPatch.parse)))
