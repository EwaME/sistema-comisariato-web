// Lógica pura de la pantalla de análisis de una importación: convierte el resultado de la simulación
// (filas rechazadas, omitidas y en conflicto) en pasos con sus hallazgos. Cada hallazgo indica la fila de Excel,
// el campo y el mensaje. La fila 1 del Excel es el encabezado, así que los datos empiezan en la 2.

export const PASOS_ANALISIS = [
  { id: "lectura", titulo: "Lectura del archivo", detalle: "El archivo se abre y trae filas de datos", cargando: "Leyendo el archivo…" },
  { id: "columnas", titulo: "Columnas del encabezado", detalle: "Las columnas coinciden con la plantilla", cargando: "Comparando encabezados con la plantilla…" },
  { id: "obligatorio", titulo: "Campos obligatorios", detalle: "Ningún campo requerido viene vacío", cargando: "Buscando campos vacíos…", consultaSistema: true },
  { id: "formato", titulo: "Tipos de datos y formato", detalle: "Números, fechas y códigos con formato válido", cargando: "Verificando números, fechas y códigos…" },
  { id: "regla", titulo: "Reglas de negocio", detalle: "Rangos, estados y límites permitidos", cargando: "Aplicando reglas de negocio…" },
  { id: "referencia", titulo: "Referencias en el sistema", detalle: "Categorías, empleados, productos y créditos existen", cargando: "Comprobando que lo referenciado exista…" },
  { id: "coherencia", titulo: "Coherencia entre campos", detalle: "Montos, plazos, cuotas y fechas cuadran entre sí", cargando: "Cruzando montos, plazos y fechas…" },
  { id: "duplicado", titulo: "Duplicados y conflictos", detalle: "Registros repetidos o que ya existen", cargando: "Buscando duplicados…" },
];

const OK = {
  obligatorio: "Todos los campos obligatorios tienen valor",
  formato: "Números, fechas y códigos con formato válido",
  regla: "Todas las reglas de negocio se cumplen",
  referencia: "Todo lo referenciado existe en el sistema",
  coherencia: "Los datos son coherentes entre sí",
  duplicado: "No hay duplicados ni conflictos",
};

const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;
const filasDistintas = (hallazgos) => new Set(hallazgos.map((h) => h.fila)).size;

function cerrar(hallazgos, textoOk, textoAviso) {
  const errores = hallazgos.filter((h) => h.nivel === "error");
  if (errores.length) {
    return { estado: "error", mensaje: `${plural(errores.length, "error", "errores")} en ${plural(filasDistintas(errores), "fila", "filas")}`, hallazgos };
  }
  if (hallazgos.length) return { estado: "aviso", mensaje: textoAviso(hallazgos), hallazgos };
  return { estado: "ok", mensaje: textoOk, hallazgos };
}

function evaluarColumnas({ encabezados }) {
  const hallazgos = encabezados.extras.map((h) => ({ fila: 1, id: "", campo: h, mensaje: `La columna “${h}” no pertenece a la plantilla y no se importará`, nivel: "aviso" }));
  return cerrar(hallazgos, "Las columnas coinciden con la plantilla", (h) => plural(h.length, "columna ignorada", "columnas ignoradas"));
}

function evaluarDuplicados(resultado) {
  const hallazgos = [];
  for (const f of resultado.rechazadas) {
    for (const e of f.errores.filter((x) => x.paso === "duplicado")) {
      hallazgos.push({ fila: f.fila, id: f.id, campo: e.campo, mensaje: e.mensaje, nivel: "error" });
    }
  }
  for (const o of resultado.omitidas) hallazgos.push({ fila: o.fila, id: o.id, campo: "", mensaje: o.motivo, nivel: "aviso" });
  for (const c of resultado.conflictos) {
    const cambios = c.campos.map((x) => `${x.campo} (${x.actual} → ${x.nuevo})`).join(", ");
    hallazgos.push({ fila: c.fila, id: c.id, campo: "", mensaje: `Ya existe con datos distintos: ${cambios}`, nivel: "aviso" });
  }
  hallazgos.sort((a, b) => a.fila - b.fila);
  return cerrar(hallazgos, OK.duplicado, () => {
    const partes = [];
    if (resultado.omitidas.length) partes.push(plural(resultado.omitidas.length, "omitida", "omitidas"));
    if (resultado.conflictos.length) partes.push(plural(resultado.conflictos.length, "conflicto", "conflictos"));
    return partes.join(" y ");
  });
}

export function evaluarPaso(id, { nombreArchivo, totalFilas, encabezados, resultado }) {
  if (id === "lectura") return { estado: "ok", mensaje: `${plural(totalFilas, "fila leída", "filas leídas")} de ${nombreArchivo}`, hallazgos: [] };
  if (id === "columnas") return evaluarColumnas({ encabezados });
  if (id === "duplicado") return evaluarDuplicados(resultado);

  const hallazgos = [];
  for (const f of resultado.rechazadas) {
    for (const e of f.errores.filter((x) => x.paso === id)) {
      hallazgos.push({ fila: f.fila, id: f.id, campo: e.campo, mensaje: e.mensaje, nivel: "error" });
    }
  }
  for (const a of (resultado.advertencias || []).filter((x) => x.paso === id)) {
    hallazgos.push({ fila: a.fila, id: a.id, campo: a.campo, mensaje: a.mensaje, nivel: "aviso" });
  }
  hallazgos.sort((x, y) => x.fila - y.fila);
  return cerrar(hallazgos, OK[id], (h) => plural(h.length, "advertencia", "advertencias"));
}
