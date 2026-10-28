import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Radio } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { Tarjeta, Panel, Dona, Barras } from "../../components/PanelesDashboard";
import { C, dato } from "../../helpers/graficos";
import ModalDetalle from "../../components/ModalDetalle";
import { formatearDinero } from "../../helpers/formatoDinero";
import { escucharDatosGerenciales } from "../../services/dashboardGerencialService";
import { calcularIndicadores } from "../../helpers/kpisGerenciales";
import { calcularPeriodo, textoPeriodo } from "../../helpers/periodo";
import FiltroPeriodo from "../../components/FiltroPeriodo";


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

const etiquetaDe = (d) => d.etiqueta;

export default function DashboardGerencial() {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState("");
  const [preset, setPreset] = useState("todo");
  const [desdeTxt, setDesdeTxt] = useState("");
  const [hastaTxt, setHastaTxt] = useState("");
  const [detalle, setDetalle] = useState(null);

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
  const cerrar = useCallback(() => setDetalle(null), []);

  const abrir = (titulo, subtitulo, columnas, filas) => setDetalle({ titulo, subtitulo, columnas, filas });
  const rango = textoPeriodo(periodo);

  if (error) return <p className="p-8 text-rose-600">{error}</p>;
  if (!ind)
    return (
      <div className="p-8 flex items-center gap-2 text-gray-500">
        <Loader2 className="animate-spin" size={18} /> Calculando indicadores...
      </div>
    );

  const { aprobados, cartera, stock, mensual, reclamos, top, nuevos, promociones } = ind;
  const colorEstado = { Pendientes: C.ambar, Resueltos: C.verde, "Crítico": C.rojo, Aviso: C.ambar, Cobrado: C.verde, "Por cobrar": C.azul, Vigente: C.verde, Vencida: C.rojo, Inactiva: C.gris, Programada: C.azul };
  const dona = (pares) => pares.filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }));

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-[#020817]">Dashboard gerencial</h1>
          <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
            Créditos, cobros e inventario · período: {rango}
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-emerald-600"><Radio size={12} /> en vivo</span>
          </p>
        </div>
        <FiltroPeriodo preset={preset} setPreset={setPreset} desdeTxt={desdeTxt} setDesdeTxt={setDesdeTxt} hastaTxt={hastaTxt} setHastaTxt={setHastaTxt} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <Tarjeta etiqueta="Créditos aprobados" valor={aprobados.cantidad} sub={`${formatearDinero(aprobados.monto)} financiados`} color={C.morado}
          alClic={() => abrir("Créditos aprobados", rango, COLUMNAS.creditos, aprobados.registros)} />
        <Tarjeta etiqueta="Saldo por cobrar" valor={formatearDinero(cartera.saldo)} sub={`${cartera.conSaldo.length} ${cartera.conSaldo.length === 1 ? "crédito" : "créditos"} con saldo`} color={C.azul}
          alClic={() => abrir("Créditos con saldo por cobrar", rango, COLUMNAS.cartera, cartera.conSaldo)} />
        <Tarjeta etiqueta="Tasa de recuperación" valor={`${cartera.porcentaje} %`} sub={`${formatearDinero(cartera.cobrado)} de ${formatearDinero(cartera.financiado)}`} color={C.verde}
          alClic={() => abrir("Recuperación por crédito", rango, COLUMNAS.cartera, cartera.registros)} />
        <Tarjeta etiqueta="Productos bajo mínimo" valor={stock.total} sub={`${stock.critico} críticos · ${stock.enAviso} en aviso`} color={C.rojo}
          alClic={() => abrir("Productos bajo el stock mínimo", `aviso ≤ ${stock.aviso} · cierre ≤ ${stock.cierre}`, COLUMNAS.stock, stock.registros)} />
        <Tarjeta etiqueta="Reclamos pendientes" valor={reclamos.pendientes} sub={`${reclamos.total} reclamos en el período`} color={C.ambar}
          alClic={() => abrir("Reclamos pendientes", rango, COLUMNAS.reclamos, reclamos.registros.filter((r) => r.grupo === "Pendientes"))} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel titulo="Monto cobrado y desembolsado por mes" subtitulo={`L., ${rango}`} vacio={mensual.serie.length === 0}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mensual.serie}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="etiqueta" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip formatter={(v) => formatearDinero(v)} />
              <Legend />
              <Bar name="Desembolsado" dataKey="desembolsado" fill={C.azul} radius={[6, 6, 0, 0]}
                onClick={(e) => abrir("Créditos desembolsados", etiquetaDe(dato(e)), COLUMNAS.mensual, mensual.registros.filter((r) => r.grupo === dato(e).mes && r.tipo === "Desembolso"))} />
              <Bar name="Cobrado" dataKey="cobrado" fill={C.verde} radius={[6, 6, 0, 0]}
                onClick={(e) => abrir("Pagos cobrados", etiquetaDe(dato(e)), COLUMNAS.mensual, mensual.registros.filter((r) => r.grupo === dato(e).mes && r.tipo === "Cobro"))} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel titulo="Créditos aprobados por mes" subtitulo={`cantidad, ${rango}`} vacio={aprobados.porMes.length === 0}>
          <Barras datos={aprobados.porMes} clave="cantidad" color={C.morado}
            alClic={(d) => abrir("Créditos aprobados", d.etiqueta, COLUMNAS.creditos, aprobados.registros.filter((r) => r.grupo === d.mes))} />
        </Panel>

        <Panel titulo="Productos más financiados" subtitulo={`unidades, ${rango}`} vacio={top.ranking.length === 0}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={top.ranking} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" fontSize={11} allowDecimals={false} />
              <YAxis type="category" dataKey="producto" width={150} fontSize={11} />
              <Tooltip />
              <Bar name="Unidades" dataKey="unidades" fill={C.morado} radius={[0, 6, 6, 0]}
                onClick={(e) => abrir(`Créditos de ${dato(e).producto}`, rango, COLUMNAS.creditos, top.registros.filter((r) => r.grupo === dato(e).producto))} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel titulo="Cartera: cobrado frente a por cobrar" subtitulo={`L., créditos aprobados en ${rango}`} vacio={cartera.financiado === 0}>
          <Dona datos={dona([["Cobrado", cartera.cobrado], ["Por cobrar", cartera.saldo]])} colores={colorEstado} formato={(v) => formatearDinero(v)}
            alClic={(n) => abrir(`Cartera: ${n}`, rango, COLUMNAS.cartera, n === "Cobrado" ? cartera.conPagos : cartera.conSaldo)} />
        </Panel>

        <Panel titulo="Reclamos pendientes y resueltos" subtitulo={rango} vacio={reclamos.total === 0}>
          <Dona datos={dona([["Pendientes", reclamos.pendientes], ["Resueltos", reclamos.resueltos]])} colores={colorEstado}
            alClic={(n) => abrir(`Reclamos ${n.toLowerCase()}`, rango, COLUMNAS.reclamos, reclamos.registros.filter((r) => r.grupo === n))} />
        </Panel>

        <Panel titulo="Productos bajo el stock mínimo" subtitulo="estado actual" vacio={stock.total === 0}>
          <Dona datos={dona([["Crítico", stock.critico], ["Aviso", stock.enAviso]])} colores={colorEstado}
            alClic={(n) => abrir(`Stock en nivel ${n.toLowerCase()}`, "estado actual", COLUMNAS.stock, stock.registros.filter((r) => r.grupo === n))} />
        </Panel>

        <Panel titulo="Nuevas cuentas registradas por mes" subtitulo={rango} vacio={nuevos.porMes.length === 0}>
          <Barras datos={nuevos.porMes} clave="cantidad" color={C.azul}
            alClic={(d) => abrir("Cuentas registradas", d.etiqueta, COLUMNAS.nuevos, nuevos.registros.filter((r) => r.grupo === d.mes))} />
        </Panel>

        <Panel titulo="Promociones por situación" subtitulo="estado actual; el aprovechamiento no se mide (los créditos no guardan la promoción)" vacio={promociones.total === 0}>
          <Dona datos={dona([["Vigente", promociones.vigentes], ["Vencida", promociones.vencidas], ["Inactiva", promociones.inactivas], ["Programada", promociones.programadas]])} colores={colorEstado}
            alClic={(n) => abrir(`Promociones: ${n.toLowerCase()}`, "estado actual", COLUMNAS.promociones, promociones.registros.filter((r) => r.grupo === n))} />
        </Panel>
      </div>

      <ModalDetalle detalle={detalle} alCerrar={cerrar} />
    </div>
  );
}

