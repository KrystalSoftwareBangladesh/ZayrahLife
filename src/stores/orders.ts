import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { orders as mockOrders } from '@/mock/orders'
import { salesApi } from '@/api/sales'
import { customersApi } from '@/api/customers'
import type { ApiError, CustomerCreateRequest, SaleCreateRequest, SaleDetail, SaleList } from '@/api/types'

interface OrderItem {
  productId: number
  name: string
  price: number
  quantity: number
  color: string
  size: string | null
}

interface ShippingAddress {
  customerId?: number
  name?: string
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
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
  variantId?: number
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

function toApiDate(value?: string): string {
  const parsed = value ? new Date(value) : new Date()
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString().split('T')[0]
  return parsed.toISOString().split('T')[0]
}

function getSaleCustomerName(sale: Partial<SaleDetail & SaleList>): string {
  if (sale.customer && typeof sale.customer === 'object') {
    return sale.customer.full_name || 'Customer'
  }
  return sale.customer_name || 'Customer'
}

function normalizeSaleOrder(sale: Partial<SaleDetail & SaleList>): Order {
  const status = toStatusKey(sale.status)
  const createdAt = sale.created_at || (sale.sale_date ? `${sale.sale_date}T00:00:00.000Z` : new Date().toISOString())
  const items = Array.isArray(sale.items)
    ? sale.items.map(item => ({
      productId: item.product_variant?.id ?? item.product_id ?? item.id ?? 0,
      name: item.product_name || item.product_variant?.product || 'Product',
      price: toNumber(item.unit_price),
      quantity: item.quantity || 1,
      color: item.variant?.split('/')[0]?.trim() || item.product_variant?.color || '',
      size: item.variant?.split('/')[1]?.trim() || item.product_variant?.size || null
    }))
    : []
  const customerName = getSaleCustomerName(sale)

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
    shippingAddress: parseShippingAddress(sale.shipping_address, customerName),
    trackingNumber: sale.tracking_number || null
  }
}

function buildCustomerPayload(shippingAddress: ShippingAddress): CustomerCreateRequest {
  const fullName = (shippingAddress.name || '').trim()
  const nameParts = fullName.split(/\s+/).filter(Boolean)
  const firstName = shippingAddress.firstName?.trim() || nameParts[0] || 'Guest'
  const lastName = shippingAddress.lastName?.trim() || nameParts.slice(1).join(' ') || undefined
  const email = shippingAddress.email?.trim() || undefined
  const phone = shippingAddress.phone?.trim() || undefined

  return {
    first_name: firstName,
    last_name: lastName,
    email,
    phone,
    customer_type: 'WEBSITE',
    notes: 'Auto-created during website checkout.'
  }
}

async function resolveCustomerId(shippingAddress: ShippingAddress): Promise<number | null> {
  if (typeof shippingAddress.customerId === 'number' && shippingAddress.customerId > 0) {
    return shippingAddress.customerId
  }

  const email = shippingAddress.email?.trim().toLowerCase()
  if (email) {
    try {
      const response = await customersApi.list({ search: email, page: 1, page_size: 20 })
      const matched = response.results.find(customer => customer.email?.toLowerCase() === email)
      if (matched) return matched.id
    } catch {
      // Continue with a create attempt if customer search fails.
    }
  }

  try {
    const created = await customersApi.create(buildCustomerPayload(shippingAddress))
    return created.id
  } catch {
    return null
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
      const response = await salesApi.list({ page: 1, page_size: 50, ordering: '-sale_date' })
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

    const customerId = await resolveCustomerId(shippingAddress)
    const saleItems = cartItems
      .filter(item => typeof item.variantId === 'number' && item.variantId > 0)
      .map(item => ({
        product_variant_id: item.variantId as number,
        quantity: item.quantity,
        unit_price: String(item.price.toFixed(2)),
        line_total: String((item.price * item.quantity).toFixed(2))
      }))

    const canSubmitToApi =
      typeof customerId === 'number' &&
      customerId > 0 &&
      saleItems.length === cartItems.length

    if (!canSubmitToApi) {
      error.value = 'Order saved locally because checkout data is missing customer or variant mapping.'
      orders.value.unshift(fallbackOrder)
      return fallbackOrder
    }

    const payload: SaleCreateRequest = {
      customer: customerId,
      sale_date: toApiDate(),
      invoice_number: null,
      discount_amount: '0.00',
      tax_amount: String(totals.tax.toFixed(2)),
      notes: null,
      items: saleItems
    }

    try {
      const created = await salesApi.create(payload)
      const normalized = normalizeSaleOrder(created)
      orders.value.unshift(normalized)
      return normalized
    } catch (err) {
      const apiError = err as ApiError
      error.value = apiError.message || 'Failed to create sale order in API'
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
