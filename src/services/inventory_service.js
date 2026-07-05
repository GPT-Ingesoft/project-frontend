import api from './auth_service';
import { isDemoMode } from './auth_service';

const DEMO_EQUIPMENT_KEY = 'syslab_demo_equipment';
const DEMO_LABS_KEY = 'syslab_demo_laboratories';
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
  { id: 4, laboratory: 'Laboratorio 101', laboratory_id: 1, day: 'lunes', day_display: 'Lunes', start_time: '08:00', end_time: '10:00', available: true },
  { id: 5, laboratory: 'Laboratorio 101', laboratory_id: 1, day: 'miercoles', day_display: 'Miercoles', start_time: '14:00', end_time: '16:00', available: true },
  { id: 6, laboratory: 'Sala de Sistemas', laboratory_id: 2, day: 'martes', day_display: 'Martes', start_time: '09:00', end_time: '11:00', available: true },
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

const normalizeScheduleItem = (item) => ({
  ...item,
  laboratorio: item.laboratorio || item.laboratory || '',
  laboratory: item.laboratory || item.laboratorio || '',
  laboratory_id: item.laboratory_id || item.laboratorio_id || null,
  dia: item.dia || item.day_display || item.day || '',
  day: item.day || item.dia || '',
  hora_inicio: item.hora_inicio || item.start_time || '',
  start_time: item.start_time || item.hora_inicio || '',
  hora_fin: item.hora_fin || item.end_time || '',
  end_time: item.end_time || item.hora_fin || '',
  disponible: item.disponible !== undefined ? item.disponible : item.available !== false,
  available: item.available !== undefined ? item.available : item.disponible !== false,
});

const normalizeSchedulesResponse = (payload) => {
  const schedules = Array.isArray(payload)
    ? payload
    : payload?.horarios || payload?.schedules || payload?.results || [];
  return {
    ...(Array.isArray(payload) ? {} : payload),
    horarios: schedules.map(normalizeScheduleItem),
  };
};

const readDemoSchedules = (key = DEMO_SCHEDULES_KEY) => {
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : [];
};

const writeDemoSchedules = (items, key = DEMO_SCHEDULES_KEY) => {
  localStorage.setItem(key, JSON.stringify(items));
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
    const schedules = this.getDemoSchedules().map(normalizeScheduleItem);
    if (!laboratorio) return schedules;
    return schedules.filter((item) => item.laboratorio === laboratorio || item.laboratory === laboratorio);
  },

  mergeSchedules(apiSchedules = [], localSchedules = []) {
    const seen = new Set();
    return [...apiSchedules, ...localSchedules].map(normalizeScheduleItem).filter((item) => {
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

    const res = await api.get('/laboratories/');
    return normalizeLaboratoriesResponse(res.data);
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

    const res = await api.post('/laboratories/', {
      name: data.name,
      location: data.location,
      description: data.description,
      active: data.active !== false,
    });
    return res.data;
  },

  async updateLaboratory(laboratoryId, data) {
    if (isDemoMode()) {
      const laboratorios = this.getDemoLaboratories();
      const index = laboratorios.findIndex((item) => Number(item.id) === Number(laboratoryId));
      if (index === -1) throw new Error('Laboratorio demo no encontrado.');
      laboratorios[index] = { ...laboratorios[index], ...data };
      writeCollection(DEMO_LABS_KEY, laboratorios);
      return { message: 'Laboratorio actualizado correctamente.', laboratorio: laboratorios[index] };
    }

    const res = await api.patch(`/laboratories/${laboratoryId}/`, data);
    return res.data;
  },

  async deleteLaboratory(laboratoryId) {
    if (isDemoMode()) {
      const laboratorios = this.getDemoLaboratories().filter((item) => Number(item.id) !== Number(laboratoryId));
      writeCollection(DEMO_LABS_KEY, laboratorios);
      return { message: 'Laboratorio eliminado correctamente.' };
    }

    const res = await api.delete(`/laboratories/${laboratoryId}/`);
    return res.data;
  },

  async listSchedules(laboratoryId = '') {
    if (isDemoMode()) {
      const schedules = this.getDemoSchedules().map(normalizeScheduleItem);
      return {
        horarios: laboratoryId
          ? schedules.filter((item) => Number(item.laboratory_id) === Number(laboratoryId))
          : schedules,
      };
    }

    const params = laboratoryId ? { laboratory_id: laboratoryId } : {};
    const res = await api.get('/schedules/', { params });
    return normalizeSchedulesResponse(res.data);
  },

  async createSchedule(data) {
    if (isDemoMode()) {
      const schedules = this.getDemoSchedules();
      const schedule = {
        id: getNextId(DEMO_NEXT_SCHEDULE_ID_KEY, 7),
        laboratory: data.laboratory || data.laboratorio,
        laboratory_id: data.laboratory_id || null,
        day: data.day || data.dia,
        day_display: data.day_display || data.day || data.dia,
        start_time: data.start_time || data.hora_inicio,
        end_time: data.end_time || data.hora_fin,
        available: data.available !== undefined ? data.available : data.disponible !== false,
      };

      schedules.push(schedule);
      writeDemoSchedules(schedules);
      return { message: 'Horario agregado correctamente.', horario: normalizeScheduleItem(schedule) };
    }

    const res = await api.post('/schedules/', {
      laboratory_id: data.laboratory_id || undefined,
      laboratory: data.laboratory || data.laboratorio || undefined,
      day: data.day || data.dia,
      start_time: data.start_time || data.hora_inicio,
      end_time: data.end_time || data.hora_fin,
      available: data.available !== undefined ? data.available : data.disponible !== false,
    });
    return res.data;
  },

  async updateSchedule(scheduleId, data) {
    if (isDemoMode()) {
      const schedules = this.getDemoSchedules();
      const index = schedules.findIndex((item) => Number(item.id) === Number(scheduleId));
      if (index === -1) throw new Error('Horario demo no encontrado.');
      schedules[index] = {
        ...schedules[index],
        laboratory: data.laboratory || data.laboratorio || schedules[index].laboratory,
        laboratory_id: data.laboratory_id || schedules[index].laboratory_id || null,
        day: data.day || data.dia || schedules[index].day,
        day_display: data.day_display || data.day || data.dia || schedules[index].day_display,
        start_time: data.start_time || data.hora_inicio || schedules[index].start_time,
        end_time: data.end_time || data.hora_fin || schedules[index].end_time,
        available: data.available !== undefined ? data.available : data.disponible !== false,
      };
      writeDemoSchedules(schedules);
      return { message: 'Horario actualizado correctamente.', horario: normalizeScheduleItem(schedules[index]) };
    }

    const res = await api.patch(`/schedules/${scheduleId}/`, data);
    return res.data;
  },

  async deleteSchedule(scheduleId) {
    if (isDemoMode()) {
      const schedules = this.getDemoSchedules().filter((item) => Number(item.id) !== Number(scheduleId));
      writeDemoSchedules(schedules);
      return { message: 'Horario eliminado correctamente.' };
    }

    const res = await api.delete(`/schedules/${scheduleId}/`);
    return res.data;
  },
};
