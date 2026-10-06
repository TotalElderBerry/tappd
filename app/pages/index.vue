<script setup lang="ts">
import raw from '~~/design/05-website.html?raw'
import { splitDesign } from '#shared/designSource'

definePageMeta({ layout: false })

// The marketing page *is* design/05-website.html: same CSS, markup and script (spec §2.1, §9).
const design = splitDesign(raw)

useHead({
  title: design.title,
  link: [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    { rel: 'stylesheet', href: design.fontsHref },
  ],
  style: [{ key: 'marketing-css', innerHTML: design.css }],
})

onMounted(() => {
  // Runs the design file's own script verbatim.
  new Function(design.script)()
})
</script>

<template>
  <div v-html="design.body" />
</template>
