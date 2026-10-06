<script setup lang="ts">
import { formatPeso, getPackage } from '#shared/packages'
import { ORDER_STATUS_LABELS, type OrderStatus } from '#shared/types'

interface Row { id: string; packageKey: string; cardCount: number; pricePhp: number; status: OrderStatus; createdAt: string | Date; customerName?: string }
const props = defineProps<{ orders: Row[] }>()
const showCustomer = computed(() => props.orders.some(o => o.customerName))
</script>

<template>
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Date</TableHead>
        <TableHead v-if="showCustomer">Customer</TableHead>
        <TableHead>Package</TableHead>
        <TableHead>Cards</TableHead>
        <TableHead>Price</TableHead>
        <TableHead>Status</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow v-for="o in orders" :key="o.id" class="cursor-pointer" @click="navigateTo(`/admin/orders/${o.id}`)">
        <TableCell><NuxtLink :to="`/admin/orders/${o.id}`" class="hover:underline">{{ new Date(o.createdAt).toLocaleDateString('en-PH') }}</NuxtLink></TableCell>
        <TableCell v-if="showCustomer">{{ o.customerName }}</TableCell>
        <TableCell>{{ getPackage(o.packageKey)?.name ?? o.packageKey }}</TableCell>
        <TableCell>{{ o.cardCount }}</TableCell>
        <TableCell>{{ formatPeso(o.pricePhp) }}</TableCell>
        <TableCell><Badge :variant="o.status === 'delivered' ? 'secondary' : 'default'">{{ ORDER_STATUS_LABELS[o.status] }}</Badge></TableCell>
      </TableRow>
      <TableRow v-if="!orders.length">
        <TableCell :colspan="showCustomer ? 6 : 5" class="text-center text-muted-foreground">No orders yet</TableCell>
      </TableRow>
    </TableBody>
  </Table>
</template>
