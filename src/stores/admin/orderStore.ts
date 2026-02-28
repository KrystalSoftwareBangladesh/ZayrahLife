import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { salesApi } from '@/api/sales'
import type {
  ApiError,
  SaleCreateRequest,
  SaleDetail,
  SaleDetailRequest,
  SaleList,
  SaleStatus,
  SaleUpdateRequest
} from '@/api/types'
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
  subtotal?: number
  tax?: number
  shipping?: number
  total?: number
}

interface AdminOrder {
  id: string
  customerId: number
  customerName: string
  customerEmail: string
  items: OrderItem[]
  subtotal: number
  shipping: number
  tax: number
  total: number
  status: string
  channel: string
  paymentMethod: string
  shippingAddress: string
  createdAt: string
  updatedAt: string
}

function toNumber(value: unknown): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string' && value.trim() !== '') return Number(value)
  return 0
}

function toStatusKey(status: unknown): string {
  const raw = String(status || '').toLowerCase()
  if (raw === 'draft') return 'pending'
  if (raw === 'confirmed') return 'processing'
  return raw || 'pending'
}

function toApiStatus(status: string): SaleStatus {
  if (status === 'cancelled') return 'CANCELLED'
  if (status === 'pending') return 'DRAFT'
  return 'CONFIRMED'
}

function normalizeSaleOrder(sale: Partial<SaleDetail & SaleList>): AdminOrder {
  const mappedItems: OrderItem[] = Array.isArray(sale.items)
    ? sale.items.map(item => ({
      productId: item.product_id ?? item.id ?? 0,
      name: item.product_name || 'Product',
      variant: item.variant || '',
      quantity: item.quantity || 1,
      price: toNumber(item.unit_price)
    }))
    : []

  return {
    id: String(sale.order_number || sale.id || ''),
    customerId: sale.customer || 0,
    customerName: sale.customer_name || 'Unknown Customer',
    customerEmail: sale.customer_email || '',
    items: mappedItems,
    subtotal: toNumber(sale.subtotal_amount),
    shipping: toNumber(sale.shipping_amount),
    tax: toNumber(sale.tax_amount),
    total: toNumber(sale.total_amount),
    status: toStatusKey(sale.status),
    channel: sale.channel || 'WEBSITE',
    paymentMethod: sale.payment_method || 'CARD',
    shippingAddress: sale.shipping_address || '-',
    createdAt: sale.created_at || new Date().toISOString(),
    updatedAt: sale.updated_at || sale.created_at || new Date().toISOString()
  }
}

function buildCreatePayload(data: NewOrder): SaleCreateRequest {
  return {
    customer: data.customerId || undefined,
    customer_name: data.customerName,
    customer_email: data.customerEmail || null,
    channel: data.channel,
    payment_method: data.paymentMethod || 'CASH',
    shipping_address: data.shippingAddress || null,
    notes: data.notes || null,
    subtotal_amount: String((data.subtotal ?? 0).toFixed(2)),
    shipping_amount: String((data.shipping ?? 0).toFixed(2)),
    tax_amount: String((data.tax ?? 0).toFixed(2)),
    total_amount: String((data.total ?? 0).toFixed(2)),
    items: data.items.map(item => ({
      product_id: item.productId,
      product_name: item.productName,
      variant: item.variant || null,
      quantity: item.quantity,
      unit_price: String(item.price.toFixed(2))
    }))
  }
}

export const useOrderStore = defineStore('adminOrders', () => {
  const orders = ref<AdminOrder[]>([...mockAdminOrders] as AdminOrder[])
  const loading = ref(false)
  const error = ref<string | null>(null)

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

  async function fetchOrders(): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const response = await salesApi.list({ page: 1, page_size: 100, ordering: '-created_at' })
      orders.value = response.results.map(normalizeSaleOrder)
    } catch (err) {
      const apiError = err as ApiError
      error.value = apiError.message || 'Failed to fetch sales orders'
    } finally {
      loading.value = false
    }
  }

  async function fetchOrderById(id: string): Promise<AdminOrder | null> {
    const existing = getOrderById(id)
    if (existing) return existing

    loading.value = true
    error.value = null

    try {
      const detail = await salesApi.getById(id)
      const normalized = normalizeSaleOrder(detail)
      orders.value.unshift(normalized)
      return normalized
    } catch (err) {
      const apiError = err as ApiError
      error.value = apiError.message || 'Failed to fetch sale details'
      return null
    } finally {
      loading.value = false
    }
  }

  function getOrderById(id: string) {
    return orders.value.find(o => o.id === id)
  }

  async function updateOrderStatus(id: string, status: string): Promise<void> {
    const order = orders.value.find(o => o.id === id)
    if (!order) return

    const previousStatus = order.status
    order.status = status
    order.updatedAt = new Date().toISOString()

    try {
      const apiStatus = toApiStatus(status)
      const detailPayload: SaleDetailRequest = {
        customer: order.customerId || undefined,
        customer_name: order.customerName || undefined,
        customer_email: order.customerEmail || undefined,
        channel: order.channel || undefined,
        payment_method: order.paymentMethod || undefined,
        shipping_address: order.shippingAddress || undefined,
        subtotal_amount: String(order.subtotal.toFixed(2)),
        shipping_amount: String(order.shipping.toFixed(2)),
        tax_amount: String(order.tax.toFixed(2)),
        total_amount: String(order.total.toFixed(2)),
        items: order.items.map(item => ({
          product_id: item.productId,
          product_name: item.name,
          variant: item.variant || null,
          quantity: item.quantity,
          unit_price: String(item.price.toFixed(2))
        }))
      }

      if (apiStatus === 'CANCELLED') {
        await salesApi.cancel(id, detailPayload)
      } else if (apiStatus === 'CONFIRMED') {
        await salesApi.confirm(id, detailPayload)
      } else {
        const payload: SaleUpdateRequest = { status: apiStatus }
        await salesApi.update(id, payload)
      }
    } catch {
      order.status = previousStatus
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

  async function addOrder(data: NewOrder): Promise<AdminOrder> {
    const orderNum = orders.value.length + 1
    const year = new Date().getFullYear()
    const subtotal = data.subtotal ?? data.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const tax = data.tax ?? subtotal * 0.05
    const shipping = data.shipping ?? 0
    const total = data.total ?? (subtotal + tax + shipping)

    const fallbackOrder: AdminOrder = {
      id: `ORD-${year}-${String(orderNum).padStart(3, '0')}`,
      customerId: data.customerId,
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      items: data.items.map(item => ({
        productId: item.productId,
        name: item.productName,
        variant: item.variant || '',
        quantity: item.quantity,
        price: item.price
      })),
      subtotal,
      shipping,
      tax,
      total,
      status: 'pending',
      channel: data.channel,
      paymentMethod: data.paymentMethod || 'Credit Card',
      shippingAddress: data.shippingAddress,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    try {
      const created = await salesApi.create(buildCreatePayload({ ...data, subtotal, tax, shipping, total }))
      const normalized = normalizeSaleOrder(created)
      orders.value.unshift(normalized)
      return normalized
    } catch {
      orders.value.unshift(fallbackOrder)
      return fallbackOrder
    }
  }

  return {
    orders,
    loading,
    error,
    totalOrders,
    totalRevenue,
    pendingOrders,
    processingOrders,
    ordersByStatus,
    fetchOrders,
    fetchOrderById,
    getOrderById,
    updateOrderStatus,
    filterOrders,
    addOrder
  }
})
