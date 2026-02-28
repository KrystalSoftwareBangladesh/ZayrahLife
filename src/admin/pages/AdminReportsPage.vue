<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import StatCard from '@/components/admin/StatCard.vue'
import { useOrderStore } from '@/stores/admin/orderStore'
import { useInventoryStore } from '@/stores/admin/inventoryStore'
import { useAccountStore } from '@/stores/admin/accountStore'
import { useCustomerStore } from '@/stores/admin/customerStore'

const orderStore = useOrderStore()
const inventoryStore = useInventoryStore()
const accountStore = useAccountStore()
const customerStore = useCustomerStore()

const activeTab = ref<'overview' | 'sales' | 'inventory' | 'financial'>('overview')

const totalSales = computed(() => orderStore.totalRevenue)
const grossProfit = computed(() => totalSales.value - inventoryStore.inventoryValue * 0.4)

const salesByChannel = computed(() => {
  const channels: Record<string, { count: number, revenue: number }> = {}
  orderStore.orders.forEach(order => {
    if (!channels[order.channel]) {
      channels[order.channel] = { count: 0, revenue: 0 }
    }
    channels[order.channel].count++
    channels[order.channel].revenue += order.total
  })
  return Object.entries(channels).map(([channel, data]) => ({
    channel,
    ...data,
    percentage: (data.revenue / totalSales.value * 100) || 0
  })).sort((a, b) => b.revenue - a.revenue)
})

const topProducts = computed(() => {
  const products: Record<number, { name: string, quantity: number, revenue: number }> = {}
  orderStore.orders.forEach(order => {
    order.items.forEach(item => {
      if (!products[item.productId]) {
        products[item.productId] = { name: item.name, quantity: 0, revenue: 0 }
      }
      products[item.productId].quantity += item.quantity
      products[item.productId].revenue += item.price * item.quantity
    })
  })
  return Object.entries(products)
    .map(([id, data]) => ({ productId: Number(id), ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)
})

const lowStockProducts = computed(() => inventoryStore.lowStockItems)

const recentTransactions = computed(() => accountStore.transactions.slice(0, 10))

const ordersByStatus = computed(() => {
  const statuses: Record<string, number> = {}
  orderStore.orders.forEach(order => {
    statuses[order.status] = (statuses[order.status] || 0) + 1
  })
  return Object.entries(statuses).map(([status, count]) => ({ status, count }))
})

const getChannelColor = (channel: string) => {
  const colors: Record<string, string> = {
    FACEBOOK: 'bg-blue-500',
    INSTAGRAM: 'bg-pink-500',
    WHATSAPP: 'bg-green-500',
    WEBSITE: 'bg-gray-500',
    WALK_IN: 'bg-amber-500',
    PHONE: 'bg-indigo-500'
  }
  return colors[channel] || 'bg-gray-500'
}

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    shipped: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800'
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

onMounted(() => {
  void orderStore.fetchOrders()
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
        <p class="text-gray-500 mt-1">Business insights and performance metrics</p>
      </div>
      <div class="flex bg-gray-100 rounded-lg p-1">
        <button
          v-for="tab in ['overview', 'sales', 'inventory', 'financial']"
          :key="tab"
          @click="activeTab = tab as typeof activeTab"
          :class="[
            'px-4 py-2 text-sm font-medium rounded-md transition-all capitalize',
            activeTab === tab ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          ]"
        >
          {{ tab }}
        </button>
      </div>
    </div>

    <div v-if="activeTab === 'overview'" class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          :value="`$${totalSales.toLocaleString()}`"
          icon="dollar"
          color="green"
          change="+12.5%"
        />
        <StatCard
          title="Total Orders"
          :value="orderStore.totalOrders"
          icon="cart"
          color="blue"
          change="+8.2%"
        />
        <StatCard
          title="Total Customers"
          :value="customerStore.totalCustomers"
          icon="users"
          color="purple"
          change="+5.1%"
        />
        <StatCard
          title="Inventory Value"
          :value="`$${inventoryStore.inventoryValue.toLocaleString()}`"
          icon="box"
          color="yellow"
        />
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white rounded-xl border border-gray-200 p-6">
          <h3 class="font-semibold text-gray-900 mb-4">Sales by Channel</h3>
          <div class="space-y-4">
            <div v-for="channel in salesByChannel" :key="channel.channel" class="flex items-center gap-4">
              <div :class="[getChannelColor(channel.channel), 'w-3 h-3 rounded-full']"></div>
              <div class="flex-1">
                <div class="flex justify-between mb-1">
                  <span class="text-sm font-medium text-gray-700">{{ channel.channel }}</span>
                  <span class="text-sm text-gray-500">{{ channel.count }} orders</span>
                </div>
                <div class="w-full bg-gray-100 rounded-full h-2">
                  <div
                    :class="[getChannelColor(channel.channel), 'h-2 rounded-full transition-all']"
                    :style="{ width: `${channel.percentage}%` }"
                  ></div>
                </div>
              </div>
              <span class="text-sm font-bold text-gray-900 min-w-[80px] text-right">
                ${{ channel.revenue.toLocaleString() }}
              </span>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl border border-gray-200 p-6">
          <h3 class="font-semibold text-gray-900 mb-4">Order Status Distribution</h3>
          <div class="grid grid-cols-2 gap-4">
            <div
              v-for="item in ordersByStatus"
              :key="item.status"
              class="p-4 rounded-lg bg-gray-50"
            >
              <span :class="[getStatusColor(item.status), 'px-2 py-1 text-xs font-medium rounded capitalize']">
                {{ item.status }}
              </span>
              <div class="text-2xl font-bold text-gray-900 mt-2">{{ item.count }}</div>
              <div class="text-xs text-gray-500">orders</div>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl border border-gray-200 p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-semibold text-gray-900">Low Stock Alerts</h3>
          <span class="text-sm text-red-600 font-medium">{{ lowStockProducts.length }} items low</span>
        </div>
        <div v-if="lowStockProducts.length > 0" class="space-y-3">
          <div
            v-for="item in lowStockProducts.slice(0, 5)"
            :key="item.id"
            class="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100"
          >
            <div>
              <div class="font-medium text-gray-900">{{ item.productName }}</div>
              <div class="text-sm text-gray-500">{{ item.color }} / {{ item.size }} | SKU: {{ item.sku }}</div>
            </div>
            <div class="text-right">
              <div class="text-lg font-bold text-red-600">{{ item.stock }}</div>
              <div class="text-xs text-gray-500">in stock (min: {{ item.lowStockThreshold }})</div>
            </div>
          </div>
        </div>
        <div v-else class="text-center py-8 text-gray-500">
          All products are well stocked
        </div>
      </div>
    </div>

    <div v-if="activeTab === 'sales'" class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Sales" :value="`$${totalSales.toLocaleString()}`" icon="dollar" color="green" />
        <StatCard title="Average Order" :value="`$${(totalSales / (orderStore.totalOrders || 1)).toFixed(2)}`" icon="chart" color="blue" />
        <StatCard title="Pending Orders" :value="orderStore.pendingOrders" icon="clock" color="yellow" />
        <StatCard title="Processing" :value="orderStore.processingOrders" icon="refresh" color="purple" />
      </div>

      <div class="bg-white rounded-xl border border-gray-200 p-6">
        <h3 class="font-semibold text-gray-900 mb-4">Top Selling Products</h3>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Units Sold</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">% of Sales</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr v-for="(product, index) in topProducts" :key="product.productId">
                <td class="px-4 py-3">
                  <div class="flex items-center gap-3">
                    <span class="w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold">
                      {{ index + 1 }}
                    </span>
                    <span class="font-medium text-gray-900">{{ product.name }}</span>
                  </div>
                </td>
                <td class="px-4 py-3 text-right text-gray-600">{{ product.quantity }}</td>
                <td class="px-4 py-3 text-right font-medium text-gray-900">${{ product.revenue.toLocaleString() }}</td>
                <td class="px-4 py-3 text-right text-gray-600">{{ ((product.revenue / totalSales) * 100).toFixed(1) }}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div v-if="activeTab === 'inventory'" class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Products" :value="inventoryStore.totalProducts" icon="box" color="blue" />
        <StatCard title="Total Stock" :value="inventoryStore.totalStockCount.toLocaleString()" icon="stack" color="green" />
        <StatCard title="Low Stock Items" :value="lowStockProducts.length" icon="alert" color="red" />
        <StatCard title="Inventory Value" :value="`$${inventoryStore.inventoryValue.toLocaleString()}`" icon="dollar" color="purple" />
      </div>

      <div class="bg-white rounded-xl border border-gray-200 p-6">
        <h3 class="font-semibold text-gray-900 mb-4">Inventory by Category</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            v-for="category in ['Clothing', 'Electronics', 'Accessories', 'Footwear']"
            :key="category"
            class="p-4 rounded-lg bg-gray-50"
          >
            <div class="text-sm text-gray-500 mb-1">{{ category }}</div>
            <div class="text-2xl font-bold text-gray-900">
              {{ inventoryStore.inventory.filter(p => p.category === category).length }}
            </div>
            <div class="text-sm text-gray-600">
              {{ inventoryStore.inventory.filter(p => p.category === category).reduce((sum, p) => sum + p.totalStock, 0) }} units
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl border border-gray-200 p-6">
        <h3 class="font-semibold text-gray-900 mb-4">All Low Stock Items</h3>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Variant</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Current Stock</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Threshold</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr v-for="item in lowStockProducts" :key="item.id" class="bg-red-50">
                <td class="px-4 py-3 font-medium text-gray-900">{{ item.productName }}</td>
                <td class="px-4 py-3 text-gray-600">{{ item.color }} / {{ item.size }}</td>
                <td class="px-4 py-3 font-mono text-sm text-gray-600">{{ item.sku }}</td>
                <td class="px-4 py-3 text-right font-bold text-red-600">{{ item.stock }}</td>
                <td class="px-4 py-3 text-right text-gray-600">{{ item.lowStockThreshold }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div v-if="activeTab === 'financial'" class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Income" :value="`$${accountStore.totalIncome.toLocaleString()}`" icon="trending-up" color="green" />
        <StatCard title="Total Expenses" :value="`$${accountStore.totalExpenses.toLocaleString()}`" icon="trending-down" color="red" />
        <StatCard title="Net Balance" :value="`$${accountStore.netBalance.toLocaleString()}`" icon="dollar" :color="accountStore.netBalance >= 0 ? 'green' : 'red'" />
        <StatCard title="Gross Profit" :value="`$${grossProfit.toLocaleString()}`" icon="chart" color="blue" />
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white rounded-xl border border-gray-200 p-6">
          <h3 class="font-semibold text-gray-900 mb-4">Profit & Loss Summary</h3>
          <div class="space-y-4">
            <div class="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span class="font-medium text-green-800">Total Revenue</span>
              <span class="font-bold text-green-700">${{ totalSales.toLocaleString() }}</span>
            </div>
            <div class="flex justify-between items-center p-3 bg-red-50 rounded-lg">
              <span class="font-medium text-red-800">Cost of Goods</span>
              <span class="font-bold text-red-700">-${{ (inventoryStore.inventoryValue * 0.4).toLocaleString() }}</span>
            </div>
            <div class="flex justify-between items-center p-3 bg-red-50 rounded-lg">
              <span class="font-medium text-red-800">Operating Expenses</span>
              <span class="font-bold text-red-700">-${{ accountStore.totalExpenses.toLocaleString() }}</span>
            </div>
            <div class="flex justify-between items-center p-3 bg-primary-50 rounded-lg border-2 border-primary-200">
              <span class="font-bold text-primary-800">Net Profit</span>
              <span class="font-bold text-primary-700 text-lg">
                ${{ (totalSales - inventoryStore.inventoryValue * 0.4 - accountStore.totalExpenses).toLocaleString() }}
              </span>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl border border-gray-200 p-6">
          <h3 class="font-semibold text-gray-900 mb-4">Recent Transactions</h3>
          <div class="space-y-3">
            <div
              v-for="txn in recentTransactions"
              :key="txn.id"
              class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div>
                <div class="font-medium text-gray-900">{{ txn.description }}</div>
                <div class="text-sm text-gray-500">{{ txn.accountName }} | {{ new Date(txn.date).toLocaleDateString() }}</div>
              </div>
              <span :class="[txn.type === 'income' ? 'text-green-600' : 'text-red-600', 'font-bold']">
                {{ txn.type === 'income' ? '+' : '' }}${{ Math.abs(txn.amount).toLocaleString() }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
