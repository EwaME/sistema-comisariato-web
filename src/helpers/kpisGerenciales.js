// Cálculo de los indicadores del dashboard gerencial. Sin Firebase: recibe los documentos ya leídos.
// Cada indicador devuelve sus cifras y los `registros` que las explican (los que se muestran en el modal).

export const ESTADOS_APROBADOS = ["Aprobado", "Liquidado"];
const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

export function aFecha(valor) {
  if (!valor) return null;
  if (valor instanceof Date) return Number.isNaN(valor.getTime()) ? null : valor;
  if (typeof valor.toDate === "function") return valor.toDate();
  if (typeof valor.seconds === "number") return new Date(valor.seconds * 1000);
  if (typeof valor === "string") {
    const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor.trim());
    const f = iso ? new Date(+iso[1], +iso[2] - 1, +iso[3], 12) : new Date(valor);
    return Number.isNaN(f.getTime()) ? null : f;
  }
  return null;
}

const aMes = (f) => `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, "0")}`;
export const etiquetaMes = (mes) => {
  const [anio, m] = mes.split("-");
  return `${MESES[Number(m) - 1]} ${anio}`;
};
const inicioDia = (f) => new Date(f.getFullYear(), f.getMonth(), f.getDate());
const finDia = (f) => new Date(f.getFullYear(), f.getMonth(), f.getDate(), 23, 59, 59, 999);
const redondear = (n) => Math.round(n * 100) / 100;

// periodo = { desde: Date|null, hasta: Date|null }, ambos extremos incluidos
export function dentro(fecha, periodo) {
  if (!periodo.desde && !periodo.hasta) return true;
  if (!fecha) return false;
  return (!periodo.desde || fecha >= inicioDia(periodo.desde)) && (!periodo.hasta || fecha <= finDia(periodo.hasta));
}

const esAprobado = (c) => ESTADOS_APROBADOS.includes(c.estado);
const fechaAprobacion = (c) => aFecha(c.fechaRevision) ?? aFecha(c.fechaRegistro);
const cliente = (c) => c.usuario || c.usuarioId || "—";

function serieMensual(registros, valor) {
  const meses = new Map();
  for (const r of registros) {
    const acc = meses.get(r.grupo) ?? { mes: r.grupo, etiqueta: etiquetaMes(r.grupo), cantidad: 0, monto: 0 };
    acc.cantidad += 1;
    acc.monto = redondear(acc.monto + valor(r));
    meses.set(r.grupo, acc);
  }
  return [...meses.values()].sort((a, b) => a.mes.localeCompare(b.mes));
}

function aprobadosEnPeriodo(creditos, periodo) {
  return creditos
    .filter(esAprobado)
    .map((c) => ({ c, fecha: fechaAprobacion(c) }))
    .filter(({ fecha }) => fecha && dentro(fecha, periodo));
}

// 1. Créditos aprobados: cantidad y monto financiado, por fecha de aprobación
export function creditosAprobados(creditos, periodo) {
  const registros = aprobadosEnPeriodo(creditos, periodo)
    .map(({ c, fecha }) => ({
      id: c.id,
      grupo: aMes(fecha),
      cliente: cliente(c),
      producto: c.nombreProducto || "—",
      unidades: c.cantidad || 0,
      total: c.totalCredito || 0,
      estado: c.estado,
      fecha,
    }))
    .sort((a, b) => a.fecha - b.fecha);
  return {
    cantidad: registros.length,
    monto: redondear(registros.reduce((s, r) => s + r.total, 0)),
    porMes: serieMensual(registros, (r) => r.total),
    registros,
  };
}

// 2 y 3. Cartera de los créditos aprobados en el período: cobrado, saldo por cobrar y % de recuperación.
// Los pagos se suman hasta el fin del período (o hasta hoy si no hay fin).
export function cartera(creditos, cuotas, periodo, ahora = new Date()) {
  const corte = periodo.hasta ? finDia(periodo.hasta) : ahora;
  const pagado = new Map();
  for (const q of cuotas) {
    const f = aFecha(q.fechaRegistro);
    if (!f || f > corte) continue;
    pagado.set(q.creditoId, (pagado.get(q.creditoId) || 0) + (Number(q.monto) || 0));
  }

  const registros = aprobadosEnPeriodo(creditos, periodo).map(({ c, fecha }) => {
    const total = c.totalCredito || 0;
    const cobrado = Math.min(pagado.get(c.id) || 0, total);
    return {
      id: c.id,
      cliente: cliente(c),
      producto: c.nombreProducto || "—",
      total,
      pagado: redondear(cobrado),
      saldo: redondear(total - cobrado),
      porcentaje: total > 0 ? redondear((cobrado / total) * 100) : 0,
      fecha,
    };
  });

  const financiado = redondear(registros.reduce((s, r) => s + r.total, 0));
  const cobrado = redondear(registros.reduce((s, r) => s + r.pagado, 0));
  return {
    financiado,
    cobrado,
    saldo: redondear(financiado - cobrado),
    porcentaje: financiado > 0 ? redondear((cobrado / financiado) * 100) : 0,
    registros,
    conSaldo: registros.filter((r) => r.saldo > 0),
    conPagos: registros.filter((r) => r.pagado > 0),
  };
}

// 4. Productos en o por debajo del mínimo de aviso; "Crítico" si llegó al mínimo de cierre. Es el estado actual.
export function productosBajoMinimo(productos, config = {}) {
  const aviso = Number(config.StockMinimoAviso ?? 8);
  const cierre = Number(config.StockMinimoCierre ?? 2);
  const registros = productos
    .filter((p) => (Number(p.stock) || 0) <= aviso)
    .map((p) => ({
      id: p.id,
      nombre: p.nombre || p.id,
      categoria: p.categoria || "—",
      stock: Number(p.stock) || 0,
      activo: p.activo ? "Sí" : "No",
      grupo: (Number(p.stock) || 0) <= cierre ? "Crítico" : "Aviso",
    }))
    .sort((a, b) => a.stock - b.stock);
  const critico = registros.filter((r) => r.grupo === "Crítico").length;
  return { aviso, cierre, critico, enAviso: registros.length - critico, total: registros.length, registros };
}

// 5. Monto cobrado (pagos) y desembolsado (créditos aprobados) por mes
export function montoMensual(creditos, cuotas, periodo) {
  const desembolsos = aprobadosEnPeriodo(creditos, periodo).map(({ c, fecha }) => ({
    id: `D-${c.id}`,
    tipo: "Desembolso",
    grupo: aMes(fecha),
    referencia: c.id,
    detalle: c.nombreProducto || "—",
    monto: c.totalCredito || 0,
    fecha,
  }));
  const cobros = cuotas
    .map((q) => ({ q, fecha: aFecha(q.fechaRegistro) }))
    .filter(({ fecha }) => fecha && dentro(fecha, periodo))
    .map(({ q, fecha }) => ({
      id: `C-${q.id}`,
      tipo: "Cobro",
      grupo: aMes(fecha),
      referencia: q.creditoId,
      detalle: q.numeroCuota ? `Cuota ${q.numeroCuota}` : "Pago de cuota",
      monto: Number(q.monto) || 0,
      fecha,
    }));

  const meses = new Map();
  for (const r of [...desembolsos, ...cobros]) {
    const acc = meses.get(r.grupo) ?? { mes: r.grupo, etiqueta: etiquetaMes(r.grupo), cobrado: 0, desembolsado: 0 };
    if (r.tipo === "Cobro") acc.cobrado = redondear(acc.cobrado + r.monto);
    else acc.desembolsado = redondear(acc.desembolsado + r.monto);
    meses.set(r.grupo, acc);
  }
  const serie = [...meses.values()].sort((a, b) => a.mes.localeCompare(b.mes));
  return {
    serie,
    totalCobrado: redondear(serie.reduce((s, m) => s + m.cobrado, 0)),
    totalDesembolsado: redondear(serie.reduce((s, m) => s + m.desembolsado, 0)),
    registros: [...desembolsos, ...cobros].sort((a, b) => a.fecha - b.fecha),
  };
}

// 6. Reclamos pendientes (Pendiente o En revisión) frente a resueltos (Revisado), por fecha de emisión
export function reclamosResumen(reclamos, periodo) {
  const registros = reclamos
    .map((r) => ({ r, fecha: aFecha(r.fechaEmision) }))
    .filter(({ fecha }) => dentro(fecha, periodo))
    .map(({ r, fecha }) => ({
      id: r.id,
      grupo: r.estado === "Revisado" ? "Resueltos" : "Pendientes",
      solicitante: r.solicitante || "—",
      asunto: r.asunto || "—",
      estado: r.estado || "—",
      fecha,
    }));
  const resueltos = registros.filter((r) => r.grupo === "Resueltos").length;
  return { pendientes: registros.length - resueltos, resueltos, total: registros.length, registros };
}

// 7. Productos más financiados (créditos aprobados en el período), ordenados por unidades
export function topProductos(creditos, periodo, limite = 5) {
  const grupos = new Map();
  const detalle = aprobadosEnPeriodo(creditos, periodo).map(({ c, fecha }) => {
    const producto = c.nombreProducto || c.productoId || "—";
    const g = grupos.get(producto) ?? { producto, creditos: 0, unidades: 0, monto: 0 };
    g.creditos += 1;
    g.unidades += c.cantidad || 0;
    g.monto = redondear(g.monto + (c.totalCredito || 0));
    grupos.set(producto, g);
    return { id: c.id, grupo: producto, cliente: cliente(c), producto, unidades: c.cantidad || 0, total: c.totalCredito || 0, estado: c.estado, fecha };
  });
  const ranking = [...grupos.values()].sort((a, b) => b.unidades - a.unidades || b.monto - a.monto).slice(0, limite);
  const elegidos = new Set(ranking.map((g) => g.producto));
  return { ranking, registros: detalle.filter((r) => elegidos.has(r.grupo)).sort((a, b) => a.fecha - b.fecha) };
}

// 8. Cuentas de usuario registradas en el período, por mes
export function nuevosRegistros(usuarios, periodo) {
  const registros = usuarios
    .map((u) => ({ u, fecha: aFecha(u.fechaRegistro) }))
    .filter(({ fecha }) => fecha && dentro(fecha, periodo))
    .map(({ u, fecha }) => {
      const roles = Array.isArray(u.rol) ? u.rol.filter((r) => r !== "EMPLEADO") : [];
      return {
        id: u.id,
        grupo: aMes(fecha),
        nombre: u.nombre || "—",
        correo: u.correo || u.id,
        rol: roles.length ? roles.join(", ") : "EMPLEADO",
        plataforma: u.plataforma || "—",
        fecha,
      };
    })
    .sort((a, b) => a.fecha - b.fecha);
  return { total: registros.length, porMes: serieMensual(registros, () => 0), registros };
}

// 9. Promociones por situación actual. El aprovechamiento (créditos por promoción) no se mide: los créditos no guardan promocionId.
export function promocionesResumen(promociones, ahora = new Date()) {
  const hoy = inicioDia(ahora);
  const registros = promociones.map((p) => {
    const inicio = aFecha(p.fechaInicio);
    const fin = aFecha(p.fechaFin);
    let grupo = "Vigente";
    if (fin && finDia(fin) < hoy) grupo = "Vencida";
    else if (p.estado !== "ACTIVO") grupo = "Inactiva";
    else if (inicio && inicioDia(inicio) > hoy) grupo = "Programada";
    return {
      id: p.id,
      grupo,
      nombre: p.nombre || p.id,
      tipo: p.tipo || "—",
      descuento: p.valorDescuento ?? "—",
      fechaInicio: p.fechaInicio || "—",
      fechaFin: p.fechaFin || "—",
      estado: p.estado || "—",
    };
  });
  const cuenta = (g) => registros.filter((r) => r.grupo === g).length;
  return { vigentes: cuenta("Vigente"), vencidas: cuenta("Vencida"), inactivas: cuenta("Inactiva"), programadas: cuenta("Programada"), total: registros.length, registros };
}

export function calcularIndicadores(datos, periodo, ahora = new Date()) {
  return {
    aprobados: creditosAprobados(datos.creditos, periodo),
    cartera: cartera(datos.creditos, datos.cuotas, periodo, ahora),
    stock: productosBajoMinimo(datos.productos, datos.config),
    mensual: montoMensual(datos.creditos, datos.cuotas, periodo),
    reclamos: reclamosResumen(datos.reclamos, periodo),
    top: topProductos(datos.creditos, periodo),
    nuevos: nuevosRegistros(datos.usuarios, periodo),
    promociones: promocionesResumen(datos.promociones, ahora),
  };
}
