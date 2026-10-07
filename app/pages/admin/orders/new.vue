<script setup lang="ts">
import CustomerForm from '~/components/admin/CustomerForm.vue'
import { PACKAGES, type PackageKey, formatPeso, getPackage, quote } from '#shared/packages'

definePageMeta({ layout: 'admin' })

const route = useRoute()
const { data: customers, refresh: refreshCustomers } = await useFetch('/api/admin/customers')
const customerId = ref(typeof route.query.customerId === 'string' ? route.query.customerId : '')
const packageKey = ref<PackageKey>('fully_tappd')
const cardCount = ref(5)
const customPrice = ref<number | undefined>(undefined)
const notes = ref('')
const creatingCustomer = ref(false)
const busy = ref(false)

const def = computed(() => getPackage(packageKey.value)!)
// Card counts the Tap Pack picker offers, straight from the catalog (2–3 today)
const packRange = computed(() => Array.from({ length: (def.value.maxCards ?? def.value.minCards) - def.value.minCards + 1 }, (_, i) => def.value.minCards + i))
watch(packageKey, () => { cardCount.value = def.value.minCards; customPrice.value = undefined })

const preview = computed(() => {
  try {
    const q = quote(packageKey.value, cardCount.value, customPrice.value)
    return { ok: true as const, text: `${formatPeso(q.pricePhp)}${q.regularPricePhp ? ` (regular ${formatPeso(q.regularPricePhp)})` : ''}` }
  } catch (e) {
    return { ok: false as const, text: (e as Error).message }
  }
})

async function customerCreated(c: { id: string }) {
  creatingCustomer.value = false
  await refreshCustomers()
  customerId.value = c.id
}

async function create() {
  busy.value = true
  try {
    const d = await adminFetch<{ order: { id: string } }>('/api/admin/orders', {
      method: 'POST',
      body: { customerId: customerId.value, packageKey: packageKey.value, cardCount: cardCount.value, customPricePhp: customPrice.value, notes: notes.value },
    })
    await navigateTo(`/admin/orders/${d.order.id}`)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="grid max-w-3xl gap-6">
    <h1 class="text-2xl font-bold">New order</h1>
    <Card>
      <CardHeader><CardTitle>Customer</CardTitle></CardHeader>
      <CardContent class="flex flex-wrap gap-2">
        <Select v-model="customerId">
          <SelectTrigger class="w-72" aria-label="Customer"><SelectValue placeholder="Choose a customer" /></SelectTrigger>
          <SelectContent>
            <SelectItem v-for="c in customers ?? []" :key="c.id" :value="c.id">{{ c.name }}</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" @click="creatingCustomer = true">New customer</Button>
      </CardContent>
    </Card>
    <Card>
      <CardHeader><CardTitle>Package</CardTitle></CardHeader>
      <CardContent class="grid gap-5">
        <div v-for="line in (['cards', 'website'] as const)" :key="line" class="grid gap-2">
          <p class="text-sm font-semibold text-muted-foreground">{{ line === 'cards' ? 'Tap cards' : 'Website + cards' }}</p>
          <div class="grid gap-2 sm:grid-cols-2">
            <button
              v-for="p in PACKAGES.filter(x => x.line === line)" :key="p.key" type="button" :data-package="p.key"
              class="rounded-lg border bg-background p-3 text-left hover:border-primary"
              :class="{ 'border-primary ring-2 ring-primary/30': packageKey === p.key }"
              @click="packageKey = p.key"
            >
              <span class="block font-semibold">{{ p.name }}</span>
              <span class="block text-sm text-muted-foreground">{{ p.summary }}</span>
            </button>
          </div>
        </div>
        <div v-if="packageKey === 'tap_pack'" class="flex items-center gap-2">
          <Label>Cards</Label>
          <Button v-for="n in packRange" :key="n" type="button" size="sm" :variant="cardCount === n ? 'default' : 'outline'" @click="cardCount = n">{{ n }}</Button>
        </div>
        <div v-if="def.customPrice" class="flex flex-wrap gap-4">
          <div v-if="def.maxCards === null" class="grid gap-1.5"><Label for="o-count">Cards</Label><Input id="o-count" v-model.number="cardCount" type="number" :min="def.minCards" class="w-28" /></div>
          <div class="grid gap-1.5"><Label for="o-price">Price (₱)</Label><Input id="o-price" v-model.number="customPrice" type="number" min="1" class="w-36" /></div>
        </div>
        <div class="grid gap-1.5"><Label for="o-notes">Notes</Label><Textarea id="o-notes" v-model="notes" rows="2" /></div>
        <div class="flex items-center justify-between gap-3 rounded-lg bg-muted p-3">
          <span :class="preview.ok ? 'font-semibold' : 'text-destructive text-sm'" data-testid="quote">{{ preview.text }}</span>
          <Button :disabled="busy || !customerId || !preview.ok" @click="create">Create order</Button>
        </div>
      </CardContent>
    </Card>
    <Dialog v-model:open="creatingCustomer">
      <DialogContent>
        <DialogHeader><DialogTitle>New customer</DialogTitle></DialogHeader>
        <CustomerForm @saved="customerCreated" />
      </DialogContent>
    </Dialog>
  </div>
</template>
