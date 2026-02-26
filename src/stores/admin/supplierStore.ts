import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { suppliersApi } from '@/api/suppliers'
import type {
  ApiError,
  SupplierCreateRequest,
  SupplierDetail,
  SupplierList,
  SupplierListParams,
  SupplierPaymentType,
  SupplierUpdateRequest
} from '@/api/types'
import { mockPurchaseOrders } from '@/mock/admin/suppliers'
import { useInventoryStore } from '@/stores/admin/inventoryStore'

interface PurchaseOrderItem {
  productId: number
  productName: string
  variantId: number
  variantLabel: string
  sku: string
  quantity: number
  unitCost: number
  total: number
}

interface NewPurchaseOrder {
  supplierId: number
  supplierName: string
  items: PurchaseOrderItem[]
  subtotal: number
  tax: number
  shipping: number
  total: number
  expectedDate: string
  notes?: string
}

export const useSupplierStore = defineStore('adminSuppliers', () => {
  const suppliers = ref<SupplierList[]>([])
  const currentSupplier = ref<SupplierDetail | null>(null)
  const purchaseOrders = ref([...mockPurchaseOrders])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const pagination = ref({
    count: 0,
    page: 1,
    pageSize: 20,
    hasNext: false,
    hasPrevious: false
  })

  const activeSuppliers = computed(() => suppliers.value)
  const totalSuppliers = computed(() => pagination.value.count)
  const totalPurchaseValue = computed(() => purchaseOrders.value.reduce((sum, po) => sum + po.total, 0))
  const codSuppliers = computed(() => suppliers.value.filter(supplier => supplier.payment_type === 'COD').length)
  const creditSuppliers = computed(() => suppliers.value.filter(supplier => supplier.payment_type === 'CREDIT').length)
  const prepaidSuppliers = computed(() => suppliers.value.filter(supplier => supplier.payment_type === 'PREPAID').length)

  const pendingPurchaseOrders = computed(() =>
    purchaseOrders.value.filter(po => po.status === 'pending' || po.status === 'ordered')
  )

  const unpaidPurchaseOrders = computed(() =>
    purchaseOrders.value.filter(po => po.paymentStatus === 'unpaid' || po.paymentStatus === 'partial')
  )

  async function fetchSuppliers(params: SupplierListParams = {}): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const response = await suppliersApi.list({
        page: params.page || pagination.value.page,
        page_size: params.page_size || pagination.value.pageSize,
        ...params
      })

      suppliers.value = response.results
      pagination.value = {
        count: response.count,
        page: params.page || pagination.value.page,
        pageSize: params.page_size || pagination.value.pageSize,
        hasNext: !!response.next,
        hasPrevious: !!response.previous
      }
    } catch (err) {
      const apiError = err as ApiError
      error.value = apiError.message || 'Failed to fetch suppliers'
      suppliers.value = []
    } finally {
      loading.value = false
    }
  }

  async function getSupplierById(id: number): Promise<SupplierDetail | null> {
    loading.value = true
    error.value = null

    try {
      const supplier = await suppliersApi.getById(id)
      currentSupplier.value = supplier
      return supplier
    } catch (err) {
      const apiError = err as ApiError
      error.value = apiError.message || 'Failed to fetch supplier'
      return null
    } finally {
      loading.value = false
    }
  }

  async function createSupplier(data: SupplierCreateRequest): Promise<boolean> {
    loading.value = true
    error.value = null

    try {
      await suppliersApi.create(data)
      await fetchSuppliers({ page: 1 })
      return true
    } catch (err) {
      const apiError = err as ApiError
      error.value = apiError.message || 'Failed to create supplier'
      return false
    } finally {
      loading.value = false
    }
  }

  async function updateSupplier(id: number, data: SupplierUpdateRequest): Promise<boolean> {
    loading.value = true
    error.value = null

    try {
      await suppliersApi.update(id, data)
      await fetchSuppliers()
      return true
    } catch (err) {
      const apiError = err as ApiError
      error.value = apiError.message || 'Failed to update supplier'
      return false
    } finally {
      loading.value = false
    }
  }

  async function deleteSupplier(id: number): Promise<boolean> {
    loading.value = true
    error.value = null

    try {
      await suppliersApi.delete(id)
      await fetchSuppliers()
      return true
    } catch (err) {
      const apiError = err as ApiError
      error.value = apiError.message || 'Failed to delete supplier'
      return false
    } finally {
      loading.value = false
    }
  }

  async function updateSupplierNotes(id: number, notes: string): Promise<boolean> {
    return updateSupplier(id, { notes })
  }

  function setPage(page: number): void {
    pagination.value.page = page
    fetchSuppliers({ page })
  }

  function setPaymentTypeFilter(paymentType: SupplierPaymentType | ''): void {
    fetchSuppliers({ payment_type: paymentType || undefined, page: 1 })
  }

  function clearError(): void {
    error.value = null
  }

  function addPurchaseOrder(data: NewPurchaseOrder) {
    const orderNum = purchaseOrders.value.length + 1
    const year = new Date().getFullYear()
    const today = new Date().toISOString().split('T')[0]

    const newPO = {
      id: `PO-${year}-${String(orderNum).padStart(3, '0')}`,
      supplierId: data.supplierId,
      supplierName: data.supplierName,
      items: data.items,
      subtotal: data.subtotal,
      tax: data.tax,
      shipping: data.shipping,
      total: data.total,
      status: 'pending',
      paymentStatus: 'unpaid',
      orderDate: today,
      expectedDate: data.expectedDate,
      receivedDate: null,
      notes: data.notes || ''
    }
    purchaseOrders.value.unshift(newPO)

    return newPO
  }

  function updatePurchaseOrderStatus(id: string, status: string) {
    const po = purchaseOrders.value.find(p => p.id === id)
    if (po) {
      const previousStatus = po.status
      po.status = status
      if (status === 'received' && previousStatus !== 'received') {
        po.receivedDate = new Date().toISOString().split('T')[0]
        const inventoryStore = useInventoryStore()
        po.items.forEach(item => {
          if (item.variantId && item.productId) {
            inventoryStore.adjustStock(item.productId, item.variantId, item.quantity)
          }
        })
      }
    }
  }

  function updatePaymentStatus(id: string, paymentStatus: string) {
    const po = purchaseOrders.value.find(p => p.id === id)
    if (po) {
      po.paymentStatus = paymentStatus
    }
  }

  return {
    suppliers,
    currentSupplier,
    purchaseOrders,
    loading,
    error,
    pagination,
    activeSuppliers,
    totalSuppliers,
    totalPurchaseValue,
    codSuppliers,
    creditSuppliers,
    prepaidSuppliers,
    pendingPurchaseOrders,
    unpaidPurchaseOrders,
    fetchSuppliers,
    getSupplierById,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    updateSupplierNotes,
    setPage,
    setPaymentTypeFilter,
    clearError,
    addPurchaseOrder,
    updatePurchaseOrderStatus,
    updatePaymentStatus
  }
})
