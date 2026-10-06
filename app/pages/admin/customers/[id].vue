<script setup lang="ts">
import { toast } from 'vue-sonner'
import CustomerForm from '~/components/admin/CustomerForm.vue'
import OrdersTable from '~/components/admin/OrdersTable.vue'

definePageMeta({ layout: 'admin' })

const id = String(useRoute().params.id)
const { data, refresh } = await useFetch(`/api/admin/customers/${id}`)

async function newTapPage() {
  const page = await adminFetch<{ id: string }>('/api/admin/tap-pages', { method: 'POST', body: { customerId: id, template: 'business' } })
  await navigateTo(`/admin/tap-pages/${page.id}`)
}
function saved() {
  toast.success('Customer saved')
  refresh()
}
</script>

<template>
  <div v-if="data" class="grid gap-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h1 class="text-2xl font-bold">{{ data.customer.name }}</h1>
      <div class="flex gap-2">
        <Button variant="outline" @click="newTapPage">New Tap Page</Button>
        <Button as-child><NuxtLink :to="`/admin/orders/new?customerId=${id}`">New order</NuxtLink></Button>
      </div>
    </div>
    <div class="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
      <Card>
        <CardHeader><CardTitle>Details</CardTitle></CardHeader>
        <CardContent><CustomerForm :key="String(data.customer.updatedAt)" :customer="data.customer" @saved="saved" /></CardContent>
      </Card>
      <div class="grid content-start gap-6">
        <Card>
          <CardHeader><CardTitle>Orders</CardTitle></CardHeader>
          <CardContent><OrdersTable :orders="data.orders" /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Tap Pages</CardTitle></CardHeader>
          <CardContent class="grid gap-2">
            <NuxtLink v-for="p in data.tapPages" :key="p.id" :to="`/admin/tap-pages/${p.id}`" class="flex items-center justify-between rounded-md border px-3 py-2 hover:bg-muted">
              <span class="font-mono text-sm">/{{ p.slug }}</span>
              <Badge :variant="p.published ? 'default' : 'secondary'">{{ p.published ? 'Live' : 'Draft' }}</Badge>
            </NuxtLink>
            <p v-if="!data.tapPages.length" class="text-sm text-muted-foreground">No Tap Pages yet</p>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>
