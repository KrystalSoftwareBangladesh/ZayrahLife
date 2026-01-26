import { createRouter, createWebHistory } from 'vue-router'
import { useAdminAuthStore } from '@/stores/admin/adminAuth'

const adminRoutes = [
  {
    path: '/admin/login',
    name: 'admin-login',
    component: () => import('@/admin/pages/AdminLoginPage.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/admin',
    component: () => import('@/components/admin/AdminLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: '/admin/dashboard'
      },
      {
        path: 'dashboard',
        name: 'admin-dashboard',
        component: () => import('@/admin/pages/AdminDashboardPage.vue')
      },
      {
        path: 'customers',
        name: 'admin-customers',
        component: () => import('@/admin/pages/AdminCustomersPage.vue')
      },
      {
        path: 'customers/:id',
        name: 'admin-customer-detail',
        component: () => import('@/admin/pages/AdminCustomerDetailPage.vue')
      },
      {
        path: 'products',
        name: 'admin-products',
        component: () => import('@/admin/pages/AdminProductsPage.vue')
      },
      {
        path: 'products/:id',
        name: 'admin-product-detail',
        component: () => import('@/admin/pages/AdminProductDetailPage.vue')
      },
      {
        path: 'orders',
        name: 'admin-orders',
        component: () => import('@/admin/pages/AdminOrdersPage.vue')
      },
      {
        path: 'orders/:id',
        name: 'admin-order-detail',
        component: () => import('@/admin/pages/AdminOrderDetailPage.vue')
      },
      {
        path: 'accounts',
        name: 'admin-accounts',
        component: () => import('@/admin/pages/AdminAccountsPage.vue')
      },
      {
        path: 'campaigns',
        name: 'admin-campaigns',
        component: () => import('@/admin/pages/AdminCampaignsPage.vue')
      }
    ]
  }
]

export function setupAdminGuard(router) {
  router.beforeEach((to, from, next) => {
    if (to.path.startsWith('/admin') && to.meta.requiresAuth !== false) {
      const adminAuth = useAdminAuthStore()
      if (!adminAuth.isAuthenticated) {
        next({ name: 'admin-login' })
        return
      }
    }
    next()
  })
}

export default adminRoutes
