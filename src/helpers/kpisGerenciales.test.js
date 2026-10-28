import { describe, it, expect } from "vitest";
import { procesarFilas } from "./importacionExcel";
import { EJEMPLOS } from "./ejemplosImportacion";
import { aFecha, calcularIndicadores, productosBajoMinimo, promocionesResumen } from "./kpisGerenciales";

const AHORA = new Date(2026, 9, 27, 15, 0);
const SIN_PERIODO = { desde: null, hasta: null };

// Datos sembrados + importación de los tres archivos de ejemplo (como en el Emulator)
function datosConImportacion() {
  const ctx = {
    ahora: AHORA,
    importacionId: "IMP",
    stockMinimoCierre: 2,
    categorias: new Map([["CAT-001", "Electrodomésticos"], ["CAT-002", "Hogar"], ["CAT-003", "Tecnología"]]),
    productos: new Map([["PRD-001", { nombre: "Refrigeradora 12 pies" }], ["PRD-002", { nombre: "Licuadora 600W" }], ["PRD-003", { nombre: "Colchón" }], ["PRD-004", { nombre: "Smart TV 50 pulgadas" }]]),
    empleados: new Map(Array.from({ length: 9 }, (_, i) => [`EMP-00${i + 1}`, { correo: `u${i + 1}@crediflow.test` }])),
    usuarios: new Map(),
    existentes: new Set(["PRD-001", "PRD-002", "PRD-003", "PRD-004"]),
  };
  const productosNuevos = procesarFilas("productos", EJEMPLOS.productos, ctx).insertar;
  const creditosNuevos = procesarFilas("creditos", EJEMPLOS.creditos, { ...ctx, existentes: new Set(["CRD-001", "CRD-002"]) }).insertar;
  const mapaCreditos = new Map(creditosNuevos.map((x) => [x.id, { estado: x.data.estado, plazoMeses: x.data.plazoMeses, fechaRegistro: x.data.fechaRegistro }]));
  const cuotasNuevas = procesarFilas("cuotas", EJEMPLOS.cuotas, { ...ctx, existentes: new Set(), creditos: mapaCreditos }).insertar;

  const sembradoProductos = [
    { id: "PRD-001", nombre: "Refrigeradora 12 pies", stock: 12, activo: true },
    { id: "PRD-002", nombre: "Licuadora 600W", stock: 25, activo: true },
    { id: "PRD-003", nombre: "Colchón", stock: 8, activo: true },
    { id: "PRD-004", nombre: "Smart TV 50 pulgadas", stock: 3, activo: true },
  ];
  return {
    creditos: [
      { id: "CRD-001", estado: "Pendiente", totalCredito: 0, fechaRegistro: new Date(2026, 9, 1) },
      ...creditosNuevos.map((x) => ({ id: x.id, ...x.data })),
    ],
    cuotas: cuotasNuevas.map((x) => ({ id: x.id, ...x.data })),
    productos: [...sembradoProductos, ...productosNuevos.map((x) => ({ id: x.id, ...x.data }))],
    reclamos: [
      { id: "RCL-1", estado: "Pendiente", fechaEmision: { toDate: () => new Date(2026, 9, 24) }, solicitante: "A", asunto: "x" },
      { id: "RCL-2", estado: "En revisión", fechaEmision: new Date(2026, 9, 21) },
      { id: "RCL-3", estado: "Revisado", fechaEmision: new Date(2026, 9, 7) },
    ],
    usuarios: [
      { id: "a@x", nombre: "A", rol: ["EMPLEADO", "ADMINISTRADOR"], fechaRegistro: new Date(2026, 1, 3) },
      { id: "b@x", nombre: "B", rol: ["EMPLEADO"], fechaRegistro: new Date(2026, 1, 20) },
      { id: "c@x", nombre: "C", rol: ["EMPLEADO", "GERENTE"], fechaRegistro: new Date(2026, 9, 5) },
    ],
    promociones: [],
    config: { StockMinimoAviso: 8, StockMinimoCierre: 2 },
  };
}

describe("aFecha", () => {
  it("acepta Timestamp de Firestore, Date, segundos y texto aaaa-mm-dd", () => {
    expect(aFecha({ toDate: () => new Date(2026, 0, 5) }).getDate()).toBe(5);
    expect(aFecha({ seconds: Math.floor(new Date(2026, 5, 15, 12).getTime() / 1000) }).getMonth()).toBe(5);
    expect(aFecha("2026-03-15").getMonth()).toBe(2);
    expect(aFecha(null)).toBeNull();
    expect(aFecha("nada")).toBeNull();
  });
});

describe("los registros importados alimentan los indicadores gerenciales", () => {
  const datos = datosConImportacion();
  const k = calcularIndicadores(datos, SIN_PERIODO, AHORA);

  it("créditos aprobados: 4 créditos por L 20,220 (el Rechazado y los Pendientes no cuentan)", () => {
    expect(k.aprobados.cantidad).toBe(4);
    expect(k.aprobados.monto).toBe(20220);
    expect(k.aprobados.porMes.map((m) => m.mes)).toEqual(["2026-02", "2026-03", "2026-06", "2026-09"]);
  });

  it("cartera: cobrado L 5,964, saldo por cobrar L 14,256 y 29.5 % de recuperación", () => {
    expect(k.cartera.cobrado).toBe(5964);
    expect(k.cartera.saldo).toBe(14256);
    expect(k.cartera.porcentaje).toBe(29.5);
    expect(k.cartera.conSaldo).toHaveLength(4);
  });

  it("monto mensual usa la fecha de negocio: cobros por mes del Excel, no el mes de la carga", () => {
    const cobrado = Object.fromEntries(k.mensual.serie.map((m) => [m.mes, m.cobrado]));
    expect(cobrado).toEqual({ "2026-02": 0, "2026-03": 480, "2026-04": 1297, "2026-05": 1297, "2026-06": 817, "2026-07": 1325, "2026-08": 508, "2026-09": 0, "2026-10": 240 });
    expect(k.mensual.totalCobrado).toBe(5964);
    expect(k.mensual.totalDesembolsado).toBe(20220);
    expect(k.mensual.registros.filter((r) => r.grupo === "2026-04" && r.tipo === "Cobro")).toHaveLength(2);
  });

  it("top de productos financiados: la licuadora lidera con 3 unidades", () => {
    expect(k.top.ranking[0]).toMatchObject({ producto: "Licuadora 600W", unidades: 3, creditos: 2, monto: 4320 });
    expect(k.top.registros.filter((r) => r.grupo === "Licuadora 600W")).toHaveLength(2);
  });

  it("productos bajo mínimo incluye los importados con poco stock", () => {
    expect(k.stock.critico).toBe(0);
    expect(k.stock.enAviso).toBe(5);
    expect(k.stock.registros.map((r) => r.id)).toEqual(expect.arrayContaining(["PRD-004", "PRD-104", "PRD-103"]));
  });
});

describe("filtro de período (los resultados cambian con el filtro)", () => {
  const datos = datosConImportacion();

  it("de junio a septiembre quedan 2 créditos y solo los cobros de ese rango", () => {
    const k = calcularIndicadores(datos, { desde: new Date(2026, 5, 1), hasta: new Date(2026, 8, 30) }, AHORA);
    expect(k.aprobados.cantidad).toBe(2);
    expect(k.aprobados.monto).toBe(7536);
    expect(k.mensual.serie.filter((m) => m.cobrado > 0).map((m) => m.mes)).toEqual(["2026-06", "2026-07", "2026-08"]);
    expect(k.cartera.financiado).toBe(7536);
  });

  it("el corte de la cartera es el fin del período: los pagos posteriores no cuentan", () => {
    const k = calcularIndicadores(datos, { desde: null, hasta: new Date(2026, 3, 30) }, AHORA);
    expect(k.cartera.financiado).toBe(2880 + 9804);
    expect(k.cartera.cobrado).toBe(480 + 480 + 817);
  });

  it("nuevos registros por mes", () => {
    const k = calcularIndicadores(datos, { desde: new Date(2026, 1, 1), hasta: new Date(2026, 1, 28) }, AHORA);
    expect(k.nuevos.total).toBe(2);
    expect(k.nuevos.porMes).toEqual([{ mes: "2026-02", etiqueta: "feb 2026", cantidad: 2, monto: 0 }]);
    expect(k.nuevos.registros[0].rol).toBe("ADMINISTRADOR");
  });

  it("reclamos pendientes (Pendiente y En revisión) frente a resueltos", () => {
    const todo = calcularIndicadores(datos, SIN_PERIODO, AHORA).reclamos;
    expect([todo.pendientes, todo.resueltos]).toEqual([2, 1]);
    const octubre = calcularIndicadores(datos, { desde: new Date(2026, 9, 20), hasta: null }, AHORA).reclamos;
    expect([octubre.pendientes, octubre.resueltos]).toEqual([2, 0]);
  });
});

describe("indicadores de estado actual", () => {
  it("productos críticos cuando el stock llega al mínimo de cierre", () => {
    const r = productosBajoMinimo([{ id: "P1", nombre: "A", stock: 2, activo: false }, { id: "P2", nombre: "B", stock: 7, activo: true }, { id: "P3", stock: 30 }], { StockMinimoAviso: 8, StockMinimoCierre: 2 });
    expect([r.critico, r.enAviso, r.total]).toEqual([1, 1, 2]);
    expect(r.registros[0]).toMatchObject({ id: "P1", grupo: "Crítico", activo: "No" });
  });

  it("promociones: vigente, vencida, inactiva y programada", () => {
    const r = promocionesResumen(
      [
        { id: "1", estado: "ACTIVO", fechaInicio: "2026-10-01", fechaFin: "2026-12-31" },
        { id: "2", estado: "ACTIVO", fechaInicio: "2026-01-01", fechaFin: "2026-03-31" },
        { id: "3", estado: "INACTIVO", fechaInicio: "2026-10-01", fechaFin: "2026-12-31" },
        { id: "4", estado: "ACTIVO", fechaInicio: "2026-11-15", fechaFin: "2026-12-31" },
      ],
      AHORA,
    );
    expect([r.vigentes, r.vencidas, r.inactivas, r.programadas]).toEqual([1, 1, 1, 1]);
  });

  it("sin datos no falla: todo en cero", () => {
    const vacio = { creditos: [], cuotas: [], productos: [], reclamos: [], usuarios: [], promociones: [], config: {} };
    const k = calcularIndicadores(vacio, SIN_PERIODO, AHORA);
    expect([k.aprobados.cantidad, k.cartera.porcentaje, k.stock.total, k.reclamos.total, k.nuevos.total, k.promociones.total]).toEqual([0, 0, 0, 0, 0, 0]);
  });
});
