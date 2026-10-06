<script setup lang="ts">
import { QUICK_ICONS, type QuickIcon } from '#shared/types'
import { useDraft } from '~/lib/tapEditor'

const draft = useDraft()
const QUICK: Record<QuickIcon, { label: string; placeholder: string }> = {
  call: { label: 'Call', placeholder: 'tel:+639171234567' },
  sms: { label: 'Text', placeholder: 'sms:+639171234567' },
  chat: { label: 'Message', placeholder: 'https://m.me/yourpage or viber://chat?number=%2B63…' },
  nav: { label: 'Directions', placeholder: 'https://maps.google.com/?q=…' },
  mail: { label: 'Email', placeholder: 'mailto:hello@yourbusiness.ph' },
}
</script>

<template>
  <div class="grid gap-6">
    <div class="grid gap-2">
      <Label>Quick action buttons (up to 4)</Label>
      <div v-for="(q, i) in draft.content.quick" :key="i" class="grid gap-2 rounded-md border p-2 sm:grid-cols-[9rem_8rem_1fr_auto]">
        <Select v-model="q.icon">
          <SelectTrigger aria-label="Action type"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem v-for="ic in QUICK_ICONS" :key="ic" :value="ic">{{ QUICK[ic].label }}</SelectItem></SelectContent>
        </Select>
        <Input v-model="q.label" aria-label="Button label" />
        <Input v-model="q.url" :placeholder="QUICK[q.icon].placeholder" aria-label="Action link" />
        <Button type="button" variant="ghost" size="sm" @click="draft.content.quick.splice(i, 1)">Remove</Button>
      </div>
      <Button v-if="draft.content.quick.length < 4" type="button" variant="outline" size="sm" class="justify-self-start" @click="draft.content.quick.push({ icon: 'call', label: 'Call', url: '' })">Add button</Button>
    </div>
    <div class="grid gap-3 sm:grid-cols-3">
      <p class="text-sm text-muted-foreground sm:col-span-3">Contact details used by "Save contact"</p>
      <div class="grid gap-1.5"><Label for="tp-phone">Phone</Label><Input id="tp-phone" v-model="draft.content.contact.phone" /></div>
      <div class="grid gap-1.5"><Label for="tp-email">Email</Label><Input id="tp-email" v-model="draft.content.contact.email" /></div>
      <div class="grid gap-1.5"><Label for="tp-address">Address</Label><Input id="tp-address" v-model="draft.content.contact.address" /></div>
    </div>
  </div>
</template>
