# Importación desde Excel

Pantalla: **Gestión de Sistema → Importar Excel** (`/importaciones`, solo `ADMINISTRADOR`).
Código: `src/helpers/importacionExcel.js` (reglas, sin Firebase), `src/services/importacionesService.js` (Firestore), `src/pages/Manage/GestionSistema/ImportarExcel.jsx` (pantalla).

## Flujo

1. Elegir la tabla: **Productos**, **Créditos** o **Cuotas (pagos)**. Se puede descargar una plantilla con las columnas.
2. Subir el `.xlsx`. La app lo lee y **simula** la importación (vista previa): no escribe nada.
3. La vista previa muestra filas leídas, insertadas, rechazadas (con fila y motivo) y omitidas.
4. Al confirmar se escribe en lotes de 400 y se guarda un registro en `importaciones` más una entrada en `actividad_logs`.

Orden recomendado: productos → créditos → cuotas (los créditos exigen que el producto y el empleado existan; los pagos exigen un crédito aprobado).

## Si el dato ya existe: conflictos

La fila se compara, campo por campo, con el documento que ya está en Firestore:

| Situación | Qué pasa |
|---|---|
| ID nuevo | Se inserta. |
| ID existente y **todos los campos iguales** | Se omite ("Ya existe y es idéntico"). Repetir un archivo no cambia nada. |
| ID existente y **algún campo distinto** | Es un **conflicto**: no se escribe nada hasta que el usuario decida. |
| Celda vacía en el Excel | Significa "no cambiar": no se compara ni se toca ese campo. |

En la vista previa aparece la tarjeta **Conflictos** y el botón **Revisar conflictos**, que abre un modal con dos columnas por registro: **dato actual** y **dato nuevo (Excel)**, solo con los campos que difieren. Cada registro tiene una casilla "Actualizar este registro"; también hay "Actualizar todos" y "Conservar todos". Por defecto todo se **conserva**.

Al confirmar solo se escriben los campos que cambian en los registros marcados, más `ultimaImportacionId` y `fechaModificacion`. Los no marcados cuentan como omitidos. El documento de `importaciones` guarda `conflictosDetectados`, `actualizadas` y `detalleConflictos` (por cada conflicto: campos, dato actual, dato nuevo y la decisión), de modo que queda rastro de qué se cambió. La suma sigue cuadrando: `total = insertadas + actualizadas + rechazadas + omitidas`.

Precauciones:

- Un crédito que pasa a **Aprobado** por actualización dispara la Cloud Function que descuenta inventario; el modal lo advierte con un aviso ámbar.
- Los campos derivados se recalculan solos (p. ej. `nombreProducto` si cambia `productoId`, `nombreNormalizado` si cambia `nombre`).
- Si el ID existe pero la fila es inválida, se rechaza en lugar de compararla.
- Los datos existentes se leen **siempre del servidor**: sin conexión la importación falla (`unavailable`) y no escribe nada.

## Cómo se cumple cada requisito de la Parte 2

| Requisito | Cómo se resuelve |
|---|---|
| Aparece en el dashboard técnico | Cada corrida crea un documento en `importaciones`; el indicador "Resultados de importaciones Excel" lo suma, con filtro por tabla. |
| Las cantidades coinciden | `totalFilas = insertadas + rechazadas + omitidas` (una prueba lo verifica). Si falla un lote queda `estado: ERROR` y `noProcesadas`, de modo que la suma sigue cuadrando. |
| Alimenta los indicadores gerenciales | Los documentos importados usan los mismos campos que los reales (`creditos.totalCredito/estado/fechaRegistro`, `cuotas.monto/fechaRegistro`, `productos.stock`). Qué usa cada KPI: ver tabla siguiente. |
| Fecha de negocio, no de carga | `fechaRegistro` = fecha del Excel (`fechaSolicitud`, `fechaPago`, `fechaAlta`). La fecha de carga va aparte en `fechaImportacion`; además `origen: IMPORTACION_EXCEL` e `importacionId`. |
| Repetir no duplica | El ID del documento es determinista: `productoId`, `creditoId`, `creditoId-Cnn`. Si ya existe y es idéntico se omite; si es distinto se trata como conflicto (sección anterior). También se omiten las repetidas dentro del mismo archivo. |

| KPI gerencial | Tablas que usa |
|---|---|
| Créditos aprobados (cantidad y monto) | `creditos` |
| Saldo por cobrar y % cobrado | `creditos` (`totalCredito`) y `cuotas` (`monto`) |
| Monto cobrado / desembolsado por mes | `cuotas` y `creditos`, agrupando por `fechaRegistro` |
| Top productos financiados | `creditos` y `productos` |
| Productos bajo stock mínimo | `productos` |

## Columnas (* obligatoria)

- **productos**: `productoId*`, `nombre*`, `categoriaId*` (debe existir), `precioContado*`, `precioCredito*` (no menor que el contado), `stock*`, `garantiaMeses`, `activo` (SI/NO), `descripcion`, `fechaAlta`.
- **creditos**: `creditoId*`, `empleadoId*` (debe existir y tener correo), `productoId*` (debe existir), `cantidad*`, `plazoMeses*`, `cuotaMensual*`, `totalCredito*`, `cuotasPagadas` (0 a plazo), `estado*` (Pendiente, En revisión, Aprobado, Rechazado, Liquidado), `fechaSolicitud*`, `fechaResolucion`.
- **cuotas**: `creditoId*` (debe existir y estar Aprobado o Liquidado), `numeroCuota*` (1 a plazo del crédito), `monto*`, `fechaPago*` (no anterior a la solicitud del crédito).

Fechas: `dd/mm/aaaa`, `aaaa-mm-dd` o celda de fecha de Excel; no se aceptan fechas futuras. Los encabezados no distinguen mayúsculas, acentos ni espacios.

## Reglas importantes

- Un crédito **Liquidado** debe tener todas las cuotas pagadas; uno Pendiente, En revisión o Rechazado no puede tener cuotas pagadas.
- Un producto activo no puede tener stock menor o igual al mínimo de cierre (misma regla que el formulario de productos).
- Importar créditos no descuenta stock: la Cloud Function `descontarStockAlAprobar` solo se dispara al **actualizar** un crédito, y aquí se crean ya con su estado histórico.
- Limitación: las cuotas creadas desde la app móvil tienen ID automático, así que un pago idéntico registrado allí no se detecta como duplicado de uno importado (solo se detectan duplicados entre importaciones).

## Archivos de demostración

`docs/ejemplos-importacion/` (se regeneran con `npm run ejemplos:excel`). Pensados para el entorno de desarrollo sembrado por `docker/seed.mjs`.

| Archivo | Filas | Insertadas | Rechazadas | Omitidas |
|---|---|---|---|---|
| `productos.xlsx` | 10 | 7 | 2 (precio negativo, categoría inexistente) | 1 (`PRD-001` ya existe) |
| `creditos.xlsx` | 8 | 5 | 2 (producto inexistente, cuotas pagadas > plazo) | 1 (`CRD-001` ya existe) |
| `cuotas.xlsx` | 13 | 10 | 2 (crédito rechazado, cuota 13 de 12) | 1 (cuota repetida en el archivo) |

Archivos para probar **conflictos** (importarlos *después* de los tres anteriores; columnas: filas / insertadas / **conflictos** / rechazadas / omitidas):

| Archivo | Filas | Insertadas | Conflictos | Rechazadas | Omitidas |
|---|---|---|---|---|---|
| `productos_conflictos.xlsx` | 6 | 1 (`PRD-203`) | 3: `PRD-101` (precios y stock), `PRD-103` (nombre y stock), `PRD-001` (precio de crédito y stock) | 1 (`PRD-204` con stock negativo) | 1 (`PRD-102` idéntico) |
| `creditos_conflictos.xlsx` | 6 | 1 (`CRD-H08`) | 3: `CRD-H03` (cuotas pagadas), `CRD-001` (Pendiente a Aprobado, con aviso de stock), `CRD-H01` (cuota y total) | 1 (`CRD-H09` con empleado inexistente) | 1 (`CRD-H05` idéntico) |
| `cuotas_conflictos.xlsx` | 6 | 2 (`CRD-H01` cuota 5, `CRD-H03` cuota 3) | 2: cuota 1 (monto 817 a 850) y cuota 3 (fecha 10/06 a 12/06) | 1 (`CRD-H02` cuota 9 de 6) | 1 (`CRD-H01` cuota 2 idéntica) |

## Matriz de pruebas

Ejecutada el 27/10/2026 en el **Firebase Emulator local** (proyecto `demo-crediflow`, nunca producción), con la app en `vite dev` y un navegador automatizado. Capturas en `docs/evidencias-importacion/`. Además de las pruebas automáticas (`npm test`, `src/helpers/importacionExcel.test.js`).

| # | Paso | Datos | Resultado esperado | Resultado observado | Evidencia |
|---|---|---|---|---|---|
| 1 | Importar productos | `productos.xlsx` | 10 filas: 7 / 2 / 1 | Vista previa y resultado: 10 leídas, 7 insertadas, 2 rechazadas (PRD-108 precio, PRD-109 categoría), 1 omitida (PRD-001). Cumple | `03-preview-productos.png`, `04-resultado-productos.png` |
| 2 | Importar créditos | `creditos.xlsx` | 8 filas: 5 / 2 / 1 | 8 leídas, 5 insertadas, 2 rechazadas, 1 omitida. Cumple | `05-preview-creditos.png`, `06-resultado-creditos.png` |
| 3 | Importar cuotas | `cuotas.xlsx` | 13 filas: 10 / 2 / 1 | 13 leídas, 10 insertadas, 2 rechazadas, 1 omitida. Cumple | `07-preview-cuotas.png`, `08-resultado-cuotas.png` |
| 4 | Repetir los tres archivos | Los mismos | 0 insertadas; lo insertado pasa a omitido | Productos 0 / 2 / 8, créditos 0 / 2 / 6, cuotas 0 / 2 / 11; el botón de confirmar queda deshabilitado. Cumple | `09-preview-productos-repetido.png`, `10-preview-creditos-repetido.png`, `11-preview-cuotas-repetido.png` |
| 5 | Fecha de negocio | `CRD-H01` | `fechaRegistro` = 10/03/2026, distinta de la fecha de carga | En Firestore: `fechaRegistro` 2026-03-10, `fechaRevision` 2026-03-12, `fechaImportacion` 2026-10-28. El pago `CRD-H03-C01` quedó con fecha 2026-07-18. Cumple | Consulta a Firestore (resultado en la sección siguiente) |
| 6 | Cuadrar cantidades | Resultado de los pasos 1 a 3 | Documentos nuevos = insertadas; rechazadas no existen | `productos` 4 + 7 = 11, `creditos` 2 + 5 = 7, `cuotas` 10; `PRD-108`, `PRD-109`, `CRD-H06` y `CRD-H07` no existen; `PRD-001` quedó intacto. Cumple | Consulta a Firestore |
| 7 | Dashboard técnico | Rol `SUPERVISOR TECNICO` | La tarjeta suma las tres importaciones y el filtro por tabla cambia las cifras | Todas: 3 importaciones, 22 insertadas, 6 rechazadas, 3 omitidas. Productos: 1 / 7 / 2 / 1. Cuotas: 1 / 10 / 2 / 1. Cumple | `sup-2-tecnico.png`, `sup-3-tecnico-filtro-productos.png` |
| 8 | KPIs gerenciales | Rol `GERENTE`, datos importados en los pasos 1 a 3 | Los créditos y pagos importados aparecen en los indicadores y el clic en cada gráfico abre el detalle | Tarjetas: 4 créditos aprobados (L 20,220), saldo por cobrar L 14,256, recuperación 29.5 % (L 5,964 cobrados), 5 productos bajo mínimo, 2 reclamos pendientes. Cada tarjeta y los 8 gráficos abren un modal con los registros (p. ej. barra de mayo: 2 pagos por L 1,297; Licuadora: 2 créditos por L 4,320). Con "Últimos 6 meses" bajan a 2 créditos y 16.67 %; con marzo-abril, a 1 crédito. Al crear un crédito aprobado desde fuera de la página, la tarjeta pasó de 4 a 5 sin recargar. Cumple | `g-0-dashboard-completo.png`, `g-2-modal-creditos-aprobados.png`, `g-4-modal-barra-cobrado-abril.png` (en `docs/evidencias-gerencial/`) |
| 9 | Error controlado | Archivo vacío y archivo con otra hoja | Mensaje claro, sin escribir nada | **Pendiente** | — |
| 10 | Acceso restringido | Usuarios sin rol `ADMINISTRADOR` | `/importaciones` muestra "Acceso Denegado" | `SUPERVISOR TECNICO` y `GERENTE` reciben "Acceso Denegado" en `/importaciones`; el supervisor también en el dashboard gerencial y el gerente en el técnico. Cumple | `sup-5-importaciones-denegado.png`, `ger-4-importaciones-denegado.png`, `sup-4-gerencial-denegado.png`, `ger-3-tecnico-denegado.png` |
| 11 | Conflictos en productos | `productos_conflictos.xlsx`, marcando `PRD-101` y `PRD-001` y dejando `PRD-103` | Vista previa 1 / 3 conflictos / 1 / 1; el modal muestra dato actual y nuevo; solo se actualizan los marcados | Vista previa: 6 leídas, 1 insertada, 3 conflictos, 1 rechazada, 1 omitida. Resultado: 1 insertada, 2 actualizadas, 1 rechazada, 2 omitidas. En Firestore: `PRD-101` 7500 / 8625 / stock 8 y `PRD-001` 10200 / stock 9 (su descripción quedó intacta); `PRD-103` conservó "Sofá 3 plazas" y stock 6; `PRD-203` creado. Cumple | `c-1-previa-conflictos-productos.png`, `c-2-modal-conflictos-productos.png`, `c-3-modal-con-casillas-productos.png`, `c-4-resultado-productos.png` (en `docs/evidencias-conflictos/`) |
| 12 | Conflictos en créditos con aviso | `creditos_conflictos.xlsx`, marcando `CRD-H03` y `CRD-H01`; luego una segunda pasada marcando `CRD-001` | Aviso ámbar en `CRD-001`; en la segunda pasada solo queda ese conflicto; al aprobarlo se descuenta stock | Modal con el aviso de la Cloud Function. Primera pasada: 1 insertada, 2 actualizadas. Segunda: 0 insertadas, 1 conflicto, 4 omitidas, 1 actualizada. `CRD-001` quedó Aprobado y `PRD-002` pasó de stock 25 a 23 (la función corrió con éxito) | `c-5-modal-conflictos-creditos-advertencia.png` |
| 13 | Conflictos en cuotas | `cuotas_conflictos.xlsx`, "Actualizar todos" | 2 insertadas y 2 actualizadas | 2 insertadas, 2 actualizadas, 1 rechazada, 1 omitida. `CRD-H01-C01` quedó en 850 y `CRD-H01-C03` con fecha 12/06/2026. Cumple | `c-6-resultado-cuotas-historial.png` |

Resultado de la consulta a Firestore del paso 5 y 6: monto cobrado por mes (fecha de negocio) 2026-03: 480, 04: 1297, 05: 1297, 06: 817, 07: 1325, 08: 508, 10: 240; las tres importaciones quedaron con `estado: COMPLETADA`, `noProcesadas: 0` y 3 entradas de auditoría en el módulo "Importación Excel".

## Dashboard gerencial: de dónde sale cada indicador

Pantalla: `/dashboard-gerencial` (roles `GERENTE` y `ADMINISTRADOR`). Cálculo: `src/helpers/kpisGerenciales.js`; lectura en tiempo real: `src/services/dashboardGerencialService.js`; detalle al hacer clic: `src/components/ModalDetalle.jsx`. Filtro de período: Todo, Este año, Últimos 6 meses, Este mes o fechas a elección.

| Indicador | Cálculo | Fecha usada | Colecciones |
|---|---|---|---|
| Créditos aprobados | Cantidad y suma de `totalCredito` con estado Aprobado o Liquidado | `fechaRevision` (aprobación) | `creditos` |
| Saldo por cobrar | `totalCredito` menos pagos, de los créditos aprobados en el período | Pagos hasta el fin del período (o hoy) | `creditos`, `cuotas` |
| Tasa de recuperación | Cobrado / financiado. No mide pago a tiempo: no hay cronograma de vencimientos | Igual que el anterior | `creditos`, `cuotas` |
| Productos bajo mínimo | Stock menor o igual a `StockMinimoAviso`; crítico si llega a `StockMinimoCierre` | Estado actual | `productos`, `configuraciones` |
| Monto cobrado y desembolsado por mes | Pagos y créditos aprobados agrupados por mes | `cuotas.fechaRegistro` y aprobación | `cuotas`, `creditos` |
| Reclamos pendientes y resueltos | Resueltos = estado Revisado; pendientes = Pendiente y En revisión | `fechaEmision` | `reclamos` |
| Productos más financiados | Unidades por producto en créditos aprobados | Aprobación | `creditos` |
| Nuevas cuentas por mes | Cuentas con `fechaRegistro` en el período | `fechaRegistro` | `usuarios` |
| Promociones por situación | Vigente, vencida, inactiva o programada según fechas y estado | Estado actual | `promociones` |

Limitaciones: el aprovechamiento de promociones no se mide porque los créditos no guardan `promocionId`; el rol `GERENTE` necesita permiso de lectura sobre estas seis colecciones (en el Emulator no hay reglas, en producción hay que revisarlas).
