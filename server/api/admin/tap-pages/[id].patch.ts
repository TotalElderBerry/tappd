import { useDb } from '~~/server/db/client'
import { updateTapPage } from '~~/server/services/tapPages'
import { tapPagePatch } from '#shared/schemas'

export default defineServiceHandler(async (event) => updateTapPage(useDb(), routeId(event), await readValidatedBody(event, tapPagePatch.parse)))
