import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { customersApi } from '@/api/customers'
import { salesApi } from '@/api/sales'
import type {
  ApiError,
  CustomerCreateRequest,
  SaleAccount,
  SaleCreateRequest,
  SaleDetail,
  SaleDetailRequest,
  SaleItemCreateRequest,
  SaleLinkedTransaction,
  SaleList,
  SaleStatus,
  SaleStatusOption,
  SaleStatusesResponse,
  SaleUpdateRequest
} from '@/api/types'
import { mockAdminOrders } from '@/mock/admin/orders'
import { humanizeStatusLabel, normalizeStatusValue, statusValuesMatch } from '@/utils/status'

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
  accountId: number
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

export interface AdminOrder {
  id: string
  apiId: string
  invoiceNumber: string | null
  saleDate: string
  customerId: number
  customerName: string
  customerEmail: string
  items: OrderItem[]
  subtotal: number
  shipping: number
  tax: number
  total: number
  status: string
  accountId: number | null
  account: SaleAccount | null
  accountingTransaction: SaleLinkedTransaction | null
  returnTransaction: SaleLinkedTransaction | null
  notes: string | null
  channel: string
  paymentMethod: string
  shippingAddress: string
  createdAt: string
  updatedAt: string
  isLocalOnly: boolean
}

const fallbackStatuses: SaleStatusesResponse = {
  default: 'PENDING',
  statuses: [
    { value: 'PENDING', label: 'Pending' },
    { value: 'PROCESSING', label: 'Processing' },
    { value: 'SHIPPED', label: 'Shipped' },
    { value: 'DELIVERED', label: 'Delivered' },
    { value: 'CANCELLED', label: 'Cancelled' }
  ],
  transitions: {
    PENDING: ['PROCESSING', 'CANCELLED'],
    PROCESSING: ['SHIPPED', 'DELIVERED', 'CANCELLED'],
    SHIPPED: ['DELIVERED'],
    DELIVERED: [],
    CANCELLED: []
  }
}

function toNumber(value: unknown): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string' && value.trim() !== '') return Number(value)
  return 0
}

function toApiDate(value?: string): string {
  const parsed = value ? new Date(value) : new Date()
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString().split('T')[0]
  return parsed.toISOString().split('T')[0]
}

function buildStatusOption(value: string, label?: string): SaleStatusOption {
  return {
    value,
    label: label || humanizeStatusLabel(value)
  }
}

function normalizeTransitions(transitions: Record<string, string[]> = {}): Record<string, string[]> {
  return Object.entries(transitions).reduce<Record<string, string[]>>((acc, [status, nextStatuses]) => {
    acc[normalizeStatusValue(status)] = Array.from(
      new Set((Array.isArray(nextStatuses) ? nextStatuses : []).map(nextStatus => normalizeStatusValue(nextStatus)).filter(Boolean))
    )
    return acc
  }, {})
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

function getSaleAccount(sale: Partial<SaleDetail & SaleList>): SaleAccount | null {
  if (sale.account && typeof sale.account === 'object') {
    return {
      id: sale.account.id,
      code: sale.account.code,
      name: sale.account.name,
      account_type: sale.account.account_type
    }
  }

  return null
}

function formatApiErrorMessage(apiError: ApiError, fallbackMessage: string): string {
  const payload = apiError.data
  if (payload && typeof payload === 'object') {
    const messages = Object.entries(payload as Record<string, unknown>).flatMap(([field, value]) => {
      if (field === 'detail' || field === 'message') return []
      if (Array.isArray(value)) {
        return value.map(item => `${field}: ${String(item)}`)
      }
      if (typeof value === 'string') {
        return [`${field}: ${value}`]
      }
      return []
    })

    if (messages.length > 0) return messages.join(' ')
  }

  return apiError.message || fallbackMessage
}

function normalizeSaleOrder(sale: Partial<SaleDetail & SaleList>): AdminOrder {
  const customer = getSaleCustomer(sale)
  const account = getSaleAccount(sale)
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
    apiId: String(sale.id || sale.order_number || ''),
    invoiceNumber: sale.invoice_number || null,
    saleDate: sale.sale_date || createdAt.split('T')[0],
    customerId: customer.id,
    customerName: customer.name,
    customerEmail: customer.email,
    items: mappedItems,
    subtotal: toNumber(sale.subtotal_amount),
    shipping: toNumber(sale.shipping_amount),
    tax: toNumber(sale.tax_amount),
    total: toNumber(sale.total_amount),
    status: String(sale.status || fallbackStatuses.default),
    accountId: typeof sale.account_id === 'number' ? sale.account_id : account?.id || null,
    account,
    accountingTransaction: sale.accounting_transaction || null,
    returnTransaction: sale.return_transaction || null,
    notes: sale.notes || null,
    channel: sale.channel || 'WEBSITE',
    paymentMethod: sale.payment_method || 'CARD',
    shippingAddress: sale.shipping_address || '-',
    createdAt,
    updatedAt: sale.updated_at || createdAt,
    isLocalOnly: false
  }
}

function normalizeMockOrder(
  order: Omit<AdminOrder, 'apiId' | 'isLocalOnly' | 'invoiceNumber'> & { invoiceNumber?: string | null }
): AdminOrder {
  return {
    ...order,
    invoiceNumber: order.invoiceNumber ?? null,
    apiId: String(order.id),
    isLocalOnly: true
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
    account_id: data.accountId,
    sale_date: toApiDate(),
    channel: data.channel,
    discount_amount: '0.00',
    tax_amount: String((data.tax ?? 0).toFixed(2)),
    notes: data.notes || null,
    items
  }
}

export const useOrderStore = defineStore('adminOrders', () => {
  const orders = ref<AdminOrder[]>(mockAdminOrders.map(order => normalizeMockOrder(order)))
  const saleDetails = ref<Record<string, SaleDetail>>({})
  const loading = ref(false)
  const error = ref<string | null>(null)
  const walkInCustomerId = ref<number | null>(null)
  const statusLoading = ref(false)
  const statusMetadataLoaded = ref(false)
  const defaultStatus = ref(fallbackStatuses.default)
  const configuredStatusOptions = ref<SaleStatusOption[]>(fallbackStatuses.statuses)
  const statusTransitions = ref<Record<string, string[]>>(normalizeTransitions(fallbackStatuses.transitions))

  const statusOptions = computed(() => {
    const merged = [...configuredStatusOptions.value]
    orders.value.forEach(order => {
      if (!merged.some(option => statusValuesMatch(option.value, order.status))) {
        merged.push(buildStatusOption(order.status))
      }
    })
    return merged
  })
  const apiStatusOptions = computed(() => [...configuredStatusOptions.value])

  const totalOrders = computed(() => orders.value.length)
  const totalRevenue = computed(() => orders.value.reduce((sum, order) => sum + order.total, 0))
  const pendingOrders = computed(() =>
    orders.value.filter(order =>
      statusValuesMatch(order.status, defaultStatus.value) ||
      statusValuesMatch(order.status, 'PENDING') ||
      statusValuesMatch(order.status, 'DRAFT')
    ).length
  )
  const processingOrders = computed(() =>
    orders.value.filter(order =>
      statusValuesMatch(order.status, 'PROCESSING') ||
      statusValuesMatch(order.status, 'CONFIRMED')
    ).length
  )

  const ordersByStatus = computed(() => {
    const grouped: Record<string, typeof orders.value> = {}
    orders.value.forEach(order => {
      const key = normalizeStatusValue(order.status) || defaultStatus.value
      if (!grouped[key]) grouped[key] = []
      grouped[key].push(order)
    })
    return grouped
  })

  function resolveStatusValue(status: string): string {
    const matched = statusOptions.value.find(option => statusValuesMatch(option.value, status))
    return matched?.value || status
  }

  function getOrderById(identifier: string) {
    return orders.value.find(order => order.apiId === identifier || order.id === identifier)
  }

  function getSaleDetailById(identifier: string): SaleDetail | null {
    const order = getOrderById(identifier)
    if (!order) return saleDetails.value[identifier] || null

    return (
      saleDetails.value[order.apiId] ||
      saleDetails.value[order.id] ||
      null
    )
  }

  function storeSaleDetail(detail: SaleDetail): void {
    const id = String(detail.id)
    saleDetails.value[id] = detail
    if (detail.order_number) {
      saleDetails.value[String(detail.order_number)] = detail
    }
  }

  function upsertOrderFromSale(sale: Partial<SaleDetail & SaleList>): AdminOrder {
    const normalized = normalizeSaleOrder(sale)
    const existingIndex = orders.value.findIndex(order => order.apiId === normalized.apiId || order.id === normalized.id)

    if (existingIndex >= 0) {
      orders.value.splice(existingIndex, 1, normalized)
    } else {
      orders.value.unshift(normalized)
    }

    return normalized
  }

  function isPendingStatus(status: string): boolean {
    return (
      statusValuesMatch(status, defaultStatus.value) ||
      statusValuesMatch(status, 'PENDING') ||
      statusValuesMatch(status, 'DRAFT')
    )
  }

  function canDeleteOrder(identifier: string): boolean {
    const order = getOrderById(identifier)
    if (!order) return false
    if (order.isLocalOnly) return isPendingStatus(order.status)
    return isPendingStatus(order.status)
  }

  function getStatusLabel(status: string): string {
    return statusOptions.value.find(option => statusValuesMatch(option.value, status))?.label || humanizeStatusLabel(status)
  }

  function getAvailableStatuses(currentStatus?: string): SaleStatusOption[] {
    if (!currentStatus) return statusOptions.value

    const normalizedCurrentStatus = normalizeStatusValue(currentStatus)
    if (Object.keys(statusTransitions.value).length === 0) {
      return statusOptions.value
    }

    const nextStatuses = statusTransitions.value[normalizedCurrentStatus]
    if (!nextStatuses) {
      return [buildStatusOption(resolveStatusValue(currentStatus), getStatusLabel(currentStatus))]
    }

    const allowedValues = Array.from(new Set([normalizedCurrentStatus, ...nextStatuses]))
    return allowedValues.map(status => {
      const matched = statusOptions.value.find(option => statusValuesMatch(option.value, status))
      return matched || buildStatusOption(status)
    })
  }

  function canTransition(fromStatus: string, toStatus: string): boolean {
    if (statusValuesMatch(fromStatus, toStatus)) return true
    if (Object.keys(statusTransitions.value).length === 0) return true

    const allowed = statusTransitions.value[normalizeStatusValue(fromStatus)]
    if (!allowed) return false

    return allowed.some(status => statusValuesMatch(status, toStatus))
  }

  function getTransitionLabels(status: string): string[] {
    const allowed = statusTransitions.value[normalizeStatusValue(status)] || []
    return allowed.map(nextStatus => getStatusLabel(nextStatus))
  }

  async function fetchStatusMetadata(force = false): Promise<void> {
    if (statusMetadataLoaded.value && !force) return

    statusLoading.value = true

    try {
      const response = await salesApi.getStatuses()
      const nextOptions = Array.isArray(response.statuses) && response.statuses.length > 0
        ? response.statuses.map(status => buildStatusOption(status.value, status.label))
        : fallbackStatuses.statuses

      configuredStatusOptions.value = nextOptions
      defaultStatus.value = response.default || nextOptions[0]?.value || fallbackStatuses.default
      statusTransitions.value = normalizeTransitions(response.transitions)
      statusMetadataLoaded.value = true
    } catch {
      configuredStatusOptions.value = fallbackStatuses.statuses
      defaultStatus.value = fallbackStatuses.default
      statusTransitions.value = normalizeTransitions(fallbackStatuses.transitions)
      statusMetadataLoaded.value = true
    } finally {
      statusLoading.value = false
    }
  }

  async function fetchOrders(): Promise<void> {
    loading.value = true
    error.value = null

    try {
      await fetchStatusMetadata()
      const response = await salesApi.list({ page: 1, page_size: 100, ordering: '-sale_date' })
      orders.value = response.results.map(normalizeSaleOrder)
    } catch (err) {
      const apiError = err as ApiError
      error.value = apiError.message || 'Failed to fetch sales orders'
    } finally {
      loading.value = false
    }
  }

  async function fetchOrderById(identifier: string): Promise<AdminOrder | null> {
    const existing = getOrderById(identifier)
    if (existing?.isLocalOnly) return existing

    if (existing && getSaleDetailById(identifier)) {
      return existing
    }

    loading.value = true
    error.value = null

    try {
      await fetchStatusMetadata()
      const detail = await salesApi.getById(identifier)
      storeSaleDetail(detail)
      return upsertOrderFromSale(detail)
    } catch (err) {
      const apiError = err as ApiError
      error.value = apiError.message || 'Failed to fetch sale details'
      return null
    } finally {
      loading.value = false
    }
  }

  async function updateOrderStatus(identifier: string, status: string): Promise<boolean> {
    const order = getOrderById(identifier)
    if (!order) return false

    const nextStatus = resolveStatusValue(status)
    if (!canTransition(order.status, nextStatus)) {
      error.value = `Transition from ${getStatusLabel(order.status)} to ${getStatusLabel(nextStatus)} is not allowed.`
      return false
    }

    const previousStatus = order.status
    const previousUpdatedAt = order.updatedAt

    order.status = nextStatus
    order.updatedAt = new Date().toISOString()
    error.value = null

    if (order.isLocalOnly) {
      return true
    }

    try {
      const isConfirmStatus =
        statusValuesMatch(nextStatus, 'CONFIRMED') ||
        statusValuesMatch(nextStatus, 'PROCESSING')
      const isCancelStatus =
        statusValuesMatch(nextStatus, 'CANCELLED') ||
        statusValuesMatch(nextStatus, 'RETURNED')

      if (isConfirmStatus && !order.accountId) {
        throw { message: 'Select an asset account before confirming the sale.' } satisfies Partial<ApiError>
      }

      if (isConfirmStatus || isCancelStatus) {
        const detail = getSaleDetailById(identifier) || await salesApi.getById(order.apiId)
        storeSaleDetail(detail)

        const customerId = typeof detail.customer === 'number' ? detail.customer : detail.customer?.id
        const validItems = detail.items
          .filter(item => typeof item.product_variant?.id === 'number' && item.product_variant.id > 0)
          .map(item => ({
            product_variant_id: item.product_variant!.id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            line_total: item.line_total
          }))

        if (!customerId || validItems.length === 0) {
          throw { message: 'Unable to build the sale payload needed for this status change.' } satisfies Partial<ApiError>
        }

        const payload: SaleDetailRequest = {
          customer: customerId,
          account_id: order.accountId || detail.account_id || null,
          items: validItems,
          sale_date: detail.sale_date,
          channel: detail.channel,
          invoice_number: detail.invoice_number,
          status: nextStatus as SaleStatus,
          subtotal_amount: detail.subtotal_amount,
          discount_amount: detail.discount_amount,
          tax_amount: detail.tax_amount,
          total_amount: detail.total_amount,
          notes: detail.notes || null
        }

        const response = isConfirmStatus
          ? await salesApi.confirm(order.apiId, payload)
          : await salesApi.cancel(order.apiId, payload)

        storeSaleDetail(response)
        upsertOrderFromSale(response)
        return true
      }

      const payload: SaleUpdateRequest = {
        status: nextStatus as SaleStatus,
        account_id: order.accountId
      }
      const response = await salesApi.update(order.apiId, payload)
      storeSaleDetail(response)
      upsertOrderFromSale(response)
      return true
    } catch (err) {
      const apiError = err as ApiError
      order.status = previousStatus
      order.updatedAt = previousUpdatedAt
      error.value = formatApiErrorMessage(apiError, 'Failed to update sale status')
      return false
    }
  }

  async function confirmOrder(identifier: string): Promise<boolean> {
    const nextStatus = statusOptions.value.find(option =>
      statusValuesMatch(option.value, 'PROCESSING') || statusValuesMatch(option.value, 'CONFIRMED')
    )

    if (!nextStatus) return false
    return updateOrderStatus(identifier, nextStatus.value)
  }

  async function cancelOrder(identifier: string): Promise<boolean> {
    const nextStatus = statusOptions.value.find(option => statusValuesMatch(option.value, 'CANCELLED'))
    if (!nextStatus) return false
    return updateOrderStatus(identifier, nextStatus.value)
  }

  function filterOrders(filters: OrderFilters) {
    let result = [...orders.value]
    if (filters.status) {
      result = result.filter(order => statusValuesMatch(order.status, filters.status))
    }
    if (filters.channel) {
      result = result.filter(order => order.channel === filters.channel)
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

  async function addOrder(data: NewOrder): Promise<AdminOrder | null> {
    const orderNum = orders.value.length + 1
    const year = new Date().getFullYear()
    const subtotal = data.subtotal ?? data.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const tax = data.tax ?? subtotal * 0.05
    const shipping = data.shipping ?? 0
    const total = data.total ?? (subtotal + tax + shipping)
    const initialStatus = resolveStatusValue(defaultStatus.value)

    const fallbackOrder: AdminOrder = {
      id: `ORD-${year}-${String(orderNum).padStart(3, '0')}`,
      apiId: `ORD-${year}-${String(orderNum).padStart(3, '0')}`,
      invoiceNumber: null,
      saleDate: toApiDate(),
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
      status: initialStatus,
      accountId: data.accountId,
      account: null,
      accountingTransaction: null,
      returnTransaction: null,
      notes: data.notes || null,
      channel: data.channel,
      paymentMethod: data.paymentMethod || 'Credit Card',
      shippingAddress: data.shippingAddress,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isLocalOnly: true
    }

    const customerId = await resolveCustomerId(data)
    const saleItems = mapCreateItems(data)
    const hasValidCustomer = typeof customerId === 'number' && customerId > 0
    const hasItems = saleItems.length === data.items.length && data.items.length > 0
    const hasAccount = Number.isFinite(data.accountId) && data.accountId > 0
    if (!hasValidCustomer || !hasItems) {
      error.value = 'Order saved locally because customer or product variant mapping is incomplete.'
      orders.value.unshift(fallbackOrder)
      return fallbackOrder
    }
    if (!hasAccount) {
      error.value = 'Select an asset account before creating the sale.'
      return null
    }

    try {
      const created = await salesApi.create(
        buildCreatePayload({ ...data, customerId, subtotal, tax, shipping, total }, customerId, saleItems)
      )
      storeSaleDetail(created)
      return upsertOrderFromSale(created)
    } catch (err) {
      const apiError = err as ApiError
      error.value = formatApiErrorMessage(apiError, 'Failed to create sale order in API')
      return null
    }
  }

  async function updateOrderDetails(identifier: string, payload: SaleUpdateRequest): Promise<boolean> {
    const order = getOrderById(identifier)
    if (!order) return false

    error.value = null

    if (order.isLocalOnly) {
      if (payload.account_id !== undefined) {
        order.accountId = payload.account_id
      }
      if (payload.notes !== undefined) {
        order.notes = payload.notes || null
      }
      return true
    }

    try {
      const response = await salesApi.update(order.apiId, payload)
      storeSaleDetail(response)
      upsertOrderFromSale(response)
      return true
    } catch (err) {
      const apiError = err as ApiError
      error.value = formatApiErrorMessage(apiError, 'Failed to update sale')
      return false
    }
  }

  async function deleteOrder(identifier: string): Promise<boolean> {
    const index = orders.value.findIndex(order => order.apiId === identifier || order.id === identifier)
    if (index < 0) return false

    if (!canDeleteOrder(identifier)) {
      error.value = 'Only pending orders can be deleted.'
      return false
    }

    const [removed] = orders.value.splice(index, 1)

    if (removed.isLocalOnly) {
      return true
    }

    try {
      await salesApi.delete(removed.apiId)
      return true
    } catch (err) {
      orders.value.splice(index, 0, removed)
      const apiError = err as ApiError
      error.value = apiError.message || 'Failed to delete sale order'
      return false
    }
  }

  function clearError(): void {
    error.value = null
  }

  return {
    orders,
    saleDetails,
    loading,
    error,
    statusLoading,
    statusOptions,
    apiStatusOptions,
    defaultStatus,
    statusTransitions,
    totalOrders,
    totalRevenue,
    pendingOrders,
    processingOrders,
    ordersByStatus,
    fetchStatusMetadata,
    fetchOrders,
    fetchOrderById,
    getOrderById,
    getSaleDetailById,
    isPendingStatus,
    canDeleteOrder,
    getStatusLabel,
    getAvailableStatuses,
    getTransitionLabels,
    canTransition,
    updateOrderStatus,
    updateOrderDetails,
    confirmOrder,
    cancelOrder,
    filterOrders,
    addOrder,
    deleteOrder,
    clearError,
    statusValuesMatch
  }
})
