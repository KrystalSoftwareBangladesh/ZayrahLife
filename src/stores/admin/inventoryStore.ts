import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { mockInventory } from '@/mock/admin/inventory'

interface LowStockItem {
  id: number
  color: string
  size: string
  sku: string
  stock: number
  lowStockThreshold: number
  productName: string
  productId: number
}

export const useInventoryStore = defineStore('adminInventory', () => {
  const inventory = ref([...mockInventory])
  const loading = ref(false)

  const totalProducts = computed(() => inventory.value.length)
  const totalStockCount = computed(() => inventory.value.reduce((sum, p) => sum + p.totalStock, 0))
  const lowStockItems = computed(() => {
    const items: LowStockItem[] = []
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

  function getProductById(id: string | number) {
    return inventory.value.find(p => p.productId === parseInt(String(id)))
  }

  function adjustStock(productId: number, variantId: number, adjustment: number) {
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
