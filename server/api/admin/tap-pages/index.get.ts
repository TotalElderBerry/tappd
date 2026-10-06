import { useDb } from '~~/server/db/client'
import { listTapPages } from '~~/server/services/tapPages'

export default defineServiceHandler(async () => listTapPages(useDb()))
