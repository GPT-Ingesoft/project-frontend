<script setup>
import UserInfoComponent from '../components/user_info_component.vue';
import LogoutButton from '../components/logout_button.vue';
</script>

<template>
  <div class="dashboard-container">
    <header class="dashboard-header">
      <h1>Dashboard</h1>
      <LogoutButton />
    </header>

    <main class="dashboard-content">
      <UserInfoComponent />
    </main>
  </div>
</template>

<style scoped>
.dashboard-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #eee;
}
.dashboard-header h1 {
  margin: 0;
  color: #2c3e50;
}
</style>