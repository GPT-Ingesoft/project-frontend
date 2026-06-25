import { createRouter, createWebHistory } from 'vue-router';
import { authState } from '../services/auth_service';

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

  if (to.name === 'Login' && isAuthenticated) {
    return next({ name: 'Home' });
  }

  next();
});

export default router;