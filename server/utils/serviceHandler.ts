import type { EventHandlerRequest, H3Event } from 'h3'
import { ServiceError } from '../services/errors'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Event handler that maps ServiceError(status, message) to an HTTP error with that status. */
export function defineServiceHandler<T>(fn: (event: H3Event<EventHandlerRequest>) => Promise<T>) {
  return defineEventHandler(async (event) => {
    try {
      return await fn(event)
    } catch (e) {
      if (e instanceof ServiceError) throw createError({ statusCode: e.status, statusMessage: e.message })
      throw e
    }
  })
}

/** Route param that must be a UUID; anything else is a 404 instead of a database error. */
export function routeId(event: H3Event, name = 'id'): string {
  const v = getRouterParam(event, name)
  if (!v || !UUID_RE.test(v)) throw createError({ statusCode: 404, statusMessage: 'Not found' })
  return v
}
