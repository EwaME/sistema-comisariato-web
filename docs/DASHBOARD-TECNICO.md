# Dashboard técnico

Pantalla: Dashboard principal del rol `IT` (`/dashboard`). Se actualiza en vivo; el filtro de período y el selector de operación recalculan los indicadores, y cada tarjeta o gráfico abre un modal con los registros que explican la cifra.
Código: `src/helpers/kpisTecnicos.js` (cálculo), `src/services/dashboardTecnicoService.js` (lectura en tiempo real), `src/services/metricasService.js` (medición), `src/pages/Dashboards/DashboardTecnico.jsx`.

## Indicadores

| Indicador | Cálculo | Fuente |
|---|---|---|
| Usuarios activos | Usuarios únicos con una acción en los últimos 5 minutos (no cuentan accesos fallidos ni "Sistema"); se recalcula cada 30 s | `actividad_logs` |
| Cuentas habilitadas por rol | Cuentas con estado distinto de INACTIVO, por su rol principal (el primero distinto de EMPLEADO) | `usuarios` |
| Actividad por módulo | Registros por módulo en el período | `actividad_logs` |
| Acciones por tipo | Registros por acción (creación, edición, aprobación, acceso...) | `actividad_logs` |
| Horas pico | Registros por hora local del día | `actividad_logs` |
| Logins fallidos | Acciones `ERROR DE ACCESO` y `ACCESO DENEGADO`, por día | `actividad_logs` |
| Errores de servidor | Operaciones medidas con error equivalente a 5xx, sobre el total, en cantidad y porcentaje | `logs_sistema` |
| Tiempo de respuesta | Promedio de `duracionMs` de las operaciones medidas, por operación o de la seleccionada | `logs_sistema` |
| Ejecuciones de Cloud Functions | Éxito y fallo de `descontarStockAlAprobar` | `logs_sistema` |
| Resultados de importaciones Excel | Importaciones y filas insertadas, actualizadas, rechazadas y omitidas, con filtro por tabla | `importaciones` |

## Qué se adaptó y por qué

El proyecto no tiene una API HTTP propia: la app habla directo con Firestore y Firebase Auth. Por eso:

- **Errores 5xx**: se agrupan los códigos de error de Firebase por su equivalente HTTP. `unavailable`, `internal`, `deadline-exceeded`, `unknown`, `aborted`, `resource-exhausted`, `data-loss` y `auth/network-request-failed` cuentan como **servidor (≈ 5xx)**; `permission-denied`, `not-found`, `invalid-argument`, `auth/*` y similares como **cliente (≈ 4xx)**; un error sin código es de **aplicación**. La tarjeta muestra los de servidor sobre el total; el modal lista todos los errores con su tipo.
- **Tiempo de respuesta**: es la duración, medida en el navegador, de las operaciones críticas, no de un endpoint.
- **Operaciones medidas** (`conMetrica` en `metricasService.js`): `login`, `actualizarRevisionCredito`, `crearProducto`, `asignarRolWebYAuth` y `ejecutarImportacion`. Cada ejecución guarda `{ operacion, exito, duracionMs, codigoError, mensaje, correo, fecha }` en `logs_sistema`; si registrar falla, la operación no se ve afectada.
- **Cloud Function**: `descontarStockAlAprobar` escribe su propio registro (`origen: cloud_function`, éxito o fallo, duración, crédito) en cada ejecución real.
- **Usuarios activos** se deriva de la auditoría, porque no existe presencia en tiempo real.
- Los registros de actividad y de mediciones se leen limitados a los 5,000 más recientes.

## Pruebas realizadas (Emulator local, 27 y 28/10/2026)

| Prueba | Resultado | Evidencia |
|---|---|---|
| Dashboard con datos reales | 2 usuarios activos, 9 cuentas, 15 operaciones registradas, 6 logins fallidos, 16 operaciones medidas con 1 error de servidor (6.25 %) y promedio de 63.3 ms | `docs/evidencias-tecnico/t-0-dashboard-completo.png` |
| Clic en 3 tarjetas, 7 gráficos y 1 dona | Cada uno abre su modal con los registros correctos | `docs/evidencias-tecnico/t-1-dashboard-tecnico.png` |
| Filtro por operación | Con `login`: 0 de 11 operaciones con error de servidor y 23.7 ms | (misma corrida) |
| Filtro por período | Con 01-02/10/2026: actividad, errores y logins en 0; "Usuarios activos" no cambia (usa los últimos 5 minutos) | (misma corrida) |
| Actualización en vivo | Al crear un registro de login fallido desde fuera de la página, la tarjeta pasó de 6 a 7 sin recargar y volvió a 6 al borrarlo | (misma corrida) |
| Cloud Function con éxito y con fallo | Crédito aprobado con producto válido: stock 25 a 23 y registro de éxito (363 ms). Con producto inexistente: registro de fallo "El producto no existe en el inventario" | Consulta a `logs_sistema` |
| Error de servidor provocado | Se cortó la conexión al confirmar una importación: falla con `unavailable`, **no escribe nada** y la medición quedó registrada como error | `docs/evidencias-tecnico/t-0-error-sin-conexion.png` |
| Acceso por rol | `IT` ve este dashboard como principal; `GERENCIA` y `ADMINISTRADOR` ya no lo ven | pendiente de repetir con los roles nuevos |

Limitación: los logins fallidos solo se registran si las reglas de Firestore permiten escribir en `logs_sistema` sin sesión; si no, la medición se pierde, pero el intento sigue quedando en `actividad_logs`.
