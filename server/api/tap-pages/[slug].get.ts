import { useDb } from '~~/server/db/client'
import { getPublishedView } from '~~/server/services/tapPages'

export default defineEventHandler(async (event) => {
  const view = await getPublishedView(useDb(), getRouterParam(event, 'slug') ?? '')
  if (!view) throw createError({ statusCode: 404, statusMessage: 'Page not found' })
  return view
})
