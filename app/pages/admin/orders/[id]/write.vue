<script setup lang="ts">
import { toast } from 'vue-sonner'
import { chipUrl } from '#shared/codes'

definePageMeta({ layout: 'admin' })

const id = String(useRoute().params.id)
const { data, refresh } = await useFetch(`/api/admin/orders/${id}`)
const isProductionHost = computed(() => data.value?.baseUrl.replace(/\/+$/, '') === 'https://tappd.ph')
const done = computed(() => data.value?.cards.filter(c => c.writtenAt).length ?? 0)

async function setWritten(cardId: string, written: boolean) {
  await adminFetch(`/api/admin/cards/${cardId}`, { method: 'PATCH', body: { written } })
  await refresh()
}
async function copy(text: string) {
  await navigator.clipboard.writeText(text)
  toast.success('Copied — paste it into NFC Tools → Write → URL')
}
</script>

<template>
  <div v-if="data" class="grid max-w-3xl gap-4">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold">Write chips · {{ data.customer.name }}</h1>
      <NuxtLink :to="`/admin/orders/${id}`" class="text-sm hover:underline">Back to order</NuxtLink>
    </div>
    <div class="rounded-lg border p-3 text-sm" :class="isProductionHost ? 'bg-background' : 'border-amber-400 bg-amber-50'" data-testid="base-url">
      Chips will point to <span class="font-mono font-semibold">{{ data.baseUrl }}</span>.
      <template v-if="!isProductionHost"> This isn't https://tappd.ph. Don't write customer chips yet; a chip keeps its URL forever.</template>
    </div>
    <p class="text-sm text-muted-foreground">{{ done }} of {{ data.cards.length }} written</p>
    <Card v-for="c in data.cards" :key="c.id" :data-write="c.code">
      <CardContent class="grid gap-3 pt-6">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <span class="font-semibold">{{ c.label }}</span>
          <div class="flex gap-2">
            <Badge v-if="c.destinationType === 'none'" variant="destructive">No destination</Badge>
            <Badge v-if="!c.designApprovedAt" variant="secondary">Design not approved</Badge>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <code class="flex-1 rounded-md bg-muted px-3 py-2 font-mono text-lg">{{ chipUrl(data.baseUrl, c.code) }}</code>
          <Button variant="outline" @click="copy(chipUrl(data.baseUrl, c.code))">Copy</Button>
        </div>
        <label class="flex items-center gap-2 text-sm"><Switch :model-value="!!c.writtenAt" @update:model-value="(v: boolean) => setWritten(c.id, v)" /> Written ✓</label>
      </CardContent>
    </Card>
  </div>
</template>
