<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()
const notFound = computed(() => props.error.statusCode === 404)
useHead({
  title: () => (notFound.value ? 'Page not found · Tappd' : 'Something went wrong · Tappd'),
  bodyAttrs: { style: 'margin:0' },
})
</script>

<template>
  <main style="min-height:100vh;display:grid;place-items:center;padding:24px;background:#f6f5fb;color:#17152a;font-family:system-ui,-apple-system,'Segoe UI',sans-serif">
    <div style="max-width:420px;text-align:center;display:grid;gap:12px">
      <h1 style="margin:0;font-size:26px;letter-spacing:-.02em">{{ notFound ? 'Page not found' : 'Something went wrong' }}</h1>
      <p style="margin:0;color:#5f5b75;line-height:1.55">{{ notFound ? "This Tappd page doesn't exist or isn't live yet." : 'Please try again in a moment.' }}</p>
      <a href="/" style="color:#5b3fd6;font-weight:700">Go to Tappd</a>
    </div>
  </main>
</template>
