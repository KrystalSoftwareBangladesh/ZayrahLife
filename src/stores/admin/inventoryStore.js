import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { mockInventory } from '@/mock/admin/inventory'

export const useInventoryStore = defineStore('adminInventory', () => {
  const inventory = ref([...mockInventory])
  const loading = ref(false)

  const totalProducts = computed(() => inventory.value.length)
  const totalStockCount = computed(() => inventory.value.reduce((sum, p) => sum + p.totalStock, 0))
  const lowStockItems = computed(() => {
    const items = []
    inventory.value.forEach(product => {
      product.variants.forEach(variant => {
        if (variant.stock <= variant.lowStockThreshold) {
          items.push({
            ...variant,
            productName: product.productName,
            productId: product.productId
          })
        }
      })
    })
    return items
  })

  const inventoryValue = computed(() => {
    return inventory.value.reduce((sum, p) => sum + (p.totalStock * p.cost), 0)
  })

  function getProductById(id) {
    return inventory.value.find(p => p.productId === parseInt(id))
  }

  function adjustStock(productId, variantId, adjustment) {
    const product = inventory.value.find(p => p.productId === productId)
    if (product) {
      const variant = product.variants.find(v => v.id === variantId)
      if (variant) {
        variant.stock = Math.max(0, variant.stock + adjustment)
        product.totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0)
      }
    }
  }

  return {
    inventory,
    loading,
    totalProducts,
    totalStockCount,
    lowStockItems,
    inventoryValue,
    getProductById,
    adjustStock
  }
})
