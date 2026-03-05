import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { productsApi, productVariantsApi } from '@/api/products'
import type { ApiError, ProductList, ProductVariantList } from '@/api/types'

interface InventoryVariant {
  id: number
  color: string
  size: string
  sku: string
  stock: number
  lowStockThreshold: number
}

interface InventoryProduct {
  id: number
  productId: number
  productName: string
  category: string
  price: number
  cost: number
  totalStock: number
  variants: InventoryVariant[]
}

interface LowStockItem extends InventoryVariant {
  productName: string
  productId: number
}

interface ProductVariantInput {
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
  variants: ProductVariantInput[]
}

function toNumber(value: unknown): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string' && value.trim() !== '') return Number(value)
  return 0
}

async function fetchAllProductPages(): Promise<ProductList[]> {
  const products: ProductList[] = []
  let page = 1
  const pageSize = 100

  while (true) {
    const response = await productsApi.list({ page, page_size: pageSize })
    products.push(...response.results)
    if (!response.next) break
    page += 1
    if (page > 50) break
  }

  return products
}

async function fetchAllVariantPages(): Promise<ProductVariantList[]> {
  const variants: ProductVariantList[] = []
  let page = 1
  const pageSize = 200

  while (true) {
    const response = await productVariantsApi.list({ page, page_size: pageSize })
    variants.push(...response.results)
    if (!response.next) break
    page += 1
    if (page > 50) break
  }

  return variants
}

function normalizeLabel(value: string): string {
  return value.trim().toLowerCase()
}

function mapInventoryProduct(product: ProductList, variants: ProductVariantList[]): InventoryProduct {
  const mappedVariants: InventoryVariant[] = variants.map(variant => ({
    id: variant.id,
    color: variant.color || 'Default',
    size: variant.size || 'One Size',
    sku: variant.sku,
    stock: variant.current_stock ?? 0,
    lowStockThreshold: 5
  }))
  const price = toNumber(product.current_selling_price)
  const totalStock = mappedVariants.reduce((sum, variant) => sum + Math.max(0, variant.stock), 0)

  return {
    id: product.id,
    productId: product.id,
    productName: product.name,
    category: product.category || 'Uncategorized',
    price,
    // API does not expose cost here, so keep a conservative estimate for value analytics.
    cost: Number((price * 0.6).toFixed(2)),
    totalStock,
    variants: mappedVariants
  }
}

export const useInventoryStore = defineStore('adminInventory', () => {
  const inventory = ref<InventoryProduct[]>([])
  const loading = ref(false)
  const loaded = ref(false)
  const error = ref<string | null>(null)

  const totalProducts = computed(() => inventory.value.length)
  const totalStockCount = computed(() => inventory.value.reduce((sum, product) => sum + product.totalStock, 0))
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
    return inventory.value.reduce((sum, product) => sum + (product.totalStock * product.cost), 0)
  })

  function getProductById(id: string | number) {
    const productId = Number(id)
    if (Number.isNaN(productId)) return undefined
    return inventory.value.find(product => product.productId === productId)
  }

  function adjustStock(productId: number, variantId: number, adjustment: number) {
    const product = inventory.value.find(item => item.productId === productId)
    if (!product) return

    const variant = product.variants.find(item => item.id === variantId)
    if (!variant) return

    variant.stock = Math.max(0, variant.stock + adjustment)
    product.totalStock = product.variants.reduce((sum, item) => sum + item.stock, 0)
  }

  function addProduct(data: NewProduct) {
    const newId = inventory.value.length
      ? Math.max(...inventory.value.map(product => product.id)) + 1
      : 1
    const newProductId = inventory.value.length
      ? Math.max(...inventory.value.map(product => product.productId)) + 1
      : 1
    const baseVariantId = inventory.value.flatMap(product => product.variants.map(variant => variant.id))
    const variantStartId = baseVariantId.length ? Math.max(...baseVariantId) + 1 : 1

    const variants: InventoryVariant[] = data.variants.map((variant, index) => ({
      id: variantStartId + index,
      color: variant.color,
      size: variant.size || 'One Size',
      sku: variant.sku || `SKU-${newProductId}-${index + 1}`,
      stock: variant.stock || 0,
      lowStockThreshold: 5
    }))

    const newProduct: InventoryProduct = {
      id: newId,
      productId: newProductId,
      productName: data.productName,
      category: data.category,
      price: data.price,
      cost: data.cost,
      totalStock: variants.reduce((sum, variant) => sum + variant.stock, 0),
      variants
    }

    inventory.value.unshift(newProduct)
    return newProduct
  }

  async function fetchInventory(force = false): Promise<void> {
    if (loading.value) return
    if (loaded.value && !force) return

    loading.value = true
    error.value = null

    try {
      const [products, variants] = await Promise.all([
        fetchAllProductPages(),
        fetchAllVariantPages()
      ])

      const variantMapByProductName = new Map<string, ProductVariantList[]>()
      variants.forEach(variant => {
        const productName = normalizeLabel(String(variant.product || ''))
        if (!productName) return
        const existing = variantMapByProductName.get(productName)
        if (existing) {
          existing.push(variant)
        } else {
          variantMapByProductName.set(productName, [variant])
        }
      })

      const mapped = products.map(product => {
        const productVariants = variantMapByProductName.get(normalizeLabel(product.name)) || []
        return mapInventoryProduct(product, productVariants)
      })
      inventory.value = mapped
      loaded.value = true
    } catch (err) {
      const apiError = err as ApiError
      error.value = apiError.message || 'Failed to fetch inventory products'
      inventory.value = []
      loaded.value = false
    } finally {
      loading.value = false
    }
  }

  void fetchInventory()

  return {
    inventory,
    loading,
    loaded,
    error,
    totalProducts,
    totalStockCount,
    lowStockItems,
    inventoryValue,
    getProductById,
    adjustStock,
    addProduct,
    fetchInventory
  }
})
