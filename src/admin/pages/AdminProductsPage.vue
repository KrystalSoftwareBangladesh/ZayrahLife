<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import DataTable from '@/components/admin/DataTable.vue'
import StatusBadge from '@/components/admin/StatusBadge.vue'
import FormInput from '@/components/admin/FormInput.vue'
import FormSelect from '@/components/admin/FormSelect.vue'
import { useInventoryStore } from '@/stores/admin/inventoryStore'

const router = useRouter()
const inventoryStore = useInventoryStore()

const searchQuery = ref('')
const categoryFilter = ref('')

const columns = [
  { key: 'productName', label: 'Product' },
  { key: 'category', label: 'Category', width: '120px' },
  { key: 'variants', label: 'Variants', width: '100px' },
  { key: 'totalStock', label: 'Total Stock', width: '120px' },
  { key: 'price', label: 'Price', width: '100px' },
  { key: 'status', label: 'Status', width: '120px' }
]

const categoryOptions = [
  { value: '', label: 'All Categories' },
  { value: 'Clothing', label: 'Clothing' },
  { value: 'Accessories', label: 'Accessories' },
  { value: 'Electronics', label: 'Electronics' },
  { value: 'Footwear', label: 'Footwear' }
]

const filteredProducts = computed(() => {
  let result = inventoryStore.inventory
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(p => p.productName.toLowerCase().includes(query))
  }
  if (categoryFilter.value) {
    result = result.filter(p => p.category === categoryFilter.value)
  }
  return result
})

const getStockStatus = (product) => {
  if (product.totalStock === 0) return 'out_of_stock'
  const hasLowStock = product.variants.some(v => v.stock <= v.lowStockThreshold)
  return hasLowStock ? 'low' : 'in_stock'
}

const handleRowClick = (product) => {
  router.push({ name: 'admin-product-detail', params: { id: product.productId } })
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Products & Inventory</h1>
        <p class="text-gray-500 mt-1">Manage your product catalog and stock levels</p>
      </div>
    </div>

    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div class="flex items-center gap-4">
        <div class="flex-1 max-w-md">
          <FormInput
            v-model="searchQuery"
            placeholder="Search products..."
          />
        </div>
        <div class="w-48">
          <FormSelect
            v-model="categoryFilter"
            :options="categoryOptions"
            placeholder="All Categories"
          />
        </div>
        <div class="text-sm text-gray-500">
          {{ filteredProducts.length }} products
        </div>
      </div>
    </div>

    <DataTable
      :columns="columns"
      :data="filteredProducts"
      :loading="inventoryStore.loading"
      @row-click="handleRowClick"
    >
      <template #productName="{ row }">
        <span class="font-medium">{{ row.productName }}</span>
      </template>
      <template #variants="{ row }">
        {{ row.variants.length }}
      </template>
      <template #totalStock="{ row }">
        <span :class="row.totalStock === 0 ? 'text-red-600 font-bold' : row.totalStock < 20 ? 'text-yellow-600' : 'text-gray-900'">
          {{ row.totalStock }}
        </span>
      </template>
      <template #price="{ value }">
        ${{ value.toFixed(2) }}
      </template>
      <template #status="{ row }">
        <StatusBadge :status="getStockStatus(row)" />
      </template>
    </DataTable>
  </div>
</template>
