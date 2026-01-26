import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { mockAdminOrders } from '@/mock/admin/orders'

export const useOrderStore = defineStore('adminOrders', () => {
  const orders = ref([...mockAdminOrders])
  const loading = ref(false)

  const totalOrders = computed(() => orders.value.length)
  const totalRevenue = computed(() => orders.value.reduce((sum, o) => sum + o.total, 0))
  const pendingOrders = computed(() => orders.value.filter(o => o.status === 'pending').length)
  const processingOrders = computed(() => orders.value.filter(o => o.status === 'processing').length)

  const ordersByStatus = computed(() => {
    const grouped = {}
    orders.value.forEach(order => {
      if (!grouped[order.status]) grouped[order.status] = []
      grouped[order.status].push(order)
    })
    return grouped
  })

  function getOrderById(id) {
    return orders.value.find(o => o.id === id)
  }

  function updateOrderStatus(id, status) {
    const order = orders.value.find(o => o.id === id)
    if (order) {
      order.status = status
      order.updatedAt = new Date().toISOString()
    }
  }

  function filterOrders(filters) {
    let result = [...orders.value]
    if (filters.status) {
      result = result.filter(o => o.status === filters.status)
    }
    if (filters.channel) {
      result = result.filter(o => o.channel === filters.channel)
    }
    return result
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
    filterOrders
  }
})
