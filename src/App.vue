<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import PageLayout from '@/components/layout/PageLayout.vue'
import { useTheme } from '@/composables/useTheme'

const route = useRoute()
const isAdminRoute = computed(() => route.path.startsWith('/admin'))
const { initTheme } = useTheme()

initTheme()
</script>

<template>
  <PageLayout v-if="!isAdminRoute">
    <router-view />
  </PageLayout>
  <router-view v-else />
</template>
