<script setup>
import { computed, onMounted, ref } from 'vue';
import { getErrorMessage } from '../services/error_service';
import { inventoryService } from '../services/inventory_service';

const loading = ref(true);
const saving = ref(false);
const error = ref('');
const message = ref('');
const equipment = ref([]);
const laboratories = ref([]);
const schedules = ref([]);
const selectedEquipment = ref(null);
const equipmentHistory = ref(null);
const availabilityResult = ref('');
const filters = ref({ search: '', laboratory: '', status: '', criticality: '' });

const equipmentForm = ref({
  name: '',
  inventory_code: '',
  brand: '',
  model: '',
  serial_number: '',
  location: '',
  status: 'operativo',
  criticality: 'media',
});

const editForm = ref({
  id: '',
  name: '',
  inventory_code: '',
  brand: '',
  model: '',
  location: '',
  status: 'operativo',
  criticality: 'media',
});

const labForm = ref({
  name: '',
  location: '',
  description: '',
});

const scheduleForm = ref({
  laboratorio: '',
  dia: 'lunes',
  hora_inicio: '08:00',
  hora_fin: '10:00',
  disponible: true,
});

const decommissionForm = ref({
  equipmentId: '',
  reason: '',
});

const criticalityForm = ref({
  equipmentId: '',
  criticality: 'media',
});

const labEditForm = ref({
  id: '',
  name: '',
  location: '',
  description: '',
});

const scheduleEditForm = ref({
  id: '',
  laboratorio: '',
  dia: 'lunes',
  hora_inicio: '08:00',
  hora_fin: '10:00',
  disponible: true,
});

const laboratoryOptions = computed(() => {
  return laboratories.value
    .map((item) => item.name || item.nombre)
    .filter(Boolean);
});
const filteredEquipment = computed(() => {
  const search = filters.value.search.trim().toLowerCase();
  return equipment.value.filter((item) => {
    const location = item.location || item.ubicacion || '';
    const status = item.status || item.estado || '';
    const criticality = item.criticality || item.criticidad || '';
    const searchable = [
      item.name,
      item.nombre,
      item.inventory_code,
      item.codigo_inventario,
      item.codigo,
      item.serial_number,
      item.numero_serie,
      item.brand,
      item.marca,
      item.model,
      item.modelo,
      location,
      status,
      criticality,
    ].filter(Boolean).join(' ').toLowerCase();

    return (!search || searchable.includes(search))
      && (!filters.value.laboratory || location === filters.value.laboratory)
      && (!filters.value.status || status === filters.value.status)
      && (!filters.value.criticality || criticality === filters.value.criticality);
  });
});
const historyRequests = computed(() => equipmentHistory.value?.maintenance_requests || []);

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

const resetEquipmentForm = () => {
  equipmentForm.value = {
    name: '',
    inventory_code: '',
    brand: '',
    model: '',
    serial_number: '',
    location: '',
    status: 'operativo',
    criticality: 'media',
  };
};

const resetLabForm = () => {
  labForm.value = {
    name: '',
    location: '',
    description: '',
  };
};

const resetScheduleForm = () => {
  scheduleForm.value = {
    laboratorio: laboratoryOptions.value[0] || '',
    dia: 'lunes',
    hora_inicio: '08:00',
    hora_fin: '10:00',
    disponible: true,
  };
};

const clearLabEdit = () => {
  labEditForm.value = {
    id: '',
    name: '',
    location: '',
    description: '',
  };
};

const clearScheduleEdit = () => {
  scheduleEditForm.value = {
    id: '',
    laboratorio: '',
    dia: 'lunes',
    hora_inicio: '08:00',
    hora_fin: '10:00',
    disponible: true,
  };
};

const loadInventory = async () => {
  loading.value = true;
  error.value = '';

  try {
    const [equipmentResponse, labsResponse, scheduleResponse] = await Promise.all([
      inventoryService.listEquipment(),
      inventoryService.listLaboratories(),
      inventoryService.listSchedules(),
    ]);
    equipment.value = normalizeEquipment(equipmentResponse);
    laboratories.value = normalizeLaboratories(labsResponse);
    schedules.value = normalizeSchedules(scheduleResponse);
    if (!scheduleForm.value.laboratorio) resetScheduleForm();
  } catch (err) {
    error.value = getErrorMessage(err);
  } finally {
    loading.value = false;
  }
};

const validateEquipmentForm = (form, requireSerial = true) => {
  if (!form.name.trim()) throw new Error('El nombre del equipo es obligatorio.');
  if (!form.inventory_code.trim()) throw new Error('El código de inventario es obligatorio.');
  if (!form.brand.trim()) throw new Error('La marca es obligatoria.');
  if (!form.model.trim()) throw new Error('El modelo es obligatorio.');
  if (requireSerial && !form.serial_number.trim()) throw new Error('El número de serie es obligatorio.');
  if (!form.location.trim()) throw new Error('Debe seleccionar un laboratorio.');
};

const createEquipment = async () => {
  saving.value = true;
  message.value = '';
  error.value = '';

  try {
    validateEquipmentForm(equipmentForm.value);
    await inventoryService.createEquipment({
      name: equipmentForm.value.name.trim(),
      inventory_code: equipmentForm.value.inventory_code.trim(),
      brand: equipmentForm.value.brand.trim(),
      model: equipmentForm.value.model.trim(),
      serial_number: equipmentForm.value.serial_number.trim(),
      location: equipmentForm.value.location,
      status: equipmentForm.value.status,
      criticality: equipmentForm.value.criticality,
    });
    message.value = 'Equipo agregado correctamente.';
    resetEquipmentForm();
    await loadInventory();
  } catch (err) {
    error.value = getErrorMessage(err);
  } finally {
    saving.value = false;
  }
};

const createLaboratory = async () => {
  saving.value = true;
  message.value = '';
  error.value = '';

  try {
    if (!labForm.value.name.trim()) throw new Error('El nombre del laboratorio es obligatorio.');
    await inventoryService.createLaboratory({
      name: labForm.value.name.trim(),
      location: labForm.value.location.trim(),
      description: labForm.value.description.trim(),
    });
    message.value = 'Laboratorio agregado correctamente.';
    resetLabForm();
    await loadInventory();
  } catch (err) {
    error.value = getErrorMessage(err);
  } finally {
    saving.value = false;
  }
};

const startLabEdit = (lab) => {
  labEditForm.value = {
    id: lab.id,
    name: lab.name || lab.nombre || '',
    location: lab.location || lab.ubicacion || '',
    description: lab.description || lab.descripcion || '',
  };
};

const updateLaboratory = async () => {
  saving.value = true;
  message.value = '';
  error.value = '';

  try {
    if (!labEditForm.value.id) throw new Error('Debe seleccionar un laboratorio.');
    if (!labEditForm.value.name.trim()) throw new Error('El nombre del laboratorio es obligatorio.');
    await inventoryService.updateLaboratory(labEditForm.value.id, {
      name: labEditForm.value.name.trim(),
      location: labEditForm.value.location.trim(),
      description: labEditForm.value.description.trim(),
    });
    message.value = 'Laboratorio actualizado correctamente.';
    clearLabEdit();
    await loadInventory();
  } catch (err) {
    error.value = getErrorMessage(err);
  } finally {
    saving.value = false;
  }
};

const deleteLaboratory = async (lab) => {
  if (!window.confirm(`¿Eliminar ${lab.name || lab.nombre || 'este laboratorio'}?`)) return;

  saving.value = true;
  message.value = '';
  error.value = '';

  try {
    await inventoryService.deleteLaboratory(lab.id);
    message.value = 'Laboratorio eliminado correctamente.';
    if (Number(labEditForm.value.id) === Number(lab.id)) clearLabEdit();
    await loadInventory();
  } catch (err) {
    error.value = getErrorMessage(err);
  } finally {
    saving.value = false;
  }
};

const createSchedule = async () => {
  saving.value = true;
  message.value = '';
  error.value = '';

  try {
    if (!scheduleForm.value.laboratorio) throw new Error('Debe seleccionar un laboratorio.');
    if (!scheduleForm.value.hora_inicio || !scheduleForm.value.hora_fin) throw new Error('Debe indicar hora inicio y fin.');
    if (scheduleForm.value.hora_inicio >= scheduleForm.value.hora_fin) throw new Error('La hora fin debe ser posterior a la hora inicio.');
    await inventoryService.createSchedule({ ...scheduleForm.value });
    message.value = 'Horario agregado correctamente.';
    resetScheduleForm();
    await loadInventory();
  } catch (err) {
    error.value = getErrorMessage(err);
  } finally {
    saving.value = false;
  }
};

const startScheduleEdit = (schedule) => {
  scheduleEditForm.value = {
    id: schedule.id,
    laboratorio: schedule.laboratorio || schedule.laboratory || '',
    dia: schedule.dia || schedule.day || 'lunes',
    hora_inicio: schedule.hora_inicio || schedule.start_time || '08:00',
    hora_fin: schedule.hora_fin || schedule.end_time || '10:00',
    disponible: schedule.disponible !== false && schedule.available !== false,
  };
};

const updateSchedule = async () => {
  saving.value = true;
  message.value = '';
  error.value = '';

  try {
    if (!scheduleEditForm.value.id) throw new Error('Debe seleccionar un horario.');
    if (!scheduleEditForm.value.laboratorio) throw new Error('Debe seleccionar un laboratorio.');
    if (scheduleEditForm.value.hora_inicio >= scheduleEditForm.value.hora_fin) {
      throw new Error('La hora fin debe ser posterior a la hora inicio.');
    }
    const selectedLab = laboratories.value.find((item) => (item.name || item.nombre) === scheduleEditForm.value.laboratorio);
    await inventoryService.updateSchedule(scheduleEditForm.value.id, {
      laboratory_id: selectedLab?.id,
      laboratorio: scheduleEditForm.value.laboratorio,
      dia: scheduleEditForm.value.dia,
      hora_inicio: scheduleEditForm.value.hora_inicio,
      hora_fin: scheduleEditForm.value.hora_fin,
      disponible: scheduleEditForm.value.disponible,
    });
    message.value = 'Horario actualizado correctamente.';
    clearScheduleEdit();
    await loadInventory();
  } catch (err) {
    error.value = getErrorMessage(err);
  } finally {
    saving.value = false;
  }
};

const deleteSchedule = async (schedule) => {
  if (!window.confirm('¿Eliminar este horario?')) return;

  saving.value = true;
  message.value = '';
  error.value = '';

  try {
    await inventoryService.deleteSchedule(schedule.id);
    message.value = 'Horario eliminado correctamente.';
    if (Number(scheduleEditForm.value.id) === Number(schedule.id)) clearScheduleEdit();
    await loadInventory();
  } catch (err) {
    error.value = getErrorMessage(err);
  } finally {
    saving.value = false;
  }
};

const startEdit = (item) => {
  selectedEquipment.value = item;
  editForm.value = {
    id: item.id,
    name: item.name || item.nombre || '',
    inventory_code: item.inventory_code || item.codigo_inventario || item.codigo || '',
    brand: item.brand || item.marca || '',
    model: item.model || item.modelo || '',
    location: item.location || item.ubicacion || '',
    status: item.status || item.estado || 'operativo',
    criticality: item.criticality || item.criticidad || 'media',
  };
  decommissionForm.value.equipmentId = item.id;
  criticalityForm.value.equipmentId = item.id;
  criticalityForm.value.criticality = editForm.value.criticality;
};

const updateEquipment = async () => {
  saving.value = true;
  message.value = '';
  error.value = '';

  try {
    validateEquipmentForm(editForm.value, false);
    await inventoryService.updateEquipment(editForm.value.id, {
      name: editForm.value.name.trim(),
      inventory_code: editForm.value.inventory_code.trim(),
      brand: editForm.value.brand.trim(),
      model: editForm.value.model.trim(),
      location: editForm.value.location,
      status: editForm.value.status,
      criticality: editForm.value.criticality,
    });
    message.value = 'Equipo actualizado correctamente.';
    await loadInventory();
  } catch (err) {
    error.value = getErrorMessage(err);
  } finally {
    saving.value = false;
  }
};

const checkAvailability = async (item) => {
  saving.value = true;
  error.value = '';
  availabilityResult.value = '';

  try {
    const response = await inventoryService.checkAvailability(item.id);
    availabilityResult.value = response.message || 'Equipo disponible.';
  } catch (err) {
    error.value = getErrorMessage(err);
  } finally {
    saving.value = false;
  }
};

const loadHistory = async (item) => {
  saving.value = true;
  error.value = '';

  try {
    equipmentHistory.value = await inventoryService.getEquipmentHistory(item.id);
    startEdit(item);
  } catch (err) {
    error.value = getErrorMessage(err);
  } finally {
    saving.value = false;
  }
};

const decommissionEquipment = async () => {
  if (!window.confirm('¿Dar de baja este equipo? Esta acción cambia su disponibilidad.')) {
    return;
  }

  saving.value = true;
  message.value = '';
  error.value = '';

  try {
    if (!decommissionForm.value.equipmentId) throw new Error('Debe seleccionar un equipo.');
    if (!decommissionForm.value.reason.trim()) throw new Error('Debe indicar el motivo de baja.');
    await inventoryService.decommissionEquipment(decommissionForm.value.equipmentId, decommissionForm.value.reason.trim());
    message.value = 'Equipo dado de baja correctamente.';
    decommissionForm.value.reason = '';
    await loadInventory();
  } catch (err) {
    error.value = getErrorMessage(err);
  } finally {
    saving.value = false;
  }
};

const updateCriticality = async () => {
  saving.value = true;
  message.value = '';
  error.value = '';

  try {
    if (!criticalityForm.value.equipmentId) throw new Error('Debe seleccionar un equipo.');
    await inventoryService.updateCriticality(criticalityForm.value.equipmentId, criticalityForm.value.criticality);
    message.value = 'Criticidad actualizada correctamente.';
    await loadInventory();
  } catch (err) {
    error.value = getErrorMessage(err);
  } finally {
    saving.value = false;
  }
};

onMounted(loadInventory);
</script>

<template>
  <div class="page">
    <header class="page-header">
      <div>
        <h1>Inventario</h1>
        <p>Gestiona laboratorios, horarios y equipos disponibles para solicitudes.</p>
      </div>
    </header>

    <p v-if="loading" class="state" role="status">Cargando inventario...</p>
    <p v-if="error" class="state error" role="alert">{{ error }}</p>
    <p v-if="message" class="state success" role="status">{{ message }}</p>
    <p v-if="availabilityResult" class="state success" role="status">{{ availabilityResult }}</p>

    <main class="content-grid">
      <section class="panel">
        <h2>Nuevo laboratorio</h2>
        <form class="form" @submit.prevent="createLaboratory">
          <label>
            Nombre
            <input v-model="labForm.name" type="text" placeholder="Ej. Laboratorio 202" />
          </label>
          <label>
            Ubicación
            <input v-model="labForm.location" type="text" placeholder="Ej. Bloque C" />
          </label>
          <label>
            Descripción
            <textarea v-model="labForm.description" rows="4" />
          </label>
          <button class="btn" type="submit" :disabled="saving">
            {{ saving ? 'Guardando...' : 'Agregar laboratorio' }}
          </button>
        </form>
      </section>

      <section class="panel">
        <h2>Nuevo horario</h2>
        <form class="form" @submit.prevent="createSchedule">
          <label>
            Laboratorio
            <select v-model="scheduleForm.laboratorio">
              <option value="">Selecciona un laboratorio</option>
              <option v-for="laboratory in laboratoryOptions" :key="laboratory" :value="laboratory">
                {{ laboratory }}
              </option>
            </select>
          </label>
          <div class="nested-grid">
            <label>
              Día
              <select v-model="scheduleForm.dia">
                <option value="lunes">Lunes</option>
                <option value="martes">Martes</option>
                <option value="miercoles">Miércoles</option>
                <option value="jueves">Jueves</option>
                <option value="viernes">Viernes</option>
                <option value="sabado">Sábado</option>
              </select>
            </label>
            <label>
              Hora inicio
              <input v-model="scheduleForm.hora_inicio" type="time" />
            </label>
            <label>
              Hora fin
              <input v-model="scheduleForm.hora_fin" type="time" />
            </label>
          </div>
          <label class="check-row">
            <input v-model="scheduleForm.disponible" type="checkbox" />
            Disponible
          </label>
          <button class="btn" type="submit" :disabled="saving">Agregar horario</button>
        </form>
      </section>

      <section class="panel wide">
        <h2>Nuevo equipo</h2>
        <form class="form" @submit.prevent="createEquipment">
          <div class="nested-grid">
            <label>
              Nombre
              <input v-model="equipmentForm.name" type="text" placeholder="Ej. Multimetro digital" />
            </label>
            <label>
              Código inventario
              <input v-model="equipmentForm.inventory_code" type="text" placeholder="Ej. EQ-045" />
            </label>
            <label>
              Laboratorio
              <select v-model="equipmentForm.location">
                <option value="">Selecciona un laboratorio</option>
                <option v-for="laboratory in laboratoryOptions" :key="laboratory" :value="laboratory">
                  {{ laboratory }}
                </option>
              </select>
            </label>
            <label>
              Estado
              <select v-model="equipmentForm.status">
                <option value="operativo">Operativo</option>
                <option value="en_mantenimiento">En mantenimiento</option>
                <option value="fuera_de_servicio">Fuera de servicio</option>
              </select>
            </label>
            <label>
              Criticidad
              <select v-model="equipmentForm.criticality">
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
              </select>
            </label>
            <label>
              Marca
              <input v-model="equipmentForm.brand" type="text" />
            </label>
            <label>
              Modelo
              <input v-model="equipmentForm.model" type="text" />
            </label>
            <label>
              Número de serie
              <input v-model="equipmentForm.serial_number" type="text" />
            </label>
          </div>
          <button class="btn" type="submit" :disabled="saving">
            {{ saving ? 'Guardando...' : 'Agregar equipo' }}
          </button>
        </form>
      </section>
    </main>

    <section v-if="selectedEquipment" class="panel list-panel">
      <h2>Gestionar equipo seleccionado</h2>
      <form class="form" @submit.prevent="updateEquipment">
        <div class="nested-grid">
          <label>
            Nombre
            <input v-model="editForm.name" type="text" />
          </label>
          <label>
            Código inventario
            <input v-model="editForm.inventory_code" type="text" />
          </label>
          <label>
            Marca
            <input v-model="editForm.brand" type="text" />
          </label>
          <label>
            Modelo
            <input v-model="editForm.model" type="text" />
          </label>
          <label>
            Laboratorio
            <select v-model="editForm.location">
              <option v-for="laboratory in laboratoryOptions" :key="laboratory" :value="laboratory">
                {{ laboratory }}
              </option>
            </select>
          </label>
          <label>
            Estado
            <select v-model="editForm.status">
              <option value="operativo">Operativo</option>
              <option value="en_mantenimiento">En mantenimiento</option>
              <option value="fuera_de_servicio">Fuera de servicio</option>
            </select>
          </label>
        </div>
        <button class="btn" type="submit" :disabled="saving">Guardar cambios</button>
      </form>

      <div class="management-grid">
        <form class="form" @submit.prevent="updateCriticality">
          <h3>Cambiar criticidad</h3>
          <label>
            Criticidad
            <select v-model="criticalityForm.criticality">
              <option value="baja">Baja</option>
              <option value="media">Media</option>
              <option value="alta">Alta</option>
            </select>
          </label>
          <button class="btn" type="submit" :disabled="saving">Actualizar criticidad</button>
        </form>

        <form class="form" @submit.prevent="decommissionEquipment">
          <h3>Dar de baja</h3>
          <label>
            Motivo
            <input v-model="decommissionForm.reason" type="text" />
          </label>
          <button class="btn danger" type="submit" :disabled="saving">Dar de baja</button>
        </form>
      </div>
    </section>

    <section v-if="equipmentHistory" class="panel list-panel">
      <h2>Historial del equipo</h2>
      <dl class="detail-grid">
        <div>
          <dt>Equipo</dt>
          <dd>{{ equipmentHistory.equipment?.name || equipmentHistory.equipment?.nombre || 'Sin nombre' }}</dd>
        </div>
        <div>
          <dt>Estado</dt>
          <dd>{{ equipmentHistory.equipment?.status || equipmentHistory.equipment?.estado || 'Sin estado' }}</dd>
        </div>
        <div>
          <dt>Ubicación</dt>
          <dd>{{ equipmentHistory.equipment?.location || equipmentHistory.equipment?.ubicacion || 'Sin ubicación' }}</dd>
        </div>
      </dl>
      <p v-if="historyRequests.length === 0" class="state">No hay solicitudes asociadas al historial.</p>
      <ul v-else class="history-list">
        <li v-for="request in historyRequests" :key="request.id">
          <strong>Solicitud #{{ request.id }}</strong>
          <span>{{ request.status || request.estado }} · {{ request.priority || request.prioridad }}</span>
          <p>{{ request.description || request.descripcion }}</p>
        </li>
      </ul>
    </section>

    <section class="panel list-panel">
      <h2>Laboratorios registrados</h2>
      <form v-if="labEditForm.id" class="form edit-strip" @submit.prevent="updateLaboratory">
        <h3>Editar laboratorio</h3>
        <div class="nested-grid">
          <label>
            Nombre
            <input v-model="labEditForm.name" type="text" />
          </label>
          <label>
            Ubicación
            <input v-model="labEditForm.location" type="text" />
          </label>
          <label>
            Descripción
            <input v-model="labEditForm.description" type="text" />
          </label>
        </div>
        <div class="actions">
          <button class="btn" type="submit" :disabled="saving">Guardar laboratorio</button>
          <button class="btn secondary" type="button" :disabled="saving" @click="clearLabEdit">Cancelar</button>
        </div>
      </form>
      <p v-if="laboratories.length === 0" class="state">No hay laboratorios registrados.</p>
      <div v-else class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Ubicación</th>
              <th>Descripción</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="lab in laboratories" :key="lab.id || lab.name || lab.nombre">
              <td>{{ lab.name || lab.nombre || 'Sin nombre' }}</td>
              <td>{{ lab.location || lab.ubicacion || 'Sin ubicación' }}</td>
              <td>{{ lab.description || lab.descripcion || 'Sin descripción' }}</td>
              <td class="actions">
                <button class="btn small" type="button" :disabled="saving" @click="startLabEdit(lab)">Editar</button>
                <button class="btn small danger" type="button" :disabled="saving" @click="deleteLaboratory(lab)">Eliminar</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="panel list-panel">
      <h2>Horarios registrados</h2>
      <form v-if="scheduleEditForm.id" class="form edit-strip" @submit.prevent="updateSchedule">
        <h3>Editar horario</h3>
        <div class="nested-grid">
          <label>
            Laboratorio
            <select v-model="scheduleEditForm.laboratorio">
              <option v-for="laboratory in laboratoryOptions" :key="laboratory" :value="laboratory">
                {{ laboratory }}
              </option>
            </select>
          </label>
          <label>
            Día
            <select v-model="scheduleEditForm.dia">
              <option value="lunes">Lunes</option>
              <option value="martes">Martes</option>
              <option value="miercoles">Miércoles</option>
              <option value="jueves">Jueves</option>
              <option value="viernes">Viernes</option>
              <option value="sabado">Sábado</option>
            </select>
          </label>
          <label>
            Hora inicio
            <input v-model="scheduleEditForm.hora_inicio" type="time" />
          </label>
          <label>
            Hora fin
            <input v-model="scheduleEditForm.hora_fin" type="time" />
          </label>
          <label class="check-row">
            <input v-model="scheduleEditForm.disponible" type="checkbox" />
            Disponible
          </label>
        </div>
        <div class="actions">
          <button class="btn" type="submit" :disabled="saving">Guardar horario</button>
          <button class="btn secondary" type="button" :disabled="saving" @click="clearScheduleEdit">Cancelar</button>
        </div>
      </form>
      <p v-if="schedules.length === 0" class="state">No hay horarios registrados.</p>
      <div v-else class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Laboratorio</th>
              <th>Día</th>
              <th>Inicio</th>
              <th>Fin</th>
              <th>Disponible</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="schedule in schedules" :key="schedule.id">
              <td>{{ schedule.laboratorio || schedule.laboratory }}</td>
              <td>{{ schedule.dia || schedule.day_display || schedule.day }}</td>
              <td>{{ schedule.hora_inicio || schedule.start_time }}</td>
              <td>{{ schedule.hora_fin || schedule.end_time }}</td>
              <td>{{ schedule.disponible !== false && schedule.available !== false ? 'Si' : 'No' }}</td>
              <td class="actions">
                <button class="btn small" type="button" :disabled="saving" @click="startScheduleEdit(schedule)">Editar</button>
                <button class="btn small danger" type="button" :disabled="saving" @click="deleteSchedule(schedule)">Eliminar</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="panel list-panel">
      <h2>Equipos registrados</h2>
      <div class="filters">
        <label>
          Buscar
          <input v-model="filters.search" type="search" placeholder="Nombre, código, serial, marca..." />
        </label>
        <label>
          Laboratorio
          <select v-model="filters.laboratory">
            <option value="">Todos</option>
            <option v-for="laboratory in laboratoryOptions" :key="laboratory" :value="laboratory">
              {{ laboratory }}
            </option>
          </select>
        </label>
        <label>
          Estado
          <select v-model="filters.status">
            <option value="">Todos</option>
            <option value="operativo">Operativo</option>
            <option value="en_mantenimiento">En mantenimiento</option>
            <option value="fuera_de_servicio">Fuera de servicio</option>
            <option value="dado_de_baja">Dado de baja</option>
          </select>
        </label>
        <label>
          Criticidad
          <select v-model="filters.criticality">
            <option value="">Todas</option>
            <option value="baja">Baja</option>
            <option value="media">Media</option>
            <option value="alta">Alta</option>
          </select>
        </label>
      </div>
      <p v-if="filteredEquipment.length === 0" class="state">No hay equipos para mostrar.</p>
      <div v-else class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Código</th>
              <th>Laboratorio</th>
              <th>Estado</th>
              <th>Criticidad</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in filteredEquipment" :key="item.id || item.inventory_code">
              <td>{{ item.name || item.nombre || 'Sin nombre' }}</td>
              <td>{{ item.inventory_code || item.codigo_inventario || item.codigo || 'Sin código' }}</td>
              <td>{{ item.location || item.ubicacion || 'Sin laboratorio' }}</td>
              <td>{{ item.status || item.estado || 'Sin estado' }}</td>
              <td>{{ item.criticality || item.criticidad || 'Sin criticidad' }}</td>
              <td class="actions">
                <button class="btn small" type="button" @click="startEdit(item)">Editar</button>
                <button class="btn small secondary" type="button" @click="checkAvailability(item)">Disponibilidad</button>
                <button class="btn small secondary" type="button" @click="loadHistory(item)">Historial</button>
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
h3,
p {
  margin-top: 0;
}

.content-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 18px;
  margin-top: 24px;
}

.wide {
  grid-column: 1 / -1;
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

.form,
.nested-grid,
.management-grid,
.filters,
.detail-grid {
  display: grid;
  gap: 14px;
}

.nested-grid,
.management-grid,
.filters,
.detail-grid {
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.management-grid {
  margin-top: 18px;
}

.edit-strip {
  margin: 16px 0;
  padding: 16px;
  border: 1px solid #edf0f2;
  border-radius: 8px;
  background: #f8fafc;
}

label {
  display: grid;
  gap: 6px;
  font-weight: 700;
}

.check-row {
  display: inline-flex;
  align-items: center;
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

.danger {
  background: #a72820;
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

.json-preview {
  max-height: 360px;
  overflow: auto;
  white-space: pre-wrap;
  background: #f7f8fa;
  border: 1px solid #e2e5e8;
  border-radius: 6px;
  padding: 14px;
}

.history-list {
  display: grid;
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.history-list li {
  border: 1px solid #edf0f2;
  border-radius: 6px;
  padding: 12px;
}

dt {
  color: #04325e;
  font-weight: 700;
}

dd {
  margin: 4px 0 0;
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
