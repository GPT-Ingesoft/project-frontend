import { createRouter, createWebHistory } from 'vue-router';
import { authState, hasRole } from '../services/auth_service';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/home_view.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/login_view.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/login/callback',
    name: 'AuthCallback',
    component: () => import('../views/auth_callback.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/solicitudes',
    name: 'Requests',
    component: () => import('../views/requests_view.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/solicitudes/nueva',
    name: 'RequestCreate',
    component: () => import('../views/request_create_view.vue'),
    meta: { requiresAuth: true, roles: ['docente', 'laboratorista'] }
  },
  {
    path: '/solicitudes/:id',
    name: 'RequestDetail',
    component: () => import('../views/request_detail_view.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/inventario',
    name: 'Inventory',
    component: () => import('../views/inventory_view.vue'),
    meta: { requiresAuth: true, roles: ['laboratorista'] }
  },
  {
    path: '/usuarios',
    name: 'Users',
    component: () => import('../views/users_view.vue'),
    meta: { requiresAuth: true, roles: ['laboratorista'] }
  },
  {
    path: '/reportes',
    name: 'Reports',
    component: () => import('../views/reports_view.vue'),
    meta: { requiresAuth: true, roles: ['laboratorista'] }
  },
  {
    path: '/sin-permisos',
    name: 'Forbidden',
    component: () => import('../views/forbidden_view.vue'),
    meta: { requiresAuth: true }
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach((to, from, next) => {
  const isAuthenticated = authState.isAuthenticated;
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);

  if (requiresAuth && !isAuthenticated) {
    return next({ name: 'Login' });
  }

  const allowedRoles = to.meta.roles || [];
  if (allowedRoles.length && !hasRole(allowedRoles)) {
    return next({ name: 'Forbidden' });
  }

  if (to.name === 'Login' && isAuthenticated) {
    return next({ name: 'Home' });
  }

  next();
});

export default router;
