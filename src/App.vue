<script setup>
import { computed } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import LogoutButton from './components/logout_button.vue';
import { authState, hasRole } from './services/auth_service';

const route = useRoute();

const showShell = computed(() => authState.isAuthenticated && route.name !== 'Login' && route.name !== 'AuthCallback');

const navItems = computed(() => [
  { label: 'Panel', to: '/', roles: [] },
  { label: 'Inventario', to: '/inventario', roles: ['laboratorista'] },
  { label: 'Usuarios', to: '/usuarios', roles: ['laboratorista'] },
  { label: 'Reportes', to: '/reportes', roles: ['laboratorista', 'tecnico'] },
  { label: 'Solicitudes', to: '/solicitudes', roles: [] },
  { label: 'Nueva solicitud', to: '/solicitudes/nueva', roles: ['docente', 'laboratorista'] },
]);

const canAccess = (item) => !item.roles.length || hasRole(item.roles);
</script>

<template>
  <div :class="['app-shell', { 'with-nav': showShell }]">
    <header v-if="showShell" class="app-nav">
      <RouterLink class="brand" to="/">
        <img src="./assets/syslab-logo.png" alt="SysLab" />
        <span>SysLab Control</span>
      </RouterLink>

      <nav class="nav-list" aria-label="Navegación principal">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          class="nav-item"
          :class="{ locked: !canAccess(item) }"
          :to="canAccess(item) ? item.to : { name: 'Forbidden' }"
          :aria-disabled="!canAccess(item)"
          :title="canAccess(item) ? item.label : 'No tienes permisos para esta sección'"
        >
          {{ item.label }}
        </RouterLink>
      </nav>

      <div class="nav-user">
        <span>{{ authState.user?.name || authState.user?.email || 'Usuario' }}</span>
        <LogoutButton />
      </div>
    </header>

    <router-view />
  </div>
</template>
