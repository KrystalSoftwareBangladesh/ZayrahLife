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

router.onError((error, to) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error('Router navigation error:', { to: to?.fullPath || to?.path, message, error })

  const isChunkLoadError =
    /Failed to fetch dynamically imported module|Importing a module script failed|Loading chunk/i.test(message)
  const isAdminTarget = Boolean(to?.path?.startsWith('/admin'))

  if (isChunkLoadError && isAdminTarget) {
    const targetPath = to?.fullPath || '/admin/dashboard'
    if (window.location.pathname + window.location.search !== targetPath) {
      window.location.assign(targetPath)
    }
  }
})

export default router
