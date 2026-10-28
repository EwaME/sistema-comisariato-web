import { describe, it, expect } from "vitest";
import * as XLSX from "xlsx";
import { TABLAS, parsearFecha, parsearNumero, procesarFilas, resumenDeProceso, resumirImportaciones } from "./importacionExcel";
import { EJEMPLOS } from "./ejemplosImportacion";

const AHORA = new Date(2026, 9, 27, 15, 30);

const baseCtx = () => ({
  ahora: AHORA,
  importacionId: "IMP-1",
  stockMinimoCierre: 2,
  categorias: new Map([["CAT-001", "Electrodomésticos"], ["CAT-002", "Hogar"], ["CAT-003", "Tecnología"]]),
  productos: new Map([
    ["PRD-001", { nombre: "Refrigeradora 12 pies" }],
    ["PRD-002", { nombre: "Licuadora 600W" }],
    ["PRD-003", { nombre: "Colchón" }],
    ["PRD-004", { nombre: "Smart TV 50 pulgadas" }],
  ]),
  empleados: new Map(
    ["todologo", "admin", "acreditador", "analista", "inventario", "moderador", "proveedor", "supervisor", "gerente"].map(
      (u, i) => [`EMP-00${i + 1}`, { correo: `${u}@crediflow.test` }],
    ),
  ),
  usuarios: new Map([["admin@crediflow.test", { usuario: "admin" }]]),
});

// Simula la base de datos para encadenar importaciones y repetirlas
function nuevaBase() {
  return {
    productos: new Set(["PRD-001", "PRD-002", "PRD-003", "PRD-004"]),
    creditos: new Map([["CRD-001", { estado: "Pendiente", plazoMeses: 6, fechaRegistro: new Date(2026, 9, 1) }]]),
    cuotas: new Set(),
  };
}

function importar(tabla, filas, base) {
  const ctx = baseCtx();
  if (tabla === "productos") ctx.existentes = new Set(base.productos);
  if (tabla === "creditos") ctx.existentes = new Set(base.creditos.keys());
  if (tabla === "cuotas") {
    ctx.existentes = new Set(base.cuotas);
    ctx.creditos = base.creditos;
  }
  const r = procesarFilas(tabla, filas, ctx);
  r.insertar.forEach(({ id, data }) => {
    if (tabla === "productos") base.productos.add(id);
    if (tabla === "creditos")
      base.creditos.set(id, { estado: data.estado, plazoMeses: data.plazoMeses, fechaRegistro: data.fechaRegistro });
    if (tabla === "cuotas") base.cuotas.add(id);
  });
  return r;
}

describe("parsearFecha", () => {
  it("convierte número de serie de Excel (45658 = 01/01/2025)", () => {
    const f = parsearFecha(45658);
    expect([f.getFullYear(), f.getMonth() + 1, f.getDate()]).toEqual([2025, 1, 1]);
  });
  it("acepta aaaa-mm-dd, dd/mm/aaaa y objetos Date", () => {
    expect(parsearFecha("2026-03-15").getDate()).toBe(15);
    expect(parsearFecha("15/03/2026").getMonth()).toBe(2);
    expect(parsearFecha(new Date(2026, 2, 15, 0, 0, 1)).getDate()).toBe(15);
  });
  it("rechaza fechas imposibles o ilegibles", () => {
    expect(parsearFecha("31/02/2026")).toBeNull();
    expect(parsearFecha("ayer")).toBeNull();
    expect(parsearFecha(5)).toBeNull();
    expect(parsearFecha("")).toBeNull();
  });
});

describe("parsearNumero", () => {
  it("entiende números, comas decimales y símbolos de moneda", () => {
    expect(parsearNumero(12.5)).toBe(12.5);
    expect(parsearNumero("L. 1,250.75")).toBe(1250.75);
    expect(parsearNumero("12,5")).toBe(12.5);
    expect(parsearNumero("abc")).toBeNull();
  });
});

describe("importación de ejemplo (cantidades coinciden con el procesamiento)", () => {
  it("productos: 7 insertadas, 2 rechazadas, 1 omitida", () => {
    const r = importar("productos", EJEMPLOS.productos, nuevaBase());
    expect(resumenDeProceso(r)).toEqual({ totalFilas: 10, insertadas: 7, conflictos: 0, rechazadas: 2, omitidas: 1 });
    expect(r.rechazadas.map((x) => x.id)).toEqual(["PRD-108", "PRD-109"]);
    expect(r.omitidas[0].id).toBe("PRD-001");
  });

  it("créditos: 5 insertadas, 2 rechazadas, 1 omitida", () => {
    const r = importar("creditos", EJEMPLOS.creditos, nuevaBase());
    expect(resumenDeProceso(r)).toEqual({ totalFilas: 8, insertadas: 5, conflictos: 0, rechazadas: 2, omitidas: 1 });
    expect(r.rechazadas.map((x) => x.id)).toEqual(["CRD-H06", "CRD-H07"]);
  });

  it("cuotas: 10 insertadas, 2 rechazadas, 1 omitida", () => {
    const base = nuevaBase();
    importar("creditos", EJEMPLOS.creditos, base);
    const r = importar("cuotas", EJEMPLOS.cuotas, base);
    expect(resumenDeProceso(r)).toEqual({ totalFilas: 13, insertadas: 10, conflictos: 0, rechazadas: 2, omitidas: 1 });
    expect(r.rechazadas.map((x) => x.motivo)).toEqual([
      expect.stringContaining("solo Aprobado o Liquidado"),
      expect.stringContaining("fuera de rango"),
    ]);
    expect(r.omitidas[0].motivo).toMatch(/Repetida dentro del archivo/);
  });

  it("siempre se cumple total = insertadas + rechazadas + omitidas", () => {
    const base = nuevaBase();
    for (const tabla of ["productos", "creditos", "cuotas"]) {
      const r = resumenDeProceso(importar(tabla, EJEMPLOS[tabla], base));
      expect(r.insertadas + r.conflictos + r.rechazadas + r.omitidas).toBe(r.totalFilas);
    }
  });
});

describe("repetir una importación no duplica", () => {
  it("la segunda corrida no inserta nada: lo ya insertado pasa a omitido", () => {
    const base = nuevaBase();
    for (const tabla of ["productos", "creditos", "cuotas"]) {
      const primera = resumenDeProceso(importar(tabla, EJEMPLOS[tabla], base));
      const segunda = resumenDeProceso(importar(tabla, EJEMPLOS[tabla], base));
      expect(segunda.insertadas).toBe(0);
      expect(segunda.omitidas).toBe(primera.insertadas + primera.omitidas);
      expect(segunda.rechazadas).toBe(primera.rechazadas);
    }
  });
});

describe("fecha de negocio", () => {
  it("los créditos históricos usan la fecha del Excel, no la fecha de carga", () => {
    const r = importar("creditos", EJEMPLOS.creditos, nuevaBase());
    const h01 = r.insertar.find((x) => x.id === "CRD-H01").data;
    expect([h01.fechaRegistro.getMonth() + 1, h01.fechaRegistro.getDate()]).toEqual([3, 10]);
    expect(h01.fechaImportacion).toEqual(AHORA);
    expect(h01.fechaRegistro.getTime()).not.toBe(AHORA.getTime());
  });

  it("los pagos usan la fecha de pago como fechaRegistro", () => {
    const base = nuevaBase();
    importar("creditos", EJEMPLOS.creditos, base);
    const r = importar("cuotas", EJEMPLOS.cuotas, base);
    const pago = r.insertar.find((x) => x.id === "CRD-H03-C01").data;
    expect([pago.fechaRegistro.getMonth() + 1, pago.fechaRegistro.getDate()]).toEqual([7, 18]);
    expect(pago.origen).toBe("IMPORTACION_EXCEL");
    expect(pago.importacionId).toBe("IMP-1");
  });

  it("rechaza fechas futuras y pagos anteriores a la solicitud del crédito", () => {
    const base = nuevaBase();
    importar("creditos", EJEMPLOS.creditos, base);
    const futura = { ...EJEMPLOS.creditos[4], creditoId: "CRD-X1", fechaSolicitud: "01/12/2026" };
    expect(importar("creditos", [futura], base).rechazadas[0].motivo).toMatch(/futura/);
    const anterior = { creditoId: "CRD-H05", numeroCuota: 2, monto: 240, fechaPago: "2026-01-01" };
    expect(importar("cuotas", [anterior], base).rechazadas[0].motivo).toMatch(/anterior a la solicitud/);
  });
});

describe("reglas de validación", () => {
  it("producto activo con stock en el mínimo de cierre se rechaza", () => {
    const fila = { ...EJEMPLOS.productos[0], productoId: "PRD-X", stock: 2 };
    expect(importar("productos", [fila], nuevaBase()).rechazadas[0].motivo).toMatch(/mínimo de cierre/);
  });

  it("créditos: Liquidado exige todas las cuotas pagadas y Pendiente no admite pagos", () => {
    const liquidado = { ...EJEMPLOS.creditos[1], creditoId: "CRD-X2", estado: "Liquidado", cuotasPagadas: 3 };
    const pendiente = { ...EJEMPLOS.creditos[0], creditoId: "CRD-X3", estado: "Pendiente" };
    const r = importar("creditos", [liquidado, pendiente], nuevaBase());
    expect(r.rechazadas).toHaveLength(2);
  });

  it("reconoce encabezados con otra capitalización, acentos o espacios", () => {
    const fila = { "Producto Id": "PRD-300", Nombre: "Radio", "categoria_id": "CAT-001", PrecioContado: 500, precioCredito: 575, STOCK: 9 };
    expect(importar("productos", [fila], nuevaBase()).insertar).toHaveLength(1);
  });

  it("ignora filas completamente vacías", () => {
    const r = importar("productos", [{ productoId: null, nombre: "" }, { productoId: "  " }], nuevaBase());
    expect(r.total).toBe(0);
  });

  it("el crédito importado copia usuarioId y nombre de producto de las colecciones existentes", () => {
    const r = importar("creditos", [EJEMPLOS.creditos[0]], nuevaBase());
    expect(r.insertar[0].data).toMatchObject({
      usuarioId: "admin@crediflow.test",
      usuario: "admin",
      nombreProducto: "Refrigeradora 12 pies",
    });
  });
});

describe("archivo Excel real (viaje de ida y vuelta)", () => {
  it("las fechas escritas como celdas de fecha se leen como números de serie y se importan bien", () => {
    const cabeceras = TABLAS.creditos.columnas.map((c) => c.clave);
    const hoja = XLSX.utils.json_to_sheet(EJEMPLOS.creditos, { header: cabeceras, cellDates: true });
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "creditos");
    const buffer = XLSX.write(libro, { type: "buffer", bookType: "xlsx", cellDates: true });

    const leido = XLSX.read(buffer, { type: "buffer" });
    const filas = XLSX.utils.sheet_to_json(leido.Sheets.creditos, { defval: null, raw: true });
    expect(typeof filas[0].fechaSolicitud).toBe("number");

    const r = importar("creditos", filas, nuevaBase());
    expect(resumenDeProceso(r)).toEqual({ totalFilas: 8, insertadas: 5, conflictos: 0, rechazadas: 2, omitidas: 1 });
    const h01 = r.insertar.find((x) => x.id === "CRD-H01").data;
    expect([h01.fechaRegistro.getMonth() + 1, h01.fechaRegistro.getDate()]).toEqual([3, 10]);
  });
});

describe("resumirImportaciones (indicador del dashboard técnico)", () => {
  const lista = [
    { tabla: "productos", insertadas: 7, rechazadas: 2, omitidas: 1 },
    { tabla: "creditos", insertadas: 5, rechazadas: 2, omitidas: 1 },
    { tabla: "productos", insertadas: 0, rechazadas: 2, omitidas: 8 },
  ];
  it("suma todas las importaciones o filtra por tabla", () => {
    expect(resumirImportaciones(lista, "todas")).toEqual({ importaciones: 3, insertadas: 12, actualizadas: 0, rechazadas: 6, omitidas: 10 });
    expect(resumirImportaciones(lista, "productos")).toEqual({ importaciones: 2, insertadas: 7, actualizadas: 0, rechazadas: 4, omitidas: 9 });
  });
});
