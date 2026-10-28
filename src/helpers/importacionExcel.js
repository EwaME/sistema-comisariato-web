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
  if (!fecha) return { error: `${nombreCampo} inválida (use dd/mm/aaaa o aaaa-mm-dd)` };
  if (esFuturo(fecha, ahora)) return { error: `${nombreCampo} es una fecha futura` };
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

function validarProducto(fila, ctx) {
  const productoId = idSimple("productoId")(fila);
  if (!productoId) return { error: "productoId vacío o con caracteres no permitidos" };
  const nombre = texto(fila.nombre);
  if (!nombre) return { error: "nombre es obligatorio" };
  const categoriaId = texto(fila.categoriaId);
  if (!ctx.categorias.has(categoriaId)) return { error: `la categoría ${categoriaId || "(vacía)"} no existe` };
  const precioContado = parsearNumero(fila.precioContado);
  const precioCredito = parsearNumero(fila.precioCredito);
  if (precioContado === null || precioContado <= 0) return { error: "precioContado debe ser mayor que 0" };
  if (precioCredito === null || precioCredito < precioContado)
    return { error: "precioCredito debe ser un número no menor que precioContado" };
  const stock = parsearEntero(fila.stock);
  if (stock === null || stock < 0) return { error: "stock debe ser un entero mayor o igual a 0" };
  const garantiaMeses = texto(fila.garantiaMeses) === "" ? 0 : parsearEntero(fila.garantiaMeses);
  if (garantiaMeses === null || garantiaMeses < 0) return { error: "garantiaMeses debe ser un entero mayor o igual a 0" };
  const activoTexto = sinAcentos(texto(fila.activo)).toLowerCase();
  const activo = !["no", "false", "0"].includes(activoTexto);
  if (activo && stock <= (ctx.stockMinimoCierre || 0))
    return { error: `no se puede activar con stock ${stock} (mínimo de cierre ${ctx.stockMinimoCierre})` };

  let fechaNegocio = ctx.ahora;
  if (texto(fila.fechaAlta) !== "") {
    const r = leerFechaNegocio(fila.fechaAlta, ctx.ahora, "fechaAlta");
    if (r.error) return r;
    fechaNegocio = r.fecha;
  }

  return {
    id: productoId,
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
      ...meta(ctx, fechaNegocio),
    },
  };
}

function validarCredito(fila, ctx) {
  const creditoId = idSimple("creditoId")(fila);
  if (!creditoId) return { error: "creditoId vacío o con caracteres no permitidos" };
  const empleadoId = texto(fila.empleadoId);
  const empleado = ctx.empleados.get(empleadoId);
  if (!empleado) return { error: `el empleado ${empleadoId || "(vacío)"} no existe` };
  if (!empleado.correo) return { error: `el empleado ${empleadoId} no tiene correo registrado` };
  const productoId = texto(fila.productoId);
  const producto = ctx.productos.get(productoId);
  if (!producto) return { error: `el producto ${productoId || "(vacío)"} no existe` };

  const cantidad = parsearEntero(fila.cantidad);
  const plazoMeses = parsearEntero(fila.plazoMeses);
  const cuotaMensual = parsearNumero(fila.cuotaMensual);
  const totalCredito = parsearNumero(fila.totalCredito);
  if (cantidad === null || cantidad < 1) return { error: "cantidad debe ser un entero mayor o igual a 1" };
  if (plazoMeses === null || plazoMeses < 1) return { error: "plazoMeses debe ser un entero mayor o igual a 1" };
  if (cuotaMensual === null || cuotaMensual <= 0) return { error: "cuotaMensual debe ser mayor que 0" };
  if (totalCredito === null || totalCredito <= 0) return { error: "totalCredito debe ser mayor que 0" };

  const cuotasPagadas = texto(fila.cuotasPagadas) === "" ? 0 : parsearEntero(fila.cuotasPagadas);
  if (cuotasPagadas === null || cuotasPagadas < 0) return { error: "cuotasPagadas debe ser un entero mayor o igual a 0" };
  if (cuotasPagadas > plazoMeses) return { error: `cuotasPagadas (${cuotasPagadas}) supera el plazo (${plazoMeses})` };

  const estado = ESTADOS_CREDITO.find((e) => sinAcentos(e).toLowerCase() === sinAcentos(texto(fila.estado)).toLowerCase());
  if (!estado) return { error: `estado inválido; use ${ESTADOS_CREDITO.join(", ")}` };
  if (estado === "Liquidado" && cuotasPagadas !== plazoMeses) return { error: "un crédito Liquidado debe tener todas las cuotas pagadas" };
  if (!ESTADOS_CON_PAGOS.includes(estado) && cuotasPagadas > 0) return { error: `un crédito ${estado} no puede tener cuotas pagadas` };

  const solicitud = leerFechaNegocio(fila.fechaSolicitud, ctx.ahora, "fechaSolicitud");
  if (solicitud.error) return solicitud;
  let fechaRevision = null;
  if (texto(fila.fechaResolucion) !== "") {
    const resolucion = leerFechaNegocio(fila.fechaResolucion, ctx.ahora, "fechaResolucion");
    if (resolucion.error) return resolucion;
    if (resolucion.fecha < solicitud.fecha) return { error: "fechaResolucion es anterior a fechaSolicitud" };
    fechaRevision = resolucion.fecha;
  }

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
      ...(fechaRevision ? { fechaRevision } : {}),
      ...meta(ctx, solicitud.fecha),
    },
  };
}

const idCuota = (fila) => {
  const creditoId = idSimple("creditoId")(fila);
  const numero = parsearEntero(fila.numeroCuota);
  return creditoId && numero !== null && numero > 0 ? `${creditoId}-C${String(numero).padStart(2, "0")}` : null;
};

function validarCuota(fila, ctx) {
  const creditoId = idSimple("creditoId")(fila);
  if (!creditoId) return { error: "creditoId vacío o con caracteres no permitidos" };
  const credito = ctx.creditos.get(creditoId);
  if (!credito) return { error: `el crédito ${creditoId} no existe` };
  if (!ESTADOS_CON_PAGOS.includes(credito.estado)) return { error: `el crédito está ${credito.estado}; solo Aprobado o Liquidado recibe pagos` };
  const numeroCuota = parsearEntero(fila.numeroCuota);
  if (numeroCuota === null || numeroCuota < 1 || numeroCuota > credito.plazoMeses)
    return { error: `numeroCuota fuera de rango (1 a ${credito.plazoMeses})` };
  const monto = parsearNumero(fila.monto);
  if (monto === null || monto <= 0) return { error: "monto debe ser mayor que 0" };
  const pago = leerFechaNegocio(fila.fechaPago, ctx.ahora, "fechaPago");
  if (pago.error) return pago;
  const fr = credito.fechaRegistro;
  if (fr && pago.fecha < new Date(fr.getFullYear(), fr.getMonth(), fr.getDate()))
    return { error: "fechaPago es anterior a la solicitud del crédito" };

  const id = idCuota(fila);
  return { id, data: { cuotaId: id, creditoId, numeroCuota, monto, ...meta(ctx, pago.fecha) } };
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
  const advertencias = [];
  if (tabla === "creditos" && cambios.estado === "Aprobado" && existente.estado !== "Aprobado")
    advertencias.push("Al pasar a Aprobado, la Cloud Function descontará del inventario las unidades del crédito.");
  return { campos, cambios, advertencias };
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

const filaVacia = (fila) => Object.values(fila).every((v) => texto(v) === "");

// Procesa todas las filas sin escribir nada.
// Invariante: total = insertar + conflictos + rechazadas + omitidas.
// ctx.existentes puede ser un Map id -> datos actuales (permite detectar conflictos) o un Set de ids (solo omite).
export function procesarFilas(tabla, filasCrudas, ctx) {
  const def = TABLAS[tabla];
  const vistos = new Set();
  const resultado = { total: 0, insertar: [], conflictos: [], rechazadas: [], omitidas: [] };

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
      if (v.error) {
        resultado.rechazadas.push({ fila: numeroFila, id: idPrevio, motivo: v.error });
        return;
      }
      const { campos, cambios, advertencias } = compararConExistente(tabla, fila, v.data, actual);
      if (campos.length === 0) resultado.omitidas.push({ fila: numeroFila, id: idPrevio, motivo: "Ya existe y es idéntico" });
      else resultado.conflictos.push({ fila: numeroFila, id: idPrevio, campos, cambios, advertencias });
      return;
    }

    const r = def.validar(fila, ctx);
    if (r.error) {
      resultado.rechazadas.push({ fila: numeroFila, id: idPrevio || texto(fila[def.columnas[0].clave]), motivo: r.error });
      return;
    }
    vistos.add(r.id);
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
