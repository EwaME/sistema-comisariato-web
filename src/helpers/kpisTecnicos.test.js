import { describe, it, expect } from "vitest";
import {
  clasificarError, usuariosActivos, usuariosPorRol, actividadPorModulo, accionesPorTipo, horasPico,
  loginsFallidos, metricasOperaciones, ejecucionesFunciones, calcularIndicadoresTecnicos,
} from "./kpisTecnicos";

const AHORA = new Date(2026, 9, 27, 15, 0);
const SIN_PERIODO = { desde: null, hasta: null };
const d = (dia, h, m) => new Date(2026, 9, dia, h, m);

const actividad = [
  { id: "L1", correo: "a@x", nombreUsuario: "Ana", rolUsuario: "ADMINISTRADOR", modulo: "Gestión de Créditos", accion: "APROBADO", fechaAccion: d(27, 14, 58) },
  { id: "L2", correo: "a@x", nombreUsuario: "Ana", rolUsuario: "ADMINISTRADOR", modulo: "Autenticación", accion: "INICIO DE SESIÓN", fechaAccion: d(27, 14, 59) },
  { id: "L3", correo: "b@x", nombreUsuario: "Beto", modulo: "Gestión de Productos", accion: "CREACIÓN", fechaAccion: d(27, 14, 50) },
  { id: "L4", correo: "c@x", modulo: "Autenticación", accion: "ERROR DE ACCESO", fechaAccion: d(27, 14, 57) },
  { id: "L5", correo: "Sistema", modulo: "Gestión de Créditos", accion: "NOTIFICACIÓN", fechaAccion: d(27, 14, 59) },
  { id: "L6", correo: "d@x", nombreUsuario: "Dora", modulo: "Gestión de Productos", accion: "CREACIÓN", fechaAccion: d(27, 14, 56) },
  { id: "L7", correo: "a@x", modulo: "Gestión de Productos", accion: "EDICIÓN", fechaAccion: { toDate: () => d(20, 9, 10) } },
  { id: "L8", correo: "e@x", modulo: "Autenticación", accion: "ACCESO DENEGADO", fechaAccion: d(20, 9, 40) },
];

const logsSistema = [
  { id: "S1", origen: "cliente", operacion: "login", exito: true, duracionMs: 120, fecha: d(27, 10, 0) },
  { id: "S2", origen: "cliente", operacion: "login", exito: true, duracionMs: 80, fecha: d(27, 10, 5) },
  { id: "S3", origen: "cliente", operacion: "crearProducto", exito: false, codigoError: "unavailable", duracionMs: 3000, fecha: d(27, 11, 0) },
  { id: "S4", origen: "cliente", operacion: "crearProducto", exito: false, codigoError: "permission-denied", duracionMs: 200, fecha: d(27, 11, 5) },
  { id: "S5", origen: "cliente", operacion: "crearProducto", exito: true, duracionMs: 100, fecha: d(27, 11, 10) },
  { id: "S6", origen: "cloud_function", operacion: "descontarStockAlAprobar", exito: true, duracionMs: 300, referencia: "CRD-1", fecha: d(27, 12, 0) },
  { id: "S7", origen: "cloud_function", operacion: "descontarStockAlAprobar", exito: false, mensaje: "El producto no existe", fecha: d(27, 12, 5) },
];

describe("clasificarError", () => {
  it("agrupa los errores de Firebase por su equivalente HTTP", () => {
    expect(clasificarError("unavailable")).toBe("servidor");
    expect(clasificarError("firestore/internal")).toBe("servidor");
    expect(clasificarError("auth/network-request-failed")).toBe("servidor");
    expect(clasificarError("permission-denied")).toBe("cliente");
    expect(clasificarError("auth/invalid-credential")).toBe("cliente");
    expect(clasificarError(undefined)).toBe("aplicacion");
    expect(clasificarError("algo-raro")).toBe("aplicacion");
  });
});

describe("usuarios activos en los últimos 5 minutos", () => {
  it("cuenta usuarios únicos y excluye fallos de acceso, 'Sistema' y acciones más viejas", () => {
    const r = usuariosActivos(actividad, AHORA);
    expect(r.total).toBe(2);
    expect(r.registros.map((x) => x.id)).toEqual(["a@x", "d@x"]);
    expect(r.registros[0].accion).toBe("INICIO DE SESIÓN");
  });
  it("pasados los 5 minutos ya no está activo", () => {
    expect(usuariosActivos(actividad, new Date(2026, 9, 27, 15, 4)).total).toBe(1);
    expect(usuariosActivos(actividad, new Date(2026, 9, 27, 15, 30)).total).toBe(0);
  });
});

describe("usuarios por rol", () => {
  const usuarios = [
    { id: "u1", nombre: "Ana", rol: ["EMPLEADO", "ADMINISTRADOR"], estado: "ACTIVO" },
    { id: "u2", nombre: "Beto", rol: ["EMPLEADO"] },
    { id: "u3", nombre: "Caro", rol: ["EMPLEADO", "GERENTE"], estado: "INACTIVO" },
    { id: "u4", nombre: "Dani", rol: ["EMPLEADO", "ADMINISTRADOR"], estado: "ACTIVO" },
  ];
  it("solo cuenta cuentas habilitadas, una vez cada una", () => {
    const r = usuariosPorRol(usuarios);
    expect(r.total).toBe(3);
    expect(r.porRol).toEqual([{ rol: "ADMINISTRADOR", cantidad: 2 }, { rol: "EMPLEADO", cantidad: 1 }]);
  });
});

describe("actividad registrada", () => {
  it("por módulo, con el período filtrando", () => {
    const todo = actividadPorModulo(actividad, SIN_PERIODO);
    expect(todo.total).toBe(8);
    expect(Object.fromEntries(todo.porModulo.map((m) => [m.modulo, m.cantidad]))).toEqual({ "Gestión de Créditos": 2, Autenticación: 3, "Gestión de Productos": 3 });
    const dia = actividadPorModulo(actividad, { desde: d(27, 0, 0), hasta: d(27, 0, 0) });
    expect(dia.total).toBe(6);
    expect(dia.registros.every((r) => r.fecha.getDate() === 27)).toBe(true);
  });
  it("por tipo de acción", () => {
    const r = accionesPorTipo(actividad, SIN_PERIODO);
    expect(r.total).toBe(8);
    expect(r.porAccion[0]).toEqual({ accion: "CREACIÓN", cantidad: 2 });
  });
  it("horas pico: 14:00 concentra 6 de 8", () => {
    const r = horasPico(actividad, SIN_PERIODO);
    expect(r.porHora).toHaveLength(24);
    expect(r.horaPico).toBe("14:00");
    expect(r.porHora.find((h) => h.hora === "14").cantidad).toBe(6);
    expect(r.porHora.find((h) => h.hora === "09").cantidad).toBe(2);
  });
  it("logins fallidos: error de acceso y acceso denegado, por día", () => {
    const r = loginsFallidos(actividad, SIN_PERIODO);
    expect(r.total).toBe(2);
    expect(r.porDia).toEqual([{ dia: "2026-10-20", cantidad: 1, etiqueta: "20/10" }, { dia: "2026-10-27", cantidad: 1, etiqueta: "27/10" }]);
  });
});

describe("errores y tiempo de respuesta de las operaciones medidas", () => {
  it("porcentaje de errores de servidor (≈ 5xx) sobre el total y latencia promedio en ms", () => {
    const r = metricasOperaciones(logsSistema, SIN_PERIODO);
    expect([r.total, r.exitos, r.errores, r.erroresServidor]).toEqual([5, 3, 2, 1]);
    expect([r.pctServidor, r.pctErrores, r.latenciaPromedio]).toEqual([20, 40, 700]);
    expect(r.porOperacion.find((o) => o.operacion === "crearProducto")).toMatchObject({ total: 3, errores: 2, erroresServidor: 1, promedioMs: 1100 });
    expect(r.operaciones).toEqual(["crearProducto", "login"]);
  });
  it("permite elegir la operación sin perder la lista de operaciones", () => {
    const r = metricasOperaciones(logsSistema, SIN_PERIODO, "login");
    expect([r.total, r.latenciaPromedio, r.pctServidor]).toEqual([2, 100, 0]);
    expect(r.operaciones).toHaveLength(2);
  });
  it("las ejecuciones de la Cloud Function se cuentan aparte", () => {
    const f = ejecucionesFunciones(logsSistema, SIN_PERIODO);
    expect([f.total, f.exitos, f.fallos]).toEqual([2, 1, 1]);
    expect(f.registros[0].mensaje).toBe("El producto no existe");
  });
  it("el filtro de período se aplica a las mediciones", () => {
    const r = metricasOperaciones(logsSistema, { desde: d(27, 0, 0), hasta: d(26, 0, 0) });
    expect(r.total).toBe(0);
  });
});

describe("calcularIndicadoresTecnicos", () => {
  it("sin datos no falla", () => {
    const k = calcularIndicadoresTecnicos({ actividad: [], usuarios: [], logsSistema: [] }, SIN_PERIODO, AHORA);
    expect([k.activos.total, k.roles.total, k.modulos.total, k.fallidos.total, k.operaciones.pctServidor, k.funciones.total]).toEqual([0, 0, 0, 0, 0, 0]);
    expect(k.horas.horaPico).toBeNull();
  });
});
