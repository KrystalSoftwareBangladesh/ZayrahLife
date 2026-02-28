import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface CartItem {
  id: number
  variantId?: number
  name: string
  price: number
  image: string
  quantity: number
  selectedColor: string | null
  selectedSize: string | null
  stock: number
}

interface Product {
  id: number
  name: string
  price: number
  images: string[]
  stock: number
}

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>([])

  const itemCount = computed(() => {
    return items.value.reduce((total, item) => total + item.quantity, 0)
  })

  const subtotal = computed(() => {
    return items.value.reduce((total, item) => total + (item.price * item.quantity), 0)
  })

  const shipping = computed(() => {
    return subtotal.value > 100 ? 0 : 5.99
  })

  const tax = computed(() => {
    return subtotal.value * 0.08
  })

  const total = computed(() => {
    return subtotal.value + shipping.value + tax.value
  })

  const addItem = (
    product: Product,
    quantity = 1,
    selectedColor: string | null = null,
    selectedSize: string | null = null,
    variantPrice?: number,
    variantId?: number
  ) => {
    const existingItem = items.value.find(
      item => item.id === product.id && 
              item.variantId === variantId &&
              item.selectedColor === selectedColor && 
              item.selectedSize === selectedSize
    )

    if (existingItem) {
      existingItem.quantity += quantity
    } else {
      items.value.push({
        id: product.id,
        variantId,
        name: product.name,
        price: variantPrice ?? product.price,
        image: product.images[0],
        quantity,
        selectedColor,
        selectedSize,
        stock: product.stock
      })
    }
  }

  const removeItem = (itemIndex: number) => {
    items.value.splice(itemIndex, 1)
  }

  const updateQuantity = (itemIndex: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemIndex)
    } else {
      items.value[itemIndex].quantity = quantity
    }
  }

  const clearCart = () => {
    items.value = []
  }

  return {
    items,
    itemCount,
    subtotal,
    shipping,
    tax,
    total,
    addItem,
    removeItem,
    updateQuantity,
    clearCart
  }
})
