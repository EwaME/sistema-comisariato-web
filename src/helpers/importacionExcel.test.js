import { describe, it, expect } from "vitest";
import * as XLSX from "xlsx";
import { TABLAS, parsearFecha, parsearNumero, procesarFilas, resumenDeProceso, resumirImportaciones, verificarEncabezados } from "./importacionExcel";
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

describe("todos los errores de la fila", () => {
  it("un producto con varios problemas los reporta juntos, no solo el primero", () => {
    const mala = { productoId: "PRD-900", nombre: "", categoriaId: "CAT-999", precioContado: -5, precioCredito: "abc", stock: -1, garantiaMeses: "x", activo: "SI", descripcion: "", fechaAlta: "31/02/2026" };
    const r = importar("productos", [mala], nuevaBase());
    expect(r.rechazadas).toHaveLength(1);
    expect(r.rechazadas[0].motivos).toEqual([
      "nombre es obligatorio",
      "la categoría CAT-999 no existe",
      "precioContado debe ser mayor o igual a 0",
      "precioCredito debe ser un número (valor recibido: “abc”)",
      "stock debe ser mayor o igual a 0",
      "garantiaMeses debe ser un número entero (valor recibido: “x”)",
      expect.stringContaining("fechaAlta inválida"),
    ]);
    expect(r.rechazadas[0].motivo).toContain("; ");
    // cada error indica a qué paso del análisis pertenece y qué campo lo causó
    expect(r.rechazadas[0].errores.map((e) => `${e.paso}:${e.campo}`)).toEqual([
      "obligatorio:nombre", "referencia:categoriaId", "regla:precioContado", "formato:precioCredito",
      "regla:stock", "formato:garantiaMeses", "formato:fechaAlta",
    ]);
  });

  it("un crédito con varios problemas los reporta juntos", () => {
    const mala = { creditoId: "CRD-X1", empleadoId: "EMP-099", productoId: "PRD-777", cantidad: 0, plazoMeses: 12, cuotaMensual: 100, totalCredito: 5000, cuotasPagadas: 20, estado: "Inventado", fechaSolicitud: "", fechaResolucion: "" };
    const r = importar("creditos", [mala], nuevaBase());
    const motivos = r.rechazadas[0].motivos;
    expect(motivos.length).toBe(7);
    expect(motivos.join("|")).toMatch(/empleado EMP-099 no existe/);
    expect(motivos.join("|")).toMatch(/producto PRD-777 no existe/);
    expect(motivos.join("|")).toMatch(/cantidad debe ser mayor o igual a 1/);
    expect(motivos.join("|")).toMatch(/no coincide con cuotaMensual × plazoMeses/);
    expect(motivos.join("|")).toMatch(/supera el plazo/);
    expect(motivos.join("|")).toMatch(/estado inválido/);
    expect(motivos.join("|")).toMatch(/fechaSolicitud es obligatorio/);
  });

  it("no inventa errores derivados de un campo que ya falló", () => {
    const fila = { ...EJEMPLOS.creditos[0], creditoId: "CRD-X2", plazoMeses: "doce", estado: "Liquidado" };
    const r = importar("creditos", [fila], nuevaBase());
    expect(r.rechazadas[0].motivos).toEqual(["plazoMeses debe ser un número entero (valor recibido: “doce”)"]);
  });
});

describe("producto con el mismo nombre", () => {
  const existentes = () => new Map([["PRD-001", { nombre: "Refrigeradora 12 pies", nombreNormalizado: "refrigeradora 12 pies" }]]);
  const fila = (id, nombre) => ({ ...EJEMPLOS.productos[0], productoId: id, nombre });
  const correr = (filas) => procesarFilas("productos", filas, { ...baseCtx(), existentes: existentes() });

  it("rechaza otro ID con el nombre de uno existente, ignorando tildes, mayúsculas y espacios", () => {
    const r = correr([fila("PRD-500", "  REFRIGERADORA   12 pies ")]);
    expect(r.rechazadas[0].motivos).toEqual(["ya existe un producto con el mismo nombre en el sistema (PRD-001)"]);
  });

  it("el mismo ID con el mismo nombre no es duplicado", () => {
    const r = correr([fila("PRD-001", "Refrigeradora 12 pies")]);
    expect(r.rechazadas).toHaveLength(0);
  });

  it("rechaza el segundo producto del archivo con un nombre ya usado por otro ID del archivo", () => {
    const r = correr([fila("PRD-501", "Sofá cama"), fila("PRD-502", "sofa cama")]);
    expect(r.insertar.map((x) => x.id)).toEqual(["PRD-501"]);
    expect(r.rechazadas[0].motivos).toEqual(["el nombre ya lo usa otro producto de este archivo (PRD-501)"]);
  });

  it("si la primera fila falló por otra causa, no bloquea el nombre", () => {
    const r = correr([{ ...fila("PRD-503", "Plancha"), stock: -1 }, fila("PRD-504", "Plancha")]);
    expect(r.insertar.map((x) => x.id)).toEqual(["PRD-504"]);
  });
});

describe("coherencia del crédito", () => {
  const credito = (extra) => ({ ...EJEMPLOS.creditos[0], creditoId: "CRD-C1", ...extra });
  it("acepta total = cuota × plazo y tolera el redondeo a centavos", () => {
    expect(importar("creditos", [credito({ cuotaMensual: 817.33, totalCredito: 9807.96 })], nuevaBase()).rechazadas).toHaveLength(0);
    expect(importar("creditos", [credito({ cuotaMensual: 817.33, totalCredito: 9808 })], nuevaBase()).rechazadas).toHaveLength(0);
  });
  it("rechaza si el total no corresponde a cuota × plazo", () => {
    const r = importar("creditos", [credito({ totalCredito: 9000 })], nuevaBase());
    expect(r.rechazadas[0].motivos[0]).toMatch(/9000.*no coincide.*9804/);
  });
});

describe("compatibilidad del archivo", () => {
  const completa = EJEMPLOS.productos[0];
  const sin = (fila, ...claves) => Object.fromEntries(Object.entries(fila).filter(([k]) => !claves.includes(k)));

  it("es compatible con las columnas de la plantilla, sin importar mayúsculas, tildes ni separadores", () => {
    const fila = { ...sin(completa, "precioContado"), "Precio Contado": 1 };
    expect(verificarEncabezados("productos", [fila]).compatible).toBe(true);
  });

  it("no es compatible si falta una columna obligatoria", () => {
    const r = verificarEncabezados("productos", [sin(completa, "stock")]);
    expect(r.compatible).toBe(false);
    expect(r.faltantes).toEqual(["stock"]);
  });

  it("no es compatible si una columna viene repetida", () => {
    const r = verificarEncabezados("productos", [{ ...completa, "Precio Contado": 1 }]);
    expect(r.compatible).toBe(false);
    expect(r.repetidas).toEqual(["precioContado"]);
  });

  it("las columnas opcionales pueden faltar y las ajenas solo se reportan como extras", () => {
    const base = sin(completa, "descripcion", "fechaAlta", "garantiaMeses", "activo");
    const r = verificarEncabezados("productos", [{ ...base, Notas: "x" }]);
    expect(r.compatible).toBe(true);
    expect(r.extras).toEqual(["Notas"]);
  });

  it("un encabezado distinto como 'Precio Contado (L)' hace incompatible el archivo", () => {
    expect(verificarEncabezados("productos", [{ ...sin(completa, "precioContado"), "Precio Contado (L)": 5 }]).compatible).toBe(false);
  });
});

describe("advertencias", () => {
  const fila = (extra) => ({ ...EJEMPLOS.productos[0], productoId: "PRD-ADV", nombre: "Producto de regalo", ...extra });

  it("un precioContado de 0 se importa con una advertencia, sin rechazar la fila", () => {
    const r = importar("productos", [fila({ precioContado: 0, precioCredito: 0 })], nuevaBase());
    expect(r.rechazadas).toHaveLength(0);
    expect(r.insertar).toHaveLength(1);
    expect(r.advertencias).toEqual([expect.objectContaining({ fila: 2, id: "PRD-ADV", campo: "precioContado", paso: "regla" })]);
  });

  it("un precioContado negativo sigue siendo un error", () => {
    const r = importar("productos", [fila({ precioContado: -1 })], nuevaBase());
    expect(r.rechazadas).toHaveLength(1);
    expect(r.advertencias).toHaveLength(0);
  });

  it("precioCredito sigue sin poder ser menor que precioContado", () => {
    expect(importar("productos", [fila({ precioContado: 100, precioCredito: 50 })], nuevaBase()).rechazadas).toHaveLength(1);
  });
});
