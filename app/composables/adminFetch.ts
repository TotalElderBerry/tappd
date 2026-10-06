import { toast } from 'vue-sonner'

interface ErrorBody { statusMessage?: string; message?: string; data?: { issues?: { message: string; path?: (string | number)[] }[] } }

/** Human-readable message from a failed $fetch, including the first zod issue. */
export function apiError(e: unknown): string {
  const body = (e as { data?: ErrorBody }).data
  const issue = body?.data?.issues?.[0]
  if (issue) return issue.path?.length ? `${issue.path.join('.')}: ${issue.message}` : issue.message
  return body?.statusMessage || body?.message || (e as Error)?.message || 'Something went wrong'
}

export async function adminFetch<T>(
  url: string,
  opts: { method?: 'GET' | 'POST' | 'PATCH'; body?: unknown; query?: Record<string, unknown> } = {},
): Promise<T> {
  try {
    return (await $fetch<T>(url, opts as Parameters<typeof $fetch>[1])) as T
  } catch (e) {
    toast.error(apiError(e))
    throw e
  }
}
