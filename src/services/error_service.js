const statusMessages = {
  400: 'La solicitud tiene datos inválidos. Revisa los campos e inténtalo de nuevo.',
  401: 'Tu sesión expiró o no está autenticada. Inicia sesión nuevamente.',
  403: 'No tienes permisos para realizar esta acción.',
  404: 'No se encontró el recurso solicitado.',
  500: 'El servidor encontró un problema. Inténtalo más tarde.',
};

const flattenFieldErrors = (payload) => {
  if (!payload || typeof payload !== 'object') return '';

  return Object.entries(payload)
    .filter(([, value]) => Array.isArray(value) || typeof value === 'string')
    .map(([key, value]) => {
      const text = Array.isArray(value) ? value.join(', ') : value;
      return `${key}: ${text}`;
    })
    .join(' ');
};

export const getErrorMessage = (err, fallback = 'No fue posible completar la operación.') => {
  if (!err) return fallback;
  if (typeof err === 'string') return err;

  const data = err.response?.data;
  const status = err.response?.status;

  if (!err.response && err.request) {
    return 'No fue posible conectar con el servidor. Verifica que el backend esté encendido.';
  }

  if (typeof data === 'string' && data.trim()) return data;
  if (data?.error) return data.error;
  if (data?.detail) return data.detail;
  if (data?.message) return data.message;

  const fieldErrors = flattenFieldErrors(data);
  if (fieldErrors) return fieldErrors;

  return statusMessages[status] || err.message || fallback;
};
