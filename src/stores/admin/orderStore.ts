import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { mockAdminOrders } from '@/mock/admin/orders'

interface OrderFilters {
  status?: string
  channel?: string
}

interface OrderItem {
  productId: number
  name: string
  variant: string
  quantity: number
  price: number
}

interface NewOrder {
  customerId: number
  customerName: string
  customerEmail: string
  channel: string
  items: { productId: number; productName: string; quantity: number; price: number; variant?: string }[]
  shippingAddress: string
  paymentMethod?: string
  notes?: string
}

export const useOrderStore = defineStore('adminOrders', () => {
  const orders = ref([...mockAdminOrders])
  const loading = ref(false)

  const totalOrders = computed(() => orders.value.length)
  const totalRevenue = computed(() => orders.value.reduce((sum, o) => sum + o.total, 0))
  const pendingOrders = computed(() => orders.value.filter(o => o.status === 'pending').length)
  const processingOrders = computed(() => orders.value.filter(o => o.status === 'processing').length)

  const ordersByStatus = computed(() => {
    const grouped: Record<string, typeof orders.value> = {}
    orders.value.forEach(order => {
      if (!grouped[order.status]) grouped[order.status] = []
      grouped[order.status].push(order)
    })
    return grouped
  })

  function getOrderById(id: string) {
    return orders.value.find(o => o.id === id)
  }

  function updateOrderStatus(id: string, status: string) {
    const order = orders.value.find(o => o.id === id)
    if (order) {
      order.status = status
      order.updatedAt = new Date().toISOString()
    }
  }

  function filterOrders(filters: OrderFilters) {
    let result = [...orders.value]
    if (filters.status) {
      result = result.filter(o => o.status === filters.status)
    }
    if (filters.channel) {
      result = result.filter(o => o.channel === filters.channel)
    }
    return result
  }

  function addOrder(data: NewOrder) {
    const orderNum = orders.value.length + 1
    const year = new Date().getFullYear()
    const subtotal = data.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const shipping = subtotal > 100 ? 0 : 9.99
    const tax = subtotal * 0.08

    const orderItems: OrderItem[] = data.items.map(item => ({
      productId: item.productId,
      name: item.productName,
      variant: item.variant || '',
      quantity: item.quantity,
      price: item.price
    }))

    const newOrder = {
      id: `ORD-${year}-${String(orderNum).padStart(3, '0')}`,
      customerId: data.customerId,
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      items: orderItems,
      subtotal,
      shipping,
      tax,
      total: subtotal + shipping + tax,
      status: 'pending',
      channel: data.channel,
      paymentMethod: data.paymentMethod || 'Credit Card',
      shippingAddress: data.shippingAddress,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    orders.value.unshift(newOrder)
    return newOrder
  }

  return {
    orders,
    loading,
    totalOrders,
    totalRevenue,
    pendingOrders,
    processingOrders,
    ordersByStatus,
    getOrderById,
    updateOrderStatus,
    filterOrders,
    addOrder
  }
})
