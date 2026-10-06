<script setup lang="ts">
import OrdersTable from '~/components/admin/OrdersTable.vue'

definePageMeta({ layout: 'admin' })

const { data } = await useFetch('/api/admin/dashboard')
const tiles = computed(() => {
  const c = data.value?.counts
  if (!c) return []
  return [
    { label: 'Awaiting payment', value: c.awaitingPayment, to: '/admin/orders?status=awaiting_payment' },
    { label: 'In production', value: c.inProduction, to: '/admin/orders?status=in_production' },
    { label: 'Unassigned cards', value: c.unassignedCards, to: '' },
    { label: 'Taps, last 7 days', value: c.taps7d, to: '' },
  ]
})
</script>

<template>
  <div class="grid gap-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold">Home</h1>
      <Button as-child><NuxtLink to="/admin/orders/new">New order</NuxtLink></Button>
    </div>
    <div class="grid grid-cols-2 gap-4 md:grid-cols-4">
      <Card v-for="t in tiles" :key="t.label" :data-tile="t.label">
        <CardHeader class="pb-2"><CardDescription>{{ t.label }}</CardDescription></CardHeader>
        <CardContent>
          <NuxtLink v-if="t.to" :to="t.to" class="text-3xl font-bold hover:underline">{{ t.value }}</NuxtLink>
          <span v-else class="text-3xl font-bold">{{ t.value }}</span>
        </CardContent>
      </Card>
    </div>
    <Card>
      <CardHeader><CardTitle>Recent orders</CardTitle></CardHeader>
      <CardContent><OrdersTable :orders="data?.recentOrders ?? []" /></CardContent>
    </Card>
  </div>
</template>
