<script setup lang="ts">
import OrdersTable from '~/components/admin/OrdersTable.vue'
import { ORDER_STATUSES, ORDER_STATUS_LABELS } from '#shared/types'

definePageMeta({ layout: 'admin' })

const route = useRoute()
const status = computed({
  get: () => (typeof route.query.status === 'string' ? route.query.status : 'all'),
  set: v => navigateTo({ query: v === 'all' ? {} : { status: v } }),
})
const query = computed(() => (status.value === 'all' ? {} : { status: status.value }))
const { data: orders } = await useFetch('/api/admin/orders', { query })
</script>

<template>
  <div class="grid gap-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h1 class="text-2xl font-bold">Orders</h1>
      <div class="flex gap-2">
        <Select v-model="status">
          <SelectTrigger class="w-48" aria-label="Filter by status"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem v-for="s in ORDER_STATUSES" :key="s" :value="s">{{ ORDER_STATUS_LABELS[s] }}</SelectItem>
          </SelectContent>
        </Select>
        <Button as-child><NuxtLink to="/admin/orders/new">New order</NuxtLink></Button>
      </div>
    </div>
    <Card><CardContent class="pt-6"><OrdersTable :orders="orders ?? []" /></CardContent></Card>
  </div>
</template>
