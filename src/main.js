import { createApp } from 'vue';
import App from './App.vue';
import router from './router'; // Esto apunta automáticamente a ./router/index.js
import { authService } from './services/auth_service';
import './style.css';

authService.setupInterceptors();

const app = createApp(App);
app.use(router);
app.mount('#app');