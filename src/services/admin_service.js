import api from './auth_service';
import { isDemoMode } from './auth_service';

const demoNotifications = [
  {
    id: 1,
    tipo: 'Cambio de Estado',
    mensaje: 'La solicitud #12 pasó a en proceso.',
    fecha_envio: new Date().toISOString(),
    solicitud_id: 12,
    destinatarios: [{ id: 1, nombre: 'Usuario Demo', correo: 'demo@unal.edu.co', rol: 'laboratorista' }],
  },
];

export const adminService = {
  async getFailureReport() {
    if (isDemoMode()) {
      return {
        total_equipos: 1,
        equipos: [
          {
            id: 1,
            nombre: 'Microscopio Optico',
            codigo_inventario: 'EQ-001',
            ubicacion: 'Laboratorio 101',
            estado: 'operativo',
            total_fallas: 2,
          },
        ],
      };
    }

    const res = await api.get('/admin/reportes/fallas/');
    return res.data;
  },

  async getRepairTimeReport() {
    if (isDemoMode()) {
      return {
        total_equipos: 1,
        equipos: [
          {
            id: 2,
            nombre: 'Osciloscopio Digital',
            codigo_inventario: 'EQ-014',
            ubicacion: 'Laboratorio Electronica',
            promedio_horas_reparacion: 5.5,
          },
        ],
      };
    }

    const res = await api.get('/admin/reportes/tiempos-reparacion/');
    return res.data;
  },

  async getOutOfServiceReport(thresholdDays = 30) {
    if (isDemoMode()) {
      return {
        umbral_dias: thresholdDays,
        total: 1,
        equipos: [
          {
            id: 3,
            nombre: 'Equipo de Computo Dell',
            codigo_inventario: 'EQ-028',
            ubicacion: 'Sala de Sistemas',
            estado: 'fuera_de_servicio',
            fecha_baja: new Date().toISOString(),
            motivo_baja: 'Falla recurrente.',
            dias_inactivo: thresholdDays + 2,
          },
        ],
      };
    }

    const res = await api.get('/admin/reportes/fuera-de-servicio/', {
      params: { umbral_dias: thresholdDays },
    });
    return res.data;
  },

  async getNotifications() {
    if (isDemoMode()) {
      return { total: demoNotifications.length, notificaciones: demoNotifications };
    }

    const res = await api.get('/admin/notificaciones/');
    return res.data;
  },

  async getNotification(notificationId) {
    if (isDemoMode()) {
      const notificacion = demoNotifications.find((item) => Number(item.id) === Number(notificationId));
      if (!notificacion) throw new Error('Notificación demo no encontrada.');
      return { notificacion };
    }

    const res = await api.get(`/admin/notificaciones/${notificationId}/`);
    return res.data;
  },
};
