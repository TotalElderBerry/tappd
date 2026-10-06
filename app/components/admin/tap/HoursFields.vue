<script setup lang="ts">
import { WEEKDAYS } from '#shared/hours'
import { useDraft } from '~/lib/tapEditor'

const draft = useDraft()
function setClosed(i: number, closed: boolean) {
  draft.content.hours[i] = closed ? { open: null, close: null } : { open: '09:00', close: '18:00' }
}
</script>

<template>
  <div class="grid gap-2">
    <div v-for="(day, i) in WEEKDAYS" :key="day" class="flex flex-wrap items-center gap-3" :data-day="day">
      <span class="w-24 text-sm font-medium">{{ day }}</span>
      <label class="flex items-center gap-2 text-sm">
        <Switch :model-value="draft.content.hours[i]!.open === null" :aria-label="`${day} closed`" @update:model-value="(v: boolean) => setClosed(i, v)" /> Closed
      </label>
      <template v-if="draft.content.hours[i]!.open !== null">
        <Input :model-value="draft.content.hours[i]!.open ?? ''" type="time" class="w-32" :aria-label="`${day} opens`" @update:model-value="(v) => { draft.content.hours[i]!.open = String(v) }" />
        <span class="text-sm">to</span>
        <Input :model-value="draft.content.hours[i]!.close ?? ''" type="time" class="w-32" :aria-label="`${day} closes`" @update:model-value="(v) => { draft.content.hours[i]!.close = String(v) }" />
      </template>
    </div>
  </div>
</template>
