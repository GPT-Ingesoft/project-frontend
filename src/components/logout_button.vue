<script setup>
import { useRouter } from 'vue-router';
import { authService } from '../services/auth_service';

const router = useRouter();

const handleLogout = () => {
  authService.logout();
  router.push('/login');
};
</script>

<template>
  <button @click="handleLogout" class="btn-logout">
    Cerrar sesión
  </button>
</template>

<style scoped>
.btn-logout {
  padding: 10px 20px;
  background-color: #e74c3c;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.95rem;
  cursor: pointer;
  transition: background-color 0.2s;
}
.btn-logout:hover {
  background-color: #c0392b;
}
</style>