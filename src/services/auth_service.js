import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const api = axios.create({ baseURL: API_URL });

export const authState = {
  user: JSON.parse(localStorage.getItem('user')) || null,
  accessToken: localStorage.getItem('access_token'),
  refreshToken: localStorage.getItem('refresh_token'),
  isAuthenticated: !!localStorage.getItem('access_token'),
};

export const authService = {
  login() {
    window.location.href = `${API_URL}/auth/login/google/`;
  },

  async handleCallback() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');

    if (!code || !state) throw new Error('Parámetros OAuth inválidos');

    const res = await api.get('/auth/callback/google/', { params: { code, state } });
    const { access, refresh, user } = res.data;

    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    localStorage.setItem('user', JSON.stringify(user));

    Object.assign(authState, { 
      accessToken: access, 
      refreshToken: refresh, 
      user, 
      isAuthenticated: true 
    });

    return res.data;
  },

  logout() {
    localStorage.clear();
    Object.assign(authState, { 
      user: null, 
      accessToken: null, 
      refreshToken: null, 
      isAuthenticated: false 
    });
  },

  async refreshToken() {
    if (!authState.refreshToken) return false;
    try {
      const res = await api.post('/auth/refresh/', { refresh: authState.refreshToken });
      authState.accessToken = res.data.access;
      localStorage.setItem('access_token', res.data.access);
      return true;
    } catch (e) {
      this.logout();
      return false;
    }
  },

  async getMe() {
    try {
      const res = await api.get('/auth/me/');
      authState.user = res.data;
      localStorage.setItem('user', JSON.stringify(res.data));
      return res.data;
    } catch (e) {
      return null;
    }
  },

  setupInterceptors() {

    api.interceptors.request.use(config => {
      const token = authState.accessToken || localStorage.getItem('access_token');
      const refresh = authState.refreshToken || localStorage.getItem('refresh_token');
      
      if (token) config.headers.Authorization = `Bearer ${token}`;
      if (refresh) config.headers['X-Refresh-Token'] = refresh; 
      return config;
    });

    api.interceptors.response.use(
      response => {
        const newToken = response.headers['x-new-access-token'];
        if (newToken) {
          authState.accessToken = newToken;
          localStorage.setItem('access_token', newToken);
        }
        return response;
      },
      async error => {
        if (error.response?.status === 401 && authState.refreshToken) {
          await this.refreshToken();
          error.config.headers.Authorization = `Bearer ${authState.accessToken}`;
          return api(error.config); // Reintentar
        }
        return Promise.reject(error);
      }
    );
  }
};

export default api;