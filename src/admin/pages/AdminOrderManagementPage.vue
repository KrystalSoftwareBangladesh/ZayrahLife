<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { AdminOrder } from '@/stores/admin/orderStore'
import { useOrderStore } from '@/stores/admin/orderStore'

interface StageColumn {
  key: string
  title: string
  description: string
  dotClass: string
  toneClass: string
}

const columnThemes = [
  { dotClass: 'bg-amber-500', toneClass: 'border-amber-200 bg-amber-50/60' },
  { dotClass: 'bg-cyan-500', toneClass: 'border-cyan-200 bg-cyan-50/60' },
  { dotClass: 'bg-blue-500', toneClass: 'border-blue-200 bg-blue-50/60' },
  { dotClass: 'bg-indigo-500', toneClass: 'border-indigo-200 bg-indigo-50/60' },
  { dotClass: 'bg-violet-500', toneClass: 'border-violet-200 bg-violet-50/60' },
  { dotClass: 'bg-fuchsia-500', toneClass: 'border-fuchsia-200 bg-fuchsia-50/60' },
  { dotClass: 'bg-emerald-500', toneClass: 'border-emerald-200 bg-emerald-50/60' },
  { dotClass: 'bg-rose-500', toneClass: 'border-rose-200 bg-rose-50/60' },
  { dotClass: 'bg-slate-500', toneClass: 'border-slate-200 bg-slate-50/60' }
]

const router = useRouter()
const orderStore = useOrderStore()

const searchQuery = ref('')
const channelFilter = ref('')
const draggedOrderId = ref<string | null>(null)
const updatingOrderIds = ref<Record<string, boolean>>({})

const stageColumns = computed<StageColumn[]>(() => {
  return orderStore.apiStatusOptions.map((status, index) => {
    const theme = columnThemes[index % columnThemes.length]
    const nextLabels = orderStore.getTransitionLabels(status.value)

    return {
      key: status.value,
      title: status.label,
      description: nextLabels.length > 0 ? `Next: ${nextLabels.join(', ')}` : 'No further transitions configured',
      dotClass: theme.dotClass,
      toneClass: theme.toneClass
    }
  })
})

const availableChannels = computed(() => {
  const channels = new Set<string>()
  orderStore.orders.forEach(order => {
    if (order.channel) channels.add(order.channel)
  })
  return Array.from(channels).sort((left, right) => left.localeCompare(right))
})

const normalizedQuery = computed(() => searchQuery.value.trim().toLowerCase())

const filteredOrders = computed(() => {
  return orderStore.orders.filter(order => {
    if (channelFilter.value && order.channel !== channelFilter.value) return false
    if (!normalizedQuery.value) return true

    const haystack = [
      order.id,
      order.invoiceNumber || '',
      order.customerName,
      order.customerEmail,
      order.channel
    ]
      .join(' ')
      .toLowerCase()

    return haystack.includes(normalizedQuery.value)
  })
})

const ordersByStage = computed(() => {
  const grouped = Object.fromEntries(stageColumns.value.map(stage => [stage.key, [] as AdminOrder[]]))

  filteredOrders.value.forEach(order => {
    const matchedStage = stageColumns.value.find(stage => orderStore.statusValuesMatch(stage.key, order.status))
    const targetStage = matchedStage?.key || stageColumns.value[0]?.key
    if (!targetStage) return
    grouped[targetStage].push(order)
  })

  return grouped
})

const boardStats = computed(() => {
  const total = filteredOrders.value.length
  const closedStatuses = stageColumns.value
    .filter(stage => orderStore.getTransitionLabels(stage.key).length === 0)
    .map(stage => stage.key)

  const completed = filteredOrders.value.filter(order =>
    closedStatuses.some(status => orderStore.statusValuesMatch(status, order.status))
  ).length

  const blocked = filteredOrders.value.filter(order => orderStore.getTransitionLabels(order.status).length === 0).length

  return {
    total,
    active: total - completed,
    blocked
  }
})

function onDragStart(orderId: string) {
  draggedOrderId.value = orderId
}

function onDragEnd() {
  draggedOrderId.value = null
}

function isUpdating(orderId: string): boolean {
  return Boolean(updatingOrderIds.value[orderId])
}

async function onDrop(targetStatus: string): Promise<void> {
  if (!draggedOrderId.value) return

  const order = orderStore.getOrderById(draggedOrderId.value)
  draggedOrderId.value = null
  if (!order) return
  if (!orderStore.canTransition(order.status, targetStatus)) return

  updatingOrderIds.value = { ...updatingOrderIds.value, [order.apiId]: true }
  await orderStore.updateOrderStatus(order.apiId, targetStatus)

  const nextState = { ...updatingOrderIds.value }
  delete nextState[order.apiId]
  updatingOrderIds.value = nextState
}

function openOrderDetails(orderId: string) {
  router.push({ name: 'admin-order-detail', params: { id: orderId } })
}

onMounted(async () => {
  await orderStore.fetchStatusMetadata()
  await orderStore.fetchOrders()
})
</script>

<template>
  <div class="space-y-5">
    <div class="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Order Management</h1>
          <p class="text-sm text-gray-500 mt-1">
            Kanban board synced with backend sale statuses and transition rules.
          </p>
        </div>
      </div>

      <div class="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div class="rounded-lg border border-gray-200 p-3 bg-gray-50">
          <p class="text-xs uppercase tracking-wide text-gray-500">Total in Scope</p>
          <p class="text-2xl font-bold text-gray-900 mt-1">{{ boardStats.total }}</p>
        </div>
        <div class="rounded-lg border border-blue-200 p-3 bg-blue-50/60">
          <p class="text-xs uppercase tracking-wide text-blue-700">Active Pipeline</p>
          <p class="text-2xl font-bold text-blue-800 mt-1">{{ boardStats.active }}</p>
        </div>
        <div class="rounded-lg border border-amber-200 p-3 bg-amber-50/70">
          <p class="text-xs uppercase tracking-wide text-amber-700">No Next Step</p>
          <p class="text-2xl font-bold text-amber-800 mt-1">{{ boardStats.blocked }}</p>
        </div>
      </div>

      <div class="mt-4 flex flex-wrap gap-3">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search order, invoice, customer..."
          class="w-full md:w-80 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
        <select
          v-model="channelFilter"
          class="w-full md:w-56 px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="">All channels</option>
          <option v-for="channel in availableChannels" :key="channel" :value="channel">
            {{ channel }}
          </option>
        </select>
      </div>
      <p class="mt-3 text-xs text-gray-500">
        Drag a card into another column only when that transition is allowed by the backend metadata.
      </p>
      <p v-if="orderStore.error" class="mt-2 text-xs text-red-600">
        {{ orderStore.error }}
      </p>
    </div>

    <div class="overflow-x-auto pb-2">
      <div class="flex gap-4 min-w-max">
        <section
          v-for="column in stageColumns"
          :key="column.key"
          class="w-80 rounded-xl border shadow-sm flex flex-col"
          :class="column.toneClass"
          @dragover.prevent
          @drop.prevent="onDrop(column.key)"
        >
          <header class="p-3 border-b border-black/5">
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full" :class="column.dotClass" />
                <h2 class="font-semibold text-gray-900">{{ column.title }}</h2>
              </div>
              <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-white text-gray-700 border border-gray-200">
                {{ ordersByStage[column.key]?.length || 0 }}
              </span>
            </div>
            <p class="text-xs text-gray-600 mt-1">{{ column.description }}</p>
          </header>

          <div class="p-3 space-y-3 min-h-32 max-h-[65vh] overflow-y-auto">
            <article
              v-for="order in ordersByStage[column.key]"
              :key="order.apiId"
              draggable="true"
              class="bg-white rounded-lg border border-gray-200 shadow-sm p-3 cursor-grab active:cursor-grabbing"
              :class="{ 'opacity-60': isUpdating(order.apiId) }"
              @dragstart="onDragStart(order.apiId)"
              @dragend="onDragEnd"
            >
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <p class="font-mono text-xs text-primary-700 truncate">{{ order.id }}</p>
                  <p class="font-medium text-gray-900 text-sm truncate mt-1">{{ order.customerName }}</p>
                </div>
                <span class="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                  {{ order.channel }}
                </span>
              </div>

              <div class="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div class="rounded-md bg-gray-50 border border-gray-200 p-2">
                  <p class="text-gray-500">Amount</p>
                  <p class="font-semibold text-gray-900 mt-0.5">৳{{ order.total.toFixed(2) }}</p>
                </div>
                <div class="rounded-md bg-gray-50 border border-gray-200 p-2">
                  <p class="text-gray-500">Items</p>
                  <p class="font-semibold text-gray-900 mt-0.5">{{ order.items.length }}</p>
                </div>
              </div>

              <div class="mt-3 flex items-center justify-between text-xs text-gray-500">
                <span>{{ new Date(order.createdAt).toLocaleDateString() }}</span>
                <button class="text-primary-700 hover:text-primary-800 font-medium" @click="openOrderDetails(order.apiId)">
                  View
                </button>
              </div>
            </article>

            <div
              v-if="(ordersByStage[column.key]?.length || 0) === 0"
              class="rounded-lg border border-dashed border-gray-300 bg-white/50 p-4 text-center text-xs text-gray-500"
            >
              No orders in this status
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>
