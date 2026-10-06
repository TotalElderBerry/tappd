<script setup lang="ts">
import { ICON_LABELS } from '~/lib/tapEditor'
import { TAP_ICONS, type TapIcon } from '#shared/types'

const model = defineModel<TapIcon>({ required: true })
</script>

<template>
  <Select v-model="model">
    <SelectTrigger aria-label="Icon"><SelectValue /></SelectTrigger>
    <SelectContent><SelectItem v-for="ic in TAP_ICONS" :key="ic" :value="ic">{{ ICON_LABELS[ic] }}</SelectItem></SelectContent>
  </Select>
</template>
