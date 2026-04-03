export const fromTimestamp = (timestamp) => {
  const date = new Date(timestamp.seconds * 1000);
  return date.toLocaleString("es-HN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const calcularVencimiento = (fechaEmisionTimestamp, mesesGarantia) => {
  if (!fechaEmisionTimestamp) return "N/A";

  const fecha = fechaEmisionTimestamp.toDate
    ? fechaEmisionTimestamp.toDate()
    : new Date(fechaEmisionTimestamp.seconds * 1000);

  fecha.setMonth(fecha.getMonth() + mesesGarantia);

  return fecha;
};

export const fromTimestampToSimpleDate = (timestamp) => {
  const date = new Date(timestamp.seconds * 1000);
  return date.toLocaleString("es-HN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};
