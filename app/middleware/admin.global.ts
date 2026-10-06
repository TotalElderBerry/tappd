export default defineNuxtRouteMiddleware((to) => {
  const needsAuth = (to.path.startsWith('/admin') && to.path !== '/admin/login') || to.path.startsWith('/_preview')
  if (!needsAuth) return
  const { loggedIn } = useUserSession()
  if (!loggedIn.value) return navigateTo('/admin/login')
})
