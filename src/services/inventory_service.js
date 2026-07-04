import api from './auth_service';
import { isDemoMode } from './auth_service';

const DEMO_EQUIPMENT_KEY = 'syslab_demo_equipment';
const DEMO_LABS_KEY = 'syslab_demo_laboratories';
const LOCAL_LABS_KEY = 'syslab_local_laboratories';
const LOCAL_SCHEDULES_KEY = 'syslab_local_schedules';
const DEMO_SCHEDULES_KEY = 'syslab_demo_schedules';
const DEMO_NEXT_EQUIPMENT_ID_KEY = 'syslab_demo_next_equipment_id';
const DEMO_NEXT_LAB_ID_KEY = 'syslab_demo_next_lab_id';
const DEMO_NEXT_SCHEDULE_ID_KEY = 'syslab_demo_next_schedule_id';

const initialDemoEquipment = [
  {
    id: 1,
    name: 'Microscopio Optico',
    inventory_code: 'EQ-001',
    location: 'Laboratorio 101',
    status: 'operativo',
    criticality: 'alta',
  },
  {
    id: 2,
    name: 'Osciloscopio Digital',
    inventory_code: 'EQ-014',
    location: 'Laboratorio Electronica',
    status: 'en_mantenimiento',
    criticality: 'media',
  },
  {
    id: 3,
    name: 'Equipo de Computo Dell',
    inventory_code: 'EQ-028',
    location: 'Sala de Sistemas',
    status: 'operativo',
    criticality: 'baja',
  },
];

const initialDemoLaboratories = [
  {
    id: 1,
    name: 'Laboratorio 101',
    location: 'Bloque A',
    description: 'Laboratorio de equipos opticos.',
  },
  {
    id: 2,
    name: 'Sala de Sistemas',
    location: 'Bloque B',
    description: 'Sala para equipos de computo.',
  },
];

const initialDemoSchedules = [
  { id: 4, laboratorio: 'Laboratorio 101', dia: 'lunes', hora_inicio: '08:00', hora_fin: '10:00', disponible: true },
  { id: 5, laboratorio: 'Laboratorio 101', dia: 'miercoles', hora_inicio: '14:00', hora_fin: '16:00', disponible: true },
  { id: 6, laboratorio: 'Sala de Sistemas', dia: 'martes', hora_inicio: '09:00', hora_fin: '11:00', disponible: true },
];

const clone = (value) => JSON.parse(JSON.stringify(value));

const readCollection = (key, initialValue, nextKey, nextId) => {
  const stored = localStorage.getItem(key);
  if (stored) return JSON.parse(stored);

  const initial = clone(initialValue);
  localStorage.setItem(key, JSON.stringify(initial));
  localStorage.setItem(nextKey, String(nextId));
  return initial;
};

const writeCollection = (key, items) => {
  localStorage.setItem(key, JSON.stringify(items));
};

const getNextId = (key, initialValue) => {
  const nextId = Number(localStorage.getItem(key) || initialValue);
  localStorage.setItem(key, String(nextId + 1));
  return nextId;
};

const normalizeEquipmentResponse = (payload) => {
  if (Array.isArray(payload)) return { total: payload.length, equipos: payload };
  if (Array.isArray(payload?.equipos)) return { ...payload, equipos: payload.equipos };
  if (Array.isArray(payload?.equipment)) return { ...payload, equipos: payload.equipment };
  if (Array.isArray(payload?.results)) return { ...payload, equipos: payload.results };
  return { ...payload, equipos: [] };
};

const normalizeLaboratoriesResponse = (payload) => {
  if (Array.isArray(payload)) return { laboratorios: payload.map(normalizeLaboratoryItem) };
  if (Array.isArray(payload?.laboratorios)) return { ...payload, laboratorios: payload.laboratorios.map(normalizeLaboratoryItem) };
  if (Array.isArray(payload?.laboratories)) return { ...payload, laboratorios: payload.laboratories.map(normalizeLaboratoryItem) };
  if (Array.isArray(payload?.results)) return { ...payload, laboratorios: payload.results.map(normalizeLaboratoryItem) };
  return { ...payload, laboratorios: [] };
};

const normalizeLaboratoryItem = (item) => {
  if (typeof item === 'string') {
    return { id: item, name: item, location: '', description: '' };
  }

  return item;
};

const readLocalLaboratories = () => {
  const stored = localStorage.getItem(LOCAL_LABS_KEY);
  return stored ? JSON.parse(stored) : [];
};

const writeLocalLaboratories = (items) => {
  localStorage.setItem(LOCAL_LABS_KEY, JSON.stringify(items));
};

const readLocalSchedules = (key = LOCAL_SCHEDULES_KEY) => {
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : [];
};

const writeLocalSchedules = (items, key = LOCAL_SCHEDULES_KEY) => {
  localStorage.setItem(key, JSON.stringify(items));
};

const mergeLaboratories = (apiLaboratories, localLaboratories) => {
  const seen = new Set();
  return [...apiLaboratories, ...localLaboratories]
    .map(normalizeLaboratoryItem)
    .filter((item) => {
      const name = item.name || item.nombre;
      if (!name || seen.has(name)) return false;
      seen.add(name);
      return true;
    });
};

export const inventoryService = {
  getDemoEquipment() {
    return readCollection(DEMO_EQUIPMENT_KEY, initialDemoEquipment, DEMO_NEXT_EQUIPMENT_ID_KEY, 4);
  },

  getDemoLaboratories() {
    return readCollection(DEMO_LABS_KEY, initialDemoLaboratories, DEMO_NEXT_LAB_ID_KEY, 3);
  },

  getDemoSchedules() {
    return readCollection(DEMO_SCHEDULES_KEY, initialDemoSchedules, DEMO_NEXT_SCHEDULE_ID_KEY, 7);
  },

  getLocalSchedules(laboratorio = '') {
    const schedules = isDemoMode() ? this.getDemoSchedules() : readLocalSchedules();
    if (!laboratorio) return schedules;
    return schedules.filter((item) => item.laboratorio === laboratorio);
  },

  mergeSchedules(apiSchedules = [], localSchedules = []) {
    const seen = new Set();
    return [...apiSchedules, ...localSchedules].filter((item) => {
      const key = item.id || `${item.laboratorio}-${item.dia}-${item.hora_inicio}-${item.hora_fin}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  },

  async listEquipment() {
    if (isDemoMode()) {
      const equipos = this.getDemoEquipment();
      return { total: equipos.length, equipos };
    }

    const res = await api.get('/equipment/');
    return normalizeEquipmentResponse(res.data);
  },

  async createEquipment(data) {
    if (isDemoMode()) {
      const equipos = this.getDemoEquipment();
      const equipo = {
        id: getNextId(DEMO_NEXT_EQUIPMENT_ID_KEY, 4),
        name: data.name,
        inventory_code: data.inventory_code,
        brand: data.brand,
        model: data.model,
        serial_number: data.serial_number,
        location: data.location,
        status: data.status || 'operativo',
        criticality: data.criticality || 'media',
      };

      equipos.push(equipo);
      writeCollection(DEMO_EQUIPMENT_KEY, equipos);
      return { message: 'Equipo creado correctamente.', equipo };
    }

    const res = await api.post('/equipment/register/', data);
    return res.data;
  },

  async updateEquipment(equipmentId, data) {
    if (isDemoMode()) {
      const equipos = this.getDemoEquipment();
      const index = equipos.findIndex((item) => Number(item.id) === Number(equipmentId));
      if (index === -1) throw new Error('Equipo demo no encontrado.');
      equipos[index] = { ...equipos[index], ...data };
      writeCollection(DEMO_EQUIPMENT_KEY, equipos);
      return { message: 'Equipo actualizado correctamente.', equipment: equipos[index] };
    }

    const res = await api.patch(`/equipment/${equipmentId}/update/`, data);
    return res.data;
  },

  async checkAvailability(equipmentId) {
    if (isDemoMode()) {
      const equipment = this.getDemoEquipment().find((item) => Number(item.id) === Number(equipmentId));
      if (!equipment) throw new Error('Equipo demo no encontrado.');
      return { message: 'Equipo disponible.', equipment };
    }

    const res = await api.get(`/equipment/${equipmentId}/availability/`);
    return res.data;
  },

  async getEquipmentHistory(equipmentId) {
    if (isDemoMode()) {
      const equipment = this.getDemoEquipment().find((item) => Number(item.id) === Number(equipmentId));
      if (!equipment) throw new Error('Equipo demo no encontrado.');
      return { equipment, maintenance_requests: [] };
    }

    const res = await api.get(`/equipment/${equipmentId}/history/`);
    return res.data;
  },

  async decommissionEquipment(equipmentId, reason) {
    if (isDemoMode()) {
      const equipos = this.getDemoEquipment();
      const index = equipos.findIndex((item) => Number(item.id) === Number(equipmentId));
      if (index === -1) throw new Error('Equipo demo no encontrado.');
      equipos[index] = {
        ...equipos[index],
        status: 'dado_de_baja',
        decommission_reason: reason,
        decommission_date: new Date().toISOString(),
      };
      writeCollection(DEMO_EQUIPMENT_KEY, equipos);
      return { message: 'Equipo dado de baja correctamente.', equipment: equipos[index] };
    }

    const res = await api.patch(`/equipment/${equipmentId}/decommission/`, { reason });
    return res.data;
  },

  async updateCriticality(equipmentId, criticality) {
    if (isDemoMode()) {
      return this.updateEquipment(equipmentId, { criticality });
    }

    const res = await api.patch(`/equipment/${equipmentId}/criticality/`, { criticality });
    return res.data;
  },

  async listLaboratories() {
    if (isDemoMode()) {
      return { laboratorios: this.getDemoLaboratories() };
    }

    let apiResponse;
    try {
      const res = await api.get('/solicitudes/horario/');
      apiResponse = normalizeLaboratoriesResponse(res.data);
    } catch (err) {
      const localLaboratories = readLocalLaboratories();
      if (localLaboratories.length === 0) throw err;
      apiResponse = { laboratorios: [] };
    }

    return {
      ...apiResponse,
      laboratorios: mergeLaboratories(apiResponse.laboratorios, readLocalLaboratories()),
    };
  },

  async createLaboratory(data) {
    if (isDemoMode()) {
      const laboratorios = this.getDemoLaboratories();
      const laboratorio = {
        id: getNextId(DEMO_NEXT_LAB_ID_KEY, 3),
        name: data.name,
        location: data.location,
        description: data.description,
      };

      laboratorios.push(laboratorio);
      writeCollection(DEMO_LABS_KEY, laboratorios);
      return { message: 'Laboratorio creado correctamente.', laboratorio };
    }

    const laboratorios = readLocalLaboratories();
    const laboratorio = {
      id: `local-${Date.now()}`,
      name: data.name,
      location: data.location,
      description: data.description,
    };

    laboratorios.push(laboratorio);
    writeLocalLaboratories(laboratorios);
    return { message: 'Laboratorio agregado localmente.', laboratorio };
  },

  async createSchedule(data) {
    const key = isDemoMode() ? DEMO_SCHEDULES_KEY : LOCAL_SCHEDULES_KEY;
    const schedules = isDemoMode() ? this.getDemoSchedules() : readLocalSchedules();
    const schedule = {
      id: isDemoMode()
        ? getNextId(DEMO_NEXT_SCHEDULE_ID_KEY, 7)
        : `local-schedule-${Date.now()}`,
      laboratorio: data.laboratorio,
      dia: data.dia,
      hora_inicio: data.hora_inicio,
      hora_fin: data.hora_fin,
      disponible: data.disponible !== false,
    };

    schedules.push(schedule);
    writeLocalSchedules(schedules, key);
    return { message: 'Horario agregado correctamente.', horario: schedule };
  },
};
