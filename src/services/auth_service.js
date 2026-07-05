import axios from "axios";
import { reactive } from 'vue';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const api = axios.create({ baseURL: API_URL });

export const demoUser = {
  id: 1,
  name: 'Usuario Demo',
  email: 'demo@unal.edu.co',
  role: 'laboratorista',
  active: true,
  created_at: new Date().toISOString(),
};

export const isDemoMode = () => localStorage.getItem('syslab_demo') === 'true';

export const authState = reactive({
  user: JSON.parse(localStorage.getItem('user')) || (isDemoMode() ? demoUser : null),
  accessToken: localStorage.getItem('access_token'),
  refreshToken: localStorage.getItem('refresh_token'),
  isAuthenticated: !!localStorage.getItem('access_token') || isDemoMode(),
});

export const getUserRole = () => authState.user?.role || authState.user?.rol || '';

export const hasRole = (roles = []) => {
  if (!roles.length) return true;
  return roles.includes(getUserRole());
};

export const permissions = {
  isLabTechnician: () => getUserRole() === 'laboratorista',
  isTechnician: () => getUserRole() === 'tecnico',
  isTeacher: () => getUserRole() === 'docente',
  canManageUsers: () => getUserRole() === 'laboratorista',
  canManageInventory: () => getUserRole() === 'laboratorista',
  canViewReports: () => getUserRole() === 'laboratorista',
  canManageRequests: () => getUserRole() === 'laboratorista',
  canAssignTechnicians: () => getUserRole() === 'laboratorista',
  canApproveRequests: () => getUserRole() === 'laboratorista',
  canUploadAttachments: () => ['laboratorista', 'tecnico'].includes(getUserRole()),
  canCreateRequests: () => ['laboratorista', 'docente'].includes(getUserRole()),
  canChangeRequestStatus: () => ['laboratorista', 'tecnico', 'docente'].includes(getUserRole()),
  canRegisterInterventions: () => ['laboratorista', 'tecnico'].includes(getUserRole()),
};

export const authService = {
  login() {
    window.location.href = `${API_URL}/auth/login/google/`;
  },

  startDemoSession() {
    localStorage.setItem('syslab_demo', 'true');
    localStorage.setItem('access_token', 'demo-access-token');
    localStorage.setItem('refresh_token', 'demo-refresh-token');
    localStorage.setItem('user', JSON.stringify(demoUser));

    Object.assign(authState, {
      user: demoUser,
      accessToken: 'demo-access-token',
      refreshToken: 'demo-refresh-token',
      isAuthenticated: true,
    });
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
    if (isDemoMode()) {
      authState.user = demoUser;
      localStorage.setItem('user', JSON.stringify(demoUser));
      return demoUser;
    }

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
