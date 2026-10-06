<script setup lang="ts" generic="T">
import { moveItem } from '~/lib/tapEditor'

defineProps<{ list: T[]; index: number }>()
</script>

<template>
  <div class="flex gap-1">
    <Button type="button" variant="ghost" size="sm" :disabled="index === 0" aria-label="Move up" @click="moveItem(list, index, -1)">↑</Button>
    <Button type="button" variant="ghost" size="sm" :disabled="index === list.length - 1" aria-label="Move down" @click="moveItem(list, index, 1)">↓</Button>
    <Button type="button" variant="ghost" size="sm" aria-label="Remove" @click="list.splice(index, 1)">✕</Button>
  </div>
</template>
