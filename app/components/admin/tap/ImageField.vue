<script setup lang="ts">
import { toast } from 'vue-sonner'
import { uploadImage } from '~/lib/image'

const model = defineModel<string | null>({ required: true })
const props = defineProps<{ label: string; maxDim: number; keepAlpha?: boolean }>()
const busy = ref(false)

async function onFile(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  busy.value = true
  try {
    model.value = await uploadImage(file, { maxDim: props.maxDim, keepAlpha: props.keepAlpha })
  } catch (err) {
    toast.error(apiError(err))
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="grid gap-1.5">
    <span class="text-sm font-medium">{{ label }}</span>
    <div class="flex items-center gap-2">
      <img v-if="model" :src="model" alt="" class="h-12 w-12 rounded border object-cover">
      <label class="cursor-pointer rounded-md border px-3 py-1.5 text-sm hover:bg-muted">
        {{ busy ? 'Uploading…' : model ? 'Replace' : 'Upload' }}
        <input type="file" accept="image/*" class="sr-only" :aria-label="`Upload ${label}`" @change="onFile">
      </label>
      <Button v-if="model" type="button" variant="ghost" size="sm" @click="model = null">Remove</Button>
    </div>
  </div>
</template>
