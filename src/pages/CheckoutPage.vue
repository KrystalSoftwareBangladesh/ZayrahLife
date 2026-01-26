<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import { useOrderStore } from '@/stores/orders'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import OrderSummary from '@/components/cart/OrderSummary.vue'

const router = useRouter()
const cartStore = useCartStore()
const orderStore = useOrderStore()

const isProcessing = ref(false)

const shippingForm = ref({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  country: 'USA'
})

const billingForm = ref({
  sameAsShipping: true,
  firstName: '',
  lastName: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  country: 'USA'
})

const errors = ref({})

const isEmpty = computed(() => cartStore.items.length === 0)

const validate = () => {
  errors.value = {}
  
  if (!shippingForm.value.firstName) errors.value.firstName = 'Required'
  if (!shippingForm.value.lastName) errors.value.lastName = 'Required'
  if (!shippingForm.value.email) errors.value.email = 'Required'
  if (!shippingForm.value.address) errors.value.address = 'Required'
  if (!shippingForm.value.city) errors.value.city = 'Required'
  if (!shippingForm.value.state) errors.value.state = 'Required'
  if (!shippingForm.value.zip) errors.value.zip = 'Required'
  
  return Object.keys(errors.value).length === 0
}

const placeOrder = async () => {
  if (!validate()) return
  
  isProcessing.value = true
  
  await new Promise(resolve => setTimeout(resolve, 1500))
  
  const shippingAddress = {
    name: `${shippingForm.value.firstName} ${shippingForm.value.lastName}`,
    street: shippingForm.value.address,
    city: shippingForm.value.city,
    state: shippingForm.value.state,
    zip: shippingForm.value.zip,
    country: shippingForm.value.country
  }
  
  const order = orderStore.createOrder(
    cartStore.items,
    shippingAddress,
    {
      subtotal: cartStore.subtotal,
      shipping: cartStore.shipping,
      tax: cartStore.tax,
      total: cartStore.total
    }
  )
  
  cartStore.clearCart()
  isProcessing.value = false
  
  router.push({ name: 'invoice', params: { orderId: order.id } })
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <h1 class="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

    <div v-if="!isEmpty" class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div class="lg:col-span-2 space-y-8">
        <div class="bg-white rounded-xl shadow-sm p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-6">Shipping Information</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <BaseInput
              v-model="shippingForm.firstName"
              label="First Name"
              required
              :error="errors.firstName"
            />
            <BaseInput
              v-model="shippingForm.lastName"
              label="Last Name"
              required
              :error="errors.lastName"
            />
            <BaseInput
              v-model="shippingForm.email"
              label="Email"
              type="email"
              required
              :error="errors.email"
            />
            <BaseInput
              v-model="shippingForm.phone"
              label="Phone"
              type="tel"
            />
            <div class="md:col-span-2">
              <BaseInput
                v-model="shippingForm.address"
                label="Street Address"
                required
                :error="errors.address"
              />
            </div>
            <BaseInput
              v-model="shippingForm.city"
              label="City"
              required
              :error="errors.city"
            />
            <BaseInput
              v-model="shippingForm.state"
              label="State"
              required
              :error="errors.state"
            />
            <BaseInput
              v-model="shippingForm.zip"
              label="ZIP Code"
              required
              :error="errors.zip"
            />
            <BaseInput
              v-model="shippingForm.country"
              label="Country"
              disabled
            />
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-6">Billing Information</h2>
          <label class="flex items-center gap-2 mb-4">
            <input
              v-model="billingForm.sameAsShipping"
              type="checkbox"
              class="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <span class="text-gray-700">Same as shipping address</span>
          </label>
          
          <div v-if="!billingForm.sameAsShipping" class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <BaseInput v-model="billingForm.firstName" label="First Name" />
            <BaseInput v-model="billingForm.lastName" label="Last Name" />
            <div class="md:col-span-2">
              <BaseInput v-model="billingForm.address" label="Street Address" />
            </div>
            <BaseInput v-model="billingForm.city" label="City" />
            <BaseInput v-model="billingForm.state" label="State" />
            <BaseInput v-model="billingForm.zip" label="ZIP Code" />
            <BaseInput v-model="billingForm.country" label="Country" disabled />
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-6">Payment Method</h2>
          <p class="text-gray-500">Payment integration will be available soon. For now, orders are processed as mock orders.</p>
        </div>
      </div>

      <div class="lg:col-span-1">
        <OrderSummary
          :subtotal="cartStore.subtotal"
          :shipping="cartStore.shipping"
          :tax="cartStore.tax"
          :total="cartStore.total"
        >
          <BaseButton
            full-width
            size="lg"
            :loading="isProcessing"
            class="mt-6"
            @click="placeOrder"
          >
            Place Order
          </BaseButton>
        </OrderSummary>

        <div class="mt-6 bg-white rounded-xl shadow-sm p-4">
          <h3 class="font-medium text-gray-900 mb-3">Order Items ({{ cartStore.itemCount }})</h3>
          <div class="space-y-3 max-h-64 overflow-y-auto">
            <div
              v-for="item in cartStore.items"
              :key="`${item.id}-${item.selectedColor}-${item.selectedSize}`"
              class="flex gap-3"
            >
              <img :src="item.image" :alt="item.name" class="w-12 h-12 rounded object-cover" />
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 truncate">{{ item.name }}</p>
                <p class="text-sm text-gray-500">Qty: {{ item.quantity }}</p>
              </div>
              <p class="text-sm font-medium">${{ (item.price * item.quantity).toFixed(2) }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="text-center py-16">
      <p class="text-gray-500 mb-4">Your cart is empty. Add items before checkout.</p>
      <RouterLink to="/products">
        <BaseButton>Browse Products</BaseButton>
      </RouterLink>
    </div>
  </div>
</template>
