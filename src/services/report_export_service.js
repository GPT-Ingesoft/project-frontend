import api from './auth_service';
import { isDemoMode } from './auth_service';
import { adminService } from './admin_service';


const REPORT_FILENAMES = {
  fallas: 'reporte-fallas.pdf',
  'tiempos-reparacion': 'reporte-tiempos-reparacion.pdf',
  'fuera-de-servicio': 'reporte-fuera-de-servicio.pdf',
};

const getResponseFilename = (contentDisposition, reportType) => {
  const match = contentDisposition?.match(/filename="?([^";]+)"?/i);
  return match?.[1] || REPORT_FILENAMES[reportType] || 'reporte.pdf';
};

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export const reportExportService = {
  async exportPdf(reportType, thresholdDays = null) {
    if (isDemoMode()) {
      const payload = await getDemoReportPayload(reportType, thresholdDays);
      const { demoReportExportService } = await import('./demo_report_export_service');
      return demoReportExportService.exportPdf(reportType, payload, thresholdDays);
    }

    const params = reportType === 'fuera-de-servicio'
      ? { umbral_dias: thresholdDays }
      : undefined;
    const response = await api.get(`/admin/reportes/${reportType}/pdf/`, {
      params,
      responseType: 'blob',
    });
    const filename = getResponseFilename(response.headers['content-disposition'], reportType);
    downloadBlob(response.data, filename);
    return {
      filename,
      generationSeconds: response.headers['x-report-generation-seconds'],
      recordCount: response.headers['x-report-record-count'],
    };
  },
};

const getDemoReportPayload = (reportType, thresholdDays) => {
  const loaders = {
    fallas: () => adminService.getFailureReport(),
    'tiempos-reparacion': () => adminService.getRepairTimeReport(),
    'fuera-de-servicio': () => adminService.getOutOfServiceReport(thresholdDays),
  };
  const loader = loaders[reportType];
  if (!loader) throw new Error(`Tipo de reporte demo no válido: ${reportType}`);
  return loader();
};
