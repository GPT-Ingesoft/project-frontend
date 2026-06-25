<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { authService } from '../services/auth_service';

const router = useRouter();

onMounted(async () => {
  try {
    await authService.handleCallback();
    router.replace('/');
  } catch (err) {
    console.error('Error al autenticar:', err);
    alert('Error al iniciar sesión. Intente nuevamente.');
    router.replace('/login');
  }
});
</script>

<template>
  <div class="callback-loader">
    <p>Autenticando...</p>
  </div>
</template>

<style scoped>
.callback-loader {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  font-size: 1.2rem;
  color: #666;
}
</style>