<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { dashboardService } from '../services/dashboard_service';
import { inventoryService } from '../services/inventory_service';
import { requestService } from '../services/request_service';

const router = useRouter();

const loading = ref(false);
const loadingEquipment = ref(false);
const loadingSchedules = ref(false);
const error = ref('');
const equipmentError = ref('');
const scheduleError = ref('');
const mode = ref('registered');
const equipment = ref([]);
const laboratories = ref([]);
const schedules = ref([]);

const form = ref({
  descripcion: '',
  prioridad: 'media',
  equipo_id: '',
  laboratorio: '',
  horario_id: '',
});

const equipmentData = ref({
  name: '',
  inventory_code: '',
  model: '',
  brand: '',
  serial_number: '',
  location: '',
});

const isRegisteredMode = computed(() => mode.value === 'registered');
const selectedEquipment = computed(() => {
  const equipmentId = Number(form.value.equipo_id);
  return equipment.value.find((item) => Number(item.id) === equipmentId) || null;
});
const selectedLaboratory = computed(() => {
  if (isRegisteredMode.value) {
    return selectedEquipment.value?.location || selectedEquipment.value?.ubicacion || form.value.laboratorio;
  }

  return equipmentData.value.location || form.value.laboratorio;
});

const getErrorMessage = (err) => {
  return err.response?.data?.error || err.message || 'No fue posible crear la solicitud.';
};

const normalizeEquipment = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.equipos)) return payload.equipos;
  if (Array.isArray(payload?.equipment)) return payload.equipment;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

const normalizeLaboratories = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.laboratorios)) return payload.laboratorios;
  if (Array.isArray(payload?.laboratories)) return payload.laboratories;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

const normalizeSchedules = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.horarios)) return payload.horarios;
  if (Array.isArray(payload?.schedules)) return payload.schedules;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

const getEquipmentLabel = (item) => {
  const name = item.name || item.nombre || 'Equipo sin nombre';
  const code = item.inventory_code || item.codigo_inventario || item.codigo || item.id;
  const location = item.location || item.ubicacion || 'Sin ubicación';
  return `${name} - ${code} - ${location}`;
};

const getScheduleLabel = (item) => {
  const day = item.dia || item.day_display || item.day || 'Día sin definir';
  const start = item.hora_inicio || item.start_time || item.inicio || '';
  const end = item.hora_fin || item.end_time || item.fin || '';
  return `${day} ${start}${end ? ` - ${end}` : ''}`;
};

const getLaboratoryName = (item) => item.name || item.nombre || item.laboratory || item;

const loadEquipment = async () => {
  loadingEquipment.value = true;
  equipmentError.value = '';

  try {
    equipment.value = normalizeEquipment(await dashboardService.getActiveEquipment());
  } catch (err) {
    equipment.value = [];
    equipmentError.value = getErrorMessage(err);
  } finally {
    loadingEquipment.value = false;
  }
};

const loadLaboratories = async () => {
  scheduleError.value = '';

  try {
    laboratories.value = normalizeLaboratories(await inventoryService.listLaboratories());
  } catch (err) {
    laboratories.value = [];
    scheduleError.value = getErrorMessage(err);
  }
};

const loadSchedules = async (laboratory) => {
  form.value.horario_id = '';
  schedules.value = [];

  if (!laboratory) return;

  loadingSchedules.value = true;
  scheduleError.value = '';

  try {
    const selectedLab = laboratories.value.find((item) => getLaboratoryName(item) === laboratory);
    schedules.value = normalizeSchedules(
      await inventoryService.listSchedules(selectedLab?.id || ''),
    ).filter((item) => (item.laboratorio || item.laboratory || '') === laboratory || !selectedLab?.id);
  } catch (err) {
    scheduleError.value = getErrorMessage(err);
  } finally {
    loadingSchedules.value = false;
  }
};

const buildPayload = () => {
  const payload = {
    descripcion: form.value.descripcion.trim(),
    prioridad: form.value.prioridad,
  };

  if (form.value.horario_id) {
    payload.horario_id = Number(form.value.horario_id);
  }

  if (isRegisteredMode.value) {
    if (!form.value.equipo_id) throw new Error('Debe ingresar el ID del equipo.');
    payload.equipo_id = Number(form.value.equipo_id);
    return payload;
  }

  payload.datos_equipo = {
    name: equipmentData.value.name.trim(),
    inventory_code: equipmentData.value.inventory_code.trim(),
    model: equipmentData.value.model.trim(),
    brand: equipmentData.value.brand.trim(),
    serial_number: equipmentData.value.serial_number.trim(),
    location: equipmentData.value.location.trim(),
  };

  return payload;
};

watch(selectedLaboratory, (laboratory) => {
  loadSchedules(laboratory);
});

watch(mode, () => {
  form.value.equipo_id = '';
  form.value.laboratorio = '';
  form.value.horario_id = '';
  schedules.value = [];
});

onMounted(async () => {
  await Promise.all([loadEquipment(), loadLaboratories()]);
});

const submitRequest = async () => {
  error.value = '';
  loading.value = true;

  try {
    if (!form.value.descripcion.trim()) {
      throw new Error('La descripción es obligatoria.');
    }

    const response = await requestService.createRequest(buildPayload());
    const solicitudId = response.solicitud?.id;

    if (solicitudId) {
      router.push(`/solicitudes/${solicitudId}`);
    } else {
      router.push('/solicitudes');
    }
  } catch (err) {
    error.value = getErrorMessage(err);
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="page">
    <header class="page-header">
      <div>
        <h1>Nueva solicitud</h1>
        <p>Completa la información básica del mantenimiento.</p>
      </div>
      <RouterLink class="btn secondary" to="/solicitudes">Volver</RouterLink>
    </header>

    <form class="panel form" @submit.prevent="submitRequest">
      <label>
        Descripción
        <textarea v-model="form.descripcion" rows="5" required />
      </label>

      <label>
        Prioridad
        <select v-model="form.prioridad">
          <option value="baja">Baja</option>
          <option value="media">Media</option>
          <option value="alta">Alta</option>
        </select>
      </label>

      <label>
        Laboratorio para horario
        <select v-model="form.laboratorio" :disabled="isRegisteredMode && !!selectedEquipment">
          <option value="">Sin laboratorio seleccionado</option>
          <option v-for="laboratory in laboratories" :key="laboratory.id || getLaboratoryName(laboratory)" :value="getLaboratoryName(laboratory)">
            {{ getLaboratoryName(laboratory) }}
          </option>
        </select>
      </label>

      <fieldset>
        <legend>Equipo</legend>
        <label class="radio-row">
          <input v-model="mode" type="radio" value="registered" />
          Equipo registrado
        </label>
        <label class="radio-row">
          <input v-model="mode" type="radio" value="provisional" />
          Equipo provisional
        </label>
      </fieldset>

      <label v-if="isRegisteredMode">
        Equipo registrado
        <select v-model="form.equipo_id" :disabled="loadingEquipment">
          <option value="">{{ loadingEquipment ? 'Cargando equipos...' : 'Selecciona un equipo' }}</option>
          <option v-for="item in equipment" :key="item.id" :value="item.id">
            {{ getEquipmentLabel(item) }}
          </option>
        </select>
      </label>

      <div v-else class="nested-grid">
        <label>
          Nombre
          <input v-model="equipmentData.name" type="text" />
        </label>
        <label>
          Código inventario
          <input v-model="equipmentData.inventory_code" type="text" />
        </label>
        <label>
          Modelo
          <input v-model="equipmentData.model" type="text" />
        </label>
        <label>
          Marca
          <input v-model="equipmentData.brand" type="text" />
        </label>
        <label>
          Número de serie
          <input v-model="equipmentData.serial_number" type="text" />
        </label>
        <label>
          Ubicación
          <input v-model="equipmentData.location" type="text" />
        </label>
      </div>

      <label>
        Horario (opcional)
        <select v-model="form.horario_id" :disabled="loadingSchedules || !selectedLaboratory">
          <option value="">
            {{ loadingSchedules ? 'Cargando horarios...' : 'Sin horario seleccionado' }}
          </option>
          <option v-for="item in schedules" :key="item.id" :value="item.id">
            {{ getScheduleLabel(item) }}
          </option>
        </select>
      </label>

      <p v-if="equipmentError" class="error" role="alert">{{ equipmentError }}</p>
      <p v-if="scheduleError" class="error" role="alert">{{ scheduleError }}</p>
      <p v-if="error" class="error" role="alert">{{ error }}</p>

      <button class="btn" type="submit" :disabled="loading">
        {{ loading ? 'Creando...' : 'Crear solicitud' }}
      </button>
    </form>
  </div>
</template>

<style scoped>
.page {
  width: min(820px, calc(100% - 32px));
  margin: 0 auto;
  padding: 28px 0;
  text-align: left;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 18px;
  border-bottom: 1px solid #ddd;
}

h1,
p {
  margin-top: 0;
}

.panel {
  margin-top: 24px;
  background: #fff;
  border: 1px solid #e2e5e8;
  border-radius: 8px;
  padding: 20px;
}

.form,
.nested-grid {
  display: grid;
  gap: 14px;
}

.nested-grid {
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

label {
  display: grid;
  gap: 6px;
  font-weight: 700;
}

input,
select,
textarea {
  min-height: 40px;
  border: 1px solid #cfd6dc;
  border-radius: 6px;
  padding: 8px 12px;
  font: inherit;
}

textarea {
  resize: vertical;
}

fieldset {
  border: 1px solid #d7dde2;
  border-radius: 6px;
  display: flex;
  gap: 18px;
  flex-wrap: wrap;
}

.radio-row {
  display: inline-flex;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 8px;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 42px;
  padding: 0 16px;
  border: 0;
  border-radius: 6px;
  background: #04325e;
  color: #fff;
  text-decoration: none;
  font-weight: 700;
  cursor: pointer;
}

.btn:disabled {
  opacity: 0.7;
  cursor: wait;
}

.secondary {
  background: #5f6b76;
}

.error {
  color: #a72820;
}
</style>
