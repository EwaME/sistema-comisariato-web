import { describe, it, expect } from "vitest";
import { procesarFilas, resumenDeProceso, resumirImportaciones } from "./importacionExcel";
import { EJEMPLOS, EJEMPLOS_CONFLICTOS } from "./ejemplosImportacion";

const AHORA = new Date(2026, 9, 27, 15, 30);
const dia = (y, m, d) => new Date(y, m - 1, d, 12);

const ctxBase = () => ({
  ahora: AHORA,
  importacionId: "IMP-1",
  stockMinimoCierre: 2,
  categorias: new Map([["CAT-001", "Electrodomésticos"], ["CAT-002", "Hogar"], ["CAT-003", "Tecnología"]]),
  productos: new Map([["PRD-001", { nombre: "Refrigeradora 12 pies" }], ["PRD-002", { nombre: "Licuadora 600W" }], ["PRD-003", { nombre: "Colchón" }], ["PRD-004", { nombre: "Smart TV 50 pulgadas" }]]),
  empleados: new Map(["todologo", "admin", "acreditador", "analista", "inventario", "moderador", "proveedor", "supervisor", "gerente"].map((u, i) => [`EMP-00${i + 1}`, { correo: `${u}@crediflow.test` }])),
  usuarios: new Map([["admin@crediflow.test", { usuario: "admin" }]]),
});

// Base de datos en memoria con los DATOS ACTUALES de cada documento, como los lee el servicio desde Firestore
function baseConDatos() {
  const producto = (id, nombre, cat, contado, credito, stock, garantia, extra = {}) => [id, { productoId: id, nombre, categoriaId: cat, precioContado: contado, precioCredito: credito, stock, garantiaMeses: garantia, activo: true, fechaRegistro: dia(2026, 10, 27), ...extra }];
  return {
    productos: new Map([
      producto("PRD-001", "Refrigeradora 12 pies", "CAT-001", 8500, 9800, 12, 12, { descripcion: "Refrigeradora 12 pies — producto de prueba" }),
      producto("PRD-002", "Licuadora 600W", "CAT-001", 1200, 1400, 25, 6),
      producto("PRD-003", "Colchón", "CAT-002", 5200, 6100, 8, 24),
      producto("PRD-004", "Smart TV 50 pulgadas", "CAT-003", 9800, 11500, 3, 12),
    ]),
    creditos: new Map([
      ["CRD-001", { empleadoId: "EMP-002", productoId: "PRD-002", cantidad: 2, plazoMeses: 6, cuotaMensual: 480, totalCredito: 2880, cuotasPagadas: 0, estado: "Pendiente", fechaRegistro: { toDate: () => dia(2026, 10, 1) } }],
    ]),
    cuotas: new Map(),
  };
}

function importar(tabla, filas, base) {
  const ctx = { ...ctxBase(), existentes: base[tabla] };
  if (tabla === "cuotas")
    ctx.creditos = new Map([...base.creditos].map(([id, c]) => [id, { estado: c.estado, plazoMeses: c.plazoMeses, fechaRegistro: c.fechaRegistro?.toDate ? c.fechaRegistro.toDate() : c.fechaRegistro }]));
  const r = procesarFilas(tabla, filas, ctx);
  r.insertar.forEach(({ id, data }) => base[tabla].set(id, data));
  return r;
}

function conBaseImportada() {
  const base = baseConDatos();
  for (const t of ["productos", "creditos", "cuotas"]) importar(t, EJEMPLOS[t], base);
  return base;
}

describe("conflictos al importar sobre datos que ya existen", () => {
  it("los archivos originales siguen dando 7/2/1, 5/2/1 y 10/2/1 con la base real (PRD-001 y CRD-001 son idénticos)", () => {
    const base = baseConDatos();
    expect(resumenDeProceso(importar("productos", EJEMPLOS.productos, base))).toEqual({ totalFilas: 10, insertadas: 7, conflictos: 0, rechazadas: 2, omitidas: 1 });
    expect(resumenDeProceso(importar("creditos", EJEMPLOS.creditos, base))).toEqual({ totalFilas: 8, insertadas: 5, conflictos: 0, rechazadas: 2, omitidas: 1 });
    expect(resumenDeProceso(importar("cuotas", EJEMPLOS.cuotas, base))).toEqual({ totalFilas: 13, insertadas: 10, conflictos: 0, rechazadas: 2, omitidas: 1 });
  });

  it("repetir los archivos originales no inserta ni genera conflictos", () => {
    const base = conBaseImportada();
    for (const t of ["productos", "creditos", "cuotas"]) {
      const r = resumenDeProceso(importar(t, EJEMPLOS[t], base));
      expect([r.insertadas, r.conflictos]).toEqual([0, 0]);
    }
  });

  it("productos: 1 insertada, 3 conflictos, 1 rechazada y 1 omitida idéntica", () => {
    const r = importar("productos", EJEMPLOS_CONFLICTOS.productos, conBaseImportada());
    expect(resumenDeProceso(r)).toEqual({ totalFilas: 6, insertadas: 1, conflictos: 3, rechazadas: 1, omitidas: 1 });
    expect(r.omitidas[0]).toMatchObject({ id: "PRD-102", motivo: "Ya existe y es idéntico" });
    const c101 = r.conflictos.find((c) => c.id === "PRD-101");
    expect(c101.campos).toEqual([
      { campo: "precioContado", actual: "7200", nuevo: "7500" },
      { campo: "precioCredito", actual: "8280", nuevo: "8625" },
      { campo: "stock", actual: "10", nuevo: "8" },
    ]);
    expect(c101.cambios).toMatchObject({ precioContado: 7500, precioCredito: 8625, stock: 8 });
    expect(r.conflictos.find((c) => c.id === "PRD-103").cambios).toMatchObject({ nombre: "Sofá 3 plazas reclinable", nombreNormalizado: "sofa 3 plazas reclinable", stock: 5 });
  });

  it("una celda vacía significa 'no cambiar': PRD-001 solo difiere en lo que trae el Excel", () => {
    const r = importar("productos", EJEMPLOS_CONFLICTOS.productos, conBaseImportada());
    const c001 = r.conflictos.find((c) => c.id === "PRD-001");
    expect(c001.campos.map((x) => x.campo)).toEqual(["precioCredito", "stock"]);
    expect(Object.keys(c001.cambios)).toEqual(["precioCredito", "stock"]);
  });

  it("créditos: 1 insertada, 3 conflictos, 1 rechazada y 1 omitida; pasar a Aprobado advierte del descuento de stock", () => {
    const r = importar("creditos", EJEMPLOS_CONFLICTOS.creditos, conBaseImportada());
    expect(resumenDeProceso(r)).toEqual({ totalFilas: 6, insertadas: 1, conflictos: 3, rechazadas: 1, omitidas: 1 });
    const aprobacion = r.conflictos.find((c) => c.id === "CRD-001");
    expect(aprobacion.campos).toEqual([
      { campo: "estado", actual: "Pendiente", nuevo: "Aprobado" },
      { campo: "fechaResolucion", actual: "—", nuevo: "03/10/2026" },
    ]);
    expect(aprobacion.advertencias[0]).toMatch(/descontará del inventario/);
    expect(r.conflictos.find((c) => c.id === "CRD-H03").advertencias).toEqual([]);
    expect(r.conflictos.find((c) => c.id === "CRD-H01").campos.map((x) => x.campo)).toEqual(["cuotaMensual", "totalCredito"]);
  });

  it("cuotas: 2 insertadas, 2 conflictos (monto y fecha), 1 rechazada y 1 omitida", () => {
    const r = importar("cuotas", EJEMPLOS_CONFLICTOS.cuotas, conBaseImportada());
    expect(resumenDeProceso(r)).toEqual({ totalFilas: 6, insertadas: 2, conflictos: 2, rechazadas: 1, omitidas: 1 });
    expect(r.conflictos.find((c) => c.id === "CRD-H01-C01").campos).toEqual([{ campo: "monto", actual: "817", nuevo: "850" }]);
    expect(r.conflictos.find((c) => c.id === "CRD-H01-C03").campos).toEqual([{ campo: "fechaPago", actual: "10/06/2026", nuevo: "12/06/2026" }]);
  });

  it("siempre total = insertadas + conflictos + rechazadas + omitidas", () => {
    const base = conBaseImportada();
    for (const t of ["productos", "creditos", "cuotas"]) {
      const r = resumenDeProceso(importar(t, EJEMPLOS_CONFLICTOS[t], base));
      expect(r.insertadas + r.conflictos + r.rechazadas + r.omitidas).toBe(r.totalFilas);
    }
  });

  it("una fila repetida dentro del archivo sobre un ID existente cuenta una sola vez como conflicto", () => {
    const fila = EJEMPLOS_CONFLICTOS.productos[0];
    const r = importar("productos", [fila, fila], conBaseImportada());
    expect([r.conflictos.length, r.omitidas.length]).toEqual([1, 1]);
    expect(r.omitidas[0].motivo).toMatch(/Repetida dentro del archivo/);
  });

  it("si el ID existe pero la fila es inválida se rechaza en lugar de compararla", () => {
    const r = importar("productos", [{ ...EJEMPLOS_CONFLICTOS.productos[0], stock: -1 }], conBaseImportada());
    expect([r.conflictos.length, r.rechazadas.length]).toEqual([0, 1]);
  });
});

describe("resumirImportaciones con actualizadas", () => {
  it("suma las filas actualizadas y trata como 0 las importaciones antiguas sin ese campo", () => {
    const lista = [
      { tabla: "productos", insertadas: 1, actualizadas: 2, rechazadas: 0, omitidas: 0 },
      { tabla: "productos", insertadas: 3, rechazadas: 0, omitidas: 0 },
    ];
    expect(resumirImportaciones(lista, "todas")).toEqual({ importaciones: 2, insertadas: 4, actualizadas: 2, rechazadas: 0, omitidas: 0 });
  });
});
