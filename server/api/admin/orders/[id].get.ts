import { useDb } from '~~/server/db/client'
import { getOrderDetail } from '~~/server/services/orders'

export default defineServiceHandler(async (event) => {
  const baseUrl = useRuntimeConfig(event).public.baseUrl || getRequestURL(event).origin
  return { ...(await getOrderDetail(useDb(), routeId(event))), baseUrl }
})
