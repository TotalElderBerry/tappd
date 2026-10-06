<script setup lang="ts">
import { toast } from 'vue-sonner'
import { CARD_PURPOSES, PURPOSE_LABELS, type CardPurpose, type CardVCard, type DestinationType, type OrderDesign } from '#shared/types'
import { downloadText, downloadUrl, qrPngDataUrl, qrSvg } from '~/lib/qr'
import CardPreview from '~/components/admin/CardPreview.vue'
import { CARD_TEMPLATES, resolveCardFace } from '#shared/cardDesign'
import type { CardDesign, CardTemplate } from '#shared/types'
import { svgToPngDataUrl } from '~/lib/svgExport'

const props = defineProps<{
  cardId: string | null
  tapPages: { id: string; slug: string; published: boolean }[]
  orderDesign: OrderDesign
  businessName: string
}>()
const emit = defineEmits<{ close: []; saved: [] }>()

interface Detail {
  card: { id: string; code: string; label: string; purpose: CardPurpose; active: boolean; destinationType: DestinationType; destinationUrl: string | null; tapPageId: string | null; vcard: CardVCard | null; design: CardDesign; designApprovedAt: string | null }
  stats: { total: number; last7: number; last30: number; nfc: number; qr: number }
  chipUrl: string
  qrUrl: string
}

const detail = ref<Detail | null>(null)
const tab = ref('details')
const qr = ref('')
const busy = ref(false)
const emptyVCard = (): CardVCard => ({ fullName: '', title: '', org: '', phones: [''], emails: [''], url: '', address: '' })
const form = reactive({ label: '', purpose: 'custom' as CardPurpose, active: true, type: 'none' as DestinationType, url: '', tapPageId: '', vcard: emptyVCard() })
const design = reactive<CardDesign>({ template: 'custom', headline: '', subtext: '', showStrip: true })
const approved = ref(false)
const preview = ref<InstanceType<typeof CardPreview> | null>(null)
const face = computed(() => resolveCardFace(props.orderDesign, {
  design, purpose: form.purpose,
  destinationUrl: form.type === 'url' ? form.url : null,
  vcard: form.type === 'vcard' ? form.vcard : null,
}, props.businessName))

async function saveDesign() {
  if (!props.cardId) return
  await adminFetch(`/api/admin/cards/${props.cardId}`, { method: 'PATCH', body: { design } })
  toast.success('Design saved')
  emit('saved')
}
async function setApproved(v: boolean) {
  if (!props.cardId) return
  await adminFetch(`/api/admin/cards/${props.cardId}`, { method: 'PATCH', body: { approved: v } })
  approved.value = v
  emit('saved')
}
async function downloadPreview() {
  const el = preview.value?.svg
  if (!el || !detail.value) return
  try {
    downloadUrl(await svgToPngDataUrl(el), `tappd-${detail.value.card.code}-preview.png`)
  } catch (e) {
    toast.error(`Couldn't create the image: ${apiError(e)}`)
  }
}

async function load(id: string) {
  const d = await adminFetch<Detail>(`/api/admin/cards/${id}`)
  detail.value = d
  Object.assign(form, {
    label: d.card.label, purpose: d.card.purpose, active: d.card.active, type: d.card.destinationType,
    url: d.card.destinationUrl ?? '', tapPageId: d.card.tapPageId ?? props.tapPages[0]?.id ?? '',
    vcard: d.card.vcard ? { ...emptyVCard(), ...d.card.vcard, phones: d.card.vcard.phones.length ? [...d.card.vcard.phones] : [''], emails: d.card.vcard.emails.length ? [...d.card.vcard.emails] : [''] } : emptyVCard(),
  })
  Object.assign(design, d.card.design)
  approved.value = !!d.card.designApprovedAt
  qr.value = await qrSvg(d.qrUrl)
}
watch(() => props.cardId, (id) => { detail.value = null; tab.value = 'details'; if (id) void load(id) }, { immediate: true })

function destinationBody() {
  switch (form.type) {
    case 'url': return { type: 'url', url: form.url }
    case 'tap_page': return { type: 'tap_page', tapPageId: form.tapPageId }
    case 'vcard': return { type: 'vcard', vcard: { ...form.vcard, phones: form.vcard.phones.filter(Boolean), emails: form.vcard.emails.filter(Boolean) } }
    default: return { type: 'none' }
  }
}

async function saveDetails() {
  if (!props.cardId) return
  busy.value = true
  try {
    await adminFetch(`/api/admin/cards/${props.cardId}`, { method: 'PATCH', body: { label: form.label, purpose: form.purpose, active: form.active, destination: destinationBody() } })
    toast.success('Card saved')
    emit('saved')
    await load(props.cardId)
  } finally {
    busy.value = false
  }
}

async function copy(text: string) {
  await navigator.clipboard.writeText(text)
  toast.success('Copied')
}
async function downloadPng() {
  if (detail.value) downloadUrl(await qrPngDataUrl(detail.value.qrUrl), `tappd-${detail.value.card.code}-qr.png`)
}
function downloadSvg() {
  if (detail.value) downloadText(qr.value, `tappd-${detail.value.card.code}-qr.svg`, 'image/svg+xml')
}
</script>

<template>
  <Sheet :open="!!cardId" @update:open="(v: boolean) => { if (!v) emit('close') }">
    <SheetContent class="w-full overflow-y-auto sm:max-w-2xl">
      <SheetHeader>
        <SheetTitle>{{ detail ? `${detail.card.label} · ${detail.card.code}` : 'Loading card…' }}</SheetTitle>
      </SheetHeader>
      <Tabs v-if="detail" v-model="tab" class="px-4 pb-6">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="design">Design</TabsTrigger>
          <TabsTrigger value="programming">Programming</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <form class="grid gap-4 pt-2" @submit.prevent="saveDetails">
            <div class="grid gap-3 sm:grid-cols-2">
              <div class="grid gap-1.5"><Label for="cd-label">Label</Label><Input id="cd-label" v-model="form.label" /></div>
              <div class="grid gap-1.5">
                <Label>Purpose</Label>
                <Select v-model="form.purpose">
                  <SelectTrigger aria-label="Purpose"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem v-for="p in CARD_PURPOSES" :key="p" :value="p">{{ PURPOSE_LABELS[p] }}</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div class="grid gap-1.5">
              <Label>When tapped, go to</Label>
              <Select v-model="form.type">
                <SelectTrigger aria-label="Destination type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nothing yet (shows "not set up")</SelectItem>
                  <SelectItem value="url">A link</SelectItem>
                  <SelectItem value="tap_page" :disabled="!tapPages.length">The customer's Tap Page</SelectItem>
                  <SelectItem value="vcard">Save a contact (business card)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div v-if="form.type === 'url'" class="grid gap-1.5">
              <Label for="cd-url">Link</Label>
              <Input id="cd-url" v-model="form.url" placeholder="https://g.page/r/…/review" />
              <p class="text-xs text-muted-foreground">Google review link, Instagram, Facebook, TikTok, menu, or the customer's website.</p>
            </div>
            <div v-if="form.type === 'tap_page'" class="grid gap-1.5">
              <Label>Tap Page</Label>
              <Select v-model="form.tapPageId">
                <SelectTrigger aria-label="Tap Page"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem v-for="p in tapPages" :key="p.id" :value="p.id">/{{ p.slug }}{{ p.published ? '' : ' (draft)' }}</SelectItem></SelectContent>
              </Select>
            </div>
            <div v-if="form.type === 'vcard'" class="grid gap-3 sm:grid-cols-2">
              <div class="grid gap-1.5"><Label for="vc-name">Full name</Label><Input id="vc-name" v-model="form.vcard.fullName" /></div>
              <div class="grid gap-1.5"><Label for="vc-title">Title</Label><Input id="vc-title" v-model="form.vcard.title" /></div>
              <div class="grid gap-1.5"><Label for="vc-org">Company</Label><Input id="vc-org" v-model="form.vcard.org" /></div>
              <div class="grid gap-1.5"><Label for="vc-phone">Phone</Label><Input id="vc-phone" v-model="form.vcard.phones[0]" /></div>
              <div class="grid gap-1.5"><Label for="vc-email">Email</Label><Input id="vc-email" v-model="form.vcard.emails[0]" type="email" /></div>
              <div class="grid gap-1.5"><Label for="vc-url">Website</Label><Input id="vc-url" v-model="form.vcard.url" /></div>
              <div class="grid gap-1.5 sm:col-span-2"><Label for="vc-addr">Address</Label><Input id="vc-addr" v-model="form.vcard.address" /></div>
            </div>
            <label class="flex items-center gap-2 text-sm"><Switch v-model="form.active" /> Card is on</label>
            <Button type="submit" :disabled="busy" class="justify-self-start">Save card</Button>
          </form>
        </TabsContent>

        <TabsContent value="design">
          <div class="grid gap-4 pt-2">
            <CardPreview ref="preview" :face="face" :qr-svg="qr" />
            <p class="text-xs text-muted-foreground">Color, logo and font come from the order design. This preview is for customer approval, not for print.</p>
            <form class="grid gap-3 sm:grid-cols-2" @submit.prevent="saveDesign">
              <div class="grid gap-1.5">
                <Label>Template</Label>
                <Select v-model="design.template">
                  <SelectTrigger aria-label="Template"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem v-for="t in CARD_TEMPLATES" :key="t.key" :value="t.key as CardTemplate">{{ t.label }}</SelectItem></SelectContent>
                </Select>
              </div>
              <div class="grid gap-1.5"><Label for="ds-headline">Headline</Label><Input id="ds-headline" v-model="design.headline" maxlength="60" /></div>
              <div class="grid gap-1.5 sm:col-span-2"><Label for="ds-sub">Subtext</Label><Input id="ds-sub" v-model="design.subtext" maxlength="80" /></div>
              <label class="flex items-center gap-2 text-sm"><Switch v-model="design.showStrip" /> Show "TAP OR SCAN" strip</label>
              <div class="flex flex-wrap gap-2 sm:col-span-2">
                <Button type="submit">Save design</Button>
                <Button type="button" variant="outline" @click="downloadPreview">Download preview image</Button>
              </div>
            </form>
            <label class="flex items-center gap-2 text-sm font-medium"><Switch :model-value="approved" @update:model-value="setApproved" /> Customer approved this design</label>
          </div>
        </TabsContent>

        <TabsContent value="programming">
          <div v-if="detail" class="grid gap-5 pt-2">
            <div class="grid gap-2">
              <Label>Write this URL to the NFC chip</Label>
              <div class="flex items-center gap-2">
                <code class="flex-1 rounded-md bg-muted px-3 py-2 font-mono text-lg" data-testid="chip-url">{{ detail.chipUrl }}</code>
                <Button variant="outline" @click="copy(detail.chipUrl)">Copy</Button>
              </div>
            </div>
            <div class="flex flex-wrap items-start gap-4">
              <div class="w-44 rounded-md border bg-white p-2" aria-label="QR code" v-html="qr"></div>
              <div class="grid gap-2">
                <p class="text-sm text-muted-foreground">QR opens <span class="font-mono">{{ detail.qrUrl }}</span></p>
                <div class="flex gap-2"><Button variant="outline" size="sm" @click="downloadPng">Download PNG</Button><Button variant="outline" size="sm" @click="downloadSvg">Download SVG</Button></div>
                <Button variant="secondary" size="sm" as-child><a :href="detail.chipUrl" target="_blank" rel="noopener">Test (counts as a tap)</a></Button>
              </div>
            </div>
            <div class="grid grid-cols-5 gap-2 text-center" data-testid="stats">
              <div v-for="[k, label] in [['total', 'Total'], ['last7', '7 days'], ['last30', '30 days'], ['nfc', 'NFC'], ['qr', 'QR']] as const" :key="k" class="rounded-md border p-2">
                <div class="text-xl font-bold">{{ detail.stats[k] }}</div><div class="text-xs text-muted-foreground">{{ label }}</div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </SheetContent>
  </Sheet>
</template>
