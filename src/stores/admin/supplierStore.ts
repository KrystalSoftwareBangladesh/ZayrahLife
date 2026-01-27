import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { mockSuppliers, mockPurchaseOrders } from '@/mock/admin/suppliers'
import { useInventoryStore } from '@/stores/admin/inventoryStore'

interface NewSupplier {
  name: string
  email?: string
  phone?: string
  address?: string
  contactPerson?: string
  category?: string
  paymentTerms?: string
  notes?: string
}

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
  const suppliers = ref([...mockSuppliers])
  const purchaseOrders = ref([...mockPurchaseOrders])
  const loading = ref(false)

  const activeSuppliers = computed(() => suppliers.value.filter(s => s.status === 'active'))
  const totalSuppliers = computed(() => suppliers.value.length)
  const totalPurchaseValue = computed(() => purchaseOrders.value.reduce((sum, po) => sum + po.total, 0))
  
  const pendingPurchaseOrders = computed(() => 
    purchaseOrders.value.filter(po => po.status === 'pending' || po.status === 'ordered')
  )

  const unpaidPurchaseOrders = computed(() =>
    purchaseOrders.value.filter(po => po.paymentStatus === 'unpaid' || po.paymentStatus === 'partial')
  )

  function getSupplierById(id: number) {
    return suppliers.value.find(s => s.id === id)
  }

  function addSupplier(data: NewSupplier) {
    const newId = Math.max(...suppliers.value.map(s => s.id)) + 1
    const today = new Date().toISOString().split('T')[0]
    const newSupplier = {
      id: newId,
      name: data.name,
      email: data.email || '',
      phone: data.phone || '',
      address: data.address || '',
      contactPerson: data.contactPerson || '',
      category: data.category || 'General',
      status: 'active',
      totalOrders: 0,
      totalSpent: 0,
      lastOrderDate: today,
      paymentTerms: data.paymentTerms || 'COD',
      notes: data.notes || ''
    }
    suppliers.value.unshift(newSupplier)
    return newSupplier
  }

  function updateSupplierNotes(id: number, notes: string) {
    const supplier = suppliers.value.find(s => s.id === id)
    if (supplier) {
      supplier.notes = notes
    }
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
    
    const supplier = suppliers.value.find(s => s.id === data.supplierId)
    if (supplier) {
      supplier.totalOrders++
      supplier.totalSpent += data.total
      supplier.lastOrderDate = today
    }
    
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
    purchaseOrders,
    loading,
    activeSuppliers,
    totalSuppliers,
    totalPurchaseValue,
    pendingPurchaseOrders,
    unpaidPurchaseOrders,
    getSupplierById,
    addSupplier,
    updateSupplierNotes,
    addPurchaseOrder,
    updatePurchaseOrderStatus,
    updatePaymentStatus
  }
})
