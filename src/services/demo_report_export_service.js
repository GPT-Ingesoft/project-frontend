import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';


const SYSLAB_BLUE = [4, 50, 94];
const SYSLAB_GREEN = [104, 166, 69];
const SYSLAB_TEXT = [38, 49, 61];
const SYSLAB_ALT_ROW = [234, 241, 247];

const REPORT_DEFINITIONS = {
  fallas: {
    title: 'Reporte de fallas',
    filename: 'reporte-fallas-demo.pdf',
    payloadKeys: ['equipos'],
    columns: [
      { field: 'nombre', header: 'Equipo' },
      { field: 'codigo_inventario', header: 'Código' },
      { field: 'ubicacion', header: 'Ubicación' },
      { field: 'estado', header: 'Estado' },
      { field: 'total_fallas', header: 'Fallas' },
    ],
  },
  'tiempos-reparacion': {
    title: 'Reporte de tiempos de reparación',
    filename: 'reporte-tiempos-reparacion-demo.pdf',
    payloadKeys: ['equipos'],
    columns: [
      { field: 'nombre', header: 'Equipo' },
      { field: 'codigo_inventario', header: 'Código' },
      { field: 'ubicacion', header: 'Ubicación' },
      { field: 'promedio_horas_reparacion', header: 'Promedio (h)' },
    ],
  },
  'fuera-de-servicio': {
    title: 'Reporte de equipos fuera de servicio',
    filename: 'reporte-fuera-de-servicio-demo.pdf',
    payloadKeys: ['equipos'],
    columns: [
      { field: 'nombre', header: 'Equipo' },
      { field: 'codigo_inventario', header: 'Código' },
      { field: 'ubicacion', header: 'Ubicación' },
      { field: 'dias_inactivo', header: 'Días' },
      { field: 'motivo_baja', header: 'Motivo' },
    ],
  },
};

const normalizeRows = (payload, keys) => {
  if (Array.isArray(payload)) return payload;
  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

const formatValue = (value) => {
  if (value === null || value === undefined || value === '') return 'Sin dato';
  return String(value);
};

const addPageFooters = (document) => {
  const pageCount = document.getNumberOfPages();
  const pageWidth = document.internal.pageSize.getWidth();
  const pageHeight = document.internal.pageSize.getHeight();

  for (let page = 1; page <= pageCount; page += 1) {
    document.setPage(page);
    document.setDrawColor(...SYSLAB_GREEN);
    document.setLineWidth(0.35);
    document.line(14, pageHeight - 11, pageWidth - 14, pageHeight - 11);
    document.setFont('helvetica', 'normal');
    document.setFontSize(8);
    document.setTextColor(...SYSLAB_TEXT);
    document.text('SysLab · Sistema de gestión de laboratorios', 14, pageHeight - 7);
    document.text(`Página ${page}`, pageWidth - 14, pageHeight - 7, { align: 'right' });
  }
};

export const buildDemoReportPdf = (reportType, payload, thresholdDays = 30) => {
  const definition = REPORT_DEFINITIONS[reportType];
  if (!definition) throw new Error(`Tipo de reporte demo no válido: ${reportType}`);

  const rows = normalizeRows(payload, definition.payloadKeys);
  const document = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const generatedAt = new Date();

  document.setProperties({
    title: `${definition.title} (demo)`,
    author: 'SysLab',
    subject: 'Reporte generado en modo demostración',
  });
  document.setFont('helvetica', 'bold');
  document.setFontSize(18);
  document.setTextColor(...SYSLAB_BLUE);
  document.text(`${definition.title} · Demo`, 14, 18);
  document.setFont('helvetica', 'normal');
  document.setFontSize(8.5);
  document.setTextColor(...SYSLAB_TEXT);
  document.text(`Generado: ${generatedAt.toLocaleString('es-CO')}`, 14, 24);

  let tableStart = 31;
  if (reportType === 'fuera-de-servicio') {
    document.text(`Umbral aplicado: ${thresholdDays} días`, 14, 29);
    tableStart = 35;
  }

  autoTable(document, {
    startY: tableStart,
    margin: { left: 14, right: 14, bottom: 16 },
    head: [definition.columns.map((column) => column.header)],
    body: rows.length
      ? rows.map((row) => definition.columns.map((column) => formatValue(row[column.field])))
      : [[
          'No hay registros para este reporte.',
          ...definition.columns.slice(1).map(() => ''),
        ]],
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 7.5,
      cellPadding: 2.2,
      textColor: SYSLAB_TEXT,
      lineColor: [215, 222, 229],
      lineWidth: 0.1,
      overflow: 'linebreak',
      valign: 'top',
    },
    headStyles: {
      fillColor: SYSLAB_BLUE,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: { fillColor: SYSLAB_ALT_ROW },
    didParseCell: (data) => {
      if (!rows.length && data.section === 'body' && data.column.index === 0) {
        data.cell.colSpan = definition.columns.length;
        data.cell.styles.halign = 'center';
        data.cell.styles.fontStyle = 'italic';
      }
    },
  });

  addPageFooters(document);
  return {
    document,
    filename: definition.filename,
    recordCount: rows.length,
  };
};

export const demoReportExportService = {
  exportPdf(reportType, payload, thresholdDays = 30) {
    const result = buildDemoReportPdf(reportType, payload, thresholdDays);
    result.document.save(result.filename);
    return {
      filename: result.filename,
      recordCount: result.recordCount,
      demo: true,
    };
  },
};
