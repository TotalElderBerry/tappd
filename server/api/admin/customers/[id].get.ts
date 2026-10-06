import { useDb } from '~~/server/db/client'
import { getCustomerDetail } from '~~/server/services/customers'

export default defineServiceHandler(async event => getCustomerDetail(useDb(), routeId(event)))
