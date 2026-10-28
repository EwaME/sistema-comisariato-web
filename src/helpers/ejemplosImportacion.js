// Datos de ejemplo coherentes con el seed del entorno de desarrollo (docker/seed.mjs).
// Fechas a las 12:00 para que la conversión a número de serie de Excel no las cambie de día.
const f = (anio, mes, dia) => new Date(anio, mes - 1, dia, 12);

// 10 filas: 7 válidas, 2 rechazadas (precio negativo, categoría inexistente), 1 omitida (PRD-001 ya existe y es idéntico).
const productos = [
  { productoId: "PRD-101", nombre: "Cocina a gas 4 hornillas", categoriaId: "CAT-001", precioContado: 7200, precioCredito: 8280, stock: 10, garantiaMeses: 12, activo: "SI", descripcion: "Cocina de piso", fechaAlta: f(2026, 3, 2) },
  { productoId: "PRD-102", nombre: "Microondas 20L", categoriaId: "CAT-001", precioContado: 2400, precioCredito: 2760, stock: 15, garantiaMeses: 12, activo: "SI", descripcion: "", fechaAlta: f(2026, 3, 2) },
  { productoId: "PRD-103", nombre: "Sofá 3 plazas", categoriaId: "CAT-002", precioContado: 6900, precioCredito: 7935, stock: 6, garantiaMeses: 24, activo: "SI", descripcion: "", fechaAlta: "2026-03-09" },
  { productoId: "PRD-104", nombre: "Comedor 6 sillas", categoriaId: "CAT-002", precioContado: 8800, precioCredito: 10120, stock: 4, garantiaMeses: 24, activo: "SI", descripcion: "", fechaAlta: "15/04/2026" },
  { productoId: "PRD-105", nombre: "Laptop 15 pulgadas", categoriaId: "CAT-003", precioContado: 14500, precioCredito: 16675, stock: 7, garantiaMeses: 12, activo: "SI", descripcion: "", fechaAlta: f(2026, 5, 4) },
  { productoId: "PRD-106", nombre: "Televisor 32 pulgadas", categoriaId: "CAT-003", precioContado: 4300, precioCredito: 4945, stock: 12, garantiaMeses: 12, activo: "SI", descripcion: "", fechaAlta: f(2026, 5, 4) },
  { productoId: "PRD-107", nombre: "Ventilador de pedestal", categoriaId: "CAT-001", precioContado: 950, precioCredito: 1092.5, stock: 30, garantiaMeses: 6, activo: "SI", descripcion: "", fechaAlta: "2026-06-01" },
  { productoId: "PRD-108", nombre: "Plancha de vapor", categoriaId: "CAT-001", precioContado: -50, precioCredito: 100, stock: 9, garantiaMeses: 6, activo: "SI", descripcion: "", fechaAlta: f(2026, 6, 1) },
  { productoId: "PRD-109", nombre: "Escritorio de oficina", categoriaId: "CAT-999", precioContado: 3100, precioCredito: 3565, stock: 5, garantiaMeses: 12, activo: "SI", descripcion: "", fechaAlta: f(2026, 6, 1) },
  { productoId: "PRD-001", nombre: "Refrigeradora 12 pies", categoriaId: "CAT-001", precioContado: 8500, precioCredito: 9800, stock: 12, garantiaMeses: 12, activo: "SI", descripcion: "", fechaAlta: "" },
];

// 8 filas: 5 válidas (con fechas históricas), 2 rechazadas (producto inexistente, cuotas pagadas > plazo), 1 omitida (CRD-001 ya existe y es idéntico).
const creditos = [
  { creditoId: "CRD-H01", empleadoId: "EMP-002", productoId: "PRD-001", cantidad: 1, plazoMeses: 12, cuotaMensual: 817, totalCredito: 9804, cuotasPagadas: 4, estado: "Aprobado", fechaSolicitud: f(2026, 3, 10), fechaResolucion: f(2026, 3, 12) },
  { creditoId: "CRD-H02", empleadoId: "EMP-004", productoId: "PRD-002", cantidad: 2, plazoMeses: 6, cuotaMensual: 480, totalCredito: 2880, cuotasPagadas: 3, estado: "Aprobado", fechaSolicitud: "2026-02-05", fechaResolucion: "2026-02-07" },
  { creditoId: "CRD-H03", empleadoId: "EMP-005", productoId: "PRD-003", cantidad: 1, plazoMeses: 12, cuotaMensual: 508, totalCredito: 6096, cuotasPagadas: 2, estado: "Aprobado", fechaSolicitud: "18/06/2026", fechaResolucion: "20/06/2026" },
  { creditoId: "CRD-H04", empleadoId: "EMP-007", productoId: "PRD-004", cantidad: 1, plazoMeses: 24, cuotaMensual: 520, totalCredito: 12480, cuotasPagadas: 0, estado: "Rechazado", fechaSolicitud: f(2026, 8, 1), fechaResolucion: f(2026, 8, 3) },
  { creditoId: "CRD-H05", empleadoId: "EMP-003", productoId: "PRD-002", cantidad: 1, plazoMeses: 6, cuotaMensual: 240, totalCredito: 1440, cuotasPagadas: 1, estado: "Aprobado", fechaSolicitud: f(2026, 9, 2), fechaResolucion: f(2026, 9, 4) },
  { creditoId: "CRD-H06", empleadoId: "EMP-002", productoId: "PRD-777", cantidad: 1, plazoMeses: 12, cuotaMensual: 300, totalCredito: 3600, cuotasPagadas: 0, estado: "Aprobado", fechaSolicitud: f(2026, 4, 1), fechaResolucion: f(2026, 4, 2) },
  { creditoId: "CRD-H07", empleadoId: "EMP-006", productoId: "PRD-001", cantidad: 1, plazoMeses: 12, cuotaMensual: 817, totalCredito: 9804, cuotasPagadas: 15, estado: "Aprobado", fechaSolicitud: f(2026, 4, 1), fechaResolucion: f(2026, 4, 2) },
  { creditoId: "CRD-001", empleadoId: "EMP-002", productoId: "PRD-002", cantidad: 2, plazoMeses: 6, cuotaMensual: 480, totalCredito: 2880, cuotasPagadas: 0, estado: "Pendiente", fechaSolicitud: f(2026, 10, 1), fechaResolucion: "" },
];

// 13 filas: 10 válidas, 2 rechazadas (crédito no aprobado, número de cuota fuera de rango), 1 omitida (cuota repetida en el archivo).
// Requiere haber importado antes los créditos de ejemplo.
const pago = (creditoId, numeroCuota, monto, fechaPago) => ({ creditoId, numeroCuota, monto, fechaPago });
const cuotas = [
  pago("CRD-H01", 1, 817, f(2026, 4, 10)),
  pago("CRD-H01", 2, 817, f(2026, 5, 10)),
  pago("CRD-H01", 3, 817, "10/06/2026"),
  pago("CRD-H01", 4, 817, "2026-07-10"),
  pago("CRD-H02", 1, 480, f(2026, 3, 5)),
  pago("CRD-H02", 2, 480, f(2026, 4, 5)),
  pago("CRD-H02", 3, 480, f(2026, 5, 5)),
  pago("CRD-H03", 1, 508, f(2026, 7, 18)),
  pago("CRD-H03", 2, 508, f(2026, 8, 18)),
  pago("CRD-H05", 1, 240, f(2026, 10, 2)),
  pago("CRD-H04", 1, 520, f(2026, 9, 1)),
  pago("CRD-H01", 13, 817, f(2026, 8, 10)),
  pago("CRD-H01", 1, 817, f(2026, 4, 10)),
];

export const EJEMPLOS = { productos, creditos, cuotas };

// ---- Archivos para probar CONFLICTOS: se importan DESPUÉS de los tres de arriba ----

// 6 filas: 1 insertada (PRD-203), 3 conflictos (PRD-101, PRD-103 y PRD-001 traen datos distintos),
// 1 rechazada (PRD-204 con stock negativo) y 1 omitida (PRD-102 es idéntico).
const productosConflictos = [
  { productoId: "PRD-101", nombre: "Cocina a gas 4 hornillas", categoriaId: "CAT-001", precioContado: 7500, precioCredito: 8625, stock: 8, garantiaMeses: 12, activo: "SI", descripcion: "Cocina de piso", fechaAlta: f(2026, 3, 2) },
  { productoId: "PRD-102", nombre: "Microondas 20L", categoriaId: "CAT-001", precioContado: 2400, precioCredito: 2760, stock: 15, garantiaMeses: 12, activo: "SI", descripcion: "", fechaAlta: f(2026, 3, 2) },
  { productoId: "PRD-103", nombre: "Sofá 3 plazas reclinable", categoriaId: "CAT-002", precioContado: 6900, precioCredito: 7935, stock: 5, garantiaMeses: 24, activo: "SI", descripcion: "", fechaAlta: "2026-03-09" },
  { productoId: "PRD-203", nombre: "Cafetera de goteo", categoriaId: "CAT-001", precioContado: 650, precioCredito: 748, stock: 20, garantiaMeses: 6, activo: "SI", descripcion: "", fechaAlta: f(2026, 10, 5) },
  { productoId: "PRD-204", nombre: "Hervidor eléctrico", categoriaId: "CAT-001", precioContado: 500, precioCredito: 575, stock: -3, garantiaMeses: 6, activo: "SI", descripcion: "", fechaAlta: f(2026, 10, 5) },
  { productoId: "PRD-001", nombre: "Refrigeradora 12 pies", categoriaId: "CAT-001", precioContado: 8500, precioCredito: 10200, stock: 9, garantiaMeses: 12, activo: "SI", descripcion: "", fechaAlta: "" },
];

// 6 filas: 1 insertada (CRD-H08), 3 conflictos (CRD-H03, CRD-001 que pasa a Aprobado y CRD-H01),
// 1 rechazada (CRD-H09 con empleado inexistente) y 1 omitida (CRD-H05 idéntico).
const creditosConflictos = [
  { creditoId: "CRD-H03", empleadoId: "EMP-005", productoId: "PRD-003", cantidad: 1, plazoMeses: 12, cuotaMensual: 508, totalCredito: 6096, cuotasPagadas: 3, estado: "Aprobado", fechaSolicitud: "18/06/2026", fechaResolucion: "20/06/2026" },
  { creditoId: "CRD-H05", empleadoId: "EMP-003", productoId: "PRD-002", cantidad: 1, plazoMeses: 6, cuotaMensual: 240, totalCredito: 1440, cuotasPagadas: 1, estado: "Aprobado", fechaSolicitud: f(2026, 9, 2), fechaResolucion: f(2026, 9, 4) },
  { creditoId: "CRD-001", empleadoId: "EMP-002", productoId: "PRD-002", cantidad: 2, plazoMeses: 6, cuotaMensual: 480, totalCredito: 2880, cuotasPagadas: 0, estado: "Aprobado", fechaSolicitud: f(2026, 10, 1), fechaResolucion: f(2026, 10, 3) },
  { creditoId: "CRD-H08", empleadoId: "EMP-006", productoId: "PRD-004", cantidad: 1, plazoMeses: 12, cuotaMensual: 400, totalCredito: 4800, cuotasPagadas: 0, estado: "Aprobado", fechaSolicitud: f(2026, 9, 20), fechaResolucion: f(2026, 9, 22) },
  { creditoId: "CRD-H09", empleadoId: "EMP-099", productoId: "PRD-001", cantidad: 1, plazoMeses: 12, cuotaMensual: 300, totalCredito: 3600, cuotasPagadas: 0, estado: "Aprobado", fechaSolicitud: f(2026, 9, 25), fechaResolucion: f(2026, 9, 26) },
  { creditoId: "CRD-H01", empleadoId: "EMP-002", productoId: "PRD-001", cantidad: 1, plazoMeses: 12, cuotaMensual: 825, totalCredito: 9900, cuotasPagadas: 4, estado: "Aprobado", fechaSolicitud: f(2026, 3, 10), fechaResolucion: f(2026, 3, 12) },
];

// 6 filas: 2 insertadas (CRD-H01 cuota 5 y CRD-H03 cuota 3), 2 conflictos (cuota 1 con otro monto y cuota 3 con otra fecha),
// 1 rechazada (CRD-H02 cuota 9 de 6) y 1 omitida (CRD-H01 cuota 2 idéntica).
const cuotasConflictos = [
  pago("CRD-H01", 1, 850, f(2026, 4, 10)),
  pago("CRD-H01", 2, 817, f(2026, 5, 10)),
  pago("CRD-H01", 3, 817, "12/06/2026"),
  pago("CRD-H01", 5, 817, f(2026, 8, 10)),
  pago("CRD-H03", 3, 508, f(2026, 9, 18)),
  pago("CRD-H02", 9, 480, f(2026, 9, 5)),
];

export const EJEMPLOS_CONFLICTOS = { productos: productosConflictos, creditos: creditosConflictos, cuotas: cuotasConflictos };
