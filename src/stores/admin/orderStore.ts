import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { salesApi } from '@/api/sales'
import { customersApi } from '@/api/customers'
import type {
  ApiError,
  CustomerCreateRequest,
  SaleCreateRequest,
  SaleDetail,
  SaleDetailRequest,
  SaleItemCreateRequest,
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
  variantId?: number
  name: string
  variant: string
  quantity: number
  price: number
}

interface NewOrderItem {
  productId: number
  productName: string
  quantity: number
  price: number
  variant?: string
  variantId?: number
}

interface NewOrder {
  customerId: number
  customerName: string
  customerEmail: string
  channel: string
  items: NewOrderItem[]
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

function toApiDate(value?: string): string {
  const parsed = value ? new Date(value) : new Date()
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString().split('T')[0]
  return parsed.toISOString().split('T')[0]
}

function getSaleCustomer(sale: Partial<SaleDetail & SaleList>) {
  if (sale.customer && typeof sale.customer === 'object') {
    return {
      id: sale.customer.id,
      name: sale.customer.full_name || 'Unknown Customer',
      email: sale.customer.email || ''
    }
  }

  return {
    id: typeof sale.customer === 'number' ? sale.customer : 0,
    name: sale.customer_name || 'Unknown Customer',
    email: sale.customer_email || ''
  }
}

function mapSaleItemsForRequest(items: OrderItem[]) {
  return items.map(item => {
    const productVariantId = item.variantId || item.productId
    return {
      product_variant_id: productVariantId,
      quantity: item.quantity,
      unit_price: String(item.price.toFixed(2)),
      line_total: String((item.price * item.quantity).toFixed(2))
    }
  })
}

function normalizeSaleOrder(sale: Partial<SaleDetail & SaleList>): AdminOrder {
  const customer = getSaleCustomer(sale)
  const mappedItems: OrderItem[] = Array.isArray(sale.items)
    ? sale.items.map(item => ({
      productId: item.product_variant?.id ?? item.product_id ?? item.id ?? 0,
      variantId: item.product_variant?.id,
      name: item.product_name || item.product_variant?.product || 'Product',
      variant: item.variant || [item.product_variant?.color, item.product_variant?.size].filter(Boolean).join(' / '),
      quantity: item.quantity || 1,
      price: toNumber(item.unit_price)
    }))
    : []

  const createdAt = sale.created_at || (sale.sale_date ? `${sale.sale_date}T00:00:00.000Z` : new Date().toISOString())

  return {
    id: String(sale.order_number || sale.id || ''),
    customerId: customer.id,
    customerName: customer.name,
    customerEmail: customer.email,
    items: mappedItems,
    subtotal: toNumber(sale.subtotal_amount),
    shipping: toNumber(sale.shipping_amount),
    tax: toNumber(sale.tax_amount),
    total: toNumber(sale.total_amount),
    status: toStatusKey(sale.status),
    channel: sale.channel || 'WEBSITE',
    paymentMethod: sale.payment_method || 'CARD',
    shippingAddress: sale.shipping_address || '-',
    createdAt,
    updatedAt: sale.updated_at || createdAt
  }
}

function mapCreateItems(data: NewOrder): SaleItemCreateRequest[] {
  return data.items
    .filter(item => typeof item.variantId === 'number' && item.variantId > 0)
    .map(item => ({
      product_variant_id: item.variantId as number,
      quantity: item.quantity,
      unit_price: String(item.price.toFixed(2)),
      line_total: String((item.price * item.quantity).toFixed(2))
    }))
}

function buildCreatePayload(data: NewOrder, customerId: number, items: SaleItemCreateRequest[]): SaleCreateRequest {
  return {
    customer: customerId,
    sale_date: toApiDate(),
    invoice_number: null,
    discount_amount: '0.00',
    tax_amount: String((data.tax ?? 0).toFixed(2)),
    notes: data.notes || null,
    items
  }
}

export const useOrderStore = defineStore('adminOrders', () => {
  const orders = ref<AdminOrder[]>([...mockAdminOrders] as AdminOrder[])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const walkInCustomerId = ref<number | null>(null)

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
      const response = await salesApi.list({ page: 1, page_size: 100, ordering: '-sale_date' })
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
      if (order.customerId <= 0 || order.items.length === 0) return

      const detailPayload: SaleDetailRequest = {
        customer: order.customerId,
        sale_date: toApiDate(order.createdAt),
        invoice_number: null,
        discount_amount: '0.00',
        tax_amount: String(order.tax.toFixed(2)),
        notes: null,
        items: mapSaleItemsForRequest(order.items)
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

  function buildWalkInCustomerPayload(): CustomerCreateRequest {
    return {
      first_name: 'Walk-in',
      last_name: 'Customer',
      customer_type: 'POS',
      notes: 'Auto-created walk-in customer from POS flow.'
    }
  }

  async function resolveCustomerId(data: NewOrder): Promise<number | null> {
    if (data.customerId > 0) return data.customerId

    const email = data.customerEmail.trim().toLowerCase()
    if (email) {
      try {
        const response = await customersApi.list({ search: email, page: 1, page_size: 20 })
        const matched = response.results.find(customer => customer.email?.toLowerCase() === email)
        if (matched) return matched.id
      } catch {
        // Continue with a create attempt if lookup fails.
      }
    }

    if (walkInCustomerId.value) return walkInCustomerId.value

    try {
      const response = await customersApi.list({ search: 'walk-in customer', page: 1, page_size: 20 })
      const existing = response.results.find(customer => customer.full_name?.toLowerCase() === 'walk-in customer')
      if (existing) {
        walkInCustomerId.value = existing.id
        return existing.id
      }
    } catch {
      // Continue with create flow.
    }

    try {
      const created = await customersApi.create(buildWalkInCustomerPayload())
      walkInCustomerId.value = created.id
      return created.id
    } catch {
      return null
    }
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

    const customerId = await resolveCustomerId(data)
    const saleItems = mapCreateItems(data)
    const hasValidCustomer = typeof customerId === 'number' && customerId > 0
    const hasItems = saleItems.length === data.items.length && data.items.length > 0
    if (!hasValidCustomer || !hasItems) {
      error.value = 'Order saved locally because customer or product variant mapping is incomplete.'
      orders.value.unshift(fallbackOrder)
      return fallbackOrder
    }

    try {
      const created = await salesApi.create(
        buildCreatePayload({ ...data, customerId, subtotal, tax, shipping, total }, customerId, saleItems)
      )
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

  async function deleteOrder(id: string): Promise<boolean> {
    const index = orders.value.findIndex(order => order.id === id)
    if (index < 0) return false

    const [removed] = orders.value.splice(index, 1)
    try {
      await salesApi.delete(id)
      return true
    } catch (err) {
      orders.value.splice(index, 0, removed)
      const apiError = err as ApiError
      error.value = apiError.message || 'Failed to delete sale order'
      return false
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
    addOrder,
    deleteOrder
  }
})
