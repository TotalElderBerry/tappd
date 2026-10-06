<script setup lang="ts">
definePageMeta({ layout: 'admin' })

const { data: pages } = await useFetch('/api/admin/tap-pages')
const { data: customers } = await useFetch('/api/admin/customers')
const creating = ref(false)
const customerId = ref('')
const template = ref<'business' | 'personal'>('business')

async function create() {
  const p = await adminFetch<{ id: string }>('/api/admin/tap-pages', { method: 'POST', body: { customerId: customerId.value, template: template.value } })
  await navigateTo(`/admin/tap-pages/${p.id}`)
}
</script>

<template>
  <div class="grid gap-4">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold">Tap Pages</h1>
      <Button @click="creating = true">New Tap Page</Button>
    </div>
    <Card>
      <CardContent class="pt-6">
        <Table>
          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Customer</TableHead><TableHead>Link</TableHead><TableHead>Status</TableHead><TableHead>Updated</TableHead></TableRow></TableHeader>
          <TableBody>
            <TableRow v-for="p in pages ?? []" :key="p.id" class="cursor-pointer" @click="navigateTo(`/admin/tap-pages/${p.id}`)">
              <TableCell class="font-medium"><NuxtLink :to="`/admin/tap-pages/${p.id}`" class="hover:underline">{{ p.content.name }}</NuxtLink></TableCell>
              <TableCell>{{ p.customerName }}</TableCell>
              <TableCell class="font-mono text-sm">/{{ p.slug }}</TableCell>
              <TableCell><Badge :variant="p.published ? 'default' : 'secondary'">{{ p.published ? 'Live' : 'Draft' }}</Badge></TableCell>
              <TableCell>{{ new Date(p.updatedAt).toLocaleDateString('en-PH') }}</TableCell>
            </TableRow>
            <TableRow v-if="!pages?.length"><TableCell colspan="5" class="text-center text-muted-foreground">No Tap Pages yet</TableCell></TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
    <Dialog v-model:open="creating">
      <DialogContent>
        <DialogHeader><DialogTitle>New Tap Page</DialogTitle></DialogHeader>
        <div class="grid gap-3">
          <Select v-model="customerId">
            <SelectTrigger aria-label="Customer"><SelectValue placeholder="Choose a customer" /></SelectTrigger>
            <SelectContent><SelectItem v-for="c in customers ?? []" :key="c.id" :value="c.id">{{ c.name }}</SelectItem></SelectContent>
          </Select>
          <Select v-model="template">
            <SelectTrigger aria-label="Template"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="business">Business (like Café Luna)</SelectItem><SelectItem value="personal">Personal (like Andrea)</SelectItem></SelectContent>
          </Select>
          <Button :disabled="!customerId" @click="create">Create</Button>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>
