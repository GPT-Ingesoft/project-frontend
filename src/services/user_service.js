import api from './auth_service';
import { authState, demoUser, isDemoMode } from './auth_service';

const DEMO_USERS_KEY = 'syslab_demo_users';
const DEMO_NEXT_USER_ID_KEY = 'syslab_demo_next_user_id';

const initialDemoUsers = [
  demoUser,
  {
    id: 8,
    name: 'Carlos Ruiz',
    email: 'cruiz@unal.edu.co',
    role: 'tecnico',
    active: true,
    specialty: 'Electronica',
    contact: '3101234567',
    created_at: new Date().toISOString(),
  },
  {
    id: 11,
    name: 'Laura Gomez',
    email: 'lgomez@unal.edu.co',
    role: 'tecnico',
    active: true,
    specialty: 'Equipos de laboratorio',
    contact: '3107654321',
    created_at: new Date().toISOString(),
  },
];

const clone = (value) => JSON.parse(JSON.stringify(value));

const readDemoUsers = () => {
  const stored = localStorage.getItem(DEMO_USERS_KEY);
  if (stored) return JSON.parse(stored);

  const initial = clone(initialDemoUsers);
  localStorage.setItem(DEMO_USERS_KEY, JSON.stringify(initial));
  localStorage.setItem(DEMO_NEXT_USER_ID_KEY, '12');
  return initial;
};

const writeDemoUsers = (users) => {
  localStorage.setItem(DEMO_USERS_KEY, JSON.stringify(users));
};

const getNextDemoUserId = () => {
  const nextId = Number(localStorage.getItem(DEMO_NEXT_USER_ID_KEY) || '12');
  localStorage.setItem(DEMO_NEXT_USER_ID_KEY, String(nextId + 1));
  return nextId;
};

const normalizeUsersResponse = (payload) => {
  if (Array.isArray(payload)) return { users: payload };
  if (Array.isArray(payload?.users)) return payload;
  if (Array.isArray(payload?.usuarios)) return { ...payload, users: payload.usuarios };
  if (Array.isArray(payload?.results)) return { ...payload, users: payload.results };
  return { ...payload, users: [] };
};

const findDemoUser = (userId) => {
  const users = readDemoUsers();
  const user = users.find((item) => Number(item.id) === Number(userId));
  if (!user) throw new Error('Usuario demo no encontrado.');
  return { users, user };
};

export const userService = {
  async listUsers() {
    if (isDemoMode()) {
      return { users: readDemoUsers() };
    }

    const res = await api.get('/users/');
    return normalizeUsersResponse(res.data);
  },

  async registerUser(data) {
    if (isDemoMode()) {
      const users = readDemoUsers();
      const user = {
        id: getNextDemoUserId(),
        name: data.name,
        email: data.email,
        role: data.role,
        active: true,
        specialty: data.specialty || '',
        contact: data.contact || '',
        created_at: new Date().toISOString(),
      };
      users.push(user);
      writeDemoUsers(users);
      return { message: 'Usuario registrado correctamente.', user };
    }

    const res = await api.post('/users/register/', data);
    return res.data;
  },

  async assignRole(userId, role, technicianData = {}) {
    if (isDemoMode()) {
      const { users, user } = findDemoUser(userId);
      user.role = role;
      if (role === 'tecnico') {
        user.specialty = technicianData.specialty || user.specialty || '';
        user.contact = technicianData.contact || user.contact || '';
      } else {
        user.specialty = '';
        user.contact = '';
      }
      writeDemoUsers(users);
      return { message: 'Rol actualizado correctamente.', user };
    }

    const payload = { role };
    if (role === 'tecnico') {
      payload.specialty = technicianData.specialty;
      payload.contact = technicianData.contact;
    }
    const res = await api.patch(`/users/${userId}/role/`, payload);
    return res.data;
  },

  async changeStatus(userId, active) {
    if (isDemoMode()) {
      const { users, user } = findDemoUser(userId);
      user.active = active;
      writeDemoUsers(users);
      return { message: 'Estado actualizado correctamente.', user };
    }

    const res = await api.patch(`/users/${userId}/status/`, { active });
    return res.data;
  },

  async updateProfile(data) {
    if (isDemoMode()) {
      const { users, user } = findDemoUser(demoUser.id);
      user.name = data.name;
      user.email = data.email;
      localStorage.setItem('user', JSON.stringify(user));
      authState.user = user;
      writeDemoUsers(users);
      return { message: 'Perfil actualizado correctamente.', user };
    }

    const res = await api.patch('/users/me/profile/', data);
    return res.data;
  },
};
