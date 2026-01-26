<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <footer class="bg-gray-900 text-gray-300">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div class="col-span-1 md:col-span-2">
          <h3 class="text-2xl font-bold text-white mb-4">ZayrahLife</h3>
          <p class="text-gray-400 mb-4 max-w-md">
            Your one-stop destination for quality products. We bring you the best selection at competitive prices.
          </p>
        </div>
        
        <div>
          <h4 class="text-white font-semibold mb-4">Quick Links</h4>
          <ul class="space-y-2">
            <li>
              <RouterLink to="/" class="hover:text-white transition-colors">Home</RouterLink>
            </li>
            <li>
              <RouterLink to="/products" class="hover:text-white transition-colors">Products</RouterLink>
            </li>
            <li>
              <RouterLink to="/cart" class="hover:text-white transition-colors">Cart</RouterLink>
            </li>
          </ul>
        </div>
        
        <div>
          <h4 class="text-white font-semibold mb-4">Account</h4>
          <ul class="space-y-2">
            <li>
              <RouterLink to="/login" class="hover:text-white transition-colors">Login</RouterLink>
            </li>
            <li>
              <RouterLink to="/register" class="hover:text-white transition-colors">Register</RouterLink>
            </li>
            <li>
              <RouterLink to="/orders" class="hover:text-white transition-colors">My Orders</RouterLink>
            </li>
          </ul>
        </div>
      </div>
      
      <div class="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
        <p>&copy; {{ new Date().getFullYear() }} ZayrahLife. All rights reserved.</p>
      </div>
    </div>
  </footer>
</template>
