<script setup lang="ts">
interface Customer { id: string; name: string; contactName: string | null; phone: string | null; email: string | null; facebook: string | null; notes: string | null }
const props = defineProps<{ customer?: Customer }>()
const emit = defineEmits<{ saved: [Customer] }>()

const form = reactive({
  name: props.customer?.name ?? '',
  contactName: props.customer?.contactName ?? '',
  phone: props.customer?.phone ?? '',
  email: props.customer?.email ?? '',
  facebook: props.customer?.facebook ?? '',
  notes: props.customer?.notes ?? '',
})
const busy = ref(false)

async function submit() {
  busy.value = true
  try {
    const saved = props.customer
      ? await adminFetch<Customer>(`/api/admin/customers/${props.customer.id}`, { method: 'PATCH', body: form })
      : await adminFetch<Customer>('/api/admin/customers', { method: 'POST', body: form })
    emit('saved', saved)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <form class="grid gap-3" @submit.prevent="submit">
    <div class="grid gap-1.5"><Label for="c-name">Business or person name</Label><Input id="c-name" v-model="form.name" required /></div>
    <div class="grid gap-3 sm:grid-cols-2">
      <div class="grid gap-1.5"><Label for="c-contact">Contact person</Label><Input id="c-contact" v-model="form.contactName" /></div>
      <div class="grid gap-1.5"><Label for="c-phone">Phone</Label><Input id="c-phone" v-model="form.phone" /></div>
      <div class="grid gap-1.5"><Label for="c-email">Email</Label><Input id="c-email" v-model="form.email" type="email" /></div>
      <div class="grid gap-1.5"><Label for="c-fb">Facebook</Label><Input id="c-fb" v-model="form.facebook" placeholder="facebook.com/…" /></div>
    </div>
    <div class="grid gap-1.5"><Label for="c-notes">Notes</Label><Textarea id="c-notes" v-model="form.notes" rows="3" /></div>
    <Button type="submit" :disabled="busy" class="justify-self-start">{{ customer ? 'Save customer' : 'Create customer' }}</Button>
  </form>
</template>
