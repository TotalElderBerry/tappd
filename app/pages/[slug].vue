<script setup lang="ts">
import TapPageShell from '~/components/tap/TapPageShell.vue'

definePageMeta({ layout: false })

const slug = String(useRoute().params.slug)
if (!/^[a-z0-9-]{2,40}$/.test(slug)) throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })

const { data: view } = await useFetch(`/api/tap-pages/${slug}`)
if (!view.value) throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })

useTapPageHead(() => view.value?.content.name ?? 'Tappd')
</script>

<template>
  <TapPageShell v-if="view" :view="view" />
</template>
