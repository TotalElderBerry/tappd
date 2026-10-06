import { useDb } from '~~/server/db/client'
import { getCardDetail } from '~~/server/services/cards'
import { chipUrl, qrUrl } from '#shared/codes'

export default defineServiceHandler(async (event) => {
  const detail = await getCardDetail(useDb(), routeId(event))
  const base = useRuntimeConfig(event).public.baseUrl || getRequestURL(event).origin
  return { ...detail, chipUrl: chipUrl(base, detail.card.code), qrUrl: qrUrl(base, detail.card.code) }
})
