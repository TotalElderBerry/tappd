<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core'
import { toast } from 'vue-sonner'
import ActionsFields from '~/components/admin/tap/ActionsFields.vue'
import HoursFields from '~/components/admin/tap/HoursFields.vue'
import IdentityFields from '~/components/admin/tap/IdentityFields.vue'
import SectionsEditor from '~/components/admin/tap/SectionsEditor.vue'
import { DRAFT_KEY, type Draft } from '~/lib/tapEditor'
import type { TapPageView } from '#shared/types'

definePageMeta({ layout: 'admin' })

const id = String(useRoute().params.id)
const { data: page } = await useFetch(`/api/admin/tap-pages/${id}`)
if (!page.value) throw createError({ statusCode: 404, statusMessage: 'Tap Page not found' })
const p = page.value

const draft = reactive<Draft>(JSON.parse(JSON.stringify({
  slug: p.slug, profileType: p.profileType, color: p.color, coverUrl: p.coverUrl, avatarUrl: p.avatarUrl,
  showCover: p.showCover, showAvatar: p.showAvatar, content: p.content,
})))
provide(DRAFT_KEY, draft)

const saved = ref(JSON.stringify(draft))
const dirty = computed(() => JSON.stringify(draft) !== saved.value)
const liveSlug = ref(p.slug)
const published = ref(p.published)
const busy = ref(false)
const wide = ref(false)
const frame = ref<HTMLIFrameElement | null>(null)

function post() {
  const view: TapPageView = JSON.parse(JSON.stringify(draft))
  frame.value?.contentWindow?.postMessage({ type: 'tappd:preview', view }, location.origin)
}
watch(draft, useDebounceFn(post, 150), { deep: true })

function onMessage(e: MessageEvent) {
  if (e.origin === location.origin && e.data?.type === 'tappd:preview-ready') post()
}
function onBeforeUnload(e: BeforeUnloadEvent) {
  if (dirty.value) e.preventDefault()
}
// In-app navigation (admin header links) doesn't fire beforeunload, so ask here too.
onBeforeRouteLeave(() => {
  if (dirty.value && !window.confirm('You have unsaved changes on this Tap Page. Leave without saving?')) return false
})
onMounted(() => {
  window.addEventListener('message', onMessage)
  window.addEventListener('beforeunload', onBeforeUnload)
})
onBeforeUnmount(() => {
  window.removeEventListener('message', onMessage)
  window.removeEventListener('beforeunload', onBeforeUnload)
})

async function save() {
  busy.value = true
  try {
    await adminFetch(`/api/admin/tap-pages/${id}`, { method: 'PATCH', body: draft })
    saved.value = JSON.stringify(draft)
    liveSlug.value = draft.slug
    toast.success('Tap Page saved')
  } finally {
    busy.value = false
  }
}

async function setPublished(v: boolean) {
  if (v && dirty.value) await save()
  await adminFetch(`/api/admin/tap-pages/${id}`, { method: 'PATCH', body: { published: v } })
  published.value = v
  toast.success(v ? 'Tap Page is live' : 'Tap Page is now a draft')
}
</script>

<template>
  <div class="grid gap-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold">{{ draft.content.name || 'Tap Page' }}</h1>
        <p class="font-mono text-sm text-muted-foreground">/{{ liveSlug }}</p>
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <label class="flex items-center gap-2 text-sm"><Switch :model-value="published" @update:model-value="setPublished" /> Published</label>
        <Button v-if="published" variant="outline" as-child><a :href="`/${liveSlug}`" target="_blank" rel="noopener">Open live page</a></Button>
        <Button :disabled="busy || !dirty" @click="save">{{ dirty ? 'Save changes' : 'Saved' }}</Button>
      </div>
    </div>

    <div class="grid gap-6" :class="wide ? '' : 'lg:grid-cols-2'">
      <Tabs default-value="identity">
        <TabsList class="flex-wrap">
          <TabsTrigger value="identity">Identity</TabsTrigger>
          <TabsTrigger value="hours">Hours</TabsTrigger>
          <TabsTrigger value="actions">Buttons &amp; contact</TabsTrigger>
          <TabsTrigger value="sections">Sections</TabsTrigger>
        </TabsList>
        <Card class="mt-2">
          <CardContent class="pt-6">
            <TabsContent value="identity"><IdentityFields /></TabsContent>
            <TabsContent value="hours"><HoursFields /></TabsContent>
            <TabsContent value="actions"><ActionsFields /></TabsContent>
            <TabsContent value="sections"><SectionsEditor /></TabsContent>
          </CardContent>
        </Card>
      </Tabs>
      <div class="grid content-start gap-2 lg:sticky lg:top-4">
        <div class="flex gap-2">
          <Button size="sm" :variant="wide ? 'outline' : 'default'" @click="wide = false">Phone</Button>
          <Button size="sm" :variant="wide ? 'default' : 'outline'" @click="wide = true">Desktop</Button>
        </div>
        <iframe ref="frame" src="/_preview/tap-page" title="Tap Page preview" class="h-[78vh] max-w-full rounded-lg border bg-white" :class="wide ? 'w-full' : 'w-[390px]'" />
      </div>
    </div>
  </div>
</template>
