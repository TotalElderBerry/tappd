import { useDb } from '~~/server/db/client'
import { resolveCard } from '~~/server/services/cards'
import { logTap } from '~~/server/services/taps'

export default defineEventHandler(async (event) => {
  const db = useDb()
  const base = useRuntimeConfig(event).public.baseUrl || getRequestURL(event).origin
  const r = await resolveCard(db, getRouterParam(event, 'code') ?? '', base)
  // 302 + no-store so a destination change applies on the very next tap (spec §6)
  setResponseHeader(event, 'Cache-Control', 'no-store')

  if (r.kind === 'not_found' || r.kind === 'not_set_up') {
    setResponseStatus(event, r.kind === 'not_found' ? 404 : 200)
    setResponseHeader(event, 'Content-Type', 'text/html; charset=utf-8')
    return statusPageHtml(r.kind)
  }

  const source = getQuery(event).s === 'qr' ? 'qr' : 'nfc'
  // Logged after the response is sent; a failed log never blocks the customer.
  event.waitUntil(
    logTap(db, r.cardId, { source, userAgent: getRequestHeader(event, 'user-agent') ?? '' })
      .catch(err => console.error('[tappd] tap log failed', err)),
  )

  if (r.kind === 'redirect') return sendRedirect(event, r.location, 302)
  setResponseHeader(event, 'Content-Type', 'text/vcard; charset=utf-8')
  setResponseHeader(event, 'Content-Disposition', `attachment; filename="${r.filename}"`)
  return r.body
})
