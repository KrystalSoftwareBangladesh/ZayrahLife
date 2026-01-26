import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCartStore = defineStore('cart', () => {
  const items = ref([])

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

  const addItem = (product, quantity = 1, selectedColor = null, selectedSize = null) => {
    const existingItem = items.value.find(
      item => item.id === product.id && 
              item.selectedColor === selectedColor && 
              item.selectedSize === selectedSize
    )

    if (existingItem) {
      existingItem.quantity += quantity
    } else {
      items.value.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.images[0],
        quantity,
        selectedColor,
        selectedSize,
        stock: product.stock
      })
    }
  }

  const removeItem = (itemIndex) => {
    items.value.splice(itemIndex, 1)
  }

  const updateQuantity = (itemIndex, quantity) => {
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
