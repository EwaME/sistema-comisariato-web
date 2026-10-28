// Cálculo de los indicadores del dashboard técnico. Sin Firebase: recibe los documentos ya leídos.
// Fuentes: actividad_logs (auditoría), usuarios y logs_sistema (medición de operaciones y Cloud Functions).
import { aFecha, dentro } from "./kpisGerenciales.js";

export const ACCIONES_FALLO_ACCESO = ["ERROR DE ACCESO", "ACCESO DENEGADO"];
const CODIGOS_SERVIDOR = ["unavailable", "internal", "deadline-exceeded", "unknown", "data-loss", "aborted", "resource-exhausted", "auth/network-request-failed", "auth/internal-error"];
const CODIGOS_CLIENTE = ["permission-denied", "not-found", "invalid-argument", "already-exists", "failed-precondition", "out-of-range", "unauthenticated", "cancelled"];

// El proyecto no tiene API HTTP propia: los errores de Firebase se agrupan por su equivalente HTTP.
// servidor ≈ 5xx, cliente ≈ 4xx, aplicacion = error lanzado por el propio código sin código de Firebase.
export function clasificarError(codigo) {
  const c = String(codigo ?? "").replace(/^firestore\//, "");
  if (!c) return "aplicacion";
  if (CODIGOS_SERVIDOR.includes(c)) return "servidor";
  if (c.startsWith("auth/") || CODIGOS_CLIENTE.includes(c)) return "cliente";
  return "aplicacion";
}

const redondear = (n, d = 1) => Math.round(n * 10 ** d) / 10 ** d;
const pct = (parte, total) => (total > 0 ? redondear((parte / total) * 100, 2) : 0);
const dosDigitos = (n) => String(n).padStart(2, "0");

function agrupar(registros, clave, nombre) {
  const mapa = new Map();
  for (const r of registros) mapa.set(r[clave], (mapa.get(r[clave]) || 0) + 1);
  return [...mapa.entries()].map(([k, cantidad]) => ({ [nombre]: k, cantidad })).sort((a, b) => b.cantidad - a.cantidad);
}

function logsDelPeriodo(logs, periodo) {
  return logs
    .map((l) => ({ l, fecha: aFecha(l.fechaAccion) }))
    .filter(({ fecha }) => fecha && dentro(fecha, periodo));
}

const filaLog = (l, fecha, grupo) => ({
  id: l.id,
  grupo,
  fecha,
  usuario: l.nombreUsuario || l.correo || "—",
  correo: l.correo || "—",
  rol: l.rolUsuario || "—",
  modulo: l.modulo || "—",
  accion: l.accion || "—",
  descripcion: l.descripcion || "",
});

// 1. Usuarios únicos con una acción registrada en los últimos N minutos (no depende del período)
export function usuariosActivos(logs, ahora = new Date(), minutos = 5) {
  const limite = new Date(ahora.getTime() - minutos * 60000);
  const ultimo = new Map();
  for (const l of logs) {
    const fecha = aFecha(l.fechaAccion);
    if (!fecha || fecha < limite) continue;
    if (!l.correo || l.correo === "Sistema" || ACCIONES_FALLO_ACCESO.includes(l.accion)) continue;
    const previo = ultimo.get(l.correo);
    if (!previo || fecha > previo.fecha)
      ultimo.set(l.correo, { id: l.correo, nombre: l.nombreUsuario || l.correo, rol: l.rolUsuario || "—", modulo: l.modulo || "—", accion: l.accion || "—", fecha });
  }
  const registros = [...ultimo.values()].sort((a, b) => b.fecha - a.fecha);
  return { total: registros.length, minutos, registros };
}

// 2. Cuentas habilitadas por rol principal (el primer rol distinto de EMPLEADO; sin él, EMPLEADO)
export function usuariosPorRol(usuarios) {
  const registros = usuarios
    .filter((u) => u.estado !== "INACTIVO")
    .map((u) => {
      const roles = Array.isArray(u.rol) ? u.rol : u.rol ? [u.rol] : [];
      return { id: u.id, grupo: roles.find((r) => r !== "EMPLEADO") || "EMPLEADO", nombre: u.nombre || "—", correo: u.correo || u.id, plataforma: u.plataforma || "—", estado: u.estado || "ACTIVO" };
    })
    .sort((a, b) => a.grupo.localeCompare(b.grupo) || a.nombre.localeCompare(b.nombre));
  return { total: registros.length, porRol: agrupar(registros, "grupo", "rol"), registros };
}

// 3. Operaciones registradas por módulo en el período
export function actividadPorModulo(logs, periodo) {
  const registros = logsDelPeriodo(logs, periodo).map(({ l, fecha }) => filaLog(l, fecha, l.modulo || "—")).sort((a, b) => b.fecha - a.fecha);
  return { total: registros.length, porModulo: agrupar(registros, "grupo", "modulo"), registros };
}

// 10. Acciones por tipo (creación, edición, aprobación, acceso...)
export function accionesPorTipo(logs, periodo) {
  const registros = logsDelPeriodo(logs, periodo).map(({ l, fecha }) => filaLog(l, fecha, l.accion || "—")).sort((a, b) => b.fecha - a.fecha);
  return { total: registros.length, porAccion: agrupar(registros, "grupo", "accion"), registros };
}

// 9. Actividad por hora del día (hora local)
export function horasPico(logs, periodo) {
  const registros = logsDelPeriodo(logs, periodo).map(({ l, fecha }) => filaLog(l, fecha, dosDigitos(fecha.getHours())));
  const cuenta = new Map();
  for (const r of registros) cuenta.set(r.grupo, (cuenta.get(r.grupo) || 0) + 1);
  const porHora = Array.from({ length: 24 }, (_, h) => ({ hora: dosDigitos(h), etiqueta: `${dosDigitos(h)}:00`, cantidad: cuenta.get(dosDigitos(h)) || 0 }));
  const pico = porHora.reduce((m, x) => (x.cantidad > m.cantidad ? x : m), porHora[0]);
  return { total: registros.length, porHora, horaPico: pico.cantidad > 0 ? pico.etiqueta : null, registros: registros.sort((a, b) => b.fecha - a.fecha) };
}

// 7. Intentos de inicio de sesión fallidos o denegados
export function loginsFallidos(logs, periodo) {
  const registros = logsDelPeriodo(logs, periodo)
    .filter(({ l }) => ACCIONES_FALLO_ACCESO.includes(l.accion))
    .map(({ l, fecha }) => filaLog(l, fecha, `${fecha.getFullYear()}-${dosDigitos(fecha.getMonth() + 1)}-${dosDigitos(fecha.getDate())}`))
    .sort((a, b) => b.fecha - a.fecha);
  const porDia = agrupar(registros, "grupo", "dia")
    .map((d) => ({ ...d, etiqueta: `${d.dia.slice(8, 10)}/${d.dia.slice(5, 7)}` }))
    .sort((a, b) => a.dia.localeCompare(b.dia));
  return { total: registros.length, porDia, registros };
}

// 4 y 5. Operaciones medidas desde la app: errores (por equivalente HTTP) y tiempo de respuesta en milisegundos
export function metricasOperaciones(logsSistema, periodo, operacion = "todas") {
  const delPeriodo = logsSistema
    .map((l) => ({ l, fecha: aFecha(l.fecha) }))
    .filter(({ l, fecha }) => l.origen !== "cloud_function" && fecha && dentro(fecha, periodo));
  const operaciones = [...new Set(delPeriodo.map(({ l }) => l.operacion))].sort();

  const registros = delPeriodo
    .filter(({ l }) => operacion === "todas" || l.operacion === operacion)
    .map(({ l, fecha }) => ({
      id: l.id,
      grupo: l.operacion,
      operacion: l.operacion,
      resultado: l.exito ? "Éxito" : "Error",
      tipoError: l.exito ? "—" : clasificarError(l.codigoError),
      codigo: l.codigoError || "—",
      duracionMs: Math.round(l.duracionMs || 0),
      usuario: l.correo || "—",
      mensaje: l.mensaje || "",
      fecha,
    }))
    .sort((a, b) => b.fecha - a.fecha);

  const media = (lista) => (lista.length ? redondear(lista.reduce((s, r) => s + r.duracionMs, 0) / lista.length) : 0);
  const errores = registros.filter((r) => r.resultado === "Error").length;
  const erroresServidor = registros.filter((r) => r.tipoError === "servidor").length;
  const porOperacion = [...new Set(registros.map((r) => r.operacion))].map((nombre) => {
    const g = registros.filter((r) => r.operacion === nombre);
    const err = g.filter((r) => r.resultado === "Error").length;
    return { operacion: nombre, total: g.length, errores: err, exitos: g.length - err, erroresServidor: g.filter((r) => r.tipoError === "servidor").length, promedioMs: media(g) };
  }).sort((a, b) => b.total - a.total);

  return {
    total: registros.length,
    exitos: registros.length - errores,
    errores,
    erroresServidor,
    pctServidor: pct(erroresServidor, registros.length),
    pctErrores: pct(errores, registros.length),
    latenciaPromedio: media(registros),
    porOperacion,
    operaciones,
    registros,
  };
}

// 8. Ejecuciones de la Cloud Function descontarStockAlAprobar
export function ejecucionesFunciones(logsSistema, periodo) {
  const registros = logsSistema
    .map((l) => ({ l, fecha: aFecha(l.fecha) }))
    .filter(({ l, fecha }) => l.origen === "cloud_function" && fecha && dentro(fecha, periodo))
    .map(({ l, fecha }) => ({
      id: l.id,
      grupo: l.exito ? "Éxito" : "Fallo",
      operacion: l.operacion || "—",
      referencia: l.referencia || "—",
      duracionMs: Math.round(l.duracionMs || 0),
      mensaje: l.mensaje || "",
      fecha,
    }))
    .sort((a, b) => b.fecha - a.fecha);
  const exitos = registros.filter((r) => r.grupo === "Éxito").length;
  return { total: registros.length, exitos, fallos: registros.length - exitos, registros };
}

export function calcularIndicadoresTecnicos(datos, periodo, ahora = new Date(), operacion = "todas") {
  return {
    activos: usuariosActivos(datos.actividad, ahora),
    roles: usuariosPorRol(datos.usuarios),
    modulos: actividadPorModulo(datos.actividad, periodo),
    acciones: accionesPorTipo(datos.actividad, periodo),
    horas: horasPico(datos.actividad, periodo),
    fallidos: loginsFallidos(datos.actividad, periodo),
    operaciones: metricasOperaciones(datos.logsSistema, periodo, operacion),
    funciones: ejecucionesFunciones(datos.logsSistema, periodo),
  };
}
