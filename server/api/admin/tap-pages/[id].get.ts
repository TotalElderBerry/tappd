import { useDb } from '~~/server/db/client'
import { getTapPage } from '~~/server/services/tapPages'

export default defineServiceHandler(async event => getTapPage(useDb(), routeId(event)))
