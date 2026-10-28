import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Radio } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { Tarjeta, Panel, Dona, Barras } from "../../components/PanelesDashboard";
import ModalDetalle from "../../components/ModalDetalle";
import FiltroPeriodo from "../../components/FiltroPeriodo";
import { C, dato } from "../../helpers/graficos";
import { calcularPeriodo, textoPeriodo } from "../../helpers/periodo";
import { calcularIndicadoresTecnicos } from "../../helpers/kpisTecnicos";
import { TABLAS, resumirImportaciones } from "../../helpers/importacionExcel";
import { escucharDatosTecnicos } from "../../services/dashboardTecnicoService";

const LOG = [
  { clave: "fecha", etiqueta: "Fecha y hora", tipo: "fechahora" }, { clave: "usuario", etiqueta: "Usuario" }, { clave: "rol", etiqueta: "Rol" },
  { clave: "modulo", etiqueta: "Módulo" }, { clave: "accion", etiqueta: "Acción" }, { clave: "descripcion", etiqueta: "Descripción" },
];
const COLUMNAS = {
  log: LOG,
  activos: [
    { clave: "nombre", etiqueta: "Usuario" }, { clave: "id", etiqueta: "Correo" }, { clave: "rol", etiqueta: "Rol" },
    { clave: "modulo", etiqueta: "Último módulo" }, { clave: "accion", etiqueta: "Última acción" }, { clave: "fecha", etiqueta: "Hora", tipo: "fechahora" },
  ],
  roles: [
    { clave: "nombre", etiqueta: "Nombre" }, { clave: "correo", etiqueta: "Correo" }, { clave: "grupo", etiqueta: "Rol" },
    { clave: "plataforma", etiqueta: "Plataforma" }, { clave: "estado", etiqueta: "Estado" },
  ],
  operaciones: [
    { clave: "fecha", etiqueta: "Fecha y hora", tipo: "fechahora" }, { clave: "operacion", etiqueta: "Operación" }, { clave: "resultado", etiqueta: "Resultado" },
    { clave: "tipoError", etiqueta: "Tipo de error" }, { clave: "codigo", etiqueta: "Código" }, { clave: "duracionMs", etiqueta: "Duración (ms)" },
    { clave: "usuario", etiqueta: "Usuario" }, { clave: "mensaje", etiqueta: "Mensaje" },
  ],
  funciones: [
    { clave: "fecha", etiqueta: "Fecha y hora", tipo: "fechahora" }, { clave: "operacion", etiqueta: "Función" }, { clave: "grupo", etiqueta: "Resultado" },
    { clave: "referencia", etiqueta: "Crédito" }, { clave: "duracionMs", etiqueta: "Duración (ms)" }, { clave: "mensaje", etiqueta: "Mensaje" },
  ],
};

export default function DashboardTecnico() {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState("");
  const [preset, setPreset] = useState("todo");
  const [desdeTxt, setDesdeTxt] = useState("");
  const [hastaTxt, setHastaTxt] = useState("");
  const [operacion, setOperacion] = useState("todas");
  const [tablaImport, setTablaImport] = useState("todas");
  const [detalle, setDetalle] = useState(null);
  const [ahora, setAhora] = useState(() => new Date());

  useEffect(
    () =>
      escucharDatosTecnicos(
        (d) => {
          setDatos(d);
          setError("");
        },
        () => setError("No se pudieron leer los datos. Verifique que su rol tenga permiso de lectura."),
      ),
    [],
  );

  // "Activos en los últimos 5 minutos" depende del reloj, no solo de los datos
  useEffect(() => {
    const t = setInterval(() => setAhora(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const periodo = useMemo(() => calcularPeriodo(preset, desdeTxt, hastaTxt), [preset, desdeTxt, hastaTxt]);
  const ind = useMemo(() => (datos ? calcularIndicadoresTecnicos(datos, periodo, ahora, operacion) : null), [datos, periodo, ahora, operacion]);
  const cerrar = useCallback(() => setDetalle(null), []);

  if (error) return <p className="p-8 text-rose-600">{error}</p>;
  if (!ind)
    return (
      <div className="p-8 flex items-center gap-2 text-gray-500">
        <Loader2 className="animate-spin" size={18} /> Calculando indicadores...
      </div>
    );

  const abrir = (titulo, subtitulo, columnas, filas) => setDetalle({ titulo, subtitulo, columnas, filas });
  const rango = textoPeriodo(periodo);
  const { activos, roles, modulos, acciones, horas, fallidos, operaciones, funciones } = ind;
  const resumenImport = resumirImportaciones(datos.importaciones, tablaImport);
  const importaciones = datos.importaciones.filter((i) => tablaImport === "todas" || i.tabla === tablaImport).slice(0, 5);
  const etiquetaOp = operacion === "todas" ? "todas las operaciones" : operacion;
  const tarjetaImport = [["importaciones", "Importaciones", "#020817"], ["insertadas", "Filas insertadas", C.verde], ["actualizadas", "Filas actualizadas", C.morado], ["rechazadas", "Filas rechazadas", C.rojo], ["omitidas", "Omitidas por duplicidad", C.ambar]];

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-[#020817]">Dashboard técnico</h1>
          <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
            Uso y funcionamiento del sistema · período: {rango}
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-emerald-600"><Radio size={12} /> en vivo</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
            Operación
            <select value={operacion} onChange={(e) => setOperacion(e.target.value)} className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium normal-case tracking-normal text-[#020817]">
              <option value="todas">Todas</option>
              {operaciones.operaciones.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </label>
          <FiltroPeriodo preset={preset} setPreset={setPreset} desdeTxt={desdeTxt} setDesdeTxt={setDesdeTxt} hastaTxt={hastaTxt} setHastaTxt={setHastaTxt} />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <Tarjeta etiqueta="Usuarios activos" valor={activos.total} sub={`con una acción en los últimos ${activos.minutos} min`} color={C.verde}
          alClic={() => abrir("Usuarios activos", `últimos ${activos.minutos} minutos`, COLUMNAS.activos, activos.registros)} />
        <Tarjeta etiqueta="Cuentas habilitadas" valor={roles.total} sub={`${roles.porRol.length} roles`} color={C.morado}
          alClic={() => abrir("Cuentas habilitadas", "por rol principal", COLUMNAS.roles, roles.registros)} />
        <Tarjeta etiqueta="Operaciones registradas" valor={modulos.total} sub={`en ${modulos.porModulo.length} módulos`} color={C.azul}
          alClic={() => abrir("Operaciones registradas", rango, COLUMNAS.log, modulos.registros)} />
        <Tarjeta etiqueta="Errores de servidor" valor={`${operaciones.pctServidor} %`} sub={`${operaciones.erroresServidor} de ${operaciones.total} operaciones · ${operaciones.errores} con error en total`} color={C.rojo}
          alClic={() => abrir("Operaciones con error", `${etiquetaOp}, ${rango}`, COLUMNAS.operaciones, operaciones.registros.filter((r) => r.resultado === "Error"))} />
        <Tarjeta etiqueta="Tiempo de respuesta" valor={`${operaciones.latenciaPromedio} ms`} sub={`promedio · ${etiquetaOp}`} color={C.ambar}
          alClic={() => abrir("Operaciones medidas", `${etiquetaOp}, ${rango}`, COLUMNAS.operaciones, operaciones.registros)} />
        <Tarjeta etiqueta="Logins fallidos" valor={fallidos.total} sub="errores y accesos denegados" color={C.rojo}
          alClic={() => abrir("Intentos de acceso fallidos", rango, COLUMNAS.log, fallidos.registros)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel titulo="Cuentas habilitadas por rol" subtitulo="rol principal de cada cuenta" vacio={roles.porRol.length === 0}>
          <Barras datos={roles.porRol} clave="cantidad" color={C.morado} ejeX="rol" horizontal alClic={(d) => abrir(`Cuentas con rol ${d.rol}`, "cuentas habilitadas", COLUMNAS.roles, roles.registros.filter((r) => r.grupo === d.rol))} />
        </Panel>

        <Panel titulo="Actividad por módulo" subtitulo={`operaciones registradas, ${rango}`} vacio={modulos.porModulo.length === 0}>
          <Barras datos={modulos.porModulo} clave="cantidad" color={C.azul} ejeX="modulo" horizontal alClic={(d) => abrir(`Actividad en ${d.modulo}`, rango, COLUMNAS.log, modulos.registros.filter((r) => r.grupo === d.modulo))} />
        </Panel>

        <Panel titulo="Acciones por tipo" subtitulo={rango} vacio={acciones.porAccion.length === 0}>
          <Barras datos={acciones.porAccion} clave="cantidad" color={C.morado} ejeX="accion" horizontal alClic={(d) => abrir(`Acción ${d.accion}`, rango, COLUMNAS.log, acciones.registros.filter((r) => r.grupo === d.accion))} />
        </Panel>

        <Panel titulo="Horas pico de actividad" subtitulo={`registros por hora del día${horas.horaPico ? ` · pico a las ${horas.horaPico}` : ""}, ${rango}`} vacio={horas.total === 0}>
          <Barras datos={horas.porHora} clave="cantidad" color={C.verde} intervalo={2} alClic={(d) => abrir(`Actividad a las ${d.etiqueta}`, rango, COLUMNAS.log, horas.registros.filter((r) => r.grupo === d.hora))} />
        </Panel>

        <Panel titulo="Logins fallidos por día" subtitulo={rango} vacio={fallidos.porDia.length === 0}>
          <Barras datos={fallidos.porDia} clave="cantidad" color={C.rojo} alClic={(d) => abrir(`Accesos fallidos del ${d.etiqueta}`, "errores y accesos denegados", COLUMNAS.log, fallidos.registros.filter((r) => r.grupo === d.dia))} />
        </Panel>

        <Panel titulo="Operaciones medidas: éxito y error" subtitulo={`por operación, ${rango}`} vacio={operaciones.porOperacion.length === 0}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={operaciones.porOperacion}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="operacion" fontSize={11} />
              <YAxis fontSize={11} allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar name="Éxito" dataKey="exitos" stackId="a" fill={C.verde} onClick={(e) => abrir(`${dato(e).operacion}: éxitos`, rango, COLUMNAS.operaciones, operaciones.registros.filter((r) => r.operacion === dato(e).operacion && r.resultado === "Éxito"))} />
              <Bar name="Error" dataKey="errores" stackId="a" fill={C.rojo} radius={[6, 6, 0, 0]} onClick={(e) => abrir(`${dato(e).operacion}: errores`, rango, COLUMNAS.operaciones, operaciones.registros.filter((r) => r.operacion === dato(e).operacion && r.resultado === "Error"))} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel titulo="Tiempo promedio de respuesta (ms)" subtitulo={`por operación, ${rango}`} vacio={operaciones.porOperacion.length === 0}>
          <Barras datos={operaciones.porOperacion} clave="promedioMs" color={C.ambar} ejeX="operacion" formato={(v) => `${v} ms`} alClic={(d) => abrir(`Mediciones de ${d.operacion}`, rango, COLUMNAS.operaciones, operaciones.registros.filter((r) => r.operacion === d.operacion))} />
        </Panel>

        <Panel titulo="Ejecuciones de Cloud Functions" subtitulo={`descontarStockAlAprobar, ${rango}`} vacio={funciones.total === 0}>
          <Dona
            datos={[["Éxito", funciones.exitos], ["Fallo", funciones.fallos]].filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }))}
            colores={{ Éxito: C.verde, Fallo: C.rojo }}
            alClic={(n) => abrir(`Ejecuciones: ${n.toLowerCase()}`, rango, COLUMNAS.funciones, funciones.registros.filter((r) => r.grupo === n))}
          />
        </Panel>
      </div>

      <div className="bg-white border border-gray-100 rounded-[1.5rem] p-6 mt-6 shadow-[0_2px_20px_rgb(0,0,0,0.04)]">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="text-base font-black text-[#020817]">Resultados de importaciones Excel</h3>
            <p className="text-xs text-gray-400">Filas procesadas por cada archivo importado.</p>
          </div>
          <select value={tablaImport} onChange={(e) => setTablaImport(e.target.value)} className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-medium">
            <option value="todas">Todas las tablas</option>
            {Object.entries(TABLAS).map(([clave, t]) => <option key={clave} value={clave}>{t.etiqueta}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
          {tarjetaImport.map(([clave, etiqueta, color]) => (
            <div key={clave} className="bg-[#F8F9FF] border border-gray-100 rounded-xl p-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{etiqueta}</p>
              <p className="text-3xl font-black mt-1" style={{ color }}>{resumenImport[clave]}</p>
            </div>
          ))}
        </div>
        <div className="overflow-x-auto border border-gray-100 rounded-xl">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-[10px] uppercase tracking-widest text-gray-400">
              <tr>{["Fecha", "Tabla", "Archivo", "Insertadas", "Actualizadas", "Rechazadas", "Omitidas"].map((h) => <th key={h} className="text-left px-4 py-2">{h}</th>)}</tr>
            </thead>
            <tbody>
              {importaciones.length === 0 && <tr><td colSpan={7} className="px-4 py-4 text-gray-400">Sin importaciones para este filtro.</td></tr>}
              {importaciones.map((i) => (
                <tr key={i.id} className="border-t border-gray-50">
                  <td className="px-4 py-2">{i.fecha?.toDate?.().toLocaleString("es-HN") ?? "—"}</td>
                  <td className="px-4 py-2">{TABLAS[i.tabla]?.etiqueta ?? i.tabla}</td>
                  <td className="px-4 py-2">{i.archivo}</td>
                  <td className="px-4 py-2">{i.insertadas}</td>
                  <td className="px-4 py-2">{i.actualizadas ?? 0}</td>
                  <td className="px-4 py-2">{i.rechazadas}</td>
                  <td className="px-4 py-2">{i.omitidas}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ModalDetalle detalle={detalle} alCerrar={cerrar} />
    </div>
  );
}
