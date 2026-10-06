import { useDb } from '~~/server/db/client'
import { listOrders } from '~~/server/services/orders'
import { dashboardCounts } from '~~/server/services/taps'

export default defineServiceHandler(async () => {
  const db = useDb()
  return { counts: await dashboardCounts(db), recentOrders: (await listOrders(db)).slice(0, 8) }
})
