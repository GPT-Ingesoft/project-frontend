<script setup>
import { authService } from '../services/auth_service';

const handleLogin = () => {
  authService.login();
};
</script>

<template>
  <button @click="handleLogin" class="btn-login">
    Iniciar sesión con Google
  </button>
</template>

<style scoped>
.btn-login {
  padding: 12px 24px;
  background-color: #4285F4;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-login:hover {
  background-color: #357ae8;
}
</style>