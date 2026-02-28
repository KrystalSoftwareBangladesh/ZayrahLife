<script setup>
import { computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import StatCard from '@/components/admin/StatCard.vue'
import { useOrderStore } from '@/stores/admin/orderStore'
import { useInventoryStore } from '@/stores/admin/inventoryStore'
import { useAccountStore } from '@/stores/admin/accountStore'
import { useCustomerStore } from '@/stores/admin/customerStore'

const orderStore = useOrderStore()
const inventoryStore = useInventoryStore()
const accountStore = useAccountStore()
const customerStore = useCustomerStore()

const stats = computed(() => [
  {
    title: 'Total Orders',
    value: orderStore.totalOrders,
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
    color: 'blue',
    trend: 12
  },
  {
    title: 'Total Revenue',
    value: `$${orderStore.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    color: 'green',
    trend: 8
  },
  {
    title: 'Total Expenses',
    value: `$${accountStore.totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z',
    color: 'red',
    trend: -5
  },
  {
    title: 'Stock Count',
    value: inventoryStore.totalStockCount.toLocaleString(),
    icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
    color: 'purple',
    trend: 3
  }
])

const recentOrders = computed(() => orderStore.orders.slice(0, 5))
const lowStockItems = computed(() => inventoryStore.lowStockItems.slice(0, 5))

onMounted(() => {
  void orderStore.fetchOrders()
})
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>
      <p class="text-gray-500 mt-1">Welcome back! Here's an overview of your business.</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        v-for="stat in stats"
        :key="stat.title"
        :title="stat.title"
        :value="stat.value"
        :icon="stat.icon"
        :color="stat.color"
        :trend="stat.trend"
      />
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-900">Recent Orders</h2>
          <RouterLink to="/admin/orders" class="text-sm text-primary-600 hover:text-primary-700">
            View all
          </RouterLink>
        </div>
        <div class="space-y-3">
          <div
            v-for="order in recentOrders"
            :key="order.id"
            class="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
          >
            <div>
              <p class="font-medium text-gray-900">{{ order.id }}</p>
              <p class="text-sm text-gray-500">{{ order.customerName }}</p>
            </div>
            <div class="text-right">
              <p class="font-medium text-gray-900">${{ order.total.toFixed(2) }}</p>
              <span
                :class="{
                  'bg-yellow-100 text-yellow-800': order.status === 'pending',
                  'bg-blue-100 text-blue-800': order.status === 'processing',
                  'bg-purple-100 text-purple-800': order.status === 'shipped',
                  'bg-green-100 text-green-800': order.status === 'delivered'
                }"
                class="inline-block px-2 py-0.5 text-xs font-medium rounded-full"
              >
                {{ order.status }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-900">Low Stock Alerts</h2>
          <RouterLink to="/admin/products" class="text-sm text-primary-600 hover:text-primary-700">
            View inventory
          </RouterLink>
        </div>
        <div v-if="lowStockItems.length === 0" class="text-center py-8 text-gray-500">
          No low stock items
        </div>
        <div v-else class="space-y-3">
          <div
            v-for="item in lowStockItems"
            :key="item.id"
            class="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
          >
            <div>
              <p class="font-medium text-gray-900">{{ item.productName }}</p>
              <p class="text-sm text-gray-500">{{ item.color }} / {{ item.size }}</p>
            </div>
            <div class="text-right">
              <p class="font-bold" :class="item.stock === 0 ? 'text-red-600' : 'text-yellow-600'">
                {{ item.stock }} left
              </p>
              <p class="text-xs text-gray-500">Min: {{ item.lowStockThreshold }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
        <div class="space-y-4">
          <div class="flex justify-between">
            <span class="text-gray-500">Total Customers</span>
            <span class="font-semibold">{{ customerStore.totalCustomers }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">Active Customers</span>
            <span class="font-semibold">{{ customerStore.activeCustomers.length }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">Pending Orders</span>
            <span class="font-semibold text-yellow-600">{{ orderStore.pendingOrders }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">Processing Orders</span>
            <span class="font-semibold text-blue-600">{{ orderStore.processingOrders }}</span>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Inventory Value</h3>
        <div class="text-3xl font-bold text-gray-900 mb-2">
          ${{ inventoryStore.inventoryValue.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}
        </div>
        <p class="text-gray-500 text-sm">Total value of current stock</p>
        <div class="mt-4 pt-4 border-t">
          <div class="flex justify-between text-sm">
            <span class="text-gray-500">Total Products</span>
            <span class="font-semibold">{{ inventoryStore.totalProducts }}</span>
          </div>
          <div class="flex justify-between text-sm mt-2">
            <span class="text-gray-500">Low Stock Items</span>
            <span class="font-semibold text-red-600">{{ inventoryStore.lowStockItems.length }}</span>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Financial Overview</h3>
        <div class="space-y-4">
          <div>
            <div class="flex justify-between text-sm mb-1">
              <span class="text-gray-500">Total Income</span>
              <span class="font-semibold text-green-600">
                ${{ accountStore.totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}
              </span>
            </div>
          </div>
          <div>
            <div class="flex justify-between text-sm mb-1">
              <span class="text-gray-500">Total Expenses</span>
              <span class="font-semibold text-red-600">
                ${{ accountStore.totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}
              </span>
            </div>
          </div>
          <div class="pt-4 border-t">
            <div class="flex justify-between">
              <span class="font-medium text-gray-900">Net Balance</span>
              <span class="font-bold text-lg" :class="accountStore.netBalance >= 0 ? 'text-green-600' : 'text-red-600'">
                ${{ accountStore.netBalance.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
