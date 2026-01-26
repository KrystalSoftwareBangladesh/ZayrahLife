import { createRouter, createWebHistory } from 'vue-router'
import adminRoutes, { setupAdminGuard } from '@/admin/router'

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/pages/HomePage.vue')
  },
  {
    path: '/products',
    name: 'products',
    component: () => import('@/pages/ProductsPage.vue')
  },
  {
    path: '/products/:id',
    name: 'product-detail',
    component: () => import('@/pages/ProductDetailPage.vue')
  },
  {
    path: '/cart',
    name: 'cart',
    component: () => import('@/pages/CartPage.vue')
  },
  {
    path: '/checkout',
    name: 'checkout',
    component: () => import('@/pages/CheckoutPage.vue')
  },
  {
    path: '/invoice/:orderId',
    name: 'invoice',
    component: () => import('@/pages/InvoicePage.vue')
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/pages/LoginPage.vue')
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/pages/RegisterPage.vue')
  },
  {
    path: '/orders',
    name: 'orders',
    component: () => import('@/pages/OrdersPage.vue')
  },
  {
    path: '/orders/:id',
    name: 'order-detail',
    component: () => import('@/pages/OrderDetailPage.vue')
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('@/pages/ProfilePage.vue')
  },
  ...adminRoutes
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

setupAdminGuard(router)

export default router
