import { useDb } from '~~/server/db/client'
import { getPublishedView, tapPageVCardInput } from '~~/server/services/tapPages'
import { buildVCard, vcardFilename } from '#shared/vcard'

async function fetchPhoto(url: string) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(3000) })
    const type = res.headers.get('content-type') ?? ''
    if (!res.ok || !/image\/(jpeg|png)/.test(type)) return undefined
    const buf = Buffer.from(await res.arrayBuffer())
    if (buf.length > 300_000) return undefined
    return { base64: buf.toString('base64'), type: type.includes('png') ? ('PNG' as const) : ('JPEG' as const) }
  } catch {
    return undefined
  }
}

export default defineEventHandler(async (event) => {
  const view = await getPublishedView(useDb(), getRouterParam(event, 'slug') ?? '')
  if (!view) throw createError({ statusCode: 404, statusMessage: 'Page not found' })
  const base = useRuntimeConfig(event).public.baseUrl || getRequestURL(event).origin
  const photo = view.avatarUrl ? await fetchPhoto(view.avatarUrl) : undefined
  setResponseHeader(event, 'Content-Type', 'text/vcard; charset=utf-8')
  setResponseHeader(event, 'Content-Disposition', `attachment; filename="${vcardFilename(view.content.name)}"`)
  return buildVCard({ ...tapPageVCardInput(view, base), photo })
})
