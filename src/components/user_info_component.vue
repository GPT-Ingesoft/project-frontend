<script setup>
import { onMounted } from 'vue';
import { authState, authService } from '../services/auth_service';

onMounted(async () => {
  if (authState.isAuthenticated) {
    await authService.getMe();
  }
});
</script>

<template>
  <div v-if="authState.user" class="user-card">
    <!-- ✅ Corrección: usar las llaves exactas del backend -->
    <h2>Bienvenido, {{ authState.user.name }}</h2>
    <p><strong>Rol:</strong> {{ authState.user.role }}</p>
    <p><strong>Correo:</strong> {{ authState.user.email }}</p>
  </div>
  <div v-else class="loading">Cargando perfil...</div>
</template>

<style scoped>
.user-card {
  background: #fff;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}
.user-card h2 {
  margin-top: 0;
  color: #333;
}
.user-card p {
  color: #555;
  margin: 0.5rem 0;
}
.loading {
  text-align: center;
  color: #999;
  padding: 2rem;
}
</style>