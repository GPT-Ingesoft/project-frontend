<script setup>
import { onMounted, ref } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { permissions } from '../services/auth_service';
import { requestService } from '../services/request_service';

const router = useRouter();
const requestId = ref('');
const requests = ref([]);
const loading = ref(true);
const error = ref('');
const canManageInventory = permissions.canManageInventory;

const openRequest = () => {
  const id = String(requestId.value).trim();
  if (!id) return;
  router.push(`/solicitudes/${id}`);
};

const loadRequests = async () => {
  loading.value = true;
  error.value = '';

  try {
    const response = await requestService.listRequests();
    requests.value = response.solicitudes || [];
  } catch (err) {
    error.value = err.response?.data?.error || err.message || 'No fue posible cargar solicitudes.';
  } finally {
    loading.value = false;
  }
};

onMounted(loadRequests);
</script>

<template>
  <div class="page">
    <header class="page-header">
      <div>
        <h1>Solicitudes</h1>
        <p>Crear una solicitud nueva o consultar una solicitud existente por ID.</p>
      </div>
    </header>

    <main class="content-grid">
      <section class="panel">
        <h2>Nueva solicitud</h2>
        <p>Registra una solicitud usando un equipo existente o datos provisionales del equipo.</p>
        <RouterLink class="btn" to="/solicitudes/nueva">Crear solicitud</RouterLink>
      </section>

      <section v-if="canManageInventory()" class="panel">
        <h2>Inventario</h2>
        <p>Agrega laboratorios y equipos antes de crear solicitudes.</p>
        <RouterLink class="btn" to="/inventario">Gestionar inventario</RouterLink>
      </section>

      <section class="panel">
        <h2>Consultar solicitud</h2>
        <form @submit.prevent="openRequest" class="lookup-form">
          <label for="request-id">ID de solicitud</label>
          <input id="request-id" v-model="requestId" type="number" min="1" placeholder="Ej. 12" />
          <button class="btn" type="submit">Ver detalle</button>
        </form>
      </section>
    </main>

    <section class="panel requests-panel">
      <h2>Solicitudes registradas</h2>
      <p v-if="loading" class="state" role="status">Cargando solicitudes...</p>
      <p v-else-if="error" class="state error" role="alert">{{ error }}</p>
      <p v-else-if="requests.length === 0" class="state">No hay solicitudes para mostrar.</p>

      <div v-else class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Estado</th>
              <th>Prioridad</th>
              <th>Descripción</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="request in requests" :key="request.id">
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
  </div>
</template>

<style scoped>
.page {
  width: min(980px, calc(100% - 32px));
  margin: 0 auto;
  padding: 28px 0;
  text-align: left;
}

.page-header,
.header-actions {
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
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 18px;
  margin-top: 24px;
}

.panel {
  background: #fff;
  border: 1px solid #e2e5e8;
  border-radius: 8px;
  padding: 20px;
}

.requests-panel {
  margin-top: 18px;
}

.lookup-form {
  display: grid;
  gap: 12px;
}

label {
  font-weight: 700;
}

input {
  min-height: 40px;
  border: 1px solid #cfd6dc;
  border-radius: 6px;
  padding: 0 12px;
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

th {
  color: #04325e;
}

.table-link {
  color: #04325e;
  font-weight: 700;
}

.state {
  color: #59636e;
}

.error {
  color: #a72820;
}
</style>
