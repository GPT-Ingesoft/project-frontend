import api from './auth_service';
import { isDemoMode } from './auth_service';
import { inventoryService } from './inventory_service';

const DEMO_REQUESTS_KEY = 'syslab_demo_requests';
const DEMO_NEXT_ID_KEY = 'syslab_demo_next_request_id';

const demoEquipment = {
  id: 1,
  name: 'Microscopio Optico',
  inventory_code: 'EQ-001',
  location: 'Laboratorio 101',
  status: 'operativo',
  criticality: 'alta',
};

const initialDemoRequests = [
  {
    id: 12,
    estado: 'pendiente',
    prioridad: 'alta',
    descripcion: 'El microscopio no enciende y requiere revision tecnica.',
    usuario: 'Ana Torres',
    created_at: '2026-06-29T10:30:00',
    equipo: demoEquipment,
    datos_equipo_solicitado: null,
    horario_agendado: {
      laboratorio: 'Laboratorio 101',
      dia: 'lunes',
      hora_inicio: '08:00',
      hora_fin: '10:00',
    },
    tecnicos_asignados: [],
    adjuntos: [],
    historial_estados: [],
  },
  {
    id: 13,
    estado: 'en_proceso',
    prioridad: 'media',
    descripcion: 'Osciloscopio con lectura inestable.',
    usuario: 'Carlos Ruiz',
    created_at: '2026-06-29T14:15:00',
    equipo: {
      id: 2,
      name: 'Osciloscopio Digital',
      inventory_code: 'EQ-014',
      location: 'Laboratorio Electronica',
      status: 'en_mantenimiento',
      criticality: 'media',
    },
    datos_equipo_solicitado: null,
    horario_agendado: null,
    tecnicos_asignados: [{ id: 8, name: 'Carlos Ruiz', email: 'cruiz@unal.edu.co' }],
    adjuntos: [],
    historial_estados: [],
  },
];

const demoTechnicians = [
  {
    id: 8,
    name: 'Carlos Ruiz',
    email: 'cruiz@unal.edu.co',
    specialty: 'Electronica',
    contact: '3101234567',
  },
  {
    id: 11,
    name: 'Laura Gomez',
    email: 'lgomez@unal.edu.co',
    specialty: 'Equipos de laboratorio',
    contact: '3107654321',
  },
];

const clone = (value) => JSON.parse(JSON.stringify(value));

const readDemoRequests = () => {
  const stored = localStorage.getItem(DEMO_REQUESTS_KEY);
  if (stored) return JSON.parse(stored);

  const initial = clone(initialDemoRequests);
  localStorage.setItem(DEMO_REQUESTS_KEY, JSON.stringify(initial));
  localStorage.setItem(DEMO_NEXT_ID_KEY, '14');
  return initial;
};

const writeDemoRequests = (requests) => {
  localStorage.setItem(DEMO_REQUESTS_KEY, JSON.stringify(requests));
};

const getNextDemoId = () => {
  const nextId = Number(localStorage.getItem(DEMO_NEXT_ID_KEY) || '14');
  localStorage.setItem(DEMO_NEXT_ID_KEY, String(nextId + 1));
  return nextId;
};

const findDemoRequest = (id) => {
  const requestId = Number(id);
  const requests = readDemoRequests();
  const request = requests.find((item) => item.id === requestId);
  if (!request) throw new Error(`No existe una solicitud demo con ID ${requestId}.`);
  return { requests, request };
};

const saveDemoRequest = (updatedRequest) => {
  const requests = readDemoRequests();
  const index = requests.findIndex((item) => item.id === updatedRequest.id);
  if (index === -1) requests.push(updatedRequest);
  else requests[index] = updatedRequest;
  writeDemoRequests(requests);
};

const normalizeRequestsResponse = (payload) => {
  if (Array.isArray(payload)) return { solicitudes: payload };
  if (Array.isArray(payload?.solicitudes)) return { ...payload, solicitudes: payload.solicitudes };
  if (Array.isArray(payload?.solicitudes_activas)) {
    return {
      ...payload,
      solicitudes: payload.solicitudes_activas,
      solicitudes_pendientes: payload.solicitudes_pendientes || [],
    };
  }
  if (Array.isArray(payload?.results)) return { ...payload, solicitudes: payload.results };
  return { ...payload, solicitudes: [] };
};

const normalizeScheduleResponse = (payload, laboratorio = '') => {
  const schedules = Array.isArray(payload)
    ? payload
    : payload?.horarios || payload?.schedules || payload?.results || [];

  return {
    ...(Array.isArray(payload) ? {} : payload),
    laboratorio: payload?.laboratorio || laboratorio,
    horarios: schedules,
  };
};

export const requestService = {
  async listRequests() {
    if (isDemoMode()) {
      return { solicitudes: readDemoRequests() };
    }

    const res = await api.get('/panel/solicitudes/');
    return normalizeRequestsResponse(res.data);
  },

  async createRequest(data) {
    if (isDemoMode()) {
      const solicitud = {
        id: getNextDemoId(),
        estado: 'pendiente',
        prioridad: data.prioridad || 'media',
        descripcion: data.descripcion,
        usuario: 'Usuario Demo',
        created_at: new Date().toISOString(),
        equipo: data.equipo_id ? { ...demoEquipment, id: data.equipo_id } : null,
        datos_equipo_solicitado: data.datos_equipo || null,
        horario_agendado: data.horario_id
          ? {
              id: data.horario_id,
              laboratorio: data.datos_equipo?.location || demoEquipment.location,
              dia: 'lunes',
              hora_inicio: '08:00',
              hora_fin: '10:00',
            }
          : null,
        tecnicos_asignados: [],
        adjuntos: [],
        historial_estados: [],
      };

      saveDemoRequest(solicitud);

      return {
        message: 'Solicitud creada correctamente.',
        solicitud,
      };
    }

    const res = await api.post('/solicitudes/', data);
    return res.data;
  },

  async getRequest(id) {
    if (isDemoMode()) {
      return { solicitud: clone(findDemoRequest(id).request) };
    }

    const res = await api.get(`/solicitudes/${id}/`);
    return res.data;
  },

  async getLabSchedule(laboratorio = '') {
    if (isDemoMode()) {
      if (!laboratorio) {
        return {
          laboratorios: inventoryService
            .getDemoLaboratories()
            .map((item) => item.name || item.nombre)
            .filter(Boolean),
        };
      }
      const localSchedules = inventoryService.getLocalSchedules(laboratorio);
      return {
        laboratorio,
        horarios: localSchedules.filter((item) => item.disponible !== false),
      };
    }

    const params = laboratorio ? { laboratorio } : {};
    const localSchedules = laboratorio ? inventoryService.getLocalSchedules(laboratorio) : [];

    let apiResponse;
    try {
      const res = await api.get('/solicitudes/horario/', { params });
      if (!laboratorio) return res.data;
      apiResponse = normalizeScheduleResponse(res.data, laboratorio);
    } catch (err) {
      if (!laboratorio || localSchedules.length === 0) throw err;
      apiResponse = { laboratorio, horarios: [] };
    }

    return {
      ...apiResponse,
      horarios: inventoryService.mergeSchedules(apiResponse.horarios, localSchedules),
    };
  },

  async getAvailableTechnicians(solicitudId) {
    if (isDemoMode()) {
      findDemoRequest(solicitudId);
      return { total: demoTechnicians.length, tecnicos: clone(demoTechnicians) };
    }

    const res = await api.get(`/solicitudes/${solicitudId}/tecnicos-disponibles/`);
    return res.data;
  },

  async approveRequest(solicitudId) {
    if (isDemoMode()) {
      const { request } = findDemoRequest(solicitudId);
      const updated = {
        ...request,
        estado: 'en_proceso',
        historial_estados: [
          ...(request.historial_estados || []),
          {
            estado_anterior: request.estado,
            estado_nuevo: 'en_proceso',
            motivo: 'Solicitud aprobada en modo demo.',
            fecha_cambio: new Date().toISOString(),
          },
        ],
      };
      saveDemoRequest(updated);

      return { message: 'Solicitud aprobada.', solicitud: updated };
    }

    const res = await api.patch(`/solicitudes/${solicitudId}/aprobar/`);
    return res.data;
  },

  async changeRequestStatus(solicitudId, estado, motivo) {
    if (isDemoMode()) {
      const { request } = findDemoRequest(solicitudId);
      const updated = {
        ...request,
        estado,
        historial_estados: [
          ...(request.historial_estados || []),
          {
            estado_anterior: request.estado,
            estado_nuevo: estado,
            motivo,
            fecha_cambio: new Date().toISOString(),
          },
        ],
      };
      saveDemoRequest(updated);

      return { message: `Estado actualizado a '${estado}'.`, solicitud: updated };
    }

    const res = await api.patch(`/solicitudes/${solicitudId}/estado/`, { estado, motivo });
    return res.data;
  },

  async reassignTechnicians(solicitudId, technicianIds) {
    if (isDemoMode()) {
      const { request } = findDemoRequest(solicitudId);
      const assigned = demoTechnicians.filter((tech) => technicianIds.includes(tech.id));
      const updated = {
        ...request,
        tecnicos_asignados: assigned,
      };
      saveDemoRequest(updated);

      return {
        message: 'Técnicos reasignados correctamente.',
        assignment: { solicitud_id: Number(solicitudId), technician_ids: technicianIds },
      };
    }

    const res = await api.patch(`/solicitudes/${solicitudId}/tecnicos/`, {
      technician_ids: technicianIds,
    });
    return res.data;
  },

  async uploadAttachment(solicitudId, formData) {
    if (isDemoMode()) {
      const { request } = findDemoRequest(solicitudId);
      const adjunto = {
        id: Date.now(),
        nombre_archivo: formData.get('nombre_archivo'),
        tipo: formData.get('tipo'),
        descripcion: formData.get('descripcion'),
        fecha_carga: new Date().toISOString(),
      };
      const updated = {
        ...request,
        adjuntos: [...(request.adjuntos || []), adjunto],
      };
      saveDemoRequest(updated);

      return {
        message: 'Archivo adjunto cargado correctamente.',
        adjunto,
      };
    }

    const res = await api.post(`/solicitudes/${solicitudId}/adjuntos/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
};
