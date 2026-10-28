// Lógica pura de la importación desde Excel: sin Firebase, para poder probarla con Vitest.
import { aFecha } from "./kpisGerenciales.js";

export const ESTADOS_CREDITO = ["Pendiente", "En revisión", "Aprobado", "Rechazado", "Liquidado"];
const ESTADOS_CON_PAGOS = ["Aprobado", "Liquidado"];
const ID_VALIDO = /^[A-Za-z0-9_-]+$/;

const sinAcentos = (t) => String(t).normalize("NFD").replace(/[̀-ͯ]/g, "");
const normalizarClave = (k) => sinAcentos(k).replace(/[\s_-]+/g, "").toLowerCase();
const texto = (v) => (v === null || v === undefined ? "" : String(v).trim());

export function parsearNumero(valor) {
  if (typeof valor === "number") return Number.isFinite(valor) ? valor : null;
  let s = texto(valor).replace(/[^\d.,-]/g, "").replace(/^[.,]+/, "");
  if (!s) return null;
  if (s.includes(",") && s.includes(".")) s = s.replace(/,/g, "");
  else if (s.includes(",")) s = s.replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function parsearEntero(valor) {
  const n = parsearNumero(valor);
  return n !== null && Number.isInteger(n) ? n : null;
}

// Devuelve la fecha de negocio a las 12:00 locales para que ningún huso horario la mueva de día.
export function parsearFecha(valor) {
  if (valor === null || valor === undefined || valor === "") return null;
  let y, m, d;
  if (valor instanceof Date) {
    if (Number.isNaN(valor.getTime())) return null;
    y = valor.getFullYear();
    m = valor.getMonth() + 1;
    d = valor.getDate();
  } else if (typeof valor === "number") {
    if (!Number.isFinite(valor) || valor < 1 || valor > 100000) return null;
    const f = new Date(Date.UTC(1899, 11, 30) + Math.floor(valor) * 86400000);
    y = f.getUTCFullYear();
    m = f.getUTCMonth() + 1;
    d = f.getUTCDate();
  } else {
    const s = texto(valor);
    let r = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s);
    if (r) {
      [y, m, d] = [+r[1], +r[2], +r[3]];
    } else if ((r = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(s))) {
      [d, m, y] = [+r[1], +r[2], +r[3]];
    } else {
      return null;
    }
  }
  if (y < 2000) return null;
  const fecha = new Date(y, m - 1, d, 12, 0, 0);
  if (fecha.getFullYear() !== y || fecha.getMonth() !== m - 1 || fecha.getDate() !== d) return null;
  return fecha;
}

function esFuturo(fecha, ahora) {
  const finDeHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 23, 59, 59);
  return fecha > finDeHoy;
}

function leerFechaNegocio(valor, ahora, nombreCampo) {
  const fecha = parsearFecha(valor);
  if (!fecha) return { error: `${nombreCampo} inválida (use dd/mm/aaaa o aaaa-mm-dd)`, paso: "formato" };
  if (esFuturo(fecha, ahora)) return { error: `${nombreCampo} es una fecha futura`, paso: "regla" };
  return { fecha };
}

const meta = (ctx, fechaNegocio) => ({
  fechaRegistro: fechaNegocio,
  origen: "IMPORTACION_EXCEL",
  importacionId: ctx.importacionId,
  fechaImportacion: ctx.ahora,
});

const idSimple = (clave) => (fila) => {
  const id = texto(fila[clave]);
  return ID_VALIDO.test(id) ? id : null;
};

// Cada validador revisa TODOS los campos y devuelve { errores: [...] } con todos los problemas de la fila,
// o { id, data } si la fila es válida. Cada error trae el `paso` del análisis al que pertenece
// (obligatorio, formato, regla, referencia, coherencia o duplicado), el `campo` y el `mensaje`.
// Los chequeos que dependen de un campo inválido se saltan para no inventar errores en cadena.
const normalizarNombre = (n) => sinAcentos(texto(n)).toLowerCase().replace(/\s+/g, " ").trim();
const err = (paso, campo, mensaje) => ({ paso, campo, mensaje });

// Lee un campo numérico y registra el error que corresponda; devuelve null si no es utilizable.
function leerNumero(fila, clave, errores, { entero = false, min = null, exclusivo = false, opcional = false } = {}) {
  const crudo = texto(fila[clave]);
  if (crudo === "") {
    if (opcional) return 0;
    errores.push(err("obligatorio", clave, `${clave} es obligatorio`));
    return null;
  }
  const n = entero ? parsearEntero(fila[clave]) : parsearNumero(fila[clave]);
  if (n === null) {
    errores.push(err("formato", clave, `${clave} debe ser ${entero ? "un número entero" : "un número"} (valor recibido: “${crudo}”)`));
    return null;
  }
  if (min !== null && (exclusivo ? n <= min : n < min)) {
    errores.push(err("regla", clave, `${clave} debe ser mayor ${exclusivo ? "que" : "o igual a"} ${min}`));
    return null;
  }
  return n;
}

function leerId(fila, clave, errores) {
  const crudo = texto(fila[clave]);
  if (crudo === "") errores.push(err("obligatorio", clave, `${clave} es obligatorio`));
  else if (!ID_VALIDO.test(crudo)) errores.push(err("formato", clave, `${clave} solo admite letras, números, guion y guion bajo (valor recibido: “${crudo}”)`));
  return ID_VALIDO.test(crudo) ? crudo : null;
}

function leerFecha(fila, clave, ctx, errores, { opcional = false } = {}) {
  if (texto(fila[clave]) === "") {
    if (!opcional) errores.push(err("obligatorio", clave, `${clave} es obligatorio`));
    return null;
  }
  const r = leerFechaNegocio(fila[clave], ctx.ahora, clave);
  if (r.error) {
    errores.push(err(r.paso, clave, r.error));
    return null;
  }
  return r.fecha;
}

function validarProducto(fila, ctx) {
  const errores = [];
  const productoId = leerId(fila, "productoId", errores);

  const nombre = texto(fila.nombre);
  if (!nombre) {
    errores.push(err("obligatorio", "nombre", "nombre es obligatorio"));
  } else {
    const clave = normalizarNombre(nombre);
    const enSistema = ctx.nombresExistentes?.get(clave);
    const enArchivo = ctx.nombresArchivo?.get(clave);
    if (enSistema && enSistema !== productoId) errores.push(err("duplicado", "nombre", `ya existe un producto con el mismo nombre en el sistema (${enSistema})`));
    if (enArchivo && enArchivo !== productoId) errores.push(err("duplicado", "nombre", `el nombre ya lo usa otro producto de este archivo (${enArchivo})`));
  }

  const categoriaId = texto(fila.categoriaId);
  if (!categoriaId) errores.push(err("obligatorio", "categoriaId", "categoriaId es obligatorio"));
  else if (!ctx.categorias.has(categoriaId)) errores.push(err("referencia", "categoriaId", `la categoría ${categoriaId} no existe`));

  const advertencias = [];
  const precioContado = leerNumero(fila, "precioContado", errores, { min: 0 });
  if (precioContado === 0) advertencias.push(err("regla", "precioContado", "precioContado es 0: el producto se importará sin precio de contado"));
  const precioCredito = leerNumero(fila, "precioCredito", errores);
  if (precioContado !== null && precioCredito !== null && precioCredito < precioContado)
    errores.push(err("coherencia", "precioCredito", `precioCredito (${precioCredito}) no puede ser menor que precioContado (${precioContado})`));

  const stock = leerNumero(fila, "stock", errores, { entero: true, min: 0 });
  const garantiaMeses = leerNumero(fila, "garantiaMeses", errores, { entero: true, min: 0, opcional: true });

  const activoTexto = sinAcentos(texto(fila.activo)).toLowerCase();
  const activo = !["no", "false", "0"].includes(activoTexto);
  if (activo && stock !== null && stock <= (ctx.stockMinimoCierre || 0))
    errores.push(err("regla", "stock", `no se puede activar con stock ${stock} (mínimo de cierre ${ctx.stockMinimoCierre})`));

  const fechaAlta = leerFecha(fila, "fechaAlta", ctx, errores, { opcional: true });

  if (errores.length) return { errores };
  ctx.nombresArchivo?.set(normalizarNombre(nombre), productoId);
  return {
    id: productoId,
    advertencias,
    data: {
      productoId,
      nombre,
      nombreNormalizado: sinAcentos(nombre).toLowerCase(),
      descripcion: texto(fila.descripcion),
      precioContado,
      precioCredito,
      categoria: ctx.categorias.get(categoriaId),
      categoriaId,
      stock,
      activo,
      rate: 0,
      cantidadVendida: 0,
      garantiaMeses,
      garantiaDias: null,
      imagenFrontalUrl: "",
      imagenLateralUrl: "",
      imagenTraseraUrl: "",
      fechaModificacion: ctx.ahora,
      ...meta(ctx, fechaAlta || ctx.ahora),
    },
  };
}

function validarCredito(fila, ctx) {
  const errores = [];
  const creditoId = leerId(fila, "creditoId", errores);

  const empleadoId = texto(fila.empleadoId);
  const empleado = ctx.empleados.get(empleadoId);
  if (!empleadoId) errores.push(err("obligatorio", "empleadoId", "empleadoId es obligatorio"));
  else if (!empleado) errores.push(err("referencia", "empleadoId", `el empleado ${empleadoId} no existe`));
  else if (!empleado.correo) errores.push(err("referencia", "empleadoId", `el empleado ${empleadoId} no tiene correo registrado`));

  const productoId = texto(fila.productoId);
  const producto = ctx.productos.get(productoId);
  if (!productoId) errores.push(err("obligatorio", "productoId", "productoId es obligatorio"));
  else if (!producto) errores.push(err("referencia", "productoId", `el producto ${productoId} no existe`));

  const cantidad = leerNumero(fila, "cantidad", errores, { entero: true, min: 1 });
  const plazoMeses = leerNumero(fila, "plazoMeses", errores, { entero: true, min: 1 });
  const cuotaMensual = leerNumero(fila, "cuotaMensual", errores, { min: 0, exclusivo: true });
  const totalCredito = leerNumero(fila, "totalCredito", errores, { min: 0, exclusivo: true });

  // Coherencia entre los tres números: el redondeo de cada cuota a centavos admite hasta 0.01 por mes.
  if (plazoMeses !== null && cuotaMensual !== null && totalCredito !== null) {
    const esperado = cuotaMensual * plazoMeses;
    if (Math.abs(totalCredito - esperado) > 0.01 * plazoMeses + 0.01)
      errores.push(err("coherencia", "totalCredito", `totalCredito (${totalCredito}) no coincide con cuotaMensual × plazoMeses (${Math.round(esperado * 100) / 100})`));
  }

  const cuotasPagadas = leerNumero(fila, "cuotasPagadas", errores, { entero: true, min: 0, opcional: true });
  if (cuotasPagadas !== null && plazoMeses !== null && cuotasPagadas > plazoMeses)
    errores.push(err("coherencia", "cuotasPagadas", `cuotasPagadas (${cuotasPagadas}) supera el plazo (${plazoMeses})`));

  const estadoCrudo = texto(fila.estado);
  const estado = ESTADOS_CREDITO.find((e) => sinAcentos(e).toLowerCase() === sinAcentos(estadoCrudo).toLowerCase());
  if (!estadoCrudo) errores.push(err("obligatorio", "estado", "estado es obligatorio"));
  else if (!estado) errores.push(err("regla", "estado", `estado inválido (“${estadoCrudo}”); use ${ESTADOS_CREDITO.join(", ")}`));
  else if (cuotasPagadas !== null && plazoMeses !== null) {
    if (estado === "Liquidado" && cuotasPagadas !== plazoMeses) errores.push(err("coherencia", "estado", "un crédito Liquidado debe tener todas las cuotas pagadas"));
    if (!ESTADOS_CON_PAGOS.includes(estado) && cuotasPagadas > 0) errores.push(err("coherencia", "estado", `un crédito ${estado} no puede tener cuotas pagadas`));
  }

  const solicitud = leerFecha(fila, "fechaSolicitud", ctx, errores);
  const resolucion = leerFecha(fila, "fechaResolucion", ctx, errores, { opcional: true });
  if (solicitud && resolucion && resolucion < solicitud) errores.push(err("coherencia", "fechaResolucion", "fechaResolucion es anterior a fechaSolicitud"));

  if (errores.length) return { errores };
  return {
    id: creditoId,
    data: {
      usuarioId: empleado.correo,
      usuario: ctx.usuarios.get(empleado.correo)?.usuario ?? "",
      empleadoId,
      productoId,
      nombreProducto: producto.nombre,
      imagenProductoURL: "",
      cantidad,
      plazoMeses,
      cuotaMensual,
      totalCredito,
      cuotasPagadas,
      estado,
      ...(resolucion ? { fechaRevision: resolucion } : {}),
      ...meta(ctx, solicitud),
    },
  };
}

const idCuota = (fila) => {
  const creditoId = idSimple("creditoId")(fila);
  const numero = parsearEntero(fila.numeroCuota);
  return creditoId && numero !== null && numero > 0 ? `${creditoId}-C${String(numero).padStart(2, "0")}` : null;
};

function validarCuota(fila, ctx) {
  const errores = [];
  const creditoId = leerId(fila, "creditoId", errores);
  const credito = creditoId ? ctx.creditos.get(creditoId) : null;
  if (creditoId && !credito) errores.push(err("referencia", "creditoId", `el crédito ${creditoId} no existe`));
  else if (credito && !ESTADOS_CON_PAGOS.includes(credito.estado))
    errores.push(err("regla", "creditoId", `el crédito está ${credito.estado}; solo Aprobado o Liquidado recibe pagos`));

  const numeroCuota = leerNumero(fila, "numeroCuota", errores, { entero: true, min: 1 });
  if (numeroCuota !== null && credito && numeroCuota > credito.plazoMeses)
    errores.push(err("coherencia", "numeroCuota", `numeroCuota fuera de rango (1 a ${credito.plazoMeses})`));

  const monto = leerNumero(fila, "monto", errores, { min: 0, exclusivo: true });

  const pago = leerFecha(fila, "fechaPago", ctx, errores);
  const fr = credito?.fechaRegistro;
  if (pago && fr && pago < new Date(fr.getFullYear(), fr.getMonth(), fr.getDate()))
    errores.push(err("coherencia", "fechaPago", "fechaPago es anterior a la solicitud del crédito"));

  if (errores.length) return { errores };
  const id = idCuota(fila);
  return { id, data: { cuotaId: id, creditoId, numeroCuota, monto, ...meta(ctx, pago) } };
}

const columna = (clave, requerido = true) => ({ clave, requerido });

export const TABLAS = {
  productos: {
    etiqueta: "Productos",
    coleccion: "productos",
    columnas: [
      columna("productoId"), columna("nombre"), columna("categoriaId"), columna("precioContado"),
      columna("precioCredito"), columna("stock"), columna("garantiaMeses", false), columna("activo", false),
      columna("descripcion", false), columna("fechaAlta", false),
    ],
    idDe: idSimple("productoId"),
    validar: validarProducto,
  },
  creditos: {
    etiqueta: "Créditos",
    coleccion: "creditos",
    columnas: [
      columna("creditoId"), columna("empleadoId"), columna("productoId"), columna("cantidad"),
      columna("plazoMeses"), columna("cuotaMensual"), columna("totalCredito"), columna("cuotasPagadas", false),
      columna("estado"), columna("fechaSolicitud"), columna("fechaResolucion", false),
    ],
    idDe: idSimple("creditoId"),
    validar: validarCredito,
  },
  cuotas: {
    etiqueta: "Cuotas (pagos)",
    coleccion: "cuotas",
    columnas: [columna("creditoId"), columna("numeroCuota"), columna("monto"), columna("fechaPago")],
    idDe: idCuota,
    validar: validarCuota,
  },
};

// Campos que se comparan cuando el ID ya existe. Una celda vacía en el Excel significa "no cambiar".
// `derivados` son campos que se recalculan a partir del cambiado (p. ej. el nombre del producto de un crédito).
const comparable = (clave, campo, tipo, derivados = []) => ({ clave, campo, tipo, derivados });
const COMPARABLES = {
  productos: [
    comparable("nombre", "nombre", "texto", ["nombreNormalizado"]),
    comparable("categoriaId", "categoriaId", "texto", ["categoria"]),
    comparable("precioContado", "precioContado", "numero"),
    comparable("precioCredito", "precioCredito", "numero"),
    comparable("stock", "stock", "numero"),
    comparable("garantiaMeses", "garantiaMeses", "numero"),
    comparable("activo", "activo", "bool"),
    comparable("descripcion", "descripcion", "texto"),
    comparable("fechaAlta", "fechaRegistro", "fecha"),
  ],
  creditos: [
    comparable("empleadoId", "empleadoId", "texto", ["usuarioId", "usuario"]),
    comparable("productoId", "productoId", "texto", ["nombreProducto"]),
    comparable("cantidad", "cantidad", "numero"),
    comparable("plazoMeses", "plazoMeses", "numero"),
    comparable("cuotaMensual", "cuotaMensual", "numero"),
    comparable("totalCredito", "totalCredito", "numero"),
    comparable("cuotasPagadas", "cuotasPagadas", "numero"),
    comparable("estado", "estado", "texto"),
    comparable("fechaSolicitud", "fechaRegistro", "fecha"),
    comparable("fechaResolucion", "fechaRevision", "fecha"),
  ],
  cuotas: [comparable("monto", "monto", "numero"), comparable("fechaPago", "fechaRegistro", "fecha")],
};

function valorComparable(valor, tipo) {
  if (valor === undefined || valor === null || valor === "") return null;
  if (tipo === "numero") return Number(valor);
  if (tipo === "bool") return Boolean(valor);
  if (tipo === "fecha") {
    const f = aFecha(valor);
    return f ? `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, "0")}-${String(f.getDate()).padStart(2, "0")}` : null;
  }
  return String(valor).trim();
}

function mostrarValor(v, tipo) {
  if (v === null) return "—";
  if (tipo === "bool") return v ? "Sí" : "No";
  if (tipo === "fecha") return `${v.slice(8, 10)}/${v.slice(5, 7)}/${v.slice(0, 4)}`;
  return String(v);
}

// Compara la fila validada con el documento que ya existe. Devuelve los campos distintos
// (para mostrarlos), los cambios a escribir si se acepta la actualización y las advertencias.
function compararConExistente(tabla, fila, data, existente) {
  const campos = [];
  const cambios = {};
  for (const c of COMPARABLES[tabla]) {
    if (texto(fila[c.clave]) === "") continue;
    const nuevo = valorComparable(data[c.campo], c.tipo);
    const actual = valorComparable(existente[c.campo], c.tipo);
    const igual = c.tipo === "numero" ? actual !== null && nuevo !== null && Math.abs(actual - nuevo) < 0.005 : actual === nuevo;
    if (igual) continue;
    campos.push({ campo: c.clave, actual: mostrarValor(actual, c.tipo), nuevo: mostrarValor(nuevo, c.tipo) });
    cambios[c.campo] = data[c.campo];
    for (const d of c.derivados) cambios[d] = data[d];
  }
  // Los créditos importados son históricos: la Cloud Function ignora las actualizaciones de importación y no toca el stock.
  return { campos, cambios, advertencias: [] };
}

function normalizarFila(cruda, columnas) {
  const mapa = new Map(columnas.map((c) => [normalizarClave(c.clave), c.clave]));
  const fila = {};
  for (const [k, v] of Object.entries(cruda)) {
    const clave = mapa.get(normalizarClave(k));
    if (clave) fila[clave] = v;
  }
  return fila;
}

// `motivo` junta los mensajes de la fila; `motivos` los separa para mostrarlos en lista; `errores` conserva paso y campo.
const rechazo = (fila, id, errores) => ({ fila, id, motivo: errores.map((e) => e.mensaje).join("; "), motivos: errores.map((e) => e.mensaje), errores });

const filaVacia = (fila) => Object.values(fila).every((v) => texto(v) === "");

// ---- Compatibilidad del archivo ----
// El archivo es compatible si trae todas las columnas obligatorias de la plantilla y ninguna repetida.
// Las columnas que no son de la plantilla (`extras`) no lo invalidan: simplemente no se importan.
export function verificarEncabezados(tabla, filasCrudas) {
  const columnas = TABLAS[tabla].columnas;
  const encabezados = [...new Set(filasCrudas.slice(0, 50).flatMap((f) => Object.keys(f)))];
  const destinos = new Map(columnas.map((c) => [normalizarClave(c.clave), c.clave]));
  const encontradas = new Map();
  const extras = [];
  for (const h of encabezados) {
    const clave = destinos.get(normalizarClave(h));
    if (clave) encontradas.set(clave, (encontradas.get(clave) || 0) + 1);
    else extras.push(h);
  }
  const faltantes = columnas.filter((c) => c.requerido && !encontradas.has(c.clave)).map((c) => c.clave);
  const repetidas = [...encontradas].filter(([, n]) => n > 1).map(([clave]) => clave);
  return { compatible: faltantes.length === 0 && repetidas.length === 0, faltantes, repetidas, extras };
}

// Procesa todas las filas sin escribir nada.
// Invariante: total = insertar + conflictos + rechazadas + omitidas.
// ctx.existentes puede ser un Map id -> datos actuales (permite detectar conflictos) o un Set de ids (solo omite).
export function procesarFilas(tabla, filasCrudas, ctxEntrada) {
  const def = TABLAS[tabla];
  const ctx = { ...ctxEntrada, nombresArchivo: new Map(), nombresExistentes: new Map() };
  if (tabla === "productos" && ctx.existentes instanceof Map) {
    for (const [id, d] of ctx.existentes) {
      const clave = normalizarNombre(d?.nombre ?? d?.nombreNormalizado);
      if (clave) ctx.nombresExistentes.set(clave, id);
    }
  }
  const vistos = new Set();
  const resultado = { total: 0, insertar: [], conflictos: [], rechazadas: [], omitidas: [], advertencias: [] };
  // Las advertencias no rechazan la fila: solo se informan en el análisis.
  const anotar = (fila, id, avisos = []) => avisos.forEach((a) => resultado.advertencias.push({ fila, id, ...a }));

  filasCrudas.forEach((cruda, indice) => {
    const fila = normalizarFila(cruda, def.columnas);
    if (filaVacia(fila)) return;
    resultado.total++;
    const numeroFila = indice + 2;
    const idPrevio = def.idDe(fila);

    if (idPrevio && vistos.has(idPrevio)) {
      resultado.omitidas.push({ fila: numeroFila, id: idPrevio, motivo: "Repetida dentro del archivo" });
      return;
    }

    if (idPrevio && ctx.existentes.has(idPrevio)) {
      vistos.add(idPrevio);
      const actual = ctx.existentes instanceof Map ? ctx.existentes.get(idPrevio) : null;
      if (!actual) {
        resultado.omitidas.push({ fila: numeroFila, id: idPrevio, motivo: "Ya existe en el sistema" });
        return;
      }
      const v = def.validar(fila, ctx);
      if (v.errores) {
        resultado.rechazadas.push(rechazo(numeroFila, idPrevio, v.errores));
        return;
      }
      anotar(numeroFila, idPrevio, v.advertencias);
      const { campos, cambios, advertencias } = compararConExistente(tabla, fila, v.data, actual);
      if (campos.length === 0) resultado.omitidas.push({ fila: numeroFila, id: idPrevio, motivo: "Ya existe y es idéntico" });
      else resultado.conflictos.push({ fila: numeroFila, id: idPrevio, campos, cambios, advertencias });
      return;
    }

    const r = def.validar(fila, ctx);
    if (r.errores) {
      resultado.rechazadas.push(rechazo(numeroFila, idPrevio || texto(fila[def.columnas[0].clave]), r.errores));
      return;
    }
    vistos.add(r.id);
    anotar(numeroFila, r.id, r.advertencias);
    resultado.insertar.push({ fila: numeroFila, id: r.id, data: r.data });
  });

  return resultado;
}

export function resumenDeProceso(r) {
  return { totalFilas: r.total, insertadas: r.insertar.length, conflictos: r.conflictos.length, rechazadas: r.rechazadas.length, omitidas: r.omitidas.length };
}

export function resumirImportaciones(lista, tabla) {
  const filtradas = tabla && tabla !== "todas" ? lista.filter((i) => i.tabla === tabla) : lista;
  return filtradas.reduce(
    (acc, i) => ({
      importaciones: acc.importaciones + 1,
      insertadas: acc.insertadas + (i.insertadas || 0),
      actualizadas: acc.actualizadas + (i.actualizadas || 0),
      rechazadas: acc.rechazadas + (i.rechazadas || 0),
      omitidas: acc.omitidas + (i.omitidas || 0),
    }),
    { importaciones: 0, insertadas: 0, actualizadas: 0, rechazadas: 0, omitidas: 0 },
  );
}
