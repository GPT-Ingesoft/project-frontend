<script setup>
import { useRouter } from 'vue-router';
import { authService } from '../services/auth_service';

const router = useRouter();

const handleLogin = () => {
  authService.login();
};

const handleDemoLogin = () => {
  authService.startDemoSession();
  router.push('/');
};
</script>

<template>
  <div class="login-actions">
    <button @click="handleLogin" class="btn-login">
      Iniciar sesión con Google
    </button>
    <button @click="handleDemoLogin" class="btn-demo">
      Ver modo demo
    </button>
  </div>
</template>

<style scoped>
.login-actions {
  display: grid;
  gap: 12px;
}

.btn-login,
.btn-demo {
  padding: 12px 24px;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-login {
  background-color: #4285F4;
}

.btn-login:hover {
  background-color: #357ae8;
}

.btn-demo {
  background-color: #04325e;
}

.btn-demo:hover {
  background-color: #064780;
}
</style>
