<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useOrderStore } from '@/stores/admin/orderStore'

type OrderStage =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'packaged'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'returned'
  | 'cancelled'

interface StageColumn {
  key: OrderStage
  title: string
  description: string
  dotClass: string
  toneClass: string
}

const STORAGE_KEY = 'admin-order-management-board-v1'

const router = useRouter()
const orderStore = useOrderStore()

const searchQuery = ref('')
const channelFilter = ref('')
const draggedOrderId = ref<string | null>(null)
const boardState = ref<Record<string, OrderStage>>({})

const stageColumns: StageColumn[] = [
  {
    key: 'pending',
    title: 'Pending',
    description: 'New order received',
    dotClass: 'bg-amber-500',
    toneClass: 'border-amber-200 bg-amber-50/60'
  },
  {
    key: 'confirmed',
    title: 'Confirmed',
    description: 'Payment/stock verified',
    dotClass: 'bg-cyan-500',
    toneClass: 'border-cyan-200 bg-cyan-50/60'
  },
  {
    key: 'processing',
    title: 'Processing',
    description: 'Picking and internal checks',
    dotClass: 'bg-blue-500',
    toneClass: 'border-blue-200 bg-blue-50/60'
  },
  {
    key: 'packaged',
    title: 'Packaged',
    description: 'Packed and labeled',
    dotClass: 'bg-indigo-500',
    toneClass: 'border-indigo-200 bg-indigo-50/60'
  },
  {
    key: 'shipped',
    title: 'Shipped',
    description: 'Handed to courier',
    dotClass: 'bg-violet-500',
    toneClass: 'border-violet-200 bg-violet-50/60'
  },
  {
    key: 'out_for_delivery',
    title: 'Out for Delivery',
    description: 'On final-mile route',
    dotClass: 'bg-fuchsia-500',
    toneClass: 'border-fuchsia-200 bg-fuchsia-50/60'
  },
  {
    key: 'delivered',
    title: 'Delivered',
    description: 'Completed successfully',
    dotClass: 'bg-emerald-500',
    toneClass: 'border-emerald-200 bg-emerald-50/60'
  },
  {
    key: 'returned',
    title: 'Returned',
    description: 'Returned by customer',
    dotClass: 'bg-rose-500',
    toneClass: 'border-rose-200 bg-rose-50/60'
  },
  {
    key: 'cancelled',
    title: 'Cancelled',
    description: 'Cancelled before completion',
    dotClass: 'bg-slate-500',
    toneClass: 'border-slate-200 bg-slate-50/60'
  }
]

const stageOrder = stageColumns.map(column => column.key)
const stageSet = new Set<OrderStage>(stageOrder)

const availableChannels = computed(() => {
  const channels = new Set<string>()
  orderStore.orders.forEach(order => {
    if (order.channel) channels.add(order.channel)
  })
  return Array.from(channels).sort((a, b) => a.localeCompare(b))
})

const normalizedQuery = computed(() => searchQuery.value.trim().toLowerCase())

function normalizeStage(status: string): OrderStage {
  const value = (status || '').toLowerCase().trim().replace(/[-\s]/g, '_')

  if (value === 'draft') return 'pending'
  if (value === 'confirmed') return 'confirmed'
  if (value === 'processing') return 'processing'
  if (value === 'packaged') return 'packaged'
  if (value === 'shipped') return 'shipped'
  if (value === 'out_for_delivery') return 'out_for_delivery'
  if (value === 'delivered') return 'delivered'
  if (value === 'returned') return 'returned'
  if (value === 'cancelled') return 'cancelled'
  return 'pending'
}

function getOrderStage(orderId: string, fallbackStatus: string): OrderStage {
  const existing = boardState.value[orderId]
  if (existing && stageSet.has(existing)) return existing
  return normalizeStage(fallbackStatus)
}

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
  const grouped = Object.fromEntries(stageOrder.map(stage => [stage, [] as typeof orderStore.orders]))
  filteredOrders.value.forEach(order => {
    const stage = getOrderStage(order.id, order.status)
    grouped[stage].push(order)
  })
  return grouped
})

const boardStats = computed(() => {
  const total = filteredOrders.value.length
  const active = total - ordersByStage.value.delivered.length - ordersByStage.value.cancelled.length
  const delayed =
    ordersByStage.value.pending.length +
    ordersByStage.value.confirmed.length +
    ordersByStage.value.processing.length

  return { total, active, delayed }
})

function hydrateBoardState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw) as Record<string, string>
    const sanitized: Record<string, OrderStage> = {}
    Object.entries(parsed).forEach(([orderId, stage]) => {
      const normalized = normalizeStage(stage)
      if (stageSet.has(normalized)) {
        sanitized[orderId] = normalized
      }
    })
    boardState.value = sanitized
  } catch {
    boardState.value = {}
  }
}

function persistBoardState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(boardState.value))
}

function moveToStage(orderId: string, stage: OrderStage) {
  boardState.value = {
    ...boardState.value,
    [orderId]: stage
  }
}

function onDragStart(orderId: string) {
  draggedOrderId.value = orderId
}

function onDrop(stage: OrderStage) {
  if (!draggedOrderId.value) return
  moveToStage(draggedOrderId.value, stage)
  draggedOrderId.value = null
}

function openOrderDetails(orderId: string) {
  router.push({ name: 'admin-order-detail', params: { id: orderId } })
}

function clearBoardTracking() {
  boardState.value = {}
}

watch(boardState, persistBoardState, { deep: true })

onMounted(() => {
  hydrateBoardState()
  void orderStore.fetchOrders()
})
</script>

<template>
  <div class="space-y-5">
    <div class="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Order Management</h1>
          <p class="text-sm text-gray-500 mt-1">
            Kanban board for tracking the complete order lifecycle from intake to completion.
          </p>
        </div>
        <button
          class="px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          @click="clearBoardTracking"
        >
          Reset Board Tracking
        </button>
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
          <p class="text-xs uppercase tracking-wide text-amber-700">Needs Attention</p>
          <p class="text-2xl font-bold text-amber-800 mt-1">{{ boardStats.delayed }}</p>
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
        Board stage updates are tracked locally in this browser to support detailed follow-up steps beyond API status values.
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
          @drop="onDrop(column.key)"
        >
          <header class="p-3 border-b border-black/5">
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full" :class="column.dotClass" />
                <h2 class="font-semibold text-gray-900">{{ column.title }}</h2>
              </div>
              <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-white text-gray-700 border border-gray-200">
                {{ ordersByStage[column.key].length }}
              </span>
            </div>
            <p class="text-xs text-gray-600 mt-1">{{ column.description }}</p>
          </header>

          <div class="p-3 space-y-3 min-h-32 max-h-[65vh] overflow-y-auto">
            <article
              v-for="order in ordersByStage[column.key]"
              :key="order.id"
              draggable="true"
              class="bg-white rounded-lg border border-gray-200 shadow-sm p-3 cursor-grab active:cursor-grabbing"
              @dragstart="onDragStart(order.id)"
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
                  <p class="font-semibold text-gray-900 mt-0.5">${{ order.total.toFixed(2) }}</p>
                </div>
                <div class="rounded-md bg-gray-50 border border-gray-200 p-2">
                  <p class="text-gray-500">Items</p>
                  <p class="font-semibold text-gray-900 mt-0.5">{{ order.items.length }}</p>
                </div>
              </div>

              <div class="mt-3 flex items-center justify-between text-xs text-gray-500">
                <span>{{ new Date(order.createdAt).toLocaleDateString() }}</span>
                <button class="text-primary-700 hover:text-primary-800 font-medium" @click="openOrderDetails(order.id)">
                  View
                </button>
              </div>
            </article>

            <div
              v-if="ordersByStage[column.key].length === 0"
              class="rounded-lg border border-dashed border-gray-300 bg-white/50 p-4 text-center text-xs text-gray-500"
            >
              No orders in this stage
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>
