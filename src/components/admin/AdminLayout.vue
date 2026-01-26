<script setup>
import AdminSidebar from './AdminSidebar.vue'
import AdminHeader from './AdminHeader.vue'
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
  </div>
</template>
