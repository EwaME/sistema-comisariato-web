import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Radio, BadgeCheck, Wallet, Percent, Boxes, MessageSquareWarning, UserPlus, Tag, ShoppingBag, ArrowLeftRight } from "lucide-react";
import { TarjetaIndicador, MiniArea, MiniBarras, DonaConLeyenda, MiniRanking, AnilloProgreso, Dona, Barras, BarrasDobles } from "../../components/PanelesDashboard";
import DrawerDetalle from "../../components/DrawerDetalle";
import FiltroPeriodo from "../../components/FiltroPeriodo";
import { C, paraDona } from "../../helpers/graficos";
import { formatearDinero } from "../../helpers/formatoDinero";
import { escucharDatosGerenciales } from "../../services/dashboardGerencialService";
import { calcularIndicadores } from "../../helpers/kpisGerenciales";
import { calcularPeriodo, textoPeriodo } from "../../helpers/periodo";

const COLUMNAS = {
  creditos: [
    { clave: "id", etiqueta: "Crédito" }, { clave: "cliente", etiqueta: "Cliente" }, { clave: "producto", etiqueta: "Producto" },
    { clave: "unidades", etiqueta: "Unidades" }, { clave: "total", etiqueta: "Total", tipo: "dinero" },
    { clave: "estado", etiqueta: "Estado" }, { clave: "fecha", etiqueta: "Fecha de aprobación", tipo: "fecha" },
  ],
  cartera: [
    { clave: "id", etiqueta: "Crédito" }, { clave: "cliente", etiqueta: "Cliente" }, { clave: "producto", etiqueta: "Producto" },
    { clave: "total", etiqueta: "Financiado", tipo: "dinero" }, { clave: "pagado", etiqueta: "Cobrado", tipo: "dinero" },
    { clave: "saldo", etiqueta: "Por cobrar", tipo: "dinero" }, { clave: "porcentaje", etiqueta: "% cobrado", tipo: "porcentaje" },
    { clave: "fecha", etiqueta: "Fecha de aprobación", tipo: "fecha" },
  ],
  stock: [
    { clave: "id", etiqueta: "Código" }, { clave: "nombre", etiqueta: "Producto" }, { clave: "categoria", etiqueta: "Categoría" },
    { clave: "stock", etiqueta: "Stock" }, { clave: "grupo", etiqueta: "Nivel" }, { clave: "activo", etiqueta: "Activo" },
  ],
  mensual: [
    { clave: "tipo", etiqueta: "Movimiento" }, { clave: "referencia", etiqueta: "Crédito" }, { clave: "detalle", etiqueta: "Detalle" },
    { clave: "monto", etiqueta: "Monto", tipo: "dinero" }, { clave: "fecha", etiqueta: "Fecha", tipo: "fecha" },
  ],
  reclamos: [
    { clave: "id", etiqueta: "Reclamo" }, { clave: "solicitante", etiqueta: "Solicitante" }, { clave: "asunto", etiqueta: "Asunto" },
    { clave: "estado", etiqueta: "Estado" }, { clave: "fecha", etiqueta: "Emitido", tipo: "fecha" },
  ],
  nuevos: [
    { clave: "nombre", etiqueta: "Nombre" }, { clave: "correo", etiqueta: "Correo" }, { clave: "rol", etiqueta: "Rol" },
    { clave: "plataforma", etiqueta: "Plataforma" }, { clave: "fecha", etiqueta: "Registro", tipo: "fecha" },
  ],
  promociones: [
    { clave: "id", etiqueta: "Código" }, { clave: "nombre", etiqueta: "Promoción" }, { clave: "tipo", etiqueta: "Tipo" },
    { clave: "descuento", etiqueta: "Descuento" }, { clave: "fechaInicio", etiqueta: "Inicio" }, { clave: "fechaFin", etiqueta: "Fin" },
    { clave: "estado", etiqueta: "Estado" }, { clave: "grupo", etiqueta: "Situación" },
  ],
};

const COLORES = {
  Cobrado: C.morado, "Por cobrar": C.lilaClaro,
  Crítico: C.rojo, Aviso: C.ambar,
  Pendientes: C.ambar, Resueltos: C.verde,
  Vigente: C.morado, Programada: C.lila, Vencida: C.grisOscuro, Inactiva: C.gris,
};

const TRAMOS = [
  ["Sin pagos", (r) => r.pagado === 0],
  ["1 % a 49 %", (r) => r.pagado > 0 && r.porcentaje < 50],
  ["50 % a 99 %", (r) => r.porcentaje >= 50 && r.porcentaje < 100],
  ["Cobrado al 100 %", (r) => r.porcentaje >= 100],
];

const mayor = (lista, clave) => lista.reduce((m, x) => (!m || x[clave] > m[clave] ? x : m), null);
const cuenta = (lista, fn) => lista.filter(fn).length;
const dinero = formatearDinero;
const pl = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;

// Arma el contenido del drawer de cada tarjeta a partir de los indicadores ya calculados.
function detalleDe(clave, ind, rango) {
  const { aprobados, cartera, stock, mensual, reclamos, top, nuevos, promociones } = ind;

  if (clave === "aprobados") {
    const mejor = mayor(aprobados.porMes, "cantidad");
    return {
      clave, titulo: "Créditos aprobados", subtitulo: rango,
      resumen: [
        ["Créditos", aprobados.cantidad],
        ["Monto financiado", dinero(aprobados.monto)],
        ["Promedio por crédito", dinero(aprobados.cantidad ? aprobados.monto / aprobados.cantidad : 0)],
        ["Unidades financiadas", aprobados.registros.reduce((s, r) => s + r.unidades, 0)],
        ["Liquidados", cuenta(aprobados.registros, (r) => r.estado === "Liquidado")],
        ["Mes con más créditos", mejor ? `${mejor.etiqueta} (${mejor.cantidad})` : "—"],
      ],
      grafico: ({ seleccion, seleccionar }) => (
        <Barras datos={aprobados.porMes} clave="cantidad" ejeX="etiqueta" activo={seleccion?.clave}
          alClic={(d) => seleccionar({ clave: d.etiqueta, etiqueta: d.etiqueta, mes: d.mes })} />
      ),
      columnas: COLUMNAS.creditos, filas: aprobados.registros, filtro: (f, s) => f.grupo === s.mes,
    };
  }

  if (clave === "flujo") {
    const mejor = mayor(mensual.serie, "cobrado");
    return {
      clave, titulo: "Cobrado y desembolsado por mes", subtitulo: rango,
      resumen: [
        ["Monto cobrado", dinero(mensual.totalCobrado)],
        ["Monto desembolsado", dinero(mensual.totalDesembolsado)],
        ["Diferencia", dinero(mensual.totalDesembolsado - mensual.totalCobrado)],
        ["Meses con movimiento", mensual.serie.length],
        ["Mes de mayor cobro", mejor ? `${mejor.etiqueta} (${dinero(mejor.cobrado)})` : "—"],
        ["Pagos registrados", cuenta(mensual.registros, (r) => r.tipo === "Cobro")],
      ],
      grafico: ({ seleccionar }) => (
        <BarrasDobles datos={mensual.serie} formato={(v) => dinero(v)}
          series={[{ clave: "desembolsado", nombre: "Desembolsado", color: C.violeta }, { clave: "cobrado", nombre: "Cobrado", color: C.lila }]}
          alClic={(s, d) => seleccionar({ clave: `${d.mes}-${s.clave}`, etiqueta: `${s.nombre}, ${d.etiqueta}`, mes: d.mes, tipo: s.clave === "cobrado" ? "Cobro" : "Desembolso" })} />
      ),
      columnas: COLUMNAS.mensual, filas: mensual.registros, filtro: (f, s) => f.grupo === s.mes && f.tipo === s.tipo,
    };
  }

  if (clave === "saldo") {
    return {
      clave, titulo: "Saldo por cobrar", subtitulo: `créditos aprobados en ${rango}`,
      resumen: [
        ["Por cobrar", dinero(cartera.saldo)],
        ["Financiado", dinero(cartera.financiado)],
        ["Cobrado", dinero(cartera.cobrado)],
        ["Créditos con saldo", cartera.conSaldo.length],
        ["Créditos saldados", cartera.registros.length - cartera.conSaldo.length],
        ["Saldo promedio", dinero(cartera.conSaldo.length ? cartera.saldo / cartera.conSaldo.length : 0)],
      ],
      grafico: ({ seleccion, seleccionar }) => (
        <Dona datos={paraDona([["Cobrado", cartera.cobrado], ["Por cobrar", cartera.saldo]])} colores={COLORES} formato={(v) => dinero(v)} activo={seleccion?.clave}
          alClic={(n) => seleccionar({ clave: n, etiqueta: n })} />
      ),
      columnas: COLUMNAS.cartera, filas: cartera.registros, filtro: (f, s) => (s.clave === "Cobrado" ? f.pagado > 0 : f.saldo > 0),
    };
  }

  if (clave === "recuperacion") {
    const datos = TRAMOS.map(([etiqueta, fn]) => ({ etiqueta, cantidad: cuenta(cartera.registros, fn) }));
    return {
      clave, titulo: "Tasa de recuperación", subtitulo: `créditos aprobados en ${rango}`,
      resumen: [
        ["Tasa de recuperación", `${cartera.porcentaje} %`],
        ["Cobrado", dinero(cartera.cobrado)],
        ["Financiado", dinero(cartera.financiado)],
        ["Cobrados al 100 %", datos[3].cantidad],
        ["Sin ningún pago", datos[0].cantidad],
        ["Créditos analizados", cartera.registros.length],
      ],
      grafico: ({ seleccion, seleccionar }) => (
        <Barras datos={datos} clave="cantidad" ejeX="etiqueta" activo={seleccion?.clave} alClic={(d) => seleccionar({ clave: d.etiqueta, etiqueta: d.etiqueta })} />
      ),
      columnas: COLUMNAS.cartera, filas: cartera.registros, filtro: (f, s) => TRAMOS.find(([e]) => e === s.clave)[1](f),
    };
  }

  if (clave === "top") {
    const lider = top.ranking[0];
    return {
      clave, titulo: "Productos más financiados", subtitulo: `por unidades, ${rango}`,
      resumen: [
        ["Producto líder", lider?.producto ?? "—"],
        ["Unidades del líder", lider?.unidades ?? 0],
        ["Monto del líder", dinero(lider?.monto ?? 0)],
        ["Créditos del líder", lider?.creditos ?? 0],
        ["Productos en el ranking", top.ranking.length],
        ["Unidades del ranking", top.ranking.reduce((s, g) => s + g.unidades, 0)],
      ],
      grafico: ({ seleccion, seleccionar }) => (
        <Barras datos={top.ranking} clave="unidades" ejeX="producto" horizontal activo={seleccion?.clave}
          alClic={(d) => seleccionar({ clave: d.producto, etiqueta: d.producto })} />
      ),
      columnas: COLUMNAS.creditos, filas: top.registros, filtro: (f, s) => f.grupo === s.clave,
    };
  }

  if (clave === "stock") {
    return {
      clave, titulo: "Productos bajo el stock mínimo", subtitulo: `estado actual · aviso ≤ ${stock.aviso} · cierre ≤ ${stock.cierre}`,
      resumen: [
        ["Productos bajo mínimo", stock.total],
        ["Críticos", stock.critico],
        ["En aviso", stock.enAviso],
        ["Umbral de aviso", stock.aviso],
        ["Umbral de cierre", stock.cierre],
        ["Ya inactivos", cuenta(stock.registros, (r) => r.activo === "No")],
      ],
      grafico: ({ seleccion, seleccionar }) => (
        <Dona datos={paraDona([["Crítico", stock.critico], ["Aviso", stock.enAviso]])} colores={COLORES} activo={seleccion?.clave}
          alClic={(n) => seleccionar({ clave: n, etiqueta: n })} />
      ),
      columnas: COLUMNAS.stock, filas: stock.registros, filtro: (f, s) => f.grupo === s.clave,
    };
  }

  if (clave === "reclamos") {
    return {
      clave, titulo: "Reclamos pendientes y resueltos", subtitulo: rango,
      resumen: [
        ["Pendientes", reclamos.pendientes],
        ["Resueltos", reclamos.resueltos],
        ["Total del período", reclamos.total],
        ["% resueltos", `${reclamos.total ? Math.round((reclamos.resueltos / reclamos.total) * 100) : 0} %`],
        ["En revisión", cuenta(reclamos.registros, (r) => r.estado === "En revisión")],
        ["Sin revisar", cuenta(reclamos.registros, (r) => r.estado === "Pendiente")],
      ],
      grafico: ({ seleccion, seleccionar }) => (
        <Dona datos={paraDona([["Pendientes", reclamos.pendientes], ["Resueltos", reclamos.resueltos]])} colores={COLORES} activo={seleccion?.clave}
          alClic={(n) => seleccionar({ clave: n, etiqueta: n })} />
      ),
      columnas: COLUMNAS.reclamos, filas: reclamos.registros, filtro: (f, s) => f.grupo === s.clave,
    };
  }

  if (clave === "nuevos") {
    const mejor = mayor(nuevos.porMes, "cantidad");
    const plataformas = [...new Set(nuevos.registros.map((r) => r.plataforma))].filter((p) => p !== "—");
    return {
      clave, titulo: "Cuentas registradas por mes", subtitulo: rango,
      resumen: [
        ["Cuentas nuevas", nuevos.total],
        ["Promedio mensual", nuevos.porMes.length ? Math.round((nuevos.total / nuevos.porMes.length) * 10) / 10 : 0],
        ["Mes con más registros", mejor ? `${mejor.etiqueta} (${mejor.cantidad})` : "—"],
        ["Meses con registros", nuevos.porMes.length],
        ["Plataformas", plataformas.length ? plataformas.join(", ") : "—"],
      ],
      grafico: ({ seleccion, seleccionar }) => (
        <Barras datos={nuevos.porMes} clave="cantidad" ejeX="etiqueta" activo={seleccion?.clave}
          alClic={(d) => seleccionar({ clave: d.etiqueta, etiqueta: d.etiqueta, mes: d.mes })} />
      ),
      columnas: COLUMNAS.nuevos, filas: nuevos.registros, filtro: (f, s) => f.grupo === s.mes,
    };
  }

  // promociones
  return {
    clave, titulo: "Promociones por situación", subtitulo: "estado actual",
    resumen: [
      ["Vigentes", promociones.vigentes],
      ["Programadas", promociones.programadas],
      ["Vencidas", promociones.vencidas],
      ["Inactivas", promociones.inactivas],
      ["Total", promociones.total],
    ],
    nota: "El aprovechamiento de cada promoción no se mide: los créditos no guardan qué promoción se aplicó.",
    grafico: ({ seleccion, seleccionar }) => (
      <Dona datos={paraDona([["Vigente", promociones.vigentes], ["Programada", promociones.programadas], ["Vencida", promociones.vencidas], ["Inactiva", promociones.inactivas]])}
        colores={COLORES} activo={seleccion?.clave} alClic={(n) => seleccionar({ clave: n, etiqueta: n })} />
    ),
    columnas: COLUMNAS.promociones, filas: promociones.registros, filtro: (f, s) => f.grupo === s.clave,
  };
}

// Presentación pura del tablero: recibe los indicadores ya calculados (así se puede probar sin Firebase).
export function TableroGerencial({ ind, rango, controles }) {
  const [clave, setClave] = useState(null);
  const cerrar = useCallback(() => setClave(null), []);
  const detalle = useMemo(() => (clave ? detalleDe(clave, ind, rango) : null), [clave, ind, rango]);

  const { aprobados, cartera, stock, mensual, reclamos, top, nuevos, promociones } = ind;
  const lider = top.ranking[0];

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto xl:h-full xl:min-h-[640px] flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div>
          <h1 className="text-2xl font-black text-[#020817] tracking-tight">Dashboard gerencial</h1>
          <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mt-0.5 flex items-center gap-2">
            Créditos, cobros e inventario · {rango}
            <span className="inline-flex items-center gap-1 text-emerald-600"><Radio size={12} /> en vivo</span>
          </p>
        </div>
        {controles}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-[repeat(4,minmax(0,1fr))] xl:grid-rows-3 gap-4 xl:flex-1 xl:min-h-0">
        <TarjetaIndicador ancho categoria="Créditos" icono={BadgeCheck} valor={aprobados.cantidad} etiqueta="Créditos aprobados" sub={`${dinero(aprobados.monto)} financiados`} alClic={() => setClave("aprobados")}>
          <MiniArea datos={aprobados.porMes} clave="cantidad" />
        </TarjetaIndicador>

        <TarjetaIndicador categoria="Cartera" icono={Wallet} tono="morado" valor={dinero(cartera.saldo)} etiqueta="Saldo por cobrar" sub={pl(cartera.conSaldo.length, "crédito con saldo", "créditos con saldo")} alClic={() => setClave("saldo")}>
          <DonaConLeyenda datos={[{ name: "Cobrado", value: cartera.cobrado }, { name: "Por cobrar", value: cartera.saldo }]} colores={COLORES} formato={(v) => dinero(v)} apilado />
        </TarjetaIndicador>

        <TarjetaIndicador categoria="Cobranza" icono={Percent} tono="verde" valor={`${cartera.porcentaje} %`} etiqueta="Tasa de recuperación" sub="del monto financiado" alClic={() => setClave("recuperacion")}>
          <AnilloProgreso porcentaje={cartera.porcentaje} lineas={[["Cobrado", dinero(cartera.cobrado)], ["Financiado", dinero(cartera.financiado)]]} />
        </TarjetaIndicador>

        <TarjetaIndicador ancho categoria="Flujo" icono={ArrowLeftRight} valor={dinero(mensual.totalCobrado)} etiqueta="Monto cobrado" sub={`${dinero(mensual.totalDesembolsado)} desembolsados`} alClic={() => setClave("flujo")}>
          <MiniBarras datos={mensual.serie} series={[{ clave: "desembolsado", color: C.violeta }, { clave: "cobrado", color: C.lila }]} />
        </TarjetaIndicador>

        <TarjetaIndicador categoria="Inventario" icono={Boxes} tono="rojo" valor={stock.total} etiqueta="Bajo el stock mínimo" sub={`${stock.critico} críticos · ${stock.enAviso} en aviso`} alClic={() => setClave("stock")}>
          <DonaConLeyenda datos={[{ name: "Crítico", value: stock.critico }, { name: "Aviso", value: stock.enAviso }]} colores={COLORES} />
        </TarjetaIndicador>

        <TarjetaIndicador categoria="Atención" icono={MessageSquareWarning} tono="ambar" valor={reclamos.pendientes} etiqueta="Reclamos pendientes" sub={`${reclamos.total} en el período`} alClic={() => setClave("reclamos")}>
          <DonaConLeyenda datos={[{ name: "Pendientes", value: reclamos.pendientes }, { name: "Resueltos", value: reclamos.resueltos }]} colores={COLORES} />
        </TarjetaIndicador>

        <TarjetaIndicador ancho categoria="Productos" icono={ShoppingBag} valor={lider?.unidades ?? 0} etiqueta="Unidades del más financiado" sub={lider?.producto ?? "Sin créditos en el período"} alClic={() => setClave("top")}>
          <MiniRanking columnas={2} items={top.ranking.map((g) => ({ nombre: g.producto, valor: g.unidades }))} />
        </TarjetaIndicador>

        <TarjetaIndicador categoria="Usuarios" icono={UserPlus} valor={nuevos.total} etiqueta="Cuentas registradas" sub="en el período" alClic={() => setClave("nuevos")}>
          <MiniArea datos={nuevos.porMes} clave="cantidad" />
        </TarjetaIndicador>

        <TarjetaIndicador categoria="Promociones" icono={Tag} valor={promociones.vigentes} etiqueta="Promociones vigentes" sub={pl(promociones.total, "promoción en total", "promociones en total")} alClic={() => setClave("promociones")}>
          <DonaConLeyenda
            datos={[{ name: "Vigente", value: promociones.vigentes }, { name: "Programada", value: promociones.programadas }, { name: "Vencida", value: promociones.vencidas }, { name: "Inactiva", value: promociones.inactivas }]}
            colores={COLORES}
          />
        </TarjetaIndicador>
      </div>

      <DrawerDetalle detalle={detalle} alCerrar={cerrar} />
    </div>
  );
}

export default function DashboardGerencial() {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState("");
  const [preset, setPreset] = useState("todo");
  const [desdeTxt, setDesdeTxt] = useState("");
  const [hastaTxt, setHastaTxt] = useState("");

  useEffect(
    () =>
      escucharDatosGerenciales(
        (d) => {
          setDatos(d);
          setError("");
        },
        () => setError("No se pudieron leer los datos. Verifique que su rol tenga permiso de lectura."),
      ),
    [],
  );

  const periodo = useMemo(() => calcularPeriodo(preset, desdeTxt, hastaTxt), [preset, desdeTxt, hastaTxt]);
  const ind = useMemo(() => (datos ? calcularIndicadores(datos, periodo) : null), [datos, periodo]);

  if (error) return <p className="p-8 text-rose-600">{error}</p>;
  if (!ind)
    return (
      <div className="p-8 flex items-center gap-2 text-gray-500">
        <Loader2 className="animate-spin text-[#7C3AED]" size={18} /> Calculando indicadores...
      </div>
    );

  return (
    <TableroGerencial
      ind={ind}
      rango={textoPeriodo(periodo)}
      controles={<FiltroPeriodo preset={preset} setPreset={setPreset} desdeTxt={desdeTxt} setDesdeTxt={setDesdeTxt} hastaTxt={hastaTxt} setHastaTxt={setHastaTxt} />}
    />
  );
}
