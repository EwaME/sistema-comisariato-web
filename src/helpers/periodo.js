export const PRESETS = [
  ["todo", "Todo"],
  ["anio", "Este año"],
  ["seis", "Últimos 6 meses"],
  ["mes", "Este mes"],
  ["personalizado", "Personalizado"],
];

// Devuelve { desde, hasta } con Date o null (sin límite)
export function calcularPeriodo(preset, desdeTxt, hastaTxt) {
  const hoy = new Date();
  if (preset === "anio") return { desde: new Date(hoy.getFullYear(), 0, 1), hasta: null };
  if (preset === "seis") return { desde: new Date(hoy.getFullYear(), hoy.getMonth() - 5, 1), hasta: null };
  if (preset === "mes") return { desde: new Date(hoy.getFullYear(), hoy.getMonth(), 1), hasta: null };
  if (preset === "personalizado")
    return {
      desde: desdeTxt ? new Date(`${desdeTxt}T12:00:00`) : null,
      hasta: hastaTxt ? new Date(`${hastaTxt}T12:00:00`) : null,
    };
  return { desde: null, hasta: null };
}

export const textoPeriodo = ({ desde, hasta }) =>
  !desde && !hasta
    ? "todo el historial"
    : `${desde ? desde.toLocaleDateString("es-HN") : "inicio"} – ${hasta ? hasta.toLocaleDateString("es-HN") : "hoy"}`;
