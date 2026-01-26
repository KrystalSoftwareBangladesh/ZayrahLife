<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import StatusBadge from '@/components/admin/StatusBadge.vue'
import ConfirmModal from '@/components/admin/ConfirmModal.vue'
import { useInventoryStore } from '@/stores/admin/inventoryStore'

const route = useRoute()
const router = useRouter()
const inventoryStore = useInventoryStore()

const product = computed(() => inventoryStore.getProductById(route.params.id))

const showAdjustModal = ref(false)
const selectedVariant = ref(null)
const adjustmentAmount = ref(0)

const getVariantStatus = (variant) => {
  if (variant.stock === 0) return 'out_of_stock'
  if (variant.stock <= variant.lowStockThreshold) return 'low'
  return 'in_stock'
}

const openAdjustModal = (variant) => {
  selectedVariant.value = variant
  adjustmentAmount.value = 0
  showAdjustModal.value = true
}

const confirmAdjustment = () => {
  if (selectedVariant.value && adjustmentAmount.value !== 0) {
    inventoryStore.adjustStock(
      product.value.productId,
      selectedVariant.value.id,
      adjustmentAmount.value
    )
  }
  showAdjustModal.value = false
  selectedVariant.value = null
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center gap-4">
      <button @click="router.back()" class="p-2 hover:bg-gray-100 rounded-lg transition-colors">
        <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Product Details</h1>
        <p class="text-gray-500">Manage product inventory</p>
      </div>
    </div>

    <div v-if="!product" class="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
      <p class="text-gray-500">Product not found</p>
    </div>

    <template v-else>
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="flex items-start justify-between">
          <div>
            <h2 class="text-xl font-bold text-gray-900">{{ product.productName }}</h2>
            <p class="text-gray-500 mt-1">{{ product.category }}</p>
          </div>
          <div class="text-right">
            <p class="text-2xl font-bold text-gray-900">${{ product.price.toFixed(2) }}</p>
            <p class="text-sm text-gray-500">Cost: ${{ product.cost.toFixed(2) }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Inventory Summary</h3>
        <div class="grid grid-cols-4 gap-6">
          <div>
            <p class="text-sm text-gray-500">Total Stock</p>
            <p class="text-2xl font-bold text-gray-900">{{ product.totalStock }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500">Variants</p>
            <p class="text-2xl font-bold text-gray-900">{{ product.variants.length }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500">Stock Value</p>
            <p class="text-2xl font-bold text-gray-900">${{ (product.totalStock * product.cost).toFixed(2) }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500">Potential Revenue</p>
            <p class="text-2xl font-bold text-green-600">${{ (product.totalStock * product.price).toFixed(2) }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900">Variants</h3>
        </div>
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Color</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr v-for="variant in product.variants" :key="variant.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 text-sm font-mono text-gray-900">{{ variant.sku }}</td>
              <td class="px-6 py-4 text-sm text-gray-900">{{ variant.color }}</td>
              <td class="px-6 py-4 text-sm text-gray-900">{{ variant.size }}</td>
              <td class="px-6 py-4 text-sm">
                <span :class="variant.stock === 0 ? 'text-red-600 font-bold' : variant.stock <= variant.lowStockThreshold ? 'text-yellow-600 font-medium' : 'text-gray-900'">
                  {{ variant.stock }}
                </span>
                <span class="text-gray-400 text-xs ml-1">(min: {{ variant.lowStockThreshold }})</span>
              </td>
              <td class="px-6 py-4">
                <StatusBadge :status="getVariantStatus(variant)" size="sm" />
              </td>
              <td class="px-6 py-4 text-right">
                <button
                  @click="openAdjustModal(variant)"
                  class="text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  Adjust Stock
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <ConfirmModal
      :show="showAdjustModal"
      title="Adjust Stock"
      :message="`Adjust stock for ${selectedVariant?.sku}. Enter positive number to add, negative to remove.`"
      confirmText="Apply"
      variant="primary"
      @confirm="confirmAdjustment"
      @cancel="showAdjustModal = false"
    >
      <template #default>
        <div class="my-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">Adjustment Amount</label>
          <input
            v-model.number="adjustmentAmount"
            type="number"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            placeholder="e.g., 10 or -5"
          />
          <p class="text-sm text-gray-500 mt-1">
            Current: {{ selectedVariant?.stock }} → New: {{ (selectedVariant?.stock || 0) + adjustmentAmount }}
          </p>
        </div>
      </template>
    </ConfirmModal>
  </div>
</template>
