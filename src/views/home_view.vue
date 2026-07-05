<script setup>
import { computed, onMounted, ref } from 'vue';
import { RouterLink } from 'vue-router';
import LogoutButton from '../components/logout_button.vue';
import { authState, authService, permissions } from '../services/auth_service';
import { dashboardService } from '../services/dashboard_service';

const loading = ref(true);
const error = ref('');
const equipment = ref([]);
const requestDashboard = ref(null);

const isLabTechnician = computed(() => authState.user?.role === 'laboratorista');
const canManageInventory = computed(() => permissions.canManageInventory());
const canManageUsers = computed(() => permissions.canManageUsers());
const canViewReports = computed(() => permissions.canViewReports());
const dashboardRequests = computed(() => requestDashboard.value?.solicitudes || requestDashboard.value?.solicitudes_activas || []);

const getErrorMessage = (err) => {
  return err.response?.data?.error || err.message || 'No fue posible cargar el dashboard.';
};

const normalizeEquipment = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.equipos)) return payload.equipos;
  if (Array.isArray(payload?.equipment)) return payload.equipment;
  return [];
};

onMounted(async () => {
  loading.value = true;
  error.value = '';

  try {
    const user = await authService.getMe();
    if (!user) throw new Error('No fue posible cargar el usuario autenticado.');

    const activeEquipment = await dashboardService.getActiveEquipment();
    equipment.value = normalizeEquipment(activeEquipment);

    if (user.role === 'laboratorista') {
      requestDashboard.value = await dashboardService.getRequestDashboard();
    }
  } catch (err) {
    error.value = getErrorMessage(err);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="dashboard-container">
    <header class="dashboard-header">
      <div>
        <h1>Panel principal</h1>
        <p v-if="authState.user">
          {{ authState.user.name }} - {{ authState.user.role }} - {{ authState.user.email }}
        </p>
      </div>
      <div class="header-actions">
        <RouterLink v-if="canManageInventory" class="action-link secondary-link" to="/inventario">Inventario</RouterLink>
        <RouterLink v-if="canManageUsers" class="action-link secondary-link" to="/usuarios">Usuarios</RouterLink>
        <RouterLink v-if="canViewReports" class="action-link secondary-link" to="/reportes">Reportes</RouterLink>
        <RouterLink class="action-link" to="/solicitudes">Solicitudes</RouterLink>
        <LogoutButton />
      </div>
    </header>

    <main class="dashboard-content">
      <p v-if="loading" class="state-message">Cargando dashboard...</p>
      <p v-else-if="error" class="state-message error">{{ error }}</p>

      <template v-else>
        <section class="summary-grid">
          <article class="summary-card">
            <span class="summary-label">Equipos activos</span>
            <strong>{{ equipment.length }}</strong>
          </article>
          <article v-if="isLabTechnician" class="summary-card">
            <span class="summary-label">Solicitudes pendientes</span>
            <strong>{{ requestDashboard?.total_pendientes || 0 }}</strong>
          </article>
          <article v-if="isLabTechnician" class="summary-card">
            <span class="summary-label">Solicitudes activas</span>
            <strong>{{ requestDashboard?.total_activas || dashboardRequests.length }}</strong>
          </article>
        </section>

        <section class="panel-section">
          <div class="section-heading">
            <h2>Equipos activos</h2>
          </div>

          <p v-if="equipment.length === 0" class="state-message">No hay equipos activos para mostrar.</p>
          <div v-else class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Ubicación</th>
                  <th>Estado</th>
                  <th>Criticidad</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in equipment" :key="item.id || item.inventory_code">
                  <td>{{ item.name || item.nombre || 'Sin nombre' }}</td>
                  <td>{{ item.location || item.ubicacion || 'Sin ubicacion' }}</td>
                  <td>{{ item.status || item.estado || 'Sin estado' }}</td>
                  <td>{{ item.criticality || item.criticidad || 'Sin criticidad' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section v-if="isLabTechnician" class="panel-section">
          <div class="section-heading">
            <h2>Solicitudes</h2>
            <RouterLink class="action-link" to="/solicitudes/nueva">Nueva solicitud</RouterLink>
          </div>

          <p v-if="dashboardRequests.length === 0" class="state-message">
            No hay solicitudes para mostrar.
          </p>
          <div v-else class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Estado</th>
                  <th>Prioridad</th>
                  <th>Descripción</th>
                  <th>Accion</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="request in dashboardRequests" :key="request.id">
                  <td>{{ request.id }}</td>
                  <td>{{ request.estado }}</td>
                  <td>{{ request.prioridad }}</td>
                  <td>{{ request.descripcion }}</td>
                  <td>
                    <RouterLink class="table-link" :to="`/solicitudes/${request.id}`">Ver</RouterLink>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </template>
    </main>
  </div>
</template>

<style scoped>
.dashboard-container {
  width: min(1180px, calc(100% - 32px));
  margin: 0 auto;
  padding: 28px 0;
  text-align: left;
}

.dashboard-header,
.section-heading,
.header-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.dashboard-header {
  padding-bottom: 18px;
  border-bottom: 1px solid #ddd;
}

.dashboard-header h1,
.panel-section h2 {
  margin: 0;
}

.dashboard-header p {
  margin-top: 8px;
  color: #59636e;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 16px;
  margin: 24px 0;
}

.summary-card,
.panel-section {
  background: #fff;
  border: 1px solid #e2e5e8;
  border-radius: 8px;
  padding: 18px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.summary-label {
  display: block;
  margin-bottom: 8px;
  color: #59636e;
}

.summary-card strong {
  font-size: 2rem;
  color: #04325e;
}

.panel-section {
  margin-top: 18px;
}

.table-wrap {
  overflow-x: auto;
  margin-top: 16px;
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
  font-weight: 700;
}

.action-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  padding: 0 14px;
  border-radius: 6px;
  background: #04325e;
  color: #fff;
  text-decoration: none;
  font-weight: 600;
}

.secondary-link {
  background: #5f6b76;
}

.table-link {
  color: #04325e;
  font-weight: 700;
}

.state-message {
  padding: 18px;
  color: #59636e;
}

.error {
  color: #a72820;
}
</style>
