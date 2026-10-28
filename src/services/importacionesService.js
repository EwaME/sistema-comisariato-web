import { conMetrica } from "./metricasService";
import * as XLSX from "xlsx";
import { collection, doc, getDocs, getDocsFromServer, getDocFromServer, setDoc, writeBatch, serverTimestamp, query, orderBy, limit } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { registrarAuditoria } from "./auditoriasService";
import { TABLAS, procesarFilas, resumenDeProceso } from "../helpers/importacionExcel";

const COLECCION_LOG = "importaciones";
const TAMANO_LOTE = 400;
const MAX_DETALLE = 200;

// raw:true deja las fechas de Excel como número de serie; parsearFecha las convierte sin husos horarios.
export const leerExcel = async (archivo) => {
  const libro = XLSX.read(await archivo.arrayBuffer(), { type: "array" });
  const hoja = libro.Sheets[libro.SheetNames[0]];
  if (!hoja) throw new Error("El archivo no tiene hojas.");
  return XLSX.utils.sheet_to_json(hoja, { defval: null, raw: true });
};

// Siempre desde el servidor: sin conexión una lectura de caché vacía saltaría la detección de duplicados.
const leerColeccion = async (nombre) => (await getDocsFromServer(collection(db, nombre))).docs;
const aMapa = (docs, valor) => new Map(docs.map((d) => [d.id, valor(d.data(), d.id)]));

async function cargarContexto(tabla) {
  const destino = await leerColeccion(TABLAS[tabla].coleccion);
  // id -> datos actuales: permite comparar cada fila con lo que ya existe y detectar conflictos
  const ctx = { existentes: new Map(destino.map((d) => [d.id, d.data()])) };

  if (tabla === "productos") {
    ctx.categorias = aMapa(await leerColeccion("categorias"), (c) => c.nombre);
    const config = await getDocFromServer(doc(db, "configuraciones", "config_global"));
    ctx.stockMinimoCierre = config.exists() ? config.data().StockMinimoCierre || 0 : 0;
  }

  if (tabla === "creditos") {
    ctx.productos = aMapa(await leerColeccion("productos"), (p) => ({ nombre: p.nombre }));
    ctx.empleados = aMapa(await leerColeccion("empleados"), (e) => ({ correo: (e.correo || "").toLowerCase() }));
    const usuarios = await leerColeccion("usuarios");
    ctx.usuarios = new Map(usuarios.map((u) => [u.id, { usuario: u.data().usuario }]));
  }

  if (tabla === "cuotas") {
    ctx.creditos = aMapa(await leerColeccion("creditos"), (c) => ({
      plazoMeses: c.plazoMeses,
      estado: c.estado,
      fechaRegistro: c.fechaRegistro?.toDate?.() ?? null,
    }));
  }

  return ctx;
}

export const simularImportacion = async (tabla, filas) => {
  const ctx = { ...(await cargarContexto(tabla)), ahora: new Date(), importacionId: "SIMULACION" };
  const r = procesarFilas(tabla, filas, ctx);
  return { ...resumenDeProceso(r), conflictos: r.conflictos, rechazadas: r.rechazadas, omitidas: r.omitidas };
};

// `actualizar` = IDs de filas en conflicto que el usuario decidió aplicar; el resto conserva el dato actual.
const ejecutarImportacionSinMedir = async ({ tabla, filas, archivo, correo, actualizar = [] }) => {
  const refLog = doc(collection(db, COLECCION_LOG));
  const ctx = { ...(await cargarContexto(tabla)), ahora: new Date(), importacionId: refLog.id };
  const r = procesarFilas(tabla, filas, ctx);
  const coleccion = TABLAS[tabla].coleccion;

  const elegidos = new Set(actualizar);
  const aplicar = r.conflictos.filter((c) => elegidos.has(c.id));
  const conservados = r.conflictos.filter((c) => !elegidos.has(c.id));
  const operaciones = [
    ...r.insertar.map(({ id, data }) => ({ tipo: "insertar", id, data: { ...data, fechaImportacion: serverTimestamp() } })),
    ...aplicar.map(({ id, cambios }) => ({ tipo: "actualizar", id, data: { ...cambios, fechaModificacion: serverTimestamp(), ultimaImportacionId: refLog.id } })),
  ];

  let insertadas = 0;
  let actualizadas = 0;
  let error = null;
  try {
    for (let i = 0; i < operaciones.length; i += TAMANO_LOTE) {
      const trozo = operaciones.slice(i, i + TAMANO_LOTE);
      const lote = writeBatch(db);
      trozo.forEach(({ tipo, id, data }) => (tipo === "insertar" ? lote.set(doc(db, coleccion, id), data) : lote.update(doc(db, coleccion, id), data)));
      await lote.commit();
      insertadas += trozo.filter((o) => o.tipo === "insertar").length;
      actualizadas += trozo.filter((o) => o.tipo === "actualizar").length;
    }
  } catch (e) {
    error = e.message;
  }

  // total = insertadas + actualizadas + rechazadas + omitidas + noProcesadas (los conflictos no aplicados cuentan como omitidos)
  const resumen = {
    totalFilas: r.total,
    insertadas,
    actualizadas,
    rechazadas: r.rechazadas.length,
    omitidas: r.omitidas.length + conservados.length,
    noProcesadas: operaciones.length - insertadas - actualizadas,
  };

  await setDoc(refLog, {
    importacionId: refLog.id,
    tabla,
    archivo,
    usuario: correo,
    fecha: serverTimestamp(),
    ...resumen,
    conflictosDetectados: r.conflictos.length,
    estado: error ? "ERROR" : "COMPLETADA",
    error,
    detalleRechazos: r.rechazadas.slice(0, MAX_DETALLE),
    detalleOmitidas: r.omitidas.slice(0, MAX_DETALLE),
    detalleConflictos: r.conflictos.slice(0, MAX_DETALLE).map(({ fila, id, campos }) => ({ fila, id, decision: elegidos.has(id) ? "actualizada" : "conservada", campos })),
  });

  await registrarAuditoria(
    "IMPORTACIÓN",
    "Importación Excel",
    `${TABLAS[tabla].etiqueta}: ${insertadas} insertadas, ${actualizadas} actualizadas, ${resumen.rechazadas} rechazadas, ${resumen.omitidas} omitidas (archivo ${archivo})`,
    refLog.id,
  );

  return { importacionId: refLog.id, estado: error ? "ERROR" : "COMPLETADA", error, ...resumen, rechazadasDetalle: r.rechazadas };
};

export const obtenerImportaciones = async (maximo = 500) => {
  const q = query(collection(db, COLECCION_LOG), orderBy("fecha", "desc"), limit(maximo));
  return (await getDocs(q)).docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const ejecutarImportacion = conMetrica("ejecutarImportacion", ejecutarImportacionSinMedir);
