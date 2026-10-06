<script setup lang="ts">
import IconSelect from './IconSelect.vue'
import ImageField from './ImageField.vue'
import { SWATCHES, useDraft } from '~/lib/tapEditor'
import type { Fact } from '#shared/types'

const draft = useDraft()
const config = useRuntimeConfig()
const host = computed(() => (config.public.baseUrl || location.origin).replace(/^https?:\/\//, '').replace(/\/+$/, ''))

function setKind(i: number, kind: Fact['kind']) {
  const old = draft.content.facts[i]!
  const text = 'text' in old ? old.text : ''
  draft.content.facts[i] = kind === 'status' ? { kind } : kind === 'rating' ? { kind, text } : { kind, icon: 'pin', text }
}
</script>

<template>
  <div class="grid gap-5">
    <div class="grid gap-3 sm:grid-cols-2">
      <div class="grid gap-1.5">
        <Label>Type</Label>
        <Select v-model="draft.profileType">
          <SelectTrigger aria-label="Profile type"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="business">Business</SelectItem><SelectItem value="personal">Personal</SelectItem></SelectContent>
        </Select>
      </div>
      <div class="grid gap-1.5">
        <Label for="tp-slug">Link</Label>
        <div class="flex items-center gap-1"><span class="text-sm text-muted-foreground">{{ host }}/</span><Input id="tp-slug" v-model="draft.slug" /></div>
      </div>
      <div class="grid gap-1.5"><Label for="tp-name">Name</Label><Input id="tp-name" v-model="draft.content.name" /></div>
      <div class="grid gap-1.5"><Label for="tp-first">Short name</Label><Input id="tp-first" v-model="draft.content.first" placeholder="Shown in the Save contact note" /></div>
      <div class="grid gap-1.5 sm:col-span-2"><Label for="tp-role">Role (personal pages)</Label><Input id="tp-role" v-model="draft.content.role" /></div>
      <div class="grid gap-1.5 sm:col-span-2"><Label for="tp-tagline">Tagline</Label><Textarea id="tp-tagline" v-model="draft.content.tagline" rows="2" /></div>
    </div>

    <div class="grid gap-1.5">
      <Label>Brand color</Label>
      <div class="flex flex-wrap items-center gap-2">
        <button
          v-for="[c, n] in SWATCHES" :key="c" type="button" class="size-7 rounded-full border-2"
          :class="draft.color === c ? 'border-foreground' : 'border-transparent'" :style="{ background: c }"
          :aria-label="n" :aria-pressed="draft.color === c" @click="draft.color = c"
        />
        <input v-model="draft.color" type="color" class="h-8 w-10 rounded border" aria-label="Custom color">
        <Input v-model="draft.color" class="w-28" aria-label="Color hex" />
      </div>
    </div>

    <div class="grid gap-4 sm:grid-cols-2">
      <div class="grid gap-2">
        <ImageField v-model="draft.coverUrl" label="Cover image" :max-dim="1600" />
        <label class="flex items-center gap-2 text-sm"><Switch v-model="draft.showCover" /> Show cover</label>
      </div>
      <div class="grid gap-2">
        <ImageField v-model="draft.avatarUrl" label="Profile photo" :max-dim="512" />
        <label class="flex items-center gap-2 text-sm"><Switch v-model="draft.showAvatar" /> Show profile photo</label>
      </div>
    </div>

    <div class="grid gap-2">
      <Label>Facts under the name</Label>
      <div v-for="(f, i) in draft.content.facts" :key="i" class="flex flex-wrap items-center gap-2">
        <Select :model-value="f.kind" @update:model-value="(k) => setKind(i, k as Fact['kind'])">
          <SelectTrigger class="w-40" aria-label="Fact type"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="status">Open / closed</SelectItem><SelectItem value="icon">Icon + text</SelectItem><SelectItem value="rating">Star rating</SelectItem></SelectContent>
        </Select>
        <div v-if="f.kind === 'icon'" class="w-40"><IconSelect v-model="f.icon" /></div>
        <Input v-if="f.kind !== 'status'" v-model="f.text" class="min-w-40 flex-1" aria-label="Fact text" />
        <Button type="button" variant="ghost" size="sm" @click="draft.content.facts.splice(i, 1)">Remove</Button>
      </div>
      <Button v-if="draft.content.facts.length < 6" type="button" variant="outline" size="sm" class="justify-self-start" @click="draft.content.facts.push({ kind: 'icon', icon: 'pin', text: '' })">Add fact</Button>
    </div>

    <div class="grid gap-3 sm:grid-cols-2">
      <div class="grid gap-1.5"><Label for="tp-sw-open">Status when open</Label><Input id="tp-sw-open" v-model="draft.content.statusWords[0]" /></div>
      <div class="grid gap-1.5"><Label for="tp-sw-closed">Status when closed</Label><Input id="tp-sw-closed" v-model="draft.content.statusWords[1]" /></div>
    </div>
  </div>
</template>
