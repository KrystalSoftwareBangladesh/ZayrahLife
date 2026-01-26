import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { orders as mockOrders } from '@/mock/orders'

interface OrderItem {
  productId: number
  name: string
  price: number
  quantity: number
  color: string
  size: string | null
}

interface ShippingAddress {
  name?: string
  firstName?: string
  lastName?: string
  street?: string
  address?: string
  city: string
  state: string
  zip: string
  country: string
}

interface Totals {
  subtotal: number
  shipping: number
  tax: number
  total: number
}

interface CartItem {
  id: number
  name: string
  price: number
  quantity: number
  selectedColor: string | null
  selectedSize: string | null
}

interface Order {
  id: string
  date: string
  status: string
  statusLabel: string
  items: OrderItem[]
  subtotal: number
  shipping: number
  tax: number
  total: number
  shippingAddress: ShippingAddress
  trackingNumber: string | null
}

export const useOrderStore = defineStore('orders', () => {
  const orders = ref<Order[]>(mockOrders as unknown as Order[])

  const getOrderById = (orderId: string) => {
    return orders.value.find(o => o.id === orderId)
  }

  const createOrder = (cartItems: CartItem[], shippingAddress: ShippingAddress, totals: Totals) => {
    const newOrder: Order = {
      id: `ORD-${String(orders.value.length + 1).padStart(3, '0')}`,
      date: new Date().toISOString().split('T')[0],
      status: 'processing',
      statusLabel: 'Processing',
      items: cartItems.map(item => ({
        productId: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        color: item.selectedColor || '',
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
    return [...orders.value].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  })

  return {
    orders,
    sortedOrders,
    getOrderById,
    createOrder
  }
})
