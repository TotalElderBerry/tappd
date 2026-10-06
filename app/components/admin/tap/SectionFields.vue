<script setup lang="ts">
import IconSelect from './IconSelect.vue'
import ImageField from './ImageField.vue'
import ItemButtons from './ItemButtons.vue'
import type { LeafSection } from '#shared/types'

// The section object is part of the injected reactive draft; editing its fields edits the draft.
const props = defineProps<{ section: LeafSection }>()

// One narrowed view per section type, so the template keeps the right field types.
type Of<T extends LeafSection['type']> = Extract<LeafSection, { type: T }>
const as = <T extends LeafSection['type']>(t: T) => computed(() => (props.section.type === t ? props.section as Of<T> : null))
const links = as('links')
const socials = as('socials')
const tiles = as('tiles')
const about = as('about')
const loc = as('location')
const areas = as('areas')

const areasText = computed({
  get: () => areas.value?.items.join(', ') ?? '',
  set: (v: string) => { if (areas.value) areas.value.items = v.split(',').map(x => x.trim()).filter(Boolean) },
})
</script>

<template>
  <div class="grid gap-3">
    <div class="grid gap-1.5"><Label>Title</Label><Input v-model="section.title" aria-label="Section title" /></div>

    <template v-if="links">
      <div v-for="(item, idx) in links.items" :key="idx" class="grid gap-2 rounded-md border p-2 sm:grid-cols-[9rem_1fr_1fr]">
        <IconSelect v-model="item.icon" />
        <Input v-model="item.title" placeholder="Title" aria-label="Link title" />
        <Input v-model="item.sub" placeholder="Short description" aria-label="Link description" />
        <Input v-model="item.url" placeholder="Paste a link, e.g. g.page/r/..." class="sm:col-span-2" aria-label="Link URL" />
        <div class="flex items-center justify-end gap-2">
          <label class="flex items-center gap-1 text-xs"><Switch v-model="item.featured" /> Highlight</label>
          <ItemButtons :list="links.items" :index="idx" />
        </div>
      </div>
      <Button type="button" variant="outline" size="sm" class="justify-self-start" @click="links.items.push({ icon: 'star', title: '', sub: '', url: '', featured: false })">Add link</Button>
    </template>

    <template v-else-if="socials">
      <div v-for="(item, idx) in socials.items" :key="idx" class="grid gap-2 rounded-md border p-2 sm:grid-cols-[9rem_8rem_1fr_auto]">
        <IconSelect v-model="item.icon" />
        <Input v-model="item.label" aria-label="Social label" />
        <Input v-model="item.url" placeholder="instagram.com/..." aria-label="Social URL" />
        <ItemButtons :list="socials.items" :index="idx" />
      </div>
      <Button type="button" variant="outline" size="sm" class="justify-self-start" @click="socials.items.push({ icon: 'cam', label: '', url: '' })">Add social link</Button>
    </template>

    <template v-else-if="tiles">
      <div class="grid gap-1.5">
        <Label>Placeholder art (when no photo)</Label>
        <Select v-model="tiles.art">
          <SelectTrigger class="w-40" aria-label="Placeholder art"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="food">Food</SelectItem><SelectItem value="homes">Homes</SelectItem></SelectContent>
        </Select>
      </div>
      <div v-for="(item, idx) in tiles.items" :key="idx" class="grid gap-2 rounded-md border p-2 sm:grid-cols-2">
        <Input v-model="item.title" placeholder="Name" aria-label="Tile name" />
        <Input v-model="item.price" placeholder="₱165" aria-label="Tile price" />
        <Input v-model="item.url" placeholder="Link (optional)" aria-label="Tile URL" />
        <div class="flex items-center justify-between gap-2"><ImageField v-model="item.imageUrl" label="Photo" :max-dim="800" /><ItemButtons :list="tiles.items" :index="idx" /></div>
      </div>
      <Button type="button" variant="outline" size="sm" class="justify-self-start" @click="tiles.items.push({ title: '', price: '', url: '', imageUrl: null })">Add tile</Button>
    </template>

    <template v-else-if="about">
      <Textarea v-model="about.text" rows="4" aria-label="About text" />
      <div v-for="(ch, idx) in about.chips" :key="idx" class="grid gap-2 sm:grid-cols-[9rem_1fr_auto]">
        <IconSelect v-model="ch.icon" />
        <Input v-model="ch.text" aria-label="Highlight text" />
        <ItemButtons :list="about.chips" :index="idx" />
      </div>
      <Button type="button" variant="outline" size="sm" class="justify-self-start" @click="about.chips.push({ icon: 'check', text: '' })">Add highlight</Button>
    </template>

    <template v-else-if="loc">
      <Input v-model="loc.line" placeholder="Ground floor, Luna Building" aria-label="Location line" />
      <Input v-model="loc.sub" placeholder="Cebu IT Park, Lahug, Cebu City" aria-label="Location detail" />
      <Input v-model="loc.url" placeholder="maps.google.com/?q=..." aria-label="Map link" />
    </template>

    <template v-else-if="areas">
      <Input v-model="areasText" placeholder="Cebu City, Mandaue, Lapu-Lapu" aria-label="Areas, comma separated" />
    </template>

    <p v-else-if="section.type === 'hours'" class="text-sm text-muted-foreground">Shows the hours from the Hours tab.</p>
  </div>
</template>
