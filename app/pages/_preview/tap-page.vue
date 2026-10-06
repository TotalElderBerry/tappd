<script setup lang="ts">
import TapPageShell from '~/components/tap/TapPageShell.vue'
import type { TapPageView } from '#shared/types'

definePageMeta({ layout: false })
useTapPageHead('Preview')

const view = ref<TapPageView | null>(null)
function onMessage(e: MessageEvent) {
  if (e.origin !== location.origin || e.data?.type !== 'tappd:preview') return
  view.value = e.data.view as TapPageView
}
onMounted(() => {
  window.addEventListener('message', onMessage)
  window.parent.postMessage({ type: 'tappd:preview-ready' }, location.origin)
})
onBeforeUnmount(() => window.removeEventListener('message', onMessage))
</script>

<template>
  <TapPageShell v-if="view" :view="view" preview />
</template>
