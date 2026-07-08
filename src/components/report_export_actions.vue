<script setup>
import { ref } from 'vue';
import { getErrorMessage } from '../services/error_service';
import { reportExportService } from '../services/report_export_service';

const props = defineProps({
  thresholdDays: {
    type: Number,
    default: 30,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

const exportingType = ref('');
const exportError = ref('');

const reports = [
  { type: 'fallas', label: 'Exportar fallas' },
  { type: 'tiempos-reparacion', label: 'Exportar tiempos' },
  { type: 'fuera-de-servicio', label: 'Exportar fuera de servicio' },
];

const exportReport = async (reportType) => {
  exportingType.value = reportType;
  exportError.value = '';
  try {
    await reportExportService.exportPdf(reportType, props.thresholdDays);
  } catch (error) {
    exportError.value = getErrorMessage(error, 'No fue posible exportar el reporte en PDF.');
  } finally {
    exportingType.value = '';
  }
};
</script>

<template>
  <div class="export-panel">
    <strong>Exportar PDF</strong>
    <div class="export-actions">
      <button
        v-for="report in reports"
        :key="report.type"
        class="btn export-button"
        type="button"
        :disabled="disabled || Boolean(exportingType)"
        @click="exportReport(report.type)"
      >
        {{ exportingType === report.type ? 'Generando...' : report.label }}
      </button>
    </div>
    <p v-if="exportError" class="export-error" role="alert">{{ exportError }}</p>
  </div>
</template>

<style scoped>
.export-panel {
  display: grid;
  gap: 10px;
  margin-top: 18px;
  padding: 16px;
  border: 1px solid #e2e5e8;
  border-left: 4px solid #68a645;
  border-radius: 8px;
  background: #fff;
}

.export-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.export-button {
  min-width: 160px;
}

.export-error {
  margin: 0;
  color: #a72820;
}
</style>
