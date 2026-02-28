import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { orders as mockOrders } from '@/mock/orders'
import { salesApi } from '@/api/sales'
import type { ApiError, SaleCreateRequest, SaleDetail, SaleList } from '@/api/types'

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

function toNumber(value: unknown): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string' && value.trim() !== '') return Number(value)
  return 0
}

function toStatusKey(status: unknown): string {
  const raw = String(status || '').toLowerCase()
  if (raw === 'confirmed') return 'processing'
  if (raw === 'draft') return 'pending'
  if (raw === 'cancelled') return 'cancelled'
  return raw || 'processing'
}

function toStatusLabel(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

function parseShippingAddress(address: string | null | undefined, fallbackName = ''): ShippingAddress {
  return {
    name: fallbackName,
    street: address || '-',
    city: '-',
    state: '-',
    zip: '-',
    country: 'USA'
  }
}

function normalizeSaleOrder(sale: Partial<SaleDetail & SaleList>): Order {
  const status = toStatusKey(sale.status)
  const createdAt = sale.created_at || new Date().toISOString()
  const items = Array.isArray(sale.items)
    ? sale.items.map(item => ({
      productId: item.product_id ?? item.id ?? 0,
      name: item.product_name || 'Product',
      price: toNumber(item.unit_price),
      quantity: item.quantity || 1,
      color: item.variant?.split('/')[0]?.trim() || '',
      size: item.variant?.split('/')[1]?.trim() || null
    }))
    : []

  return {
    id: String(sale.order_number || sale.id || ''),
    date: createdAt.split('T')[0],
    status,
    statusLabel: toStatusLabel(status),
    items,
    subtotal: toNumber(sale.subtotal_amount),
    shipping: toNumber(sale.shipping_amount),
    tax: toNumber(sale.tax_amount),
    total: toNumber(sale.total_amount),
    shippingAddress: parseShippingAddress(sale.shipping_address, sale.customer_name || ''),
    trackingNumber: sale.tracking_number || null
  }
}

export const useOrderStore = defineStore('orders', () => {
  const orders = ref<Order[]>(mockOrders as unknown as Order[])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const getOrderById = (orderId: string) => {
    return orders.value.find(o => o.id === orderId)
  }

  const fetchOrders = async () => {
    loading.value = true
    error.value = null

    try {
      const response = await salesApi.list({ page: 1, page_size: 50, ordering: '-created_at' })
      orders.value = response.results.map(normalizeSaleOrder)
    } catch (err) {
      const apiError = err as ApiError
      error.value = apiError.message || 'Failed to fetch sales orders'
    } finally {
      loading.value = false
    }
  }

  const fetchOrderById = async (orderId: string): Promise<Order | null> => {
    const existing = getOrderById(orderId)
    if (existing) return existing

    loading.value = true
    error.value = null

    try {
      const detail = await salesApi.getById(orderId)
      const normalized = normalizeSaleOrder(detail)
      const idx = orders.value.findIndex(order => order.id === normalized.id)
      if (idx >= 0) {
        orders.value[idx] = normalized
      } else {
        orders.value.unshift(normalized)
      }
      return normalized
    } catch (err) {
      const apiError = err as ApiError
      error.value = apiError.message || 'Failed to fetch order details'
      return null
    } finally {
      loading.value = false
    }
  }

  const createOrder = async (cartItems: CartItem[], shippingAddress: ShippingAddress, totals: Totals): Promise<Order> => {
    const fallbackOrder: Order = {
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

    const payload: SaleCreateRequest = {
      customer_name: shippingAddress.name || `${shippingAddress.firstName || ''} ${shippingAddress.lastName || ''}`.trim(),
      customer_email: null,
      channel: 'WEBSITE',
      payment_method: 'CARD',
      shipping_address: [
        shippingAddress.street || shippingAddress.address || '',
        `${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.zip}`,
        shippingAddress.country
      ].filter(Boolean).join(', '),
      subtotal_amount: String(totals.subtotal.toFixed(2)),
      shipping_amount: String(totals.shipping.toFixed(2)),
      tax_amount: String(totals.tax.toFixed(2)),
      total_amount: String(totals.total.toFixed(2)),
      items: cartItems.map(item => ({
        product_id: item.id,
        product_name: item.name,
        variant: [item.selectedColor, item.selectedSize].filter(Boolean).join(' / ') || null,
        quantity: item.quantity,
        unit_price: String(item.price.toFixed(2))
      }))
    }

    try {
      const created = await salesApi.create(payload)
      const normalized = normalizeSaleOrder(created)
      orders.value.unshift(normalized)
      return normalized
    } catch {
      orders.value.unshift(fallbackOrder)
      return fallbackOrder
    }
  }

  const sortedOrders = computed(() => {
    return [...orders.value].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  })

  return {
    orders,
    loading,
    error,
    sortedOrders,
    getOrderById,
    fetchOrders,
    fetchOrderById,
    createOrder
  }
})
