<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import FormInput from '@/components/admin/FormInput.vue'
import FormModal from '@/components/admin/FormModal.vue'
import { salesApi } from '@/api/sales'
import { useOrderStore } from '@/stores/admin/orderStore'
import { useCustomerStore } from '@/stores/admin/customerStore'
import { useInventoryStore } from '@/stores/admin/inventoryStore'

interface CartItem {
  productId: number
  productName: string
  variant: string
  variantId: number
  price: number
  quantity: number
  sku: string
}

const router = useRouter()
const orderStore = useOrderStore()
const customerStore = useCustomerStore()
const inventoryStore = useInventoryStore()

const activeTab = ref<'pos' | 'orders'>('pos')
const searchQuery = ref('')
const categoryFilter = ref('')
const statusFilter = ref('')
const channelFilter = ref('')
const orderSearchQuery = ref('')

const defaultChannelOptions = [
  { value: 'Walk-in', label: 'Walk-in', icon: '🏪' },
  { value: 'Facebook', label: 'Facebook', icon: '📘' },
  { value: 'Phone', label: 'Phone', icon: '📞' },
  { value: 'Website', label: 'Website', icon: '🌐' },
  { value: 'Instagram', label: 'Instagram', icon: '📷' },
  { value: 'WhatsApp', label: 'WhatsApp', icon: '💬' }
]

const selectedChannel = ref('Walk-in')
const channelOptions = ref(defaultChannelOptions)
const selectedCustomerId = ref<number>(0)
const selectedPaymentMethod = ref('CASH')
const cart = ref<CartItem[]>([])
const orderNotes = ref('')
const shippingAddress = ref('')

const showCustomerModal = ref(false)
const showCheckoutModal = ref(false)
const newCustomer = ref({ first_name: '', email: '', phone: '' })

const categories = computed(() => {
  const cats = new Set(inventoryStore.inventory.map(p => p.category))
  return ['All', ...Array.from(cats)]
})

interface VariantCatalogItem {
  productId: number
  productName: string
  category: string
  price: number
  variantId: number
  sku: string
  color: string
  size: string
  stock: number
}

const variantCatalog = computed<VariantCatalogItem[]>(() => {
  return inventoryStore.inventory.flatMap(product =>
    product.variants.map(variant => ({
      productId: product.productId,
      productName: product.productName,
      category: product.category,
      price: product.price,
      variantId: variant.id,
      sku: variant.sku,
      color: variant.color,
      size: variant.size,
      stock: variant.stock
    }))
  )
})

const filteredVariants = computed(() => {
  let result = variantCatalog.value
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(item =>
      item.productName.toLowerCase().includes(query) ||
      item.sku.toLowerCase().includes(query) ||
      item.color.toLowerCase().includes(query) ||
      item.size.toLowerCase().includes(query)
    )
  }
  if (categoryFilter.value && categoryFilter.value !== 'All') {
    result = result.filter(item => item.category === categoryFilter.value)
  }
  return result
})

const paymentMethods = [
  { value: 'CASH', label: 'Cash', icon: '💵' },
  { value: 'CARD', label: 'Card', icon: '💳' },
  { value: 'BKASH', label: 'bKash', icon: '📱' },
  { value: 'NAGAD', label: 'Nagad', icon: '📱' },
  { value: 'BANK', label: 'Bank Transfer', icon: '🏦' }
]

const customerOptions = computed(() => {
  return [
    { value: 0, label: 'Walk-in Customer' },
    ...customerStore.customers.map(c => ({
      value: c.id,
      label: `${c.full_name} (${c.phone || c.email})`
    }))
  ]
})

const selectedCustomer = computed(() => {
  if (selectedCustomerId.value === 0) return null
  return customerStore.customers.find(c => c.id === selectedCustomerId.value)
})

const cartSubtotal = computed(() => {
  return cart.value.reduce((sum, item) => sum + (item.price * item.quantity), 0)
})

const cartTax = computed(() => cartSubtotal.value * 0.05)
const cartTotal = computed(() => cartSubtotal.value + cartTax.value)
const cartItemCount = computed(() => cart.value.reduce((sum, item) => sum + item.quantity, 0))

const addVariantToCart = (item: VariantCatalogItem) => {
  if (item.stock <= 0) return
  
  const existingIndex = cart.value.findIndex(
    cartItem => cartItem.productId === item.productId && cartItem.variantId === item.variantId
  )
  
  if (existingIndex >= 0) {
    cart.value[existingIndex].quantity++
  } else {
    cart.value.push({
      productId: item.productId,
      productName: item.productName,
      variant: `${item.color} / ${item.size}`,
      variantId: item.variantId,
      price: item.price,
      quantity: 1,
      sku: item.sku
    })
  }
}

const updateQuantity = (index: number, delta: number) => {
  const newQty = cart.value[index].quantity + delta
  if (newQty <= 0) {
    cart.value.splice(index, 1)
  } else {
    cart.value[index].quantity = newQty
  }
}

const removeFromCart = (index: number) => {
  cart.value.splice(index, 1)
}

const clearCart = () => {
  cart.value = []
  orderNotes.value = ''
  shippingAddress.value = ''
  selectedCustomerId.value = 0
}

const openCheckout = () => {
  if (cart.value.length === 0) return
  if (selectedCustomer.value) {
    shippingAddress.value = ''
  }
  showCheckoutModal.value = true
}

const completeOrder = async () => {
  if (cart.value.length === 0) return
  
  const customer = selectedCustomer.value
  const orderData = {
    customerId: selectedCustomerId.value || 0,
    customerName: customer?.full_name || 'Walk-in Customer',
    customerEmail: customer?.email || '',
    channel: selectedChannel.value,
    shippingAddress: shippingAddress.value,
    paymentMethod: selectedPaymentMethod.value,
    notes: orderNotes.value,
    subtotal: cartSubtotal.value,
    tax: cartTax.value,
    shipping: 0,
    total: cartTotal.value,
    items: cart.value.map(item => ({
      productId: item.productId,
      variantId: item.variantId,
      productName: item.productName,
      quantity: item.quantity,
      price: item.price,
      variant: item.variant
    }))
  }
  
  await orderStore.addOrder(orderData)
  showCheckoutModal.value = false
  clearCart()
}

const handleAddCustomer = async () => {
  if (!newCustomer.value.first_name) return
  const customer = await customerStore.createCustomer(newCustomer.value)
  if (customer) {
    selectedCustomerId.value = customer.id
  }
  showCustomerModal.value = false
  newCustomer.value = { first_name: '', email: '', phone: '' }
}

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' }
]

const orderChannelFilterOptions = computed(() => [
  { value: '', label: 'All Channels' },
  ...channelOptions.value.map(c => ({ value: c.value, label: c.label }))
])

const filteredOrders = computed(() => {
  let result = orderStore.orders
  if (orderSearchQuery.value) {
    const query = orderSearchQuery.value.toLowerCase()
    result = result.filter(o =>
      o.id.toLowerCase().includes(query) ||
      (o.invoiceNumber || '').toLowerCase().includes(query) ||
      o.customerName.toLowerCase().includes(query)
    )
  }
  if (statusFilter.value) {
    result = result.filter(o => o.status === statusFilter.value)
  }
  if (channelFilter.value) {
    const selected = channelFilter.value.toLowerCase()
    result = result.filter(o => (o.channel || '').toLowerCase() === selected)
  }
  return result
})

const handleRowClick = (orderId: string) => {
  router.push({ name: 'admin-order-detail', params: { id: orderId } })
}

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    shipped: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800'
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

const getChannelColor = (channel: string) => {
  const normalized = channel.toLowerCase().replace(/[_\s-]/g, '')
  const colors: Record<string, string> = {
    facebook: 'bg-blue-100 text-blue-700',
    instagram: 'bg-pink-100 text-pink-700',
    whatsapp: 'bg-green-100 text-green-700',
    website: 'bg-gray-100 text-gray-700',
    walkin: 'bg-amber-100 text-amber-700',
    phone: 'bg-indigo-100 text-indigo-700'
  }
  return colors[normalized] || 'bg-gray-100 text-gray-700'
}

const loadSalesChannels = async () => {
  try {
    const response = await salesApi.getChannels()
    const iconMap: Record<string, string> = {
      'walk-in': '🏪',
      walkin: '🏪',
      facebook: '📘',
      phone: '📞',
      website: '🌐',
      instagram: '📷',
      whatsapp: '💬'
    }

    if (Array.isArray(response.channels) && response.channels.length > 0) {
      channelOptions.value = response.channels.map(channel => ({
        value: channel.value,
        label: channel.label,
        icon: iconMap[channel.value.toLowerCase().replace(/[_\s-]/g, '')] || '🧾'
      }))
    }

    const defaultValue = response.default
    if (defaultValue && channelOptions.value.some(channel => channel.value === defaultValue)) {
      selectedChannel.value = defaultValue
    } else if (channelOptions.value.length > 0) {
      selectedChannel.value = channelOptions.value[0].value
    }
  } catch {
    channelOptions.value = defaultChannelOptions
    selectedChannel.value = defaultChannelOptions[0].value
  }
}

onMounted(() => {
  void inventoryStore.fetchInventory()
  void customerStore.fetchCustomers({ page: 1, page_size: 100 })
  void orderStore.fetchOrders()
  void loadSalesChannels()
})
</script>

<template>
  <div class="h-full flex flex-col">
    <div class="flex items-center justify-between mb-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Billing / POS</h1>
        <p class="text-gray-500 text-sm">Create orders from any sales channel</p>
      </div>
      <div class="flex bg-gray-100 rounded-lg p-1">
        <button
          @click="activeTab = 'pos'"
          :class="[
            'px-4 py-2 text-sm font-medium rounded-md transition-all',
            activeTab === 'pos' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          ]"
        >
          New Sale
        </button>
        <button
          @click="activeTab = 'orders'"
          :class="[
            'px-4 py-2 text-sm font-medium rounded-md transition-all',
            activeTab === 'orders' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          ]"
        >
          Order History
        </button>
      </div>
    </div>

    <div v-if="activeTab === 'pos'" class="flex-1 flex gap-4 min-h-0">
      <div class="flex-1 flex flex-col min-w-0">
        <div class="flex gap-2 mb-3">
          <div class="flex-1">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search product/variant..."
              class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div class="flex gap-1 overflow-x-auto pb-1">
            <button
              v-for="cat in categories"
              :key="cat"
              @click="categoryFilter = cat === 'All' ? '' : cat"
              :class="[
                'px-3 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-all',
                (categoryFilter === cat || (cat === 'All' && !categoryFilter))
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              ]"
            >
              {{ cat }}
            </button>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto">
          <div class="mb-2 text-xs text-gray-500">{{ filteredVariants.length }} variants</div>
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2">
            <div
              v-for="item in filteredVariants"
              :key="item.variantId"
              class="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md hover:border-primary-300 transition-all cursor-pointer group"
            >
              <div class="aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center relative">
                <span class="text-3xl">📦</span>
                <div class="absolute top-1.5 right-1.5 bg-white/90 backdrop-blur px-1.5 py-0.5 rounded-full text-[10px] font-medium text-gray-600">
                  Stock: {{ item.stock }}
                </div>
              </div>
              <div class="p-2">
                <h3 class="font-medium text-gray-900 text-xs mb-0.5 truncate">{{ item.productName }}</h3>
                <p class="text-[11px] text-gray-500 truncate">SKU: {{ item.sku }}</p>
                <p class="text-[11px] text-gray-500 truncate">{{ item.color }} / {{ item.size }}</p>
                <div class="flex items-center justify-between">
                  <span class="text-sm font-bold text-primary-600">৳{{ item.price.toFixed(2) }}</span>
                  <span class="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{{ item.category }}</span>
                </div>
                <button
                  @click="addVariantToCart(item)"
                  :disabled="item.stock <= 0"
                  class="mt-1.5 w-full py-1.5 text-xs font-medium rounded-md bg-primary-600 text-white hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
            <div
              v-if="filteredVariants.length === 0"
              class="col-span-full bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500"
            >
              No variants found for current filters.
            </div>
          </div>
        </div>
      </div>

      <div class="w-80 xl:w-96 flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm">
        <div class="p-4 border-b border-gray-200">
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-lg font-bold text-gray-900">Current Sale</h2>
            <span class="bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full text-sm font-medium">
              {{ cartItemCount }} items
            </span>
          </div>
          
          <div class="grid grid-cols-3 gap-2 mb-3">
            <button
              v-for="channel in channelOptions.slice(0, 6)"
              :key="channel.value"
              @click="selectedChannel = channel.value"
              :class="[
                'p-2 text-xs rounded-lg border transition-all flex flex-col items-center gap-1',
                selectedChannel === channel.value
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-600'
              ]"
            >
              <span class="text-lg">{{ channel.icon }}</span>
              <span class="font-medium">{{ channel.label }}</span>
            </button>
          </div>

          <div class="flex gap-2">
            <select
              v-model="selectedCustomerId"
              class="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option v-for="opt in customerOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
            <button
              @click="showCustomerModal = true"
              class="px-3 py-2 border border-primary-500 text-primary-600 rounded-lg hover:bg-primary-50 transition-colors"
              title="Add new customer"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </button>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto p-4 min-h-0">
          <div v-if="cart.length === 0" class="h-full flex flex-col items-center justify-center text-gray-400">
            <svg class="w-16 h-16 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p class="font-medium">Cart is empty</p>
            <p class="text-sm">Add products to start a sale</p>
          </div>
          
          <div v-else class="space-y-3">
            <div
              v-for="(item, index) in cart"
              :key="`${item.productId}-${item.variantId}`"
              class="bg-gray-50 rounded-lg p-3"
            >
              <div class="flex items-start justify-between mb-2">
                <div class="flex-1 min-w-0">
                  <h4 class="font-medium text-gray-900 text-sm truncate">{{ item.productName }}</h4>
                  <p class="text-xs text-gray-500">{{ item.variant }} | {{ item.sku }}</p>
                </div>
                <button
                  @click="removeFromCart(index)"
                  class="text-gray-400 hover:text-red-500 ml-2"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <button
                    @click="updateQuantity(index, -1)"
                    class="w-7 h-7 rounded-lg bg-white border border-gray-300 flex items-center justify-center hover:bg-gray-100 text-gray-600"
                  >
                    -
                  </button>
                  <span class="w-8 text-center font-medium">{{ item.quantity }}</span>
                  <button
                    @click="updateQuantity(index, 1)"
                    class="w-7 h-7 rounded-lg bg-white border border-gray-300 flex items-center justify-center hover:bg-gray-100 text-gray-600"
                  >
                    +
                  </button>
                </div>
                <span class="font-bold text-gray-900">৳{{ (item.price * item.quantity).toFixed(2) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="p-4 border-t border-gray-200 bg-gray-50">
          <div class="space-y-2 mb-4">
            <div class="flex justify-between text-sm">
              <span class="text-gray-600">Subtotal</span>
              <span class="font-medium">৳{{ cartSubtotal.toFixed(2) }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-600">Tax (5%)</span>
              <span class="font-medium">৳{{ cartTax.toFixed(2) }}</span>
            </div>
            <div class="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
              <span>Total</span>
              <span class="text-primary-600">৳{{ cartTotal.toFixed(2) }}</span>
            </div>
          </div>
          
          <div class="flex gap-2">
            <button
              @click="clearCart"
              :disabled="cart.length === 0"
              class="flex-1 py-3 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Clear
            </button>
            <button
              @click="openCheckout"
              :disabled="cart.length === 0"
              class="flex-[2] py-3 text-sm font-medium rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Checkout
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="flex-1 flex flex-col min-h-0">
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
        <div class="flex flex-wrap items-center gap-4">
          <div class="flex-1 min-w-64">
            <input
              v-model="orderSearchQuery"
              type="text"
              placeholder="Search orders..."
              class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div class="w-40">
            <select
              v-model="statusFilter"
              class="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </div>
          <div class="w-40">
            <select
              v-model="channelFilter"
              class="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option v-for="opt in orderChannelFilterOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </div>
          <div class="text-sm text-gray-500">
            {{ filteredOrders.length }} orders
          </div>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto">
        <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table class="w-full">
            <thead class="bg-gray-50 border-b border-gray-200">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Channel</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr
                v-for="order in filteredOrders"
                :key="order.id"
                @click="handleRowClick(order.id)"
                class="hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <td class="px-4 py-3">
                  <span class="font-mono font-medium text-primary-600">{{ order.id }}</span>
                </td>
                <td class="px-4 py-3 text-sm text-gray-700">
                  <span class="font-mono">{{ order.invoiceNumber || '-' }}</span>
                </td>
                <td class="px-4 py-3 text-sm text-gray-900">{{ order.customerName }}</td>
                <td class="px-4 py-3 text-sm text-gray-600">{{ order.items.length }}</td>
                <td class="px-4 py-3">
                  <span class="font-medium">৳{{ order.total.toFixed(2) }}</span>
                </td>
                <td class="px-4 py-3">
                  <span :class="[getChannelColor(order.channel), 'px-2 py-1 text-xs font-medium rounded']">
                    {{ order.channel }}
                  </span>
                </td>
                <td class="px-4 py-3">
                  <span :class="[getStatusColor(order.status), 'px-2 py-1 text-xs font-medium rounded capitalize']">
                    {{ order.status }}
                  </span>
                </td>
                <td class="px-4 py-3 text-sm text-gray-600">
                  {{ new Date(order.createdAt).toLocaleDateString() }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <FormModal
      :show="showCustomerModal"
      title="Add New Customer"
      @close="showCustomerModal = false"
      @submit="handleAddCustomer"
    >
      <div class="space-y-4">
        <FormInput v-model="newCustomer.first_name" label="Name" placeholder="Customer name" required />
        <FormInput v-model="newCustomer.phone" label="Phone" placeholder="Phone number" />
        <FormInput v-model="newCustomer.email" label="Email" type="email" placeholder="Email address" />
      </div>
    </FormModal>

    <FormModal
      :show="showCheckoutModal"
      title="Complete Sale"
      size="lg"
      @close="showCheckoutModal = false"
      @submit="completeOrder"
    >
      <div class="grid grid-cols-2 gap-6">
        <div>
          <h3 class="font-medium text-gray-900 mb-3">Payment Method</h3>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="method in paymentMethods"
              :key="method.value"
              @click="selectedPaymentMethod = method.value"
              type="button"
              :class="[
                'p-3 rounded-lg border transition-all flex items-center gap-2',
                selectedPaymentMethod === method.value
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-600'
              ]"
            >
              <span class="text-xl">{{ method.icon }}</span>
              <span class="font-medium">{{ method.label }}</span>
            </button>
          </div>

          <div class="mt-4">
            <FormInput
              v-model="shippingAddress"
              label="Shipping Address"
              placeholder="Enter delivery address"
            />
          </div>

          <div class="mt-4">
            <FormInput
              v-model="orderNotes"
              label="Order Notes"
              placeholder="Any special instructions..."
            />
          </div>
        </div>

        <div class="bg-gray-50 rounded-lg p-4">
          <h3 class="font-medium text-gray-900 mb-3">Order Summary</h3>
          <div class="space-y-2 text-sm mb-4">
            <div v-for="item in cart" :key="`${item.productId}-${item.variantId}`" class="flex justify-between">
              <span class="text-gray-600">{{ item.productName }} x{{ item.quantity }}</span>
              <span>৳{{ (item.price * item.quantity).toFixed(2) }}</span>
            </div>
          </div>
          <div class="border-t border-gray-200 pt-3 space-y-2">
            <div class="flex justify-between text-sm">
              <span class="text-gray-600">Subtotal</span>
              <span>৳{{ cartSubtotal.toFixed(2) }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-600">Tax (5%)</span>
              <span>৳{{ cartTax.toFixed(2) }}</span>
            </div>
            <div class="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
              <span>Total</span>
              <span class="text-primary-600">৳{{ cartTotal.toFixed(2) }}</span>
            </div>
          </div>
          
          <div class="mt-4 p-3 bg-white rounded-lg border border-gray-200">
            <div class="text-xs text-gray-500 mb-1">Channel</div>
            <div class="font-medium">{{ channelOptions.find(c => c.value === selectedChannel)?.label }}</div>
          </div>
          
          <div v-if="selectedCustomer" class="mt-2 p-3 bg-white rounded-lg border border-gray-200">
            <div class="text-xs text-gray-500 mb-1">Customer</div>
            <div class="font-medium">{{ selectedCustomer.full_name }}</div>
            <div class="text-sm text-gray-600">{{ selectedCustomer.phone || selectedCustomer.email }}</div>
          </div>
        </div>
      </div>
    </FormModal>
  </div>
</template>
