<script setup>
import { computed, onMounted, ref } from 'vue';
import { authState } from '../services/auth_service';
import { getErrorMessage } from '../services/error_service';
import { userService } from '../services/user_service';

const loading = ref(true);
const saving = ref(false);
const error = ref('');
const message = ref('');
const users = ref([]);
const filters = ref({ search: '', role: '', status: '' });

const userForm = ref({
  name: '',
  email: '',
  role: 'docente',
  specialty: '',
  contact: '',
});

const profileForm = ref({
  name: '',
  email: '',
});

const isTechnician = computed(() => userForm.value.role === 'tecnico');
const filteredUsers = computed(() => {
  const search = filters.value.search.trim().toLowerCase();
  return users.value.filter((user) => {
    const role = user.role || user.rol || '';
    const active = user.active !== false && user.activo !== false;
    const searchable = [
      user.name,
      user.nombre,
      user.email,
      user.correo,
      user.specialty,
      user.especialidad,
      user.contact,
      user.contacto,
      role,
    ].filter(Boolean).join(' ').toLowerCase();
    const matchesSearch = !search || searchable.includes(search);
    const matchesRole = !filters.value.role || role === filters.value.role;
    const matchesStatus = !filters.value.status
      || (filters.value.status === 'active' && active)
      || (filters.value.status === 'inactive' && !active);
    return matchesSearch && matchesRole && matchesStatus;
  });
});

const normalizeUsers = (payload) => {
  const list = Array.isArray(payload)
    ? payload
    : payload?.users || payload?.usuarios || payload?.results || [];
  return list.map((user) => ({
    ...user,
    role: user.role || user.rol || 'docente',
    active: user.active !== false && user.activo !== false,
    specialty: user.specialty || user.especialidad || user.perfil_tecnico?.specialty || user.perfil_tecnico?.especialidad || '',
    contact: user.contact || user.contacto || user.perfil_tecnico?.contact || user.perfil_tecnico?.contacto || '',
  }));
};

const resetUserForm = () => {
  userForm.value = {
    name: '',
    email: '',
    role: 'docente',
    specialty: '',
    contact: '',
  };
};

const hydrateProfile = () => {
  profileForm.value = {
    name: authState.user?.name || '',
    email: authState.user?.email || '',
  };
};

const loadUsers = async () => {
  loading.value = true;
  error.value = '';

  try {
    users.value = normalizeUsers(await userService.listUsers());
    hydrateProfile();
  } catch (err) {
    error.value = getErrorMessage(err);
  } finally {
    loading.value = false;
  }
};

const registerUser = async () => {
  saving.value = true;
  error.value = '';
  message.value = '';

  try {
    if (!userForm.value.name.trim()) throw new Error('El nombre es obligatorio.');
    if (!userForm.value.email.trim()) throw new Error('El correo es obligatorio.');
    if (isTechnician.value && !userForm.value.specialty.trim()) throw new Error('La especialidad es obligatoria para técnicos.');
    if (isTechnician.value && !userForm.value.contact.trim()) throw new Error('El contacto es obligatorio para técnicos.');

    const payload = {
      name: userForm.value.name.trim(),
      email: userForm.value.email.trim(),
      role: userForm.value.role,
    };

    if (isTechnician.value) {
      payload.specialty = userForm.value.specialty.trim();
      payload.contact = userForm.value.contact.trim();
    }

    await userService.registerUser(payload);
    message.value = 'Usuario registrado correctamente.';
    resetUserForm();
    await loadUsers();
  } catch (err) {
    error.value = getErrorMessage(err);
  } finally {
    saving.value = false;
  }
};

const updateRole = async (user) => {
  saving.value = true;
  error.value = '';
  message.value = '';

  try {
    const role = user.role || user.rol;
    if (role === 'tecnico' && !String(user.specialty || '').trim()) {
      throw new Error('La especialidad es obligatoria para técnicos.');
    }
    if (role === 'tecnico' && !String(user.contact || '').trim()) {
      throw new Error('El contacto es obligatorio para técnicos.');
    }

    await userService.assignRole(user.id, role, {
      specialty: String(user.specialty || '').trim(),
      contact: String(user.contact || '').trim(),
    });
    message.value = 'Rol actualizado correctamente.';
    await loadUsers();
  } catch (err) {
    error.value = getErrorMessage(err);
  } finally {
    saving.value = false;
  }
};

const toggleStatus = async (user) => {
  const isCurrentUser = Number(user.id) === Number(authState.user?.id);
  if (isCurrentUser && user.active !== false && user.activo !== false) {
    error.value = 'No puedes desactivar tu propia cuenta desde esta pantalla.';
    return;
  }

  const nextActive = user.active === false || user.activo === false;
  if (!nextActive && !window.confirm(`¿Desactivar a ${user.name || user.nombre || 'este usuario'}?`)) {
    return;
  }

  saving.value = true;
  error.value = '';
  message.value = '';

  try {
    await userService.changeStatus(user.id, nextActive);
    message.value = 'Estado del usuario actualizado.';
    await loadUsers();
  } catch (err) {
    error.value = getErrorMessage(err);
  } finally {
    saving.value = false;
  }
};

const updateProfile = async () => {
  saving.value = true;
  error.value = '';
  message.value = '';

  try {
    if (!profileForm.value.name.trim()) throw new Error('El nombre del perfil es obligatorio.');
    if (!profileForm.value.email.trim()) throw new Error('El correo del perfil es obligatorio.');
    const response = await userService.updateProfile({
      name: profileForm.value.name.trim(),
      email: profileForm.value.email.trim(),
    });
    if (response.user) Object.assign(authState, { user: response.user });
    message.value = 'Perfil actualizado correctamente.';
    await loadUsers();
  } catch (err) {
    error.value = getErrorMessage(err);
  } finally {
    saving.value = false;
  }
};

onMounted(loadUsers);
</script>

<template>
  <div class="page">
    <header class="page-header">
      <div>
        <h1>Usuarios</h1>
        <p>Gestiona cuentas, roles y estado de acceso.</p>
      </div>
    </header>

    <p v-if="loading" class="state" role="status">Cargando usuarios...</p>
    <p v-if="error" class="state error" role="alert">{{ error }}</p>
    <p v-if="message" class="state success" role="status">{{ message }}</p>

    <main class="content-grid">
      <section class="panel">
        <h2>Registrar usuario</h2>
        <form class="form" @submit.prevent="registerUser">
          <label>
            Nombre
            <input v-model="userForm.name" type="text" />
          </label>
          <label>
            Correo
            <input v-model="userForm.email" type="email" />
          </label>
          <label>
            Rol
            <select v-model="userForm.role">
              <option value="docente">Docente</option>
              <option value="laboratorista">Laboratorista</option>
              <option value="tecnico">Técnico</option>
            </select>
          </label>
          <template v-if="isTechnician">
            <label>
              Especialidad
              <input v-model="userForm.specialty" type="text" />
            </label>
            <label>
              Contacto
              <input v-model="userForm.contact" type="text" />
            </label>
          </template>
          <button class="btn" type="submit" :disabled="saving">
            {{ saving ? 'Guardando...' : 'Registrar usuario' }}
          </button>
        </form>
      </section>

      <section class="panel">
        <h2>Mi perfil</h2>
        <form class="form" @submit.prevent="updateProfile">
          <label>
            Nombre
            <input v-model="profileForm.name" type="text" />
          </label>
          <label>
            Correo
            <input v-model="profileForm.email" type="email" />
          </label>
          <button class="btn" type="submit" :disabled="saving">
            {{ saving ? 'Guardando...' : 'Actualizar perfil' }}
          </button>
        </form>
      </section>
    </main>

    <section class="panel list-panel">
      <h2>Usuarios registrados</h2>
      <div class="filters">
        <label>
          Buscar
          <input v-model="filters.search" type="search" placeholder="Nombre, correo, especialidad..." />
        </label>
        <label>
          Rol
          <select v-model="filters.role">
            <option value="">Todos</option>
            <option value="docente">Docente</option>
            <option value="laboratorista">Laboratorista</option>
            <option value="tecnico">Técnico</option>
          </select>
        </label>
        <label>
          Estado
          <select v-model="filters.status">
            <option value="">Todos</option>
            <option value="active">Activo</option>
            <option value="inactive">Inactivo</option>
          </select>
        </label>
      </div>
      <p v-if="!loading && filteredUsers.length === 0" class="state">No hay usuarios para mostrar.</p>
      <div v-else class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Rol</th>
              <th>Datos técnico</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in filteredUsers" :key="user.id">
              <td>{{ user.name || user.nombre || 'Sin nombre' }}</td>
              <td>{{ user.email || user.correo || 'Sin correo' }}</td>
              <td>
                <select v-model="user.role" :disabled="saving">
                  <option value="docente">Docente</option>
                  <option value="laboratorista">Laboratorista</option>
                  <option value="tecnico">Técnico</option>
                </select>
              </td>
              <td>
                <span v-if="(user.role || user.rol) === 'tecnico'">
                  <input v-model="user.specialty" type="text" placeholder="Especialidad" :disabled="saving" />
                  <input v-model="user.contact" type="text" placeholder="Contacto" :disabled="saving" />
                </span>
                <span v-else>No aplica</span>
              </td>
              <td>{{ user.active === false || user.activo === false ? 'Inactivo' : 'Activo' }}</td>
              <td class="actions">
                <button class="btn small" type="button" :disabled="saving" @click="updateRole(user)">
                  Guardar rol
                </button>
                <button class="btn small secondary" type="button" :disabled="saving || Number(user.id) === Number(authState.user?.id)" @click="toggleStatus(user)">
                  {{ user.active === false || user.activo === false ? 'Activar' : 'Desactivar' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<style scoped>
.page {
  width: min(1180px, calc(100% - 32px));
  margin: 0 auto;
  padding: 28px 0;
  text-align: left;
}

.page-header,
.header-actions,
.actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.page-header {
  padding-bottom: 18px;
  border-bottom: 1px solid #ddd;
}

h1,
h2,
p {
  margin-top: 0;
}

.content-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 18px;
  margin-top: 24px;
}

.panel {
  background: #fff;
  border: 1px solid #e2e5e8;
  border-radius: 8px;
  padding: 20px;
}

.list-panel {
  margin-top: 18px;
}

.form {
  display: grid;
  gap: 14px;
}

.filters {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 14px;
  margin-bottom: 16px;
}

label {
  display: grid;
  gap: 6px;
  font-weight: 700;
}

input,
select {
  min-height: 40px;
  border: 1px solid #cfd6dc;
  border-radius: 6px;
  padding: 8px 12px;
  font: inherit;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  padding: 0 14px;
  border: 0;
  border-radius: 6px;
  background: #04325e;
  color: #fff;
  text-decoration: none;
  font-weight: 700;
  cursor: pointer;
}

.small {
  min-height: 34px;
  padding: 0 10px;
}

.secondary {
  background: #5f6b76;
}

.btn:disabled {
  opacity: 0.7;
  cursor: wait;
}

.table-wrap {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: 12px;
  border-bottom: 1px solid #edf0f2;
  text-align: left;
  vertical-align: top;
}

th {
  color: #04325e;
}

.state {
  margin-top: 18px;
  color: #59636e;
}

.error {
  color: #a72820;
}

.success {
  color: #1f7a3a;
}

@media (max-width: 820px) {
  .page-header,
  .header-actions,
  .actions {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
