<script setup lang="ts">
import type { CardFace } from '#shared/cardDesign'

// CR80 portrait, 54 × 85.6 mm drawn at 10 units/mm; front at x=0, back at x=600. Styled after the hero card in design/05.
const props = defineProps<{ face: CardFace; qrSvg: string }>()
const svg = ref<SVGSVGElement | null>(null)
defineExpose({ svg })

const qrHref = computed(() => (props.qrSvg ? `data:image/svg+xml;base64,${btoa(props.qrSvg)}` : ''))
const initial = computed(() => props.face.name.trim().charAt(0).toUpperCase() || 'T')
const STAR = 'M12 3l2.7 5.5 6 .9-4.4 4.2 1 6-5.3-2.8-5.3 2.8 1-6L3.3 9.4l6-.9z'
// 24×24 stroke icons from design/05-website.html's card menu
const ICONS: Record<string, string> = {
  instagram: '<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17" cy="7" r="1" fill="currentColor"/>',
  facebook: '<path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8z"/>',
  tiktok: '<path d="M9 12a4 4 0 1 0 4 4V3c.5 2.5 2.5 4.5 5 5"/>',
  menu: '<path d="M5 3h11l3 3v15H5z"/><path d="M8.5 9h7M8.5 12.5h7M8.5 16h4.5"/>',
  nfc: '<circle cx="7" cy="12" r="2" fill="currentColor"/><path d="M11 8a6 6 0 0 1 0 8"/><path d="M14.5 5a10.5 10.5 0 0 1 0 14"/>',
}
const icon = computed(() => {
  const f = props.face
  if (f.template === 'follow') return ICONS[f.purpose] ?? ICONS.instagram
  if (f.template === 'menu') return ICONS.menu
  return ICONS.nfc
})
const fit = (text: string, max: number) => (text.length > max ? 480 : undefined)
</script>

<template>
  <svg ref="svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1140 856" class="h-auto w-full" role="img" :aria-label="`Card preview: ${face.headline}`">
    <defs><clipPath id="card-clip"><rect width="540" height="856" rx="36" /></clipPath></defs>

    <!-- front -->
    <g data-side="front">
      <g clip-path="url(#card-clip)">
        <rect width="540" height="856" fill="#ffffff" />
        <rect width="540" height="520" :fill="face.color" />
        <image v-if="face.logoUrl" :href="face.logoUrl" x="190" y="60" width="160" height="160" preserveAspectRatio="xMidYMid meet" />
        <g v-else>
          <circle cx="270" cy="140" r="78" :fill="face.ink" opacity=".16" />
          <text x="270" y="168" text-anchor="middle" :fill="face.ink" :font-family="face.fontDisplay" font-size="80" font-weight="800">{{ initial }}</text>
        </g>
        <g v-if="face.template === 'review'" fill="#ffd23f">
          <path v-for="x in [150, 210, 270, 330, 390]" :key="x" :d="STAR" :transform="`translate(${x - 24} 266) scale(2)`" />
        </g>
        <g v-else-if="face.template !== 'business_card'" :transform="'translate(234 262) scale(3)'" fill="none" :stroke="face.ink" :color="face.ink" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" v-html="icon" />
        <text x="270" y="410" text-anchor="middle" :fill="face.ink" :font-family="face.fontDisplay" font-size="56" font-weight="800" data-role="headline" :textLength="fit(face.headline, 15)" lengthAdjust="spacingAndGlyphs">{{ face.headline }}</text>
        <text v-if="face.subtext" x="270" y="460" text-anchor="middle" :fill="face.ink" :font-family="face.fontBody" font-size="26" opacity=".85" :textLength="fit(face.subtext, 32)" lengthAdjust="spacingAndGlyphs">{{ face.subtext }}</text>
        <template v-if="face.template === 'business_card'">
          <text x="270" y="600" text-anchor="middle" fill="#17152a" :font-family="face.fontDisplay" font-size="40" font-weight="800" :textLength="fit(face.name, 20)" lengthAdjust="spacingAndGlyphs">{{ face.name }}</text>
          <text v-for="(l, i) in face.lines" :key="i" x="270" :y="648 + i * 38" text-anchor="middle" fill="#5f5b75" :font-family="face.fontBody" font-size="26">{{ l }}</text>
        </template>
        <text v-else x="270" y="620" text-anchor="middle" fill="#17152a" :font-family="face.fontDisplay" font-size="36" font-weight="700" :textLength="fit(face.handle || face.name, 22)" lengthAdjust="spacingAndGlyphs">{{ face.handle || face.name }}</text>
        <g v-if="face.showStrip" data-role="strip">
          <g transform="translate(150 758) scale(1.6)" fill="none" stroke="#17152a" color="#17152a" stroke-width="2" stroke-linecap="round" v-html="ICONS.nfc" />
          <text x="200" y="787" fill="#17152a" font-family="Figtree, Arial, sans-serif" font-size="24" font-weight="700" letter-spacing="3">TAP OR SCAN</text>
        </g>
      </g>
      <rect width="540" height="856" rx="36" fill="none" stroke="#e2dff0" stroke-width="3" />
    </g>

    <!-- back -->
    <g data-side="back" transform="translate(600 0)">
      <rect width="540" height="856" rx="36" fill="#ffffff" stroke="#e2dff0" stroke-width="3" />
      <rect x="100" y="150" width="340" height="340" rx="24" fill="#ffffff" stroke="#e1e3e6" stroke-width="3" />
      <image v-if="qrHref" :href="qrHref" x="120" y="170" width="300" height="300" />
      <text x="270" y="566" text-anchor="middle" fill="#17152a" :font-family="face.fontDisplay" font-size="36" font-weight="800">Tap or scan</text>
      <text x="270" y="610" text-anchor="middle" fill="#5f5b75" :font-family="face.fontBody" font-size="24">Hold your phone near this card</text>
      <g transform="translate(196 716)">
        <rect width="48" height="48" rx="13" fill="#5b3fd6" />
        <circle cx="15.6" cy="24" r="4" fill="#fff" />
        <g fill="none" stroke="#fff" stroke-width="3.8" stroke-linecap="round"><path d="M22.8 16.2a10.8 10.8 0 0 1 0 15.6" /><path d="M29.4 10.8a18.6 18.6 0 0 1 0 26.4" /></g>
        <text x="60" y="35" fill="#17152a" font-family="'Bricolage Grotesque', Arial, sans-serif" font-size="32" font-weight="800">tappd</text>
      </g>
    </g>
  </svg>
</template>
