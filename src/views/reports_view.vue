<script setup>
import { onMounted, ref } from 'vue';
import { adminService } from '../services/admin_service';
import { getErrorMessage } from '../services/error_service';

const loading = ref(true);
const error = ref('');
const thresholdDays = ref(30);
const failures = ref([]);
const repairTimes = ref([]);
const outOfService = ref([]);
const notifications = ref([]);
const selectedNotification = ref(null);

const normalizeItems = (payload, keys = []) => {
  if (Array.isArray(payload)) return payload;
  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

const loadReports = async () => {
  loading.value = true;
  error.value = '';

  try {
    const [failureResponse, repairResponse, outResponse, notificationResponse] = await Promise.all([
      adminService.getFailureReport(),
      adminService.getRepairTimeReport(),
      adminService.getOutOfServiceReport(thresholdDays.value),
      adminService.getNotifications(),
    ]);

    failures.value = normalizeItems(failureResponse, ['equipos']);
    repairTimes.value = normalizeItems(repairResponse, ['equipos']);
    outOfService.value = normalizeItems(outResponse, ['equipos']);
    notifications.value = normalizeItems(notificationResponse, ['notificaciones', 'notifications']);
  } catch (err) {
    error.value = getErrorMessage(err, 'No fue posible cargar los reportes.');
  } finally {
    loading.value = false;
  }
};

const loadThreshold = async () => {
  try {
    const response = await adminService.getOutOfServiceThreshold();
    thresholdDays.value = response.umbral_dias ?? thresholdDays.value;
  } catch (err) {
    error.value = getErrorMessage(err, 'No fue posible cargar el umbral.');
  }
};

const saveThreshold = async () => {
  loading.value = true;
  error.value = '';

  try {
    const response = await adminService.setOutOfServiceThreshold(thresholdDays.value);
    thresholdDays.value = response.umbral_dias ?? thresholdDays.value;
    await loadReports();
  } catch (err) {
    error.value = getErrorMessage(err, 'No fue posible guardar el umbral.');
  } finally {
    loading.value = false;
  }
};

const loadNotification = async (notification) => {
  error.value = '';

  try {
    const response = await adminService.getNotification(notification.id);
    selectedNotification.value = response.notificacion || response.notification || response;
  } catch (err) {
    error.value = getErrorMessage(err, 'No fue posible cargar la notificación.');
  }
};

onMounted(async () => {
  await loadThreshold();
  await loadReports();
});
</script>

<template>
  <div class="page">
    <header class="page-header">
      <div>
        <h1>Reportes</h1>
        <p>Consulta fallas, tiempos de reparación, equipos fuera de servicio y notificaciones.</p>
      </div>
    </header>

    <section class="panel filters">
      <label>
        Umbral fuera de servicio (días)
        <input v-model.number="thresholdDays" type="number" min="0" />
      </label>
      <button class="btn" type="button" :disabled="loading" @click="loadReports">
        {{ loading ? 'Cargando...' : 'Actualizar reportes' }}
      </button>
      <button class="btn secondary" type="button" :disabled="loading" @click="saveThreshold">
        Guardar umbral
      </button>
    </section>

    <p v-if="error" class="state error" role="alert">{{ error }}</p>
    <p v-if="loading" class="state" role="status">Cargando reportes...</p>

    <main class="report-grid">
      <section class="panel">
        <h2>Reporte de fallas</h2>
        <p v-if="!loading && failures.length === 0" class="state">No hay fallas reportadas.</p>
        <div v-else class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Equipo</th>
                <th>Código</th>
                <th>Ubicación</th>
                <th>Estado</th>
                <th>Fallas</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in failures" :key="item.id">
                <td>{{ item.nombre || item.name }}</td>
                <td>{{ item.codigo_inventario || item.inventory_code }}</td>
                <td>{{ item.ubicacion || item.location }}</td>
                <td>{{ item.estado || item.status }}</td>
                <td>{{ item.total_fallas ?? 0 }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="panel">
        <h2>Tiempos de reparación</h2>
        <p v-if="!loading && repairTimes.length === 0" class="state">No hay tiempos registrados.</p>
        <div v-else class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Equipo</th>
                <th>Código</th>
                <th>Ubicación</th>
                <th>Promedio (h)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in repairTimes" :key="item.id">
                <td>{{ item.nombre || item.name }}</td>
                <td>{{ item.codigo_inventario || item.inventory_code }}</td>
                <td>{{ item.ubicacion || item.location }}</td>
                <td>{{ item.promedio_horas_reparacion ?? 'Sin dato' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="panel">
        <h2>Fuera de servicio</h2>
        <p v-if="!loading && outOfService.length === 0" class="state">No hay equipos fuera de servicio.</p>
        <div v-else class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Equipo</th>
                <th>Código</th>
                <th>Ubicación</th>
                <th>Días</th>
                <th>Motivo</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in outOfService" :key="item.id">
                <td>{{ item.nombre || item.name }}</td>
                <td>{{ item.codigo_inventario || item.inventory_code }}</td>
                <td>{{ item.ubicacion || item.location }}</td>
                <td>{{ item.dias_inactivo ?? 'Sin dato' }}</td>
                <td>{{ item.motivo_baja || item.decommission_reason || 'Sin motivo' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="panel">
        <h2>Notificaciones</h2>
        <p v-if="!loading && notifications.length === 0" class="state">No hay notificaciones.</p>
        <ul v-else class="notification-list">
          <li v-for="item in notifications" :key="item.id">
            <button class="link-button" type="button" @click="loadNotification(item)">
              {{ item.tipo || item.type || 'Notificación' }}
            </button>
            <p>{{ item.mensaje || item.message }}</p>
            <small>{{ item.fecha_envio || item.created_at }}</small>
          </li>
        </ul>
      </section>
    </main>

    <section v-if="selectedNotification" class="panel list-panel">
      <h2>Detalle de notificación</h2>
      <dl class="detail-grid">
        <div>
          <dt>Tipo</dt>
          <dd>{{ selectedNotification.tipo || selectedNotification.type || 'Sin tipo' }}</dd>
        </div>
        <div>
          <dt>Fecha</dt>
          <dd>{{ selectedNotification.fecha_envio || selectedNotification.created_at || 'Sin fecha' }}</dd>
        </div>
        <div>
          <dt>Solicitud</dt>
          <dd>{{ selectedNotification.solicitud_id || 'Sin solicitud' }}</dd>
        </div>
      </dl>
      <p>{{ selectedNotification.mensaje || selectedNotification.message || 'Sin mensaje' }}</p>
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
.filters {
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

.report-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(420px, 1fr));
  gap: 18px;
  margin-top: 18px;
}

.panel {
  background: #fff;
  border: 1px solid #e2e5e8;
  border-radius: 8px;
  padding: 20px;
}

.filters,
.list-panel {
  margin-top: 18px;
}

label {
  display: grid;
  gap: 6px;
  font-weight: 700;
}

input {
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

.secondary {
  background: #5f6b76;
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

th,
dt {
  color: #04325e;
  font-weight: 700;
}

.state {
  margin-top: 18px;
  color: #59636e;
}

.error {
  color: #a72820;
}

.notification-list {
  display: grid;
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.notification-list li {
  border-bottom: 1px solid #edf0f2;
  padding-bottom: 12px;
}

.link-button {
  border: 0;
  background: none;
  color: #04325e;
  cursor: pointer;
  font: inherit;
  font-weight: 700;
  padding: 0;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 14px;
}

dd {
  margin: 4px 0 0;
}

@media (max-width: 820px) {
  .page-header,
  .header-actions,
  .filters {
    align-items: stretch;
    flex-direction: column;
  }

  .report-grid {
    grid-template-columns: 1fr;
  }
}
</style>
