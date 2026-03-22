<script setup>
import { computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useProductStore } from '@/stores/products'
import ProductCard from '@/components/product/ProductCard.vue'
import BaseButton from '@/components/common/BaseButton.vue'

const productStore = useProductStore()

const featuredProducts = computed(() => productStore.featuredProducts)
const categories = computed(() => productStore.categories)

onMounted(() => {
  void productStore.fetchProducts()
})
</script>

<template>
  <div>
    <section class="bg-gradient-to-r from-primary-800 to-primary-900 text-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <div class="max-w-2xl">
          <h1 class="text-4xl md:text-5xl font-bold mb-6">
            Discover Your Style
          </h1>
          <p class="text-lg md:text-xl text-primary-200 mb-8">
            Shop the latest trends in fashion, electronics, and accessories. Quality products at unbeatable prices.
          </p>
          <div class="flex flex-wrap gap-4">
            <RouterLink to="/products">
              <BaseButton size="lg" variant="secondary" class="!bg-gold-500 !text-primary-900 hover:!bg-gold-400">Shop Now</BaseButton>
            </RouterLink>
            <RouterLink to="/products">
              <BaseButton size="lg" variant="outline" class="!border-gold-400 !text-gold-400 hover:!bg-gold-400 hover:!text-primary-900">
                Browse Collection
              </BaseButton>
            </RouterLink>
          </div>
        </div>
      </div>
    </section>

    <section class="py-16 bg-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 class="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">
          Shop by Category
        </h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          <RouterLink
            v-for="category in categories"
            :key="category.id"
            :to="{ name: 'products', query: { category: category.id } }"
            class="bg-gray-50 rounded-xl p-6 text-center hover:bg-primary-50 transition-colors group border border-transparent hover:border-primary-200"
          >
            <span class="text-4xl mb-3 block">{{ category.icon }}</span>
            <h3 class="font-semibold text-gray-900 group-hover:text-primary-700">{{ category.name }}</h3>
            <p class="text-sm text-gray-500">{{ category.count }} products</p>
          </RouterLink>
        </div>
      </div>
    </section>

    <section class="py-16 bg-gray-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between mb-8">
          <h2 class="text-2xl md:text-3xl font-bold text-gray-900">
            Featured Products
          </h2>
          <RouterLink to="/products" class="text-primary-700 hover:text-primary-800 font-medium">
            View All
          </RouterLink>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <ProductCard
            v-for="product in featuredProducts"
            :key="product.id"
            :product="product"
          />
        </div>
      </div>
    </section>

    <section class="py-16 bg-primary-800">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 class="text-2xl md:text-3xl font-bold text-white mb-4">
          Join Our Newsletter
        </h2>
        <p class="text-primary-200 mb-8 max-w-md mx-auto">
          Subscribe to get special offers, free giveaways, and exclusive deals.
        </p>
        <form class="flex flex-col sm:flex-row gap-3 max-w-md mx-auto" @submit.prevent>
          <input
            type="email"
            placeholder="Enter your email"
            class="flex-1 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400"
          />
          <BaseButton variant="secondary" size="lg" class="!bg-gold-500 !text-primary-900 hover:!bg-gold-400">Subscribe</BaseButton>
        </form>
      </div>
    </section>

    <section class="py-16 bg-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div class="p-6">
            <div class="w-16 h-16 mx-auto mb-4 bg-primary-100 rounded-full flex items-center justify-center">
              <svg class="w-8 h-8 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">Free Shipping</h3>
            <p class="text-gray-500">On orders over ৳100</p>
          </div>
          <div class="p-6">
            <div class="w-16 h-16 mx-auto mb-4 bg-primary-100 rounded-full flex items-center justify-center">
              <svg class="w-8 h-8 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">Easy Returns</h3>
            <p class="text-gray-500">30-day return policy</p>
          </div>
          <div class="p-6">
            <div class="w-16 h-16 mx-auto mb-4 bg-primary-100 rounded-full flex items-center justify-center">
              <svg class="w-8 h-8 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">Secure Payment</h3>
            <p class="text-gray-500">100% secure checkout</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
