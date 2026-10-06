<script setup lang="ts">
import '~/assets/css/admin.css'
import 'vue-sonner/style.css'
import { toast } from 'vue-sonner'
import { Toaster } from '@/components/ui/sonner'

const { loggedIn, user, clear } = useUserSession()
const route = useRoute()
const lookup = ref('')
const nav = [
  { to: '/admin', label: 'Home' },
  { to: '/admin/orders', label: 'Orders' },
  { to: '/admin/customers', label: 'Customers' },
  { to: '/admin/tap-pages', label: 'Tap Pages' },
]
const isActive = (to: string) => (to === '/admin' ? route.path === '/admin' : route.path.startsWith(to))

async function logout() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  await clear()
  await navigateTo('/admin/login')
}

async function findCard() {
  const code = lookup.value.trim()
  if (!code) return
  try {
    const r = await $fetch<{ id: string; orderId: string }>('/api/admin/cards/lookup', { query: { code } })
    lookup.value = ''
    await navigateTo(`/admin/orders/${r.orderId}?card=${r.id}`)
  } catch (e) {
    toast.error(apiError(e))
  }
}

useHead({ title: 'Tappd Admin' })
</script>

<template>
  <div class="min-h-screen bg-muted">
    <header v-if="loggedIn" class="border-b bg-background">
      <div class="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
        <NuxtLink to="/admin" class="text-lg font-extrabold tracking-tight text-primary">tappd <span class="font-normal text-muted-foreground">admin</span></NuxtLink>
        <nav class="flex gap-1 text-sm">
          <NuxtLink v-for="n in nav" :key="n.to" :to="n.to" class="rounded-md px-3 py-1.5 hover:bg-muted" :class="{ 'bg-muted font-semibold': isActive(n.to) }">{{ n.label }}</NuxtLink>
        </nav>
        <form class="ml-auto flex gap-2" @submit.prevent="findCard">
          <Input v-model="lookup" placeholder="Card code, e.g. x7k2qm" class="w-52" aria-label="Find a card by code" />
          <Button type="submit" variant="outline" size="sm">Find card</Button>
        </form>
        <span class="text-sm text-muted-foreground">{{ user?.name }}</span>
        <Button variant="ghost" size="sm" @click="logout">Log out</Button>
      </div>
    </header>
    <main class="mx-auto max-w-6xl px-4 py-6"><slot /></main>
    <Toaster rich-colors position="top-center" />
  </div>
</template>
