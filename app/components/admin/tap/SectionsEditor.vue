<script setup lang="ts">
import ItemButtons from './ItemButtons.vue'
import SectionFields from './SectionFields.vue'
import { SECTION_LABELS, newSection, useDraft } from '~/lib/tapEditor'
import type { LeafSection, Section } from '#shared/types'

const draft = useDraft()
const adding = ref<LeafSection['type']>('links')
const sections = computed(() => draft.content.sections)

function pair(i: number) {
  const a = sections.value[i]
  const b = sections.value[i + 1]
  if (!a || !b || a.type === 'duo' || b.type === 'duo') return
  draft.content.sections.splice(i, 2, { type: 'duo', items: [a, b] })
}
function unpair(i: number) {
  const s = sections.value[i]
  if (s?.type === 'duo') draft.content.sections.splice(i, 1, s.items[0], s.items[1])
}
const label = (s: Section) => (s.type === 'duo' ? `Side by side: ${SECTION_LABELS[s.items[0].type]} + ${SECTION_LABELS[s.items[1].type]}` : SECTION_LABELS[s.type])
const canPair = (i: number) => sections.value[i]?.type !== 'duo' && !!sections.value[i + 1] && sections.value[i + 1]!.type !== 'duo'
</script>

<template>
  <div class="grid gap-3">
    <div v-for="(s, i) in sections" :key="`${i}-${s.type}`" class="grid gap-3 rounded-lg border bg-background p-3" :data-section="s.type">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <span class="font-semibold">{{ label(s) }}</span>
        <div class="flex gap-1">
          <Button v-if="canPair(i)" type="button" variant="ghost" size="sm" @click="pair(i)">Pair with next</Button>
          <Button v-if="s.type === 'duo'" type="button" variant="ghost" size="sm" @click="unpair(i)">Unpair</Button>
          <ItemButtons :list="draft.content.sections" :index="i" />
        </div>
      </div>
      <div v-if="s.type === 'duo'" class="grid gap-3 md:grid-cols-2">
        <SectionFields :section="s.items[0]" />
        <SectionFields :section="s.items[1]" />
      </div>
      <SectionFields v-else :section="s" />
    </div>
    <div class="flex flex-wrap gap-2">
      <Select v-model="adding">
        <SelectTrigger class="w-64" aria-label="Section type"><SelectValue /></SelectTrigger>
        <SelectContent><SelectItem v-for="(l, t) in SECTION_LABELS" :key="t" :value="t">{{ l }}</SelectItem></SelectContent>
      </Select>
      <Button type="button" variant="outline" @click="draft.content.sections.push(newSection(adding))">Add section</Button>
    </div>
  </div>
</template>
