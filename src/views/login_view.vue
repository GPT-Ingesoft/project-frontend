<script setup>
import LoginButton from '../components/login_button.vue';
</script>

<template>
  <div class="login-container">
    <div class="login-card">
      <h1 class="title">Bienvenido al Sistema</h1>
      <p class="subtitle">Por favor, inicia sesión para continuar</p>
      
      <!-- Uso del componente -->
      <LoginButton />
    </div>
  </div>
</template>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f4f6f8;
}

.login-card {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  text-align: center;
  width: 100%;
  max-width: 400px;
}

.title {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
  color: #333;
}

.subtitle {
  color: #666;
  margin-bottom: 2rem;
}
</style>