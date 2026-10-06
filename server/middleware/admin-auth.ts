export default defineEventHandler(async (event) => {
  if (event.path.startsWith('/api/admin/') || event.path === '/api/admin') {
    await requireUserSession(event)
  }
})
