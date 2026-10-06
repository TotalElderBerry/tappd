<script setup lang="ts">
import { toast } from 'vue-sonner'
import { FONT_PRESETS } from '#shared/cardDesign'
import type { FontPreset, OrderDesign } from '#shared/types'
import { uploadImage } from '~/lib/image'

const props = defineProps<{ orderId: string; design: OrderDesign }>()
const emit = defineEmits<{ saved: [OrderDesign] }>()
const form = reactive<OrderDesign>({ ...props.design })
const busy = ref(false)

async function onLogo(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  try {
    form.logoUrl = await uploadImage(file, { maxDim: 800, keepAlpha: true })
  } catch (err) {
    toast.error(apiError(err))
  }
}

async function save() {
  busy.value = true
  try {
    await adminFetch(`/api/admin/orders/${props.orderId}`, { method: 'PATCH', body: { design: form } })
    toast.success('Order design saved')
    emit('saved', { ...form })
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <form class="grid gap-3" @submit.prevent="save">
    <div class="flex flex-wrap items-end gap-4">
      <div class="grid gap-1.5">
        <Label for="od-color">Brand color</Label>
        <div class="flex gap-2"><input id="od-color" v-model="form.color" type="color" class="h-9 w-12 rounded border"><Input v-model="form.color" class="w-28" aria-label="Brand color hex" /></div>
      </div>
      <div class="grid gap-1.5">
        <Label>Font style</Label>
        <Select v-model="form.fontPreset">
          <SelectTrigger class="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem v-for="(f, key) in FONT_PRESETS" :key="key" :value="key as FontPreset">{{ f.label }}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div class="grid gap-1.5">
        <Label for="od-logo">Logo</Label>
        <div class="flex items-center gap-2">
          <img v-if="form.logoUrl" :src="form.logoUrl" alt="Logo" class="h-9 w-9 rounded border object-contain">
          <input id="od-logo" type="file" accept="image/*" class="text-sm" @change="onLogo">
          <Button v-if="form.logoUrl" type="button" variant="ghost" size="sm" @click="form.logoUrl = null">Remove</Button>
        </div>
      </div>
    </div>
    <Button type="submit" variant="outline" :disabled="busy" class="justify-self-start">Save order design</Button>
  </form>
</template>
