import api from './auth_service';
import { isDemoMode } from './auth_service';
import { inventoryService } from './inventory_service';
import { requestService } from './request_service';

const normalizeRequestDashboard = (payload) => {
  if (Array.isArray(payload?.solicitudes)) return payload;
  const active = payload?.solicitudes_activas || [];
  const pending = payload?.solicitudes_pendientes || [];
  return {
    ...payload,
    solicitudes: active.length ? active : pending,
    solicitudes_activas: active,
    solicitudes_pendientes: pending,
    total_pendientes: payload?.total_pendientes ?? pending.length,
    total_activas: payload?.total_activas ?? active.length,
  };
};

export const dashboardService = {
  async getActiveEquipment() {
    if (isDemoMode()) {
      return inventoryService.listEquipment();
    }

    const res = await api.get('/panel/equipos-activos/');
    return res.data;
  },

  async getMaintenanceEquipment() {
    if (isDemoMode()) {
      const response = await inventoryService.listEquipment();
      return {
        equipos: (response.equipos || []).filter((item) => item.status === 'en_mantenimiento' || item.estado === 'en_mantenimiento'),
      };
    }

    const res = await api.get('/panel/equipos-mantenimiento/');
    return res.data;
  },

  async getDecommissionedEquipment() {
    if (isDemoMode()) {
      const response = await inventoryService.listEquipment();
      return {
        equipos: (response.equipos || []).filter((item) => item.status === 'dado_de_baja' || item.estado === 'dado_de_baja'),
      };
    }

    const res = await api.get('/panel/equipos-dados-de-baja/');
    return res.data;
  },

  async getRequestDashboard() {
    if (isDemoMode()) {
      const { solicitudes } = await requestService.listRequests();
      return {
        total_pendientes: solicitudes.filter((item) => item.estado === 'pendiente').length,
        total_activas: solicitudes.filter((item) => !['completada', 'cancelada'].includes(item.estado)).length,
        solicitudes,
        solicitudes_activas: solicitudes.filter((item) => !['completada', 'cancelada'].includes(item.estado)),
        solicitudes_pendientes: solicitudes.filter((item) => item.estado === 'pendiente'),
      };
    }

    const res = await api.get('/panel/solicitudes/');
    return normalizeRequestDashboard(res.data);
  },
};
