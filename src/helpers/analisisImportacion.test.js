import { describe, it, expect } from "vitest";
import { PASOS_ANALISIS, evaluarPaso } from "./analisisImportacion";
import { verificarEncabezados, procesarFilas } from "./importacionExcel";
import { EJEMPLOS } from "./ejemplosImportacion";

const AHORA = new Date(2026, 9, 27, 15, 30);
const ctx = () => ({
  ahora: AHORA,
  importacionId: "SIM",
  stockMinimoCierre: 2,
  existentes: new Map([["PRD-001", { nombre: "Refrigeradora 12 pies", categoriaId: "CAT-001", precioContado: 8500, precioCredito: 9800, stock: 12, garantiaMeses: 12, activo: true, descripcion: "" }]]),
  categorias: new Map([["CAT-001", "Electrodomésticos"]]),
});

const fila = (extra) => ({ ...EJEMPLOS.productos[0], ...extra });
const simular = (filas) => {
  const r = procesarFilas("productos", filas, ctx());
  return { rechazadas: r.rechazadas, omitidas: r.omitidas, conflictos: r.conflictos };
};

describe("pasos del análisis", () => {
  it("hay un paso por tipo de error y cada uno tiene mensaje de carga", () => {
    expect(PASOS_ANALISIS.map((p) => p.id)).toEqual(["lectura", "columnas", "obligatorio", "formato", "regla", "referencia", "coherencia", "duplicado"]);
    PASOS_ANALISIS.forEach((p) => expect(p.cargando).toBeTruthy());
  });

  it("archivo sin problemas: todos los pasos en ok", () => {
    const resultado = simular([fila({ productoId: "PRD-700", nombre: "Tostadora" })]);
    const encabezados = verificarEncabezados("productos", [fila({})]);
    PASOS_ANALISIS.forEach((p) => {
      const r = evaluarPaso(p.id, { nombreArchivo: "a.xlsx", totalFilas: 1, encabezados, resultado });
      expect(r.estado, p.id).toBe("ok");
      expect(r.hallazgos).toEqual([]);
    });
  });

  it("reparte cada error en su paso con la fila de Excel, el ID y el campo", () => {
    const filas = [
      fila({ productoId: "PRD-800", nombre: "Ok 1" }), // fila 2
      fila({ productoId: "PRD-801", nombre: "", precioContado: "abc", categoriaId: "CAT-999" }), // fila 3
      fila({ productoId: "PRD-802", nombre: "Ok 2", precioContado: 100, precioCredito: 50 }), // fila 4
      fila({ productoId: "PRD-803", nombre: "Refrigeradora 12 PIES" }), // fila 5
    ];
    const resultado = simular(filas);
    const encabezados = verificarEncabezados("productos", [filas[0]]);
    const paso = (id) => evaluarPaso(id, { nombreArchivo: "a.xlsx", totalFilas: 4, encabezados, resultado });

    expect(paso("obligatorio").hallazgos).toEqual([{ fila: 3, id: "PRD-801", campo: "nombre", mensaje: "nombre es obligatorio", nivel: "error" }]);
    expect(paso("formato").hallazgos).toEqual([expect.objectContaining({ fila: 3, campo: "precioContado" })]);
    expect(paso("referencia").hallazgos).toEqual([expect.objectContaining({ fila: 3, campo: "categoriaId", mensaje: "la categoría CAT-999 no existe" })]);
    expect(paso("coherencia").hallazgos).toEqual([expect.objectContaining({ fila: 4, id: "PRD-802", campo: "precioCredito" })]);
    const dup = paso("duplicado");
    expect(dup.estado).toBe("error");
    expect(dup.hallazgos).toEqual([expect.objectContaining({ fila: 5, id: "PRD-803", campo: "nombre", nivel: "error" })]);
    expect(paso("obligatorio").mensaje).toBe("1 error en 1 fila");
  });

  it("omitidas y conflictos son avisos, no errores", () => {
    const resultado = simular([fila({ productoId: "PRD-001", nombre: "Refrigeradora 12 pies", precioContado: 8500, precioCredito: 9800, stock: 12, garantiaMeses: 12, descripcion: "" }), fila({ productoId: "PRD-001", nombre: "Refrigeradora 12 pies" })]);
    const r = evaluarPaso("duplicado", { nombreArchivo: "a.xlsx", totalFilas: 2, encabezados: verificarEncabezados("productos", [fila({})]), resultado });
    expect(r.estado).toBe("aviso");
    expect(r.hallazgos.every((h) => h.nivel === "aviso")).toBe(true);
  });

  it("columnas: las ajenas a la plantilla son un aviso en la fila 1 y no un error", () => {
    const encabezados = verificarEncabezados("productos", [{ ...fila({}), Notas: "x" }]);
    const r = evaluarPaso("columnas", { encabezados });
    expect(r.estado).toBe("aviso");
    expect(r.hallazgos).toEqual([expect.objectContaining({ fila: 1, campo: "Notas", nivel: "aviso" })]);
    expect(evaluarPaso("columnas", { encabezados: verificarEncabezados("productos", [fila({})]) }).estado).toBe("ok");
  });

  it("un precioContado de 0 aparece como aviso en el paso de reglas, no como error", () => {
    const filas = [fila({ productoId: "PRD-900", nombre: "Obsequio", precioContado: 0, precioCredito: 0 })];
    const r = procesarFilas("productos", filas, ctx());
    const resultado = { rechazadas: r.rechazadas, omitidas: r.omitidas, conflictos: r.conflictos, advertencias: r.advertencias };
    const paso = evaluarPaso("regla", { nombreArchivo: "a.xlsx", totalFilas: 1, encabezados: verificarEncabezados("productos", filas), resultado });
    expect(paso.estado).toBe("aviso");
    expect(paso.mensaje).toBe("1 advertencia");
    expect(paso.hallazgos).toEqual([expect.objectContaining({ fila: 2, id: "PRD-900", campo: "precioContado", nivel: "aviso" })]);
  });
});
