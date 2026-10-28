// Genera los Excel de demostración en docs/ejemplos-importacion/ a partir de src/helpers/ejemplosImportacion.js
import * as XLSX from "xlsx";
import { mkdirSync, writeFileSync } from "node:fs";
import { TABLAS } from "../src/helpers/importacionExcel.js";
import { EJEMPLOS, EJEMPLOS_CONFLICTOS } from "../src/helpers/ejemplosImportacion.js";

const destino = new URL("../docs/ejemplos-importacion/", import.meta.url);
mkdirSync(destino, { recursive: true });

const escribir = (nombreArchivo, tabla, filas) => {
  const cabeceras = TABLAS[tabla].columnas.map((c) => c.clave);
  const hoja = XLSX.utils.json_to_sheet(filas, { header: cabeceras, cellDates: true });
  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hoja, tabla);
  writeFileSync(new URL(nombreArchivo, destino), XLSX.write(libro, { type: "buffer", bookType: "xlsx", cellDates: true }));
  console.log(`docs/ejemplos-importacion/${nombreArchivo} (${filas.length} filas)`);
};

for (const [tabla, filas] of Object.entries(EJEMPLOS)) escribir(`${tabla}.xlsx`, tabla, filas);
for (const [tabla, filas] of Object.entries(EJEMPLOS_CONFLICTOS)) escribir(`${tabla}_conflictos.xlsx`, tabla, filas);
