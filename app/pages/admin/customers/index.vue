<script setup lang="ts">
import { refDebounced } from '@vueuse/core'
import CustomerForm from '~/components/admin/CustomerForm.vue'

definePageMeta({ layout: 'admin' })

const search = ref('')
const debounced = refDebounced(search, 250)
const { data: customers } = await useFetch('/api/admin/customers', { query: { search: debounced } })
const creating = ref(false)

async function created(c: { id: string }) {
  creating.value = false
  await navigateTo(`/admin/customers/${c.id}`)
}
</script>

<template>
  <div class="grid gap-4">
    <div class="flex items-center justify-between gap-3">
      <h1 class="text-2xl font-bold">Customers</h1>
      <Button @click="creating = true">New customer</Button>
    </div>
    <Input v-model="search" placeholder="Search by name, contact, phone or email" class="max-w-md" />
    <Card>
      <CardContent class="pt-6">
        <Table>
          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Contact</TableHead><TableHead>Phone</TableHead><TableHead>Email</TableHead></TableRow></TableHeader>
          <TableBody>
            <TableRow v-for="c in customers ?? []" :key="c.id" class="cursor-pointer" @click="navigateTo(`/admin/customers/${c.id}`)">
              <TableCell class="font-medium"><NuxtLink :to="`/admin/customers/${c.id}`" class="hover:underline">{{ c.name }}</NuxtLink></TableCell>
              <TableCell>{{ c.contactName }}</TableCell>
              <TableCell>{{ c.phone }}</TableCell>
              <TableCell>{{ c.email }}</TableCell>
            </TableRow>
            <TableRow v-if="!customers?.length"><TableCell colspan="4" class="text-center text-muted-foreground">No customers found</TableCell></TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
    <Dialog v-model:open="creating">
      <DialogContent>
        <DialogHeader><DialogTitle>New customer</DialogTitle></DialogHeader>
        <CustomerForm @saved="created" />
      </DialogContent>
    </Dialog>
  </div>
</template>
