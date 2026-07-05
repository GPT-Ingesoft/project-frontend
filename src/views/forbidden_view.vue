<template>
  <main class="page narrow-page">
    <section class="panel center-panel">
      <h1>Sin permisos</h1>
      <p>No tienes acceso a esta sección con el rol actual.</p>
      <RouterLink class="btn" to="/">Volver al panel</RouterLink>
    </section>
  </main>
</template>

<script setup>
import { RouterLink } from 'vue-router';
</script>
