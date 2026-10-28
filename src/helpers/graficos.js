// Paleta de los dashboards, alineada con CrediFlow: morado como color principal, azul noche para contraste
// y verde / ámbar / rojo solo cuando el dato expresa un estado (éxito, aviso, error).
export const C = {
  morado: "#7C3AED",
  violeta: "#4C1D95",
  lila: "#A78BFA",
  lilaClaro: "#DDD6FE",
  noche: "#020817",
  gris: "#CBD5E1",
  grisOscuro: "#94A3B8",
  verde: "#10B981",
  ambar: "#F59E0B",
  rojo: "#F43F5E",
};

// Recharts entrega el dato del gráfico en `payload` según el tipo de gráfico
export const dato = (e) => e?.payload ?? e;

// Grupos sin datos (todo en cero) no se dibujan en las donas
export const paraDona = (pares) => pares.filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }));
