<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <footer class="bg-primary-900 text-gray-300">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div class="col-span-1 md:col-span-2">
          <img src="/logo.png" alt="ZayrahLife" class="h-16 w-auto mb-4" />
          <p class="text-primary-300 mb-4 max-w-md">
            Your one-stop destination for quality products. We bring you the best selection at competitive prices.
          </p>
        </div>
        
        <div>
          <h4 class="text-gold-400 font-semibold mb-4">Quick Links</h4>
          <ul class="space-y-2">
            <li>
              <RouterLink to="/" class="hover:text-gold-400 transition-colors">Home</RouterLink>
            </li>
            <li>
              <RouterLink to="/products" class="hover:text-gold-400 transition-colors">Products</RouterLink>
            </li>
            <li>
              <RouterLink to="/cart" class="hover:text-gold-400 transition-colors">Cart</RouterLink>
            </li>
          </ul>
        </div>
        
        <div>
          <h4 class="text-gold-400 font-semibold mb-4">Account</h4>
          <ul class="space-y-2">
            <li>
              <RouterLink to="/login" class="hover:text-gold-400 transition-colors">Login</RouterLink>
            </li>
            <li>
              <RouterLink to="/register" class="hover:text-gold-400 transition-colors">Register</RouterLink>
            </li>
            <li>
              <RouterLink to="/orders" class="hover:text-gold-400 transition-colors">My Orders</RouterLink>
            </li>
          </ul>
        </div>
      </div>
      
      <div class="border-t border-primary-800 mt-8 pt-8 text-center text-primary-400">
        <p>&copy; {{ new Date().getFullYear() }} ZayrahLife. All rights reserved.</p>
      </div>
    </div>
  </footer>
</template>
