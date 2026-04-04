export const fromTimestamp = (timestamp) => {
  // Validación de seguridad: si no hay timestamp, retorna un string vacío o "Cargando..."
  if (!timestamp || (!timestamp.seconds && !timestamp.toDate)) return "---";

  const date = timestamp.toDate
    ? timestamp.toDate()
    : new Date(timestamp.seconds * 1000);

  return date.toLocaleString("es-HN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const calcularVencimiento = (fechaEmisionTimestamp, mesesGarantia) => {
  if (!fechaEmisionTimestamp) return null;

  // Intentar convertir a Date de JS de forma segura
  const fecha = fechaEmisionTimestamp.toDate
    ? fechaEmisionTimestamp.toDate()
    : fechaEmisionTimestamp.seconds
      ? new Date(fechaEmisionTimestamp.seconds * 1000)
      : new Date(fechaEmisionTimestamp);

  if (isNaN(fecha.getTime())) return null;

  const nuevaFecha = new Date(fecha);
  nuevaFecha.setMonth(nuevaFecha.getMonth() + (mesesGarantia || 0));

  return nuevaFecha;
};

export const fromTimestampToSimpleDate = (timestamp) => {
  if (!timestamp || (!timestamp.seconds && !timestamp.toDate)) return "---";

  const date = timestamp.toDate
    ? timestamp.toDate()
    : new Date(timestamp.seconds * 1000);

  return date.toLocaleDateString("es-HN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};
