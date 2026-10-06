<script setup lang="ts">
import { toast } from 'vue-sonner'
import OrderDesignForm from '~/components/admin/OrderDesignForm.vue'
import CardEditor from '~/components/admin/CardEditor.vue'
import { formatPeso, getPackage } from '#shared/packages'
import { ORDER_STATUSES, ORDER_STATUS_LABELS, PURPOSE_LABELS, type OrderStatus } from '#shared/types'

definePageMeta({ layout: 'admin' })

const id = String(useRoute().params.id)
const { data, refresh } = await useFetch(`/api/admin/orders/${id}`)
const route = useRoute()
const editing = computed({
  get: () => (typeof route.query.card === 'string' ? route.query.card : null),
  set: v => navigateTo({ query: v ? { card: v } : {} }, { replace: true }),
})

async function setStatus(status: OrderStatus) {
  await adminFetch(`/api/admin/orders/${id}`, { method: 'PATCH', body: { status } })
  toast.success(`Marked as ${ORDER_STATUS_LABELS[status].toLowerCase()}`)
  await refresh()
}

function destinationLabel(c: { destinationType: string; destinationUrl: string | null; tapPageId: string | null; active: boolean }) {
  if (!c.active) return 'Turned off'
  if (c.destinationType === 'url') return c.destinationUrl
  if (c.destinationType === 'tap_page') return `Tap Page /${data.value?.tapPages.find(p => p.id === c.tapPageId)?.slug ?? '?'}`
  if (c.destinationType === 'vcard') return 'Contact card'
  return 'Not set up'
}
</script>

<template>
  <div v-if="data" class="grid gap-6">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold">{{ getPackage(data.order.packageKey)?.name }} · {{ data.order.cardCount }} {{ data.order.cardCount === 1 ? 'card' : 'cards' }}</h1>
        <p class="text-muted-foreground">
          <NuxtLink :to="`/admin/customers/${data.customer.id}`" class="hover:underline">{{ data.customer.name }}</NuxtLink>
          · {{ formatPeso(data.order.pricePhp) }}<template v-if="data.order.regularPricePhp"> (regular {{ formatPeso(data.order.regularPricePhp) }})</template>
        </p>
      </div>
      <Button variant="outline" as-child><NuxtLink :to="`/admin/orders/${id}/write`">Write chips</NuxtLink></Button>
    </div>

    <Card>
      <CardHeader><CardTitle>Status</CardTitle></CardHeader>
      <CardContent class="flex flex-wrap gap-2" role="group" aria-label="Order status">
        <Button
          v-for="s in ORDER_STATUSES" :key="s" size="sm" :data-status="s"
          :variant="data.order.status === s ? 'default' : 'outline'" :aria-pressed="data.order.status === s"
          @click="setStatus(s)"
        >{{ ORDER_STATUS_LABELS[s] }}</Button>
        <span v-if="data.order.paidAt" class="self-center text-sm text-muted-foreground">Paid {{ new Date(data.order.paidAt).toLocaleDateString('en-PH') }}</span>
      </CardContent>
    </Card>

    <Card>
      <CardHeader><CardTitle>Order design</CardTitle><CardDescription>Shared by every card in this order.</CardDescription></CardHeader>
      <CardContent><OrderDesignForm :key="String(data.order.updatedAt)" :order-id="id" :design="data.order.design" @saved="refresh()" /></CardContent>
    </Card>

    <Card>
      <CardHeader><CardTitle>Cards</CardTitle></CardHeader>
      <CardContent>
        <Table>
          <TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Label</TableHead><TableHead>Purpose</TableHead><TableHead>Goes to</TableHead><TableHead>Written</TableHead><TableHead>Design</TableHead></TableRow></TableHeader>
          <TableBody>
            <TableRow v-for="c in data.cards" :key="c.id" :data-card="c.code" class="cursor-pointer" @click="editing = c.id">
              <TableCell class="font-mono">{{ c.code }}</TableCell>
              <TableCell>{{ c.label }}</TableCell>
              <TableCell>{{ PURPOSE_LABELS[c.purpose] }}</TableCell>
              <TableCell class="max-w-64 truncate">{{ destinationLabel(c) }}</TableCell>
              <TableCell>{{ c.writtenAt ? '✓' : '—' }}</TableCell>
              <TableCell>{{ c.designApprovedAt ? 'Approved' : 'Draft' }}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
    <CardEditor :card-id="editing" :tap-pages="data.tapPages" :order-design="data.order.design" :business-name="data.customer.name" @close="editing = null" @saved="refresh()" />
  </div>
</template>
