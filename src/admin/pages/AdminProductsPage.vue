<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import DataTable from '@/components/admin/DataTable.vue'
import StatusBadge from '@/components/admin/StatusBadge.vue'
import FormInput from '@/components/admin/FormInput.vue'
import FormSelect from '@/components/admin/FormSelect.vue'
import FormModal from '@/components/admin/FormModal.vue'
import { useInventoryStore } from '@/stores/admin/inventoryStore'

const router = useRouter()
const inventoryStore = useInventoryStore()

const searchQuery = ref('')
const categoryFilter = ref('')
const showAddModal = ref(false)

const newProduct = ref({
  productName: '',
  category: '',
  price: 0,
  cost: 0,
  variants: [{ color: '', size: '', sku: '', stock: 0 }]
})

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

const productCategoryOptions = [
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

const openAddModal = () => {
  newProduct.value = {
    productName: '',
    category: '',
    price: 0,
    cost: 0,
    variants: [{ color: '', size: '', sku: '', stock: 0 }]
  }
  showAddModal.value = true
}

const addVariant = () => {
  newProduct.value.variants.push({ color: '', size: '', sku: '', stock: 0 })
}

const removeVariant = (index) => {
  if (newProduct.value.variants.length > 1) {
    newProduct.value.variants.splice(index, 1)
  }
}

const handleAddProduct = () => {
  if (!newProduct.value.productName || !newProduct.value.category) return
  const validVariants = newProduct.value.variants.filter(v => v.color || v.size)
  if (validVariants.length === 0) {
    validVariants.push({ color: 'Default', size: 'One Size', sku: '', stock: 0 })
  }
  newProduct.value.variants = validVariants
  inventoryStore.addProduct(newProduct.value)
  showAddModal.value = false
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Products & Inventory</h1>
        <p class="text-gray-500 mt-1">Manage your product catalog and stock levels</p>
      </div>
      <button
        @click="openAddModal"
        class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Add Product
      </button>
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

    <FormModal
      :show="showAddModal"
      title="Add New Product"
      size="lg"
      @close="showAddModal = false"
      @submit="handleAddProduct"
    >
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <FormInput
            v-model="newProduct.productName"
            label="Product Name"
            placeholder="Enter product name"
            required
          />
          <FormSelect
            v-model="newProduct.category"
            label="Category"
            :options="productCategoryOptions"
            placeholder="Select category"
          />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <FormInput
            v-model.number="newProduct.price"
            label="Selling Price ($)"
            type="number"
            step="0.01"
            min="0"
          />
          <FormInput
            v-model.number="newProduct.cost"
            label="Cost Price ($)"
            type="number"
            step="0.01"
            min="0"
          />
        </div>
        
        <div class="border-t pt-4 mt-4">
          <div class="flex items-center justify-between mb-3">
            <h4 class="font-medium text-gray-900">Variants</h4>
            <button
              type="button"
              @click="addVariant"
              class="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              + Add Variant
            </button>
          </div>
          <div v-for="(variant, index) in newProduct.variants" :key="index" class="p-3 bg-gray-50 rounded-lg mb-2">
            <div class="flex items-start gap-3">
              <div class="flex-1 grid grid-cols-4 gap-3">
                <FormInput
                  v-model="variant.color"
                  placeholder="Color"
                />
                <FormInput
                  v-model="variant.size"
                  placeholder="Size"
                />
                <FormInput
                  v-model="variant.sku"
                  placeholder="SKU"
                />
                <FormInput
                  v-model.number="variant.stock"
                  type="number"
                  placeholder="Stock"
                  min="0"
                />
              </div>
              <button
                v-if="newProduct.variants.length > 1"
                type="button"
                @click="removeVariant(index)"
                class="p-1 text-red-500 hover:text-red-700"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </FormModal>
  </div>
</template>
