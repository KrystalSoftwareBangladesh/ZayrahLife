<script setup>
import { ref } from 'vue'
import AdminSidebar from './AdminSidebar.vue'
import AdminHeader from './AdminHeader.vue'
import Calculator from './Calculator.vue'

const showCalculator = ref(false)
</script>

<template>
  <div class="min-h-screen bg-gray-100 flex">
    <AdminSidebar />
    <div class="flex-1 flex flex-col min-w-0">
      <AdminHeader />
      <main class="flex-1 p-6 overflow-auto">
        <router-view />
      </main>
    </div>
    
    <button
      v-if="!showCalculator"
      @click="showCalculator = true"
      class="fixed bottom-6 right-6 w-14 h-14 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 transition-all hover:scale-105 flex items-center justify-center z-40"
      title="Calculator"
    >
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    </button>
    
    <div v-if="showCalculator" class="fixed bottom-6 right-6 z-50">
      <Calculator @close="showCalculator = false" />
    </div>
  </div>
</template>
