import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { orders as mockOrders } from '@/mock/orders'

export const useOrderStore = defineStore('orders', () => {
  const orders = ref([...mockOrders])

  const getOrderById = (orderId) => {
    return orders.value.find(o => o.id === orderId)
  }

  const createOrder = (cartItems, shippingAddress, totals) => {
    const newOrder = {
      id: `ORD-${String(orders.value.length + 1).padStart(3, '0')}`,
      date: new Date().toISOString().split('T')[0],
      status: 'processing',
      statusLabel: 'Processing',
      items: cartItems.map(item => ({
        productId: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        color: item.selectedColor,
        size: item.selectedSize
      })),
      subtotal: totals.subtotal,
      shipping: totals.shipping,
      tax: totals.tax,
      total: totals.total,
      shippingAddress,
      trackingNumber: null
    }

    orders.value.unshift(newOrder)
    return newOrder
  }

  const sortedOrders = computed(() => {
    return [...orders.value].sort((a, b) => new Date(b.date) - new Date(a.date))
  })

  return {
    orders,
    sortedOrders,
    getOrderById,
    createOrder
  }
})
