<script setup>
import { computed, onMounted, ref } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import { permissions } from '../services/auth_service';
import { getErrorMessage } from '../services/error_service';
import { requestService } from '../services/request_service';

const route = useRoute();
const loading = ref(true);
const actionLoading = ref(false);
const error = ref('');
const actionMessage = ref('');
const detail = ref(null);
const statusForm = ref({ estado: 'en_proceso', motivo: '' });
const technicians = ref([]);
const selectedTechnicians = ref([]);
const interventionForm = ref({
  descripcion: '',
  diagnostico: '',
  acciones_realizadas: '',
  repuestos: '',
  observaciones: '',
  tiempo_invertido_horas: 1,
});
const attachment = ref({ file: null, descripcion: '', tipo: 'documento' });
const fileInput = ref(null);

const solicitud = computed(() => detail.value?.solicitud || detail.value || null);
const isLabTechnician = computed(() => permissions.canManageRequests());
const isTechnician = computed(() => permissions.isTechnician());
const isTeacher = computed(() => permissions.isTeacher());
const canAssignTechnicians = computed(() => permissions.canAssignTechnicians());
const canApproveRequests = computed(() => permissions.canApproveRequests());
const canUploadAttachments = computed(() => permissions.canUploadAttachments());
const canChangeStatus = computed(() => permissions.canChangeRequestStatus());
const canRegisterInterventions = computed(() => permissions.canRegisterInterventions());
const requestEquipment = computed(() => solicitud.value?.equipo || solicitud.value?.datos_equipo_solicitado || null);
const requestSchedule = computed(() => solicitud.value?.horario_agendado || null);
const assignedTechnicians = computed(() => solicitud.value?.tecnicos_asignados || solicitud.value?.assigned_technicians || []);
const attachments = computed(() => solicitud.value?.adjuntos || solicitud.value?.attachments || []);
const statusHistory = computed(() => solicitud.value?.historial_estados || solicitud.value?.status_history || []);
const interventions = computed(() => solicitud.value?.intervenciones || solicitud.value?.interventions || []);
const statusOptions = computed(() => {
  if (isLabTechnician.value) {
    return [
      { value: 'pendiente', label: 'Pendiente' },
      { value: 'en_proceso', label: 'En proceso' },
      { value: 'completada', label: 'Completada' },
      { value: 'cancelada', label: 'Cancelada' },
    ];
  }

  if (isTechnician.value) {
    return [
      { value: 'en_proceso', label: 'En proceso' },
      { value: 'completada', label: 'Completada' },
    ];
  }

  if (isTeacher.value) {
    return [
      { value: 'cancelada', label: 'Cancelada' },
    ];
  }

  return [];
});

const getTechnicianId = (tech) => Number(tech.id || tech.user_id || tech.usuario_id);
const isTechnicianSelected = (tech) => selectedTechnicians.value.includes(getTechnicianId(tech));
const getTechnicianLoad = (tech) => tech.active_requests ?? tech.solicitudes_activas ?? tech.activeRequests ?? 0;
const getTechnicianSpecialty = (tech) => tech.specialty || tech.especialidad || tech.perfil_tecnico?.specialty || tech.perfil_tecnico?.especialidad || 'Sin especialidad';

const syncSelectedTechnicians = () => {
  selectedTechnicians.value = assignedTechnicians.value
    .map(getTechnicianId)
    .filter(Boolean);
};

const syncStatusForm = () => {
  if (!statusOptions.value.some((option) => option.value === statusForm.value.estado)) {
    statusForm.value.estado = statusOptions.value[0]?.value || '';
  }
};

const formatPayload = (payload) => {
  if (!payload) return 'Sin datos';
  if (typeof payload === 'string') return payload;
  return JSON.stringify(payload, null, 2);
};

const getValue = (payload, keys) => {
  if (!payload || typeof payload !== 'object') return '';
  const key = keys.find((item) => payload[item] !== undefined && payload[item] !== null && payload[item] !== '');
  return key ? payload[key] : '';
};

const buildFields = (payload, fields) => {
  return fields
    .map((field) => ({
      label: field.label,
      value: getValue(payload, field.keys),
    }))
    .filter((field) => field.value);
};

const equipmentFields = computed(() => buildFields(requestEquipment.value, [
  { label: 'Nombre', keys: ['name', 'nombre'] },
  { label: 'Código', keys: ['inventory_code', 'codigo_inventario', 'codigo'] },
  { label: 'Ubicación', keys: ['location', 'ubicacion'] },
  { label: 'Estado', keys: ['status', 'estado'] },
  { label: 'Criticidad', keys: ['criticality', 'criticidad'] },
  { label: 'Marca', keys: ['brand', 'marca'] },
  { label: 'Modelo', keys: ['model', 'modelo'] },
  { label: 'Serial', keys: ['serial_number', 'numero_serie', 'serial'] },
]));

const scheduleFields = computed(() => buildFields(requestSchedule.value, [
  { label: 'Laboratorio', keys: ['laboratorio', 'lab', 'location', 'ubicacion'] },
  { label: 'Día', keys: ['dia', 'day'] },
  { label: 'Hora inicio', keys: ['hora_inicio', 'start_time', 'inicio'] },
  { label: 'Hora fin', keys: ['hora_fin', 'end_time', 'fin'] },
]));

const getAttachmentName = (file) => {
  return file.nombre_archivo || file.name || file.nombre || file.filename || 'Adjunto sin nombre';
};

const getAttachmentUrl = (file) => {
  return file.url || file.archivo || file.file || file.download_url || file.archivo_url || '';
};

const getAttachmentDate = (file) => {
  return file.fecha_carga || file.created_at || file.fecha || '';
};

const getHistoryPrevious = (item) => item.estado_anterior || item.previous_status || '';
const getHistoryNext = (item) => item.estado_nuevo || item.new_status || '';
const getHistoryReason = (item) => item.motivo || item.reason || '';
const getHistoryDate = (item) => item.fecha_cambio || item.changed_at || '';

const loadRequest = async (clearActionMessage = true) => {
  loading.value = true;
  error.value = '';
  if (clearActionMessage) actionMessage.value = '';

  try {
    detail.value = await requestService.getRequest(route.params.id);
    syncSelectedTechnicians();
    syncStatusForm();
  } catch (err) {
    error.value = getErrorMessage(err);
  } finally {
    loading.value = false;
  }
};

const runAction = async (callback, successMessage) => {
  actionLoading.value = true;
  error.value = '';
  actionMessage.value = '';

  try {
    await callback();
    await loadRequest(false);
    actionMessage.value = successMessage;
  } catch (err) {
    error.value = getErrorMessage(err);
  } finally {
    actionLoading.value = false;
  }
};

const approve = () => {
  runAction(
    () => requestService.approveRequest(route.params.id),
    'Solicitud aprobada correctamente.',
  );
};

const changeStatus = () => {
  if (!statusOptions.value.some((option) => option.value === statusForm.value.estado)) {
    error.value = 'El rol actual no puede aplicar ese estado.';
    return;
  }

  runAction(
    () => requestService.changeRequestStatus(route.params.id, statusForm.value.estado, statusForm.value.motivo),
    'Estado actualizado correctamente.',
  );
};

const loadTechnicians = async () => {
  actionLoading.value = true;
  error.value = '';

  try {
    const response = await requestService.getAvailableTechnicians(route.params.id);
    technicians.value = response.tecnicos || response.technicians || [];
  } catch (err) {
    error.value = getErrorMessage(err);
  } finally {
    actionLoading.value = false;
  }
};

const reassign = () => {
  if (!selectedTechnicians.value.length) {
    error.value = 'Selecciona al menos un técnico para asignar.';
    return;
  }

  runAction(
    () => requestService.reassignTechnicians(route.params.id, selectedTechnicians.value.map(Number)),
    'Técnicos asignados correctamente.',
  );
};

const resetInterventionForm = () => {
  interventionForm.value = {
    descripcion: '',
    diagnostico: '',
    acciones_realizadas: '',
    repuestos: '',
    observaciones: '',
    tiempo_invertido_horas: 1,
  };
};

const registerIntervention = () => {
  if (!interventionForm.value.descripcion.trim()) {
    error.value = 'La descripción de la intervención es obligatoria.';
    return;
  }
  if (!interventionForm.value.acciones_realizadas.trim()) {
    error.value = 'Indica las acciones realizadas.';
    return;
  }

  runAction(
    async () => {
      await requestService.createIntervention(route.params.id, {
        descripcion: interventionForm.value.descripcion.trim(),
        diagnostico: interventionForm.value.diagnostico.trim(),
        acciones_realizadas: interventionForm.value.acciones_realizadas.trim(),
        repuestos: interventionForm.value.repuestos.trim(),
        observaciones: interventionForm.value.observaciones.trim(),
        tiempo_invertido_horas: Number(interventionForm.value.tiempo_invertido_horas) || 0,
      });
      resetInterventionForm();
    },
    'Intervención registrada correctamente.',
  );
};

const onFileChange = (event) => {
  attachment.value.file = event.target.files?.[0] || null;
};

const uploadAttachment = () => {
  if (!attachment.value.file) {
    error.value = 'Debe seleccionar un archivo.';
    return;
  }

  const formData = new FormData();
  formData.append('archivo', attachment.value.file);
  formData.append('tipo', attachment.value.tipo);
  formData.append('descripcion', attachment.value.descripcion);
  formData.append('nombre_archivo', attachment.value.file.name);

  runAction(
    async () => {
      await requestService.uploadAttachment(route.params.id, formData);
      attachment.value = { file: null, descripcion: '', tipo: 'documento' };
      if (fileInput.value) fileInput.value.value = '';
    },
    'Adjunto cargado correctamente.',
  );
};

onMounted(async () => {
  await loadRequest();
  if (canAssignTechnicians.value) {
    await loadTechnicians();
  }
});
</script>

<template>
  <div class="page">
    <header class="page-header">
      <div>
        <h1>Detalle de solicitud</h1>
        <p>ID {{ route.params.id }}</p>
      </div>
      <RouterLink class="btn secondary" to="/solicitudes">Volver</RouterLink>
    </header>

    <p v-if="loading" class="state" role="status">Cargando solicitud...</p>
    <p v-else-if="error && !solicitud" class="state error" role="alert">{{ error }}</p>

    <template v-else-if="solicitud">
      <section class="panel">
        <h2>Información general</h2>
        <dl class="detail-grid">
          <div>
            <dt>Estado</dt>
            <dd>{{ solicitud.estado }}</dd>
          </div>
          <div>
            <dt>Prioridad</dt>
            <dd>{{ solicitud.prioridad }}</dd>
          </div>
          <div>
            <dt>Usuario</dt>
            <dd>{{ solicitud.usuario?.name || solicitud.usuario?.nombre || solicitud.usuario || solicitud.user?.name || solicitud.user || 'Sin usuario' }}</dd>
          </div>
          <div>
            <dt>Fecha</dt>
            <dd>{{ solicitud.created_at || solicitud.fecha_creacion || 'Sin fecha' }}</dd>
          </div>
        </dl>
        <h3>Descripción</h3>
        <p>{{ solicitud.descripcion }}</p>
      </section>

      <section class="panel">
        <h2>Equipo</h2>
        <p v-if="!requestEquipment" class="state">Sin equipo asociado.</p>
        <dl v-else-if="equipmentFields.length" class="detail-grid compact">
          <div v-for="field in equipmentFields" :key="field.label">
            <dt>{{ field.label }}</dt>
            <dd>{{ field.value }}</dd>
          </div>
        </dl>
        <pre v-else class="json-preview">{{ formatPayload(requestEquipment) }}</pre>
      </section>

      <section v-if="solicitud.horario_agendado" class="panel">
        <h2>Horario</h2>
        <dl v-if="scheduleFields.length" class="detail-grid compact">
          <div v-for="field in scheduleFields" :key="field.label">
            <dt>{{ field.label }}</dt>
            <dd>{{ field.value }}</dd>
          </div>
        </dl>
        <pre v-else class="json-preview">{{ formatPayload(requestSchedule) }}</pre>
      </section>

      <section class="panel">
        <h2>Técnicos asignados</h2>
        <p v-if="!assignedTechnicians.length" class="state">No hay técnicos asignados.</p>
        <ul v-else class="simple-list">
          <li v-for="tech in assignedTechnicians" :key="tech.id">
            {{ tech.name || tech.nombre || tech.email || tech.id }}
          </li>
        </ul>
      </section>

      <section class="panel">
        <h2>Adjuntos</h2>
        <p v-if="!attachments.length" class="state">No hay adjuntos cargados.</p>
        <ul v-else class="attachment-list">
          <li v-for="file in attachments" :key="file.id || file.adjunto_id">
            <div>
              <strong>{{ getAttachmentName(file) }}</strong>
              <span v-if="file.tipo"> · {{ file.tipo }}</span>
              <p v-if="file.descripcion">{{ file.descripcion }}</p>
              <small v-if="getAttachmentDate(file)">{{ getAttachmentDate(file) }}</small>
            </div>
            <a v-if="getAttachmentUrl(file)" class="table-link" :href="getAttachmentUrl(file)" target="_blank" rel="noopener">
              Descargar
            </a>
          </li>
        </ul>

        <form v-if="canUploadAttachments" class="form" @submit.prevent="uploadAttachment">
          <label>
            Archivo
            <input ref="fileInput" type="file" @change="onFileChange" />
          </label>
          <label>
            Tipo
            <select v-model="attachment.tipo">
              <option value="imagen">Imagen</option>
              <option value="documento">Documento</option>
              <option value="video">Video</option>
              <option value="otro">Otro</option>
            </select>
          </label>
          <label>
            Descripción
            <input v-model="attachment.descripcion" type="text" />
          </label>
          <p class="hint">Formatos permitidos: imágenes, PDF, Office, texto, video y ZIP. Tamaño máximo: 10 MB.</p>
          <button class="btn" type="submit" :disabled="actionLoading">Subir adjunto</button>
        </form>
      </section>

      <section class="panel">
        <h2>Historial de estados</h2>
        <p v-if="!statusHistory.length" class="state">Aún no hay cambios registrados.</p>
        <ul v-else class="simple-list">
          <li v-for="item in statusHistory" :key="item.id || `${getHistoryDate(item)}-${getHistoryNext(item)}`">
            {{ getHistoryPrevious(item) }} -> {{ getHistoryNext(item) }} · {{ getHistoryReason(item) }}
          </li>
        </ul>
      </section>

      <section v-if="interventions.length" class="panel">
        <h2>Intervenciones</h2>
        <ul class="simple-list">
          <li v-for="item in interventions" :key="item.id">
            <strong>{{ item.descripcion || item.description }}</strong>
            <span v-if="item.observaciones || item.observations"> · {{ item.observaciones || item.observations }}</span>
          </li>
        </ul>
      </section>

      <section class="panel">
        <h2>Cambio de estado</h2>
        <form v-if="canChangeStatus" class="form split" @submit.prevent="changeStatus">
          <label>
            Estado
            <select v-model="statusForm.estado">
              <option v-for="option in statusOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </label>
          <label>
            Motivo
            <input v-model="statusForm.motivo" type="text" required />
          </label>
          <button class="btn" type="submit" :disabled="actionLoading">Cambiar estado</button>
        </form>
        <p v-else class="state">No tienes permisos para cambiar el estado.</p>
      </section>

      <section v-if="canRegisterInterventions" class="panel">
        <h2>Registrar intervención</h2>
        <form class="form" @submit.prevent="registerIntervention">
          <div class="split">
            <label>
              Descripción
              <input v-model="interventionForm.descripcion" type="text" placeholder="Resumen del trabajo" />
            </label>
            <label>
              Tiempo invertido (horas)
              <input v-model.number="interventionForm.tiempo_invertido_horas" type="number" min="0" step="0.5" />
            </label>
          </div>
          <label>
            Diagnóstico
            <textarea v-model="interventionForm.diagnostico" rows="3" placeholder="Hallazgo técnico" />
          </label>
          <label>
            Acciones realizadas
            <textarea v-model="interventionForm.acciones_realizadas" rows="3" required />
          </label>
          <div class="split">
            <label>
              Repuestos
              <input v-model="interventionForm.repuestos" type="text" placeholder="Opcional" />
            </label>
            <label>
              Observaciones
              <input v-model="interventionForm.observaciones" type="text" placeholder="Opcional" />
            </label>
          </div>
          <button class="btn" type="submit" :disabled="actionLoading">Registrar intervención</button>
        </form>
      </section>

      <section v-if="canAssignTechnicians" class="panel">
        <h2>Asignar técnicos</h2>
        <div class="actions">
          <button class="btn secondary" type="button" :disabled="actionLoading" @click="loadTechnicians">
            Actualizar lista
          </button>
        </div>

        <p v-if="actionLoading && !technicians.length" class="state" role="status">Cargando técnicos disponibles...</p>
        <p v-else-if="!technicians.length" class="state">No hay técnicos disponibles para asignar.</p>
        <form v-if="technicians.length" class="form" @submit.prevent="reassign">
          <fieldset class="technician-list">
            <legend>Técnicos disponibles</legend>
            <label v-for="tech in technicians" :key="getTechnicianId(tech)" class="technician-option">
              <input
                v-model="selectedTechnicians"
                type="checkbox"
                :value="getTechnicianId(tech)"
                :disabled="actionLoading"
              />
              <span>
                <strong>{{ tech.name || tech.nombre || tech.email || tech.id }}</strong>
                <small>
                  {{ getTechnicianSpecialty(tech) }}
                  <span v-if="tech.email"> · {{ tech.email }}</span>
                  <span> · {{ getTechnicianLoad(tech) }} solicitudes activas</span>
                </small>
              </span>
              <em v-if="isTechnicianSelected(tech)">Asignado</em>
            </label>
          </fieldset>
          <button class="btn" type="submit" :disabled="actionLoading">Guardar asignación</button>
        </form>
      </section>

      <section v-if="canApproveRequests" class="panel">
        <h2>Acciones de laboratorista</h2>
        <div class="actions">
          <button class="btn" type="button" :disabled="actionLoading" @click="approve">
            Aprobar solicitud
          </button>
        </div>
      </section>

      <p v-if="error" class="state error" role="alert">{{ error }}</p>
      <p v-if="actionMessage" class="state success" role="status">{{ actionMessage }}</p>
    </template>
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

.panel {
  margin-top: 18px;
  background: #fff;
  border: 1px solid #e2e5e8;
  border-radius: 8px;
  padding: 20px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 14px;
  margin: 0 0 18px;
}

.compact {
  margin-bottom: 0;
}

dt {
  font-weight: 700;
  color: #04325e;
}

dd {
  margin: 4px 0 0;
}

.form {
  display: grid;
  gap: 12px;
  margin-top: 16px;
}

.split {
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  align-items: end;
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

select[multiple] {
  min-height: 120px;
}

fieldset {
  border: 1px solid #d7dde2;
  border-radius: 8px;
  padding: 14px;
}

legend {
  padding: 0 6px;
  color: #04325e;
  font-weight: 700;
}

.technician-list {
  display: grid;
  gap: 10px;
}

.technician-option {
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border: 1px solid #edf0f2;
  border-radius: 8px;
  background: #f8fafc;
}

.technician-option small,
.technician-option em {
  display: block;
  color: #59636e;
  font-size: 0.9rem;
}

.technician-option em {
  color: #1f7a3a;
  font-style: normal;
  font-weight: 700;
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

.btn:disabled {
  opacity: 0.7;
  cursor: wait;
}

.secondary {
  background: #5f6b76;
}

.state {
  margin-top: 18px;
  padding: 14px;
}

.error {
  color: #a72820;
}

.success {
  color: #1f7a3a;
}

.json-preview {
  max-height: 260px;
  overflow: auto;
  white-space: pre-wrap;
  background: #f7f8fa;
  border: 1px solid #e2e5e8;
  border-radius: 6px;
  padding: 14px;
}

.simple-list {
  margin: 0;
  padding-left: 20px;
}

.attachment-list {
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.attachment-list li {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  border: 1px solid #edf0f2;
  border-radius: 6px;
  padding: 12px;
}

.attachment-list p {
  margin: 4px 0;
  color: #59636e;
}

.attachment-list small {
  color: #59636e;
}

.hint {
  color: #59636e;
  font-size: 0.92rem;
}
</style>
