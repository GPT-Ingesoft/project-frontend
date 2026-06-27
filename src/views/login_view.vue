<script setup>
import LoginButton from '../components/login_button.vue';
</script>

<template>
  <div class="login-view">
    
    <!-- Header -->
    <header class="sys-header">
      <img src="../assets/syslab-logo.png" alt="Logo" class="logo-sm" />
      <div class="sys-title">
        <span style="color: #04325e;">SysLab</span>
        <span style="color: #68a645; padding-left: 5px">CONTROL</span>
      </div>
    </header>

    <!-- Login - Box -->
    <main class="login-card">
      <div class="card-top-bar">
        <h1 class="card-title">Inicia sesión en el sistema</h1>
      </div>
      <div class="card-body">
        <section class="left-panel">
            <LoginButton />
        </section>
        <section class="right-panel">
          <div class="card-logo">
            <img src="../assets/syslab-logo.png" alt="Logo Principal" class="logo-lg"/>
          </div>
          <div class="card-logo-text">
            <span style="color: #04325e;">SysLab</span>
            <span style="color: #68a645; padding-left: 10px">CONTROL</span>          
          </div>        
        </section>
      </div>
    </main>
  </div>
</template>

<style scoped>
.login-view {
  width: 100%;
  height: 100vh;
  background: #FFFFFF;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

/* --- Header --- */
.sys-header {
  height: 8vh;
  width: 100%;
  background: #b1b2b5;
  display: flex;
  align-items: center;
  padding-left: 100px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.logo-sm {
  height: 60px;
  width: auto;
  margin-right: 1px;
}

.sys-title {
  font-size: 30px;
  font-weight: 400;
  padding-left: 10px;
  display: flex;
}

/* --- Login - Box --- */
.login-card {
  margin: auto; 
  
  width: 900px;
  height: 500px;
  background: rgba(177,178,181,0.75);
  border-radius: 8px;
  overflow: hidden;
  
  display: grid;
  grid-template-rows: 60px 1fr; 
  box-shadow: 0 4px 15px rgba(0,0,0,0.15);
}

.card-top-bar {
  background: #b1b2b5;
  display: flex;
  justify-content: center;
  align-items: center;
}

.card-title {
  color: #000000;
  font-size: 30px;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin: 0;
}

.card-body {
  display: flex;
}

.left-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 30px;
}

.right-panel {
  flex: 1; 
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 30px;
}

.card-logo-text {
  font-size: 40px;
  font-weight: 400;
}

.logo-lg {
  width: 200px;
  height: auto;
}
</style>