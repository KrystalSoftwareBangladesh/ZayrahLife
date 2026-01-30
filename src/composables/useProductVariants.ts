import { ref, computed, watch, type Ref } from 'vue'

export interface ProductVariant {
  id: number
  color: string
  size: string | null
  price: number
  originalPrice: number | null
  stock: number
  sku: string
}

export interface ProductWithVariants {
  id: number
  name: string
  slug: string
  description: string
  category: string
  categoryName: string
  images: string[]
  variants: ProductVariant[]
  featured: boolean
  rating: number
  reviewCount: number
}

export function useProductVariants(product: Ref<ProductWithVariants | null>) {
  const selectedVariantId = ref<number | null>(null)
  const quantity = ref(1)

  const availableColors = computed(() => {
    if (!product.value?.variants) return []
    const colors = new Set(product.value.variants.map(v => v.color))
    return Array.from(colors)
  })

  const selectedColor = computed({
    get: () => {
      const variant = selectedVariant.value
      return variant?.color || availableColors.value[0] || null
    },
    set: (color: string | null) => {
      if (!color || !product.value?.variants) return
      const variant = product.value.variants.find(v => 
        v.color === color && (selectedSize.value ? v.size === selectedSize.value : true)
      ) || product.value.variants.find(v => v.color === color)
      if (variant) {
        selectedVariantId.value = variant.id
        quantity.value = 1
      }
    }
  })

  const availableSizes = computed(() => {
    if (!product.value?.variants) return []
    const sizes = product.value.variants
      .filter(v => v.color === selectedColor.value && v.size)
      .map(v => v.size)
    return [...new Set(sizes)]
  })

  const selectedSize = computed({
    get: () => {
      return selectedVariant.value?.size || null
    },
    set: (size: string | null) => {
      if (!product.value?.variants) return
      const variant = product.value.variants.find(v => 
        v.color === selectedColor.value && v.size === size
      )
      if (variant) {
        selectedVariantId.value = variant.id
        quantity.value = 1
      }
    }
  })

  const selectedVariant = computed(() => {
    if (!product.value?.variants?.length) return null
    if (selectedVariantId.value) {
      return product.value.variants.find(v => v.id === selectedVariantId.value) || null
    }
    return product.value.variants[0]
  })

  const currentPrice = computed(() => selectedVariant.value?.price || 0)
  const originalPrice = computed(() => selectedVariant.value?.originalPrice || null)
  const currentStock = computed(() => selectedVariant.value?.stock || 0)
  const currentSku = computed(() => selectedVariant.value?.sku || '')

  const isInStock = computed(() => currentStock.value > 0)
  const isLowStock = computed(() => currentStock.value > 0 && currentStock.value <= 5)

  const stockLabel = computed(() => {
    if (!isInStock.value) return 'Out of Stock'
    if (isLowStock.value) return `Only ${currentStock.value} left in stock!`
    return `In Stock (${currentStock.value} available)`
  })

  const canAddToCart = computed(() => isInStock.value && quantity.value > 0)
  const maxQuantity = computed(() => currentStock.value)

  const isVariantAvailable = (color: string, size: string | null) => {
    if (!product.value?.variants) return false
    const variant = product.value.variants.find(v => v.color === color && v.size === size)
    return variant ? variant.stock > 0 : false
  }

  const getVariantStock = (color: string, size: string | null) => {
    if (!product.value?.variants) return 0
    const variant = product.value.variants.find(v => v.color === color && v.size === size)
    return variant?.stock || 0
  }

  watch(product, (newProduct) => {
    if (newProduct?.variants?.length) {
      selectedVariantId.value = newProduct.variants[0].id
      quantity.value = 1
    }
  }, { immediate: true })

  watch(quantity, (newQty) => {
    if (newQty > maxQuantity.value) {
      quantity.value = maxQuantity.value
    }
    if (newQty < 1 && maxQuantity.value > 0) {
      quantity.value = 1
    }
  })

  return {
    selectedVariantId,
    selectedVariant,
    selectedColor,
    selectedSize,
    availableColors,
    availableSizes,
    quantity,
    currentPrice,
    originalPrice,
    currentStock,
    currentSku,
    isInStock,
    isLowStock,
    stockLabel,
    canAddToCart,
    maxQuantity,
    isVariantAvailable,
    getVariantStock
  }
}
