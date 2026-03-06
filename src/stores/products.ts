import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { productsApi, productVariantsApi } from '@/api/products'
import type { ApiError, ProductDetail, ProductList, ProductVariantList } from '@/api/types'

interface StorefrontProductVariant {
  id: number
  color: string
  size: string | null
  price: number
  originalPrice: number | null
  stock: number
  sku: string
}

interface StorefrontProduct {
  id: number
  name: string
  slug: string
  description: string
  price: number
  originalPrice: number | null
  category: string
  categoryName: string
  images: string[]
  colors: string[] | null
  sizes: string[] | null
  stock: number
  featured: boolean
  rating: number
  reviewCount: number
  variants: StorefrontProductVariant[]
}

interface StorefrontCategory {
  id: string
  name: string
  icon: string
  count: number
}

const CATEGORY_ICONS: Record<string, string> = {
  clothing: '👕',
  accessories: '👜',
  electronics: '🎧',
  footwear: '👟'
}

function toNumber(value: unknown): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string' && value.trim() !== '') return Number(value)
  return 0
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function toVariant(
  variant: ProductVariantList,
  fallbackPrice: number
): StorefrontProductVariant {
  return {
    id: variant.id,
    color: variant.color || 'Default',
    size: variant.size,
    price: fallbackPrice,
    originalPrice: null,
    stock: variant.current_stock ?? 0,
    sku: variant.sku
  }
}

function buildCategoryStats(products: StorefrontProduct[]): StorefrontCategory[] {
  const map = new Map<string, { name: string; count: number }>()
  products.forEach(product => {
    const existing = map.get(product.category)
    if (existing) {
      existing.count += 1
    } else {
      map.set(product.category, { name: product.categoryName, count: 1 })
    }
  })

  return Array.from(map.entries())
    .map(([id, item]) => ({
      id,
      name: item.name,
      icon: CATEGORY_ICONS[id] || '📦',
      count: item.count
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

function mapApiProduct(
  product: ProductList | ProductDetail,
  variants: ProductVariantList[],
  featured = false
): StorefrontProduct {
  const categoryName = product.category || 'Uncategorized'
  const category = slugify(categoryName) || 'uncategorized'
  const price = toNumber(product.current_selling_price)
  const mappedVariants = variants.map(variant => toVariant(variant, price))
  const colors = Array.from(
    new Set(
      mappedVariants
        .map(variant => variant.color)
        .filter(color => color && color !== 'Default')
    )
  )
  const sizes = Array.from(
    new Set(
      mappedVariants
        .map(variant => variant.size)
        .filter((size): size is string => Boolean(size))
    )
  )
  const stock = mappedVariants.reduce((sum, variant) => sum + Math.max(0, variant.stock), 0)

  return {
    id: product.id,
    name: product.name,
    slug: slugify(product.name),
    description: '',
    price,
    originalPrice: null,
    category,
    categoryName,
    images: ['/logo.png'],
    colors: colors.length ? colors : null,
    sizes: sizes.length ? sizes : null,
    stock,
    featured,
    rating: 0,
    reviewCount: 0,
    variants: mappedVariants
  }
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

async function fetchAllVariantPages(productId: number): Promise<ProductVariantList[]> {
  const variants: ProductVariantList[] = []
  let page = 1
  const pageSize = 200

  while (true) {
    const response = await productVariantsApi.list({ product: productId, page, page_size: pageSize })
    variants.push(...response.results)
    if (!response.next) break
    page += 1
    if (page > 50) break
  }

  return variants
}

export const useProductStore = defineStore('products', () => {
  const products = ref<StorefrontProduct[]>([])
  const categories = ref<StorefrontCategory[]>([])
  const selectedCategory = ref<string | null>(null)
  const priceRange = ref({ min: 0, max: 500 })
  const loading = ref(false)
  const loaded = ref(false)
  const error = ref<string | null>(null)

  const featuredProducts = computed(() => {
    return products.value.filter(product => product.featured)
  })

  const filteredProducts = computed(() => {
    let result = products.value

    if (selectedCategory.value) {
      result = result.filter(product => product.category === selectedCategory.value)
    }

    result = result.filter(product =>
      product.price >= priceRange.value.min && product.price <= priceRange.value.max
    )

    return result
  })

  const getProductById = (id: string | number) => {
    const productId = Number(id)
    if (Number.isNaN(productId)) return undefined
    return products.value.find(product => product.id === productId)
  }

  const getProductsByCategory = (categoryId: string) => {
    return products.value.filter(product => product.category === categoryId)
  }

  const setCategory = (categoryId: string | null) => {
    selectedCategory.value = categoryId
  }

  const setPriceRange = (min: number, max: number) => {
    priceRange.value = { min, max }
  }

  const clearFilters = () => {
    selectedCategory.value = null
    priceRange.value = { min: 0, max: 500 }
  }

  const fetchProducts = async (force = false): Promise<void> => {
    if (loading.value) return
    if (loaded.value && !force) return

    loading.value = true
    error.value = null

    try {
      const apiProducts = await fetchAllProductPages()
      const mappedProducts = await Promise.all(
        apiProducts.map(async (apiProduct, index) => {
          const variants = await fetchAllVariantPages(apiProduct.id)
          return mapApiProduct(apiProduct, variants, index < 4)
        })
      )
      products.value = mappedProducts
      categories.value = buildCategoryStats(mappedProducts)
      loaded.value = true
    } catch (err) {
      const apiError = err as ApiError
      error.value = apiError.message || 'Failed to fetch products'
      products.value = []
      categories.value = []
      loaded.value = false
    } finally {
      loading.value = false
    }
  }

  const fetchProductById = async (id: string | number): Promise<StorefrontProduct | null> => {
    const productId = Number(id)
    if (Number.isNaN(productId)) return null

    const existing = getProductById(productId)
    if (existing) return existing

    try {
      const detail = await productsApi.getById(productId)
      const variants = await fetchAllVariantPages(productId)
      const mapped = mapApiProduct(detail, variants)
      products.value = [mapped, ...products.value]
      categories.value = buildCategoryStats(products.value)
      return mapped
    } catch {
      if (!loaded.value) {
        await fetchProducts()
        return getProductById(productId) || null
      }
      return null
    }
  }

  return {
    products,
    categories,
    selectedCategory,
    priceRange,
    loading,
    loaded,
    error,
    featuredProducts,
    filteredProducts,
    getProductById,
    getProductsByCategory,
    setCategory,
    setPriceRange,
    clearFilters,
    fetchProducts,
    fetchProductById
  }
})
