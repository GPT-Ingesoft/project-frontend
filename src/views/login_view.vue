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
  min-height: 100vh;
  background: #FFFFFF;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

/* --- Header --- */
.sys-header {
  min-height: 76px;
  width: 100%;
  background: #b1b2b5;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px max(24px, calc((100vw - 1100px) / 2));
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  box-sizing: border-box;
}

.logo-sm {
  height: clamp(44px, 7vw, 60px);
  width: auto;
  flex: 0 0 auto;
}

.sys-title {
  font-size: clamp(22px, 4vw, 30px);
  font-weight: 400;
  display: flex;
  flex-wrap: wrap;
  line-height: 1.1;
}

/* --- Login - Box --- */
.login-card {
  margin: auto;
  width: min(900px, calc(100% - 32px));
  min-height: 500px;
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
  padding: 0 20px;
  text-align: center;
}

.card-title {
  color: #000000;
  font-size: clamp(20px, 4vw, 30px);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin: 0;
}

.card-body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
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
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 30px;
  padding: 30px;
  text-align: center;
}

.card-logo-text {
  font-size: clamp(28px, 5vw, 40px);
  font-weight: 400;
  line-height: 1.1;
}

.logo-lg {
  width: min(200px, 48vw);
  height: auto;
}

@media (max-width: 720px) {
  .login-view {
    min-height: 100svh;
  }

  .sys-header {
    justify-content: center;
    padding-inline: 16px;
  }

  .login-card {
    grid-template-rows: auto 1fr;
    min-height: auto;
    margin: 24px auto;
  }

  .card-top-bar {
    min-height: 72px;
  }

  .card-body {
    grid-template-columns: 1fr;
  }

  .right-panel {
    order: -1;
    gap: 16px;
    padding: 28px 24px 12px;
  }

  .left-panel {
    padding: 20px 24px 30px;
  }
}
</style>
