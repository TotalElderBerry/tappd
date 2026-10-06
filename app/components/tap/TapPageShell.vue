<script setup lang="ts">
import {
  accentCss, contactLines, pageClass, renderAvatarInner, renderContent, renderCover, renderIdCol, renderStatus,
} from '#shared/tapPage/render'
import type { TapPageView } from '#shared/types'

// Markup from design/07 lines 176–196 (without the demo controls strip); behavior from 07 lines 316–326 with real actions.
const props = defineProps<{ view: TapPageView; preview?: boolean }>()
const config = useRuntimeConfig()

const now = ref(new Date())
const coverHtml = computed(() => renderCover(props.view))
const idcolHtml = computed(() => renderIdCol(props.view, now.value))
const contentHtml = computed(() => renderContent(props.view, now.value))
const avatarInner = computed(() => renderAvatarInner(props.view))
const lines = computed(() => contactLines(props.view.content))

useHead({ style: [{ key: 'tap-accent', innerHTML: computed(() => accentCss(props.view.color)) }] })

const toastMsg = ref('')
const toastOn = ref(false)
let toastTimer: ReturnType<typeof setTimeout> | undefined
function toast(m: string) {
  toastMsg.value = m
  toastOn.value = true
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toastOn.value = false }, 2600)
}

const sheetOpen = ref(false)
const okBtn = ref<HTMLButtonElement | null>(null)
let lastFocus: Element | null = null
async function openSheet() {
  lastFocus = document.activeElement
  sheetOpen.value = true
  await nextTick()
  okBtn.value?.focus()
}
function closeSheet() {
  sheetOpen.value = false
  if (lastFocus instanceof HTMLElement && lastFocus.isConnected) lastFocus.focus()
}
function saveContact() {
  closeSheet()
  if (props.preview) return toast('Preview · This downloads the contact card.')
  window.location.href = `/${props.view.slug}/contact.vcf`
}

function pageUrl() {
  const base = (config.public.baseUrl || location.origin).replace(/\/+$/, '')
  return `${base}/${props.view.slug}`
}
async function share() {
  const url = pageUrl()
  const shown = url.replace(/^https?:\/\//, '')
  if (navigator.share && !props.preview) {
    try {
      await navigator.share({ title: props.view.content.name, url })
      return
    } catch (e) {
      if ((e as DOMException).name === 'AbortError') return
    }
  }
  try {
    await navigator.clipboard.writeText(url)
    toast(`Link copied: ${shown}`)
  } catch {
    toast(`Page link: ${shown}`)
  }
}
function openUrl(url: string) {
  if (props.preview) return toast(`Preview · Opens ${url}`)
  if (/^https?:/i.test(url)) window.open(url, '_blank', 'noopener')
  else window.location.href = url
}

function onClick(e: MouseEvent) {
  const t = e.target as Element | null
  if (!t) return
  if (t.closest('#share')) { e.preventDefault(); void share(); return }
  if (t.closest('#save')) { e.preventDefault(); void openSheet(); return }
  const el = t.closest<HTMLElement>('[data-href]')
  if (el?.dataset.href) { e.preventDefault(); openUrl(el.dataset.href) }
}
function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape' && sheetOpen.value) closeSheet()
}

let statusTimer: ReturnType<typeof setInterval> | undefined
onMounted(() => {
  now.value = new Date() // re-render with the visitor's clock, as 07 renders in the browser
  document.addEventListener('click', onClick)
  document.addEventListener('keydown', onKey)
  // Like 07: refresh only the status badges each minute so an open hours list stays open.
  statusTimer = setInterval(() => {
    const st = renderStatus(props.view.content, new Date())
    document.querySelectorAll('.status').forEach((el) => {
      el.className = 'status ' + (st.open ? 'open' : 'closed')
      el.innerHTML = st.html
    })
  }, 60000)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onClick)
  document.removeEventListener('keydown', onKey)
  clearInterval(statusTimer)
  clearTimeout(toastTimer)
})
</script>

<template>
<main :class="pageClass(view)" id="page">
  <div class="cover" id="cover" data-allow-mismatch v-html="coverHtml"></div>
  <div class="layout">
    <aside class="idcol" id="idcol" data-allow-mismatch v-html="idcolHtml"></aside>
    <div class="content" id="content" data-allow-mismatch v-html="contentHtml"></div>
    <footer>
      <a class="made" href="/"><svg viewBox="0 0 40 40" aria-hidden="true"><rect width="40" height="40" rx="11" fill="var(--tappd)"/><circle cx="13" cy="20" r="3.4" fill="#fff"/><g fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round"><path d="M19 13.5a9 9 0 0 1 0 13"/><path d="M24.5 9a15.5 15.5 0 0 1 0 22"/></g></svg>Made with <b>tappd</b></a>
      <small>Get your own Tap Page at tappd.ph</small>
    </footer>
  </div>
</main>

<div class="toast" :class="{ on: toastOn }" id="toast" role="status" aria-live="polite">{{ toastMsg }}</div>
<div class="sheet-bg" id="sheet" :hidden="!sheetOpen" @click.self="closeSheet">
  <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="sh-h">
    <h3 id="sh-h">Save {{ view.content.name }} to your contacts?</h3>
    <div class="vc"><div class="av" id="vc-av" v-html="avatarInner"></div><dl id="vc-dl"><dt>{{ view.content.name }}</dt><dd v-if="view.content.role">{{ view.content.role }}</dd><dd v-for="l in lines" :key="l">{{ l }}</dd></dl></div>
    <p>This downloads a contact card that opens straight in your phone's Contacts app.</p>
    <div class="row2"><button class="ghost" type="button" id="sh-cancel" @click="closeSheet">Not now</button><button ref="okBtn" class="solid" type="button" id="sh-ok" @click="saveContact">Save contact</button></div>
  </div>
</div>
</template>
