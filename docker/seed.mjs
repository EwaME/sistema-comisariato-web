// Siembra el Firebase Emulator Suite con datos de prueba para el entorno de DESARROLLO.
// Lo ejecuta docker/emulators-entrypoint.sh cada vez que arranca el contenedor "emulators".
// Solo se conecta a los emuladores locales (FIRESTORE_EMULATOR_HOST / FIREBASE_AUTH_EMULATOR_HOST).
import { createRequire } from "node:module";

if (!process.env.FIRESTORE_EMULATOR_HOST || !process.env.FIREBASE_AUTH_EMULATOR_HOST) {
  console.error("[seed] Faltan las variables de los emuladores; se aborta para no tocar la nube.");
  process.exit(1);
}

// firebase-admin está instalado junto a las Cloud Functions
const require = createRequire("/app/src/cloudFunctions/functions/package.json");
const admin = require("firebase-admin");

admin.initializeApp({ projectId: process.env.GCLOUD_PROJECT || "demo-crediflow" });
const db = admin.firestore();
const auth = admin.auth();

export const PASSWORD = "Crediflow2026*";
const ahora = new Date();
const hace = (dias) => new Date(ahora.getTime() - dias * 86400000);
const fechas = { fechaRegistro: ahora, fechaModificacion: ahora };

// ---------- roles (ID = nombre en mayúsculas) ----------
const ROLES = [
  ["ADMINISTRADOR", "Gestiona empleados, configuración, reportes y auditoría."],
  ["ACREDITADOR", "Revisa y aprueba solicitudes de crédito y reclamos."],
  ["ANALISTA", "Consulta reportes y auditorías."],
  ["GESTOR DE INVENTARIO", "Administra productos, categorías y compras."],
  ["MODERADOR", "Modera usuarios, sugerencias y comentarios."],
  ["PROVEEDOR", "Atiende las solicitudes de compra."],
  ["TODOLOGO", "Acceso total (solo desarrollo y pruebas)."],
];

// ---------- usuarios de prueba: uno por rol, contraseña común ----------
const USUARIOS = [
  ["todologo@crediflow.test", "Tomás Todologo", "TODOLOGO", "Gerente General", "Gerencia"],
  ["admin@crediflow.test", "Ana Administradora", "ADMINISTRADOR", "Administrador", "Administración"],
  ["acreditador@crediflow.test", "Carlos Acreditador", "ACREDITADOR", "Analista de Crédito", "Créditos"],
  ["analista@crediflow.test", "Laura Analista", "ANALISTA", "Analista", "Administración"],
  ["inventario@crediflow.test", "Iván Inventario", "GESTOR DE INVENTARIO", "Encargado de Bodega", "Inventario"],
  ["moderador@crediflow.test", "Marta Moderadora", "MODERADOR", "Moderador", "Administración"],
  ["proveedor@crediflow.test", "Pedro Proveedor", "PROVEEDOR", "Proveedor", "Inventario"],
];

const DEPARTAMENTOS = ["Gerencia", "Administración", "Créditos", "Inventario"];
const CARGOS = ["Gerente General", "Administrador", "Analista de Crédito", "Analista", "Encargado de Bodega", "Moderador", "Proveedor"];
const CATEGORIAS = [
  ["CAT-001", "Electrodomésticos", "Línea blanca y pequeños electrodomésticos"],
  ["CAT-002", "Hogar", "Muebles y artículos para el hogar"],
  ["CAT-003", "Tecnología", "Televisores, computadoras y accesorios"],
];
const PRODUCTOS = [
  ["PRD-001", "Refrigeradora 12 pies", "CAT-001", 8500, 9800, 12, 12],
  ["PRD-002", "Licuadora 600W", "CAT-001", 1200, 1400, 25, 6],
  ["PRD-003", "Colchón matrimonial ortopédico", "CAT-002", 5200, 6100, 8, 24],
  ["PRD-004", "Smart TV 50 pulgadas", "CAT-003", 9800, 11500, 3, 12], // stock bajo: prueba el aviso
];

const slug = (t) => t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

async function sembrar() {
  const lote = db.batch();
  const set = (ruta, datos) => lote.set(db.doc(ruta), datos);

  for (const [nombre, descripcion] of ROLES)
    set(`roles/${nombre}`, { nombre, entorno: "WEB", descripcion, estado: "ACTIVO", ...fechas });

  DEPARTAMENTOS.forEach((nombre, i) => {
    const codigo = `DEP-${String(i + 1).padStart(2, "0")}`;
    set(`departamentos/${codigo}`, { codigo, nombre, descripcion: `Departamento de ${nombre}`, estado: "ACTIVO", ...fechas });
  });
  CARGOS.forEach((nombre, i) => {
    const codigo = `CAR-${String(i + 1).padStart(2, "0")}`;
    set(`cargos/${codigo}`, { codigo, nombre, descripcion: nombre, estado: "ACTIVO", ...fechas });
  });

  for (const [categoriaId, nombre, descripcion] of CATEGORIAS)
    set(`categorias/${categoriaId}`, { categoriaId, nombre, descripcion, imagenUrl: "", estado: "ACTIVO", ...fechas });

  for (const [productoId, nombre, categoriaId, precioContado, precioCredito, stock, garantiaMeses] of PRODUCTOS)
    set(`productos/${productoId}`, {
      productoId, nombre, nombreNormalizado: slug(nombre),
      descripcion: `${nombre} — producto de prueba del entorno de desarrollo.`,
      precioContado, precioCredito,
      categoria: CATEGORIAS.find((c) => c[0] === categoriaId)[1], categoriaId,
      stock, activo: true, rate: 0, cantidadVendida: 0,
      garantiaMeses, garantiaDias: null,
      imagenFrontalUrl: "", imagenLateralUrl: "", imagenTraseraUrl: "",
      ...fechas,
    });

  // configuración global: la app la exige (p. ej. useInactividad y la Cloud Function)
  set("configuraciones/config_global", {
    tiempoInactividad: 15, porcentajeInteres: 15, porcSueldo: 30,
    StockMinimoAviso: 8, StockMinimoCierre: 2, diaFechaCobro: 1,
    CorreoNotificaciones: "dev@crediflow.test", deduccionesAutomaticas: true,
    mensajeAprobado: "Tu crédito fue aprobado.",
    mensajeRechazado: "Tu crédito fue rechazado.",
    mensajeEspera: "Tu solicitud está en espera de revisión.",
  });
  [6, 12, 24].forEach((meses, i) => {
    const plazoId = `PLZ-${String(i + 1).padStart(2, "0")}`;
    set(`configuraciones/config_global/plazos/${plazoId}`, { plazoId, plazoMeses: meses, fechaCreacion: ahora });
  });
  [6, 12, 24].forEach((meses, i) => {
    const garantiaId = `GAR-${String(i + 1).padStart(2, "0")}`;
    set(`configuraciones/config_global/garantias/${garantiaId}`, { garantiaId, mesesCobertura: meses, requiereRevision: false });
  });

  // empleados y perfiles de acceso
  USUARIOS.forEach(([correo, nombre, rol, cargo, departamento], i) => {
    const empleadoId = `EMP-${String(i + 1).padStart(3, "0")}`;
    const [nombres, ...resto] = nombre.split(" ");
    set(`empleados/${empleadoId}`, {
      empleadoId, nombres, apellidos: resto.join(" "), dni: `0801199000${i}${i}${i}`.slice(0, 13),
      departamento, cargo, correo, telefono: `+504 9999-000${i}`, fechaIngreso: "2024-01-15",
      estado: "ACTIVO", salario: 15000 + i * 1000, limiteCredito: 4500 + i * 300, fotoUrl: "", ...fechas,
    });
    set(`usuarios/${correo}`, {
      uid: correo, empleadoId, nombre, correo, usuario: correo.split("@")[0],
      rol: ["EMPLEADO", rol], estado: "ACTIVO", plataforma: "WEB Y MÓVIL",
      passwordChanged: true, fotoUrl: "", ...fechas,
    });
  });

  // datos de ejemplo para probar los flujos de revisión
  set("creditos/CRD-001", {
    usuarioId: "admin@crediflow.test", empleadoId: "EMP-002", usuario: "admin",
    productoId: "PRD-002", nombreProducto: "Licuadora 600W", imagenProductoURL: "",
    cantidad: 2, plazoMeses: 6, cuotaMensual: 480, cuotasPagadas: 0,
    estado: "Pendiente", fechaRegistro: hace(1),
  });
  set("creditos/CRD-002", {
    usuarioId: "analista@crediflow.test", empleadoId: "EMP-004", usuario: "analista",
    productoId: "PRD-003", nombreProducto: "Colchón matrimonial ortopédico", imagenProductoURL: "",
    cantidad: 1, plazoMeses: 12, cuotaMensual: 508, cuotasPagadas: 0,
    estado: "Pendiente", fechaRegistro: hace(2),
  });
  set("reclamos/RCL-001", {
    solicitante: "Ana Administradora", asunto: "El producto llegó con un defecto de fábrica",
    estado: "Pendiente", fechaEmision: hace(3), evidenciaUrl: "",
  });
  set("sugerencias/SUG-001", {
    nombreUsuario: "Ana Administradora", fotoUsuario: "", asunto: "Más métodos de pago",
    descripcion: "Sería útil poder pagar cuotas desde la aplicación.", fechaRegistro: hace(4),
  });
  set("comprasEwa/CMP-001", {
    compraId: "CMP-001", estado: "PENDIENTE", idProveedor: "proveedor@crediflow.test",
    nombreProveedor: "Pedro Proveedor", solicitadoPor: "inventario@crediflow.test",
    items: [{ productoId: "PRD-004", nombre: "Smart TV 50 pulgadas", categoria: "Tecnología", cantidad: 10 }],
    fecha: hace(1), fechaCreacion: hace(1),
  });

  await lote.commit();

  // usuarios de Firebase Auth (el emulador no pide verificación de correo)
  for (const [correo, nombre] of USUARIOS) {
    await auth.createUser({ uid: correo, email: correo, password: PASSWORD, displayName: nombre, emailVerified: true })
      .catch(async (e) => {
        if (e.code !== "auth/uid-already-exists" && e.code !== "auth/email-already-exists") throw e;
        await auth.updateUser(correo, { password: PASSWORD });
      });
  }
}

await sembrar();
console.log(`[seed] listo: ${ROLES.length} roles, ${USUARIOS.length} usuarios (contraseña: ${PASSWORD}), ${PRODUCTOS.length} productos.`);
