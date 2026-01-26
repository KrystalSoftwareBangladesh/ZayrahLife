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

interface ProductVariant {
  color: string
  size: string
  sku: string
  stock: number
}

interface NewProduct {
  productName: string
  category: string
  price: number
  cost: number
  variants: ProductVariant[]
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

  function addProduct(data: NewProduct) {
    const newProductId = Math.max(...inventory.value.map(p => p.productId)) + 1
    const variants = data.variants.map((v, idx) => ({
      id: newProductId * 100 + idx + 1,
      color: v.color,
      size: v.size,
      sku: v.sku || `SKU-${newProductId}-${idx + 1}`,
      stock: v.stock || 0,
      lowStockThreshold: 5
    }))
    
    const newProduct = {
      productId: newProductId,
      productName: data.productName,
      category: data.category,
      price: data.price,
      cost: data.cost,
      totalStock: variants.reduce((sum, v) => sum + v.stock, 0),
      variants
    }
    inventory.value.unshift(newProduct)
    return newProduct
  }

  return {
    inventory,
    loading,
    totalProducts,
    totalStockCount,
    lowStockItems,
    inventoryValue,
    getProductById,
    adjustStock,
    addProduct
  }
})
