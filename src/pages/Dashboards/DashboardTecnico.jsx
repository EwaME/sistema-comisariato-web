import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Radio, Users, UserCheck, Layers, Clock3, ShieldAlert, MousePointerClick, ServerCrash, Timer, Cloud, FileSpreadsheet } from "lucide-react";
import { TarjetaIndicador, MiniBarras, DonaConLeyenda, MiniRanking, MiniLista, Dona, Barras, BarrasDobles } from "../../components/PanelesDashboard";
import DrawerDetalle from "../../components/DrawerDetalle";
import FiltroPeriodo from "../../components/FiltroPeriodo";
import { C, paraDona } from "../../helpers/graficos";
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
  importaciones: [
    { clave: "fecha", etiqueta: "Fecha y hora", tipo: "fechahora" }, { clave: "tabla", etiqueta: "Tabla" }, { clave: "archivo", etiqueta: "Archivo" },
    { clave: "usuario", etiqueta: "Usuario" }, { clave: "insertadas", etiqueta: "Insertadas" }, { clave: "actualizadas", etiqueta: "Actualizadas" },
    { clave: "rechazadas", etiqueta: "Rechazadas" }, { clave: "omitidas", etiqueta: "Omitidas" },
  ],
};

const COLORES = { Éxito: C.verde, Fallo: C.rojo, Insertadas: C.morado, Actualizadas: C.lila, Rechazadas: C.rojo, Omitidas: C.gris, Error: C.rojo };

const mayor = (lista, clave) => lista.reduce((m, x) => (!m || x[clave] > m[clave] ? x : m), null);
const menor = (lista, clave) => lista.reduce((m, x) => (!m || x[clave] < m[clave] ? x : m), null);
const distintos = (lista, clave) => new Set(lista.map((r) => r[clave])).size;
const promedio = (lista, clave) => (lista.length ? Math.round(lista.reduce((s, r) => s + (Number(r[clave]) || 0), 0) / lista.length) : 0);
const fechaHora = (d) => (d instanceof Date ? d.toLocaleString("es-HN") : "—");
const pl = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;
const top = (lista, clave) => {
  const g = mayor(lista, "cantidad");
  return g ? `${g[clave]} (${g.cantidad})` : "—";
};

// Arma el contenido del drawer de cada tarjeta a partir de los indicadores ya calculados.
function detalleDe(clave, { ind, importaciones, rango, etiquetaOp }) {
  const { activos, roles, modulos, acciones, horas, fallidos, operaciones, funciones } = ind;
  const sel = (d, campo, etiqueta) => ({ clave: d[campo], etiqueta: etiqueta ?? d[campo] });

  if (clave === "activos") {
    const porModulo = {};
    activos.registros.forEach((r) => (porModulo[r.modulo] = (porModulo[r.modulo] || 0) + 1));
    const modulo = Object.entries(porModulo).sort((a, b) => b[1] - a[1])[0];
    return {
      clave, titulo: "Usuarios activos", subtitulo: `últimos ${activos.minutos} minutos`,
      resumen: [["Activos ahora", activos.total], ["Ventana de medición", `${activos.minutos} min`], ["Módulo más usado", modulo ? `${modulo[0]} (${modulo[1]})` : "—"], ["Última actividad", activos.registros[0] ? fechaHora(activos.registros[0].fecha) : "—"]],
      columnas: COLUMNAS.activos, filas: activos.registros,
    };
  }

  if (clave === "roles") {
    const plataformas = {};
    roles.registros.forEach((r) => (plataformas[r.plataforma] = (plataformas[r.plataforma] || 0) + 1));
    return {
      clave, titulo: "Cuentas habilitadas por rol", subtitulo: "rol principal de cada cuenta",
      resumen: [["Cuentas habilitadas", roles.total], ["Roles distintos", roles.porRol.length], ["Rol con más cuentas", top(roles.porRol, "rol")], ["Plataformas", Object.entries(plataformas).map(([p, n]) => `${p} ${n}`).join(" · ") || "—"]],
      grafico: ({ seleccion, seleccionar }) => <Barras datos={roles.porRol} clave="cantidad" ejeX="rol" horizontal activo={seleccion?.clave} alClic={(d) => seleccionar(sel(d, "rol"))} />,
      columnas: COLUMNAS.roles, filas: roles.registros, filtro: (f, s) => f.grupo === s.clave,
    };
  }

  if (clave === "modulos") {
    return {
      clave, titulo: "Actividad por módulo", subtitulo: `operaciones registradas, ${rango}`,
      resumen: [["Operaciones", modulos.total], ["Módulos con actividad", modulos.porModulo.length], ["Módulo más activo", top(modulos.porModulo, "modulo")], ["Usuarios distintos", distintos(modulos.registros, "correo")], ["Último movimiento", modulos.registros[0] ? fechaHora(modulos.registros[0].fecha) : "—"]],
      grafico: ({ seleccion, seleccionar }) => <Barras datos={modulos.porModulo} clave="cantidad" ejeX="modulo" horizontal activo={seleccion?.clave} alClic={(d) => seleccionar(sel(d, "modulo"))} />,
      columnas: COLUMNAS.log, filas: modulos.registros, filtro: (f, s) => f.grupo === s.clave,
    };
  }

  if (clave === "horas") {
    const laboral = horas.porHora.filter((h) => Number(h.hora) >= 8 && Number(h.hora) < 18).reduce((s, h) => s + h.cantidad, 0);
    const pico = mayor(horas.porHora, "cantidad");
    return {
      clave, titulo: "Horas pico de actividad", subtitulo: `registros por hora del día, ${rango}`,
      resumen: [["Registros", horas.total], ["Hora pico", horas.horaPico ?? "—"], ["Registros en la hora pico", pico?.cantidad ?? 0], ["Horas con actividad", cuentaHoras(horas.porHora)], ["En horario 08:00 a 17:59", `${horas.total ? Math.round((laboral / horas.total) * 100) : 0} %`]],
      grafico: ({ seleccion, seleccionar }) => <Barras datos={horas.porHora} clave="cantidad" ejeX="etiqueta" intervalo={2} activo={seleccion?.clave} alClic={(d) => seleccionar({ clave: d.etiqueta, etiqueta: d.etiqueta, hora: d.hora })} />,
      columnas: COLUMNAS.log, filas: horas.registros, filtro: (f, s) => f.grupo === s.hora,
    };
  }

  if (clave === "fallidos") {
    const denegados = fallidos.registros.filter((r) => r.accion === "ACCESO DENEGADO").length;
    const dia = mayor(fallidos.porDia, "cantidad");
    return {
      clave, titulo: "Intentos de acceso fallidos", subtitulo: `errores y accesos denegados, ${rango}`,
      resumen: [["Intentos fallidos", fallidos.total], ["Accesos denegados", denegados], ["Errores de acceso", fallidos.total - denegados], ["Cuentas distintas", distintos(fallidos.registros, "correo")], ["Día con más intentos", dia ? `${dia.etiqueta} (${dia.cantidad})` : "—"]],
      grafico: ({ seleccion, seleccionar }) => <Barras datos={fallidos.porDia} clave="cantidad" ejeX="etiqueta" color={C.rojo} activo={seleccion?.clave} alClic={(d) => seleccionar({ clave: d.etiqueta, etiqueta: d.etiqueta, dia: d.dia })} />,
      columnas: COLUMNAS.log, filas: fallidos.registros, filtro: (f, s) => f.grupo === s.dia,
    };
  }

  if (clave === "acciones") {
    return {
      clave, titulo: "Acciones por tipo", subtitulo: rango,
      resumen: [["Acciones registradas", acciones.total], ["Tipos de acción", acciones.porAccion.length], ["Más frecuente", top(acciones.porAccion, "accion")], ["Usuarios distintos", distintos(acciones.registros, "correo")]],
      grafico: ({ seleccion, seleccionar }) => <Barras datos={acciones.porAccion} clave="cantidad" ejeX="accion" horizontal activo={seleccion?.clave} alClic={(d) => seleccionar(sel(d, "accion"))} />,
      columnas: COLUMNAS.log, filas: acciones.registros, filtro: (f, s) => f.grupo === s.clave,
    };
  }

  if (clave === "errores") {
    const conErrores = mayor(operaciones.porOperacion, "errores");
    const tipo = (t) => operaciones.registros.filter((r) => r.tipoError === t).length;
    return {
      clave, titulo: "Errores de servidor", subtitulo: `${etiquetaOp}, ${rango}`,
      resumen: [["Operaciones medidas", operaciones.total], ["Errores de servidor", `${operaciones.erroresServidor} (${operaciones.pctServidor} %)`], ["Errores en total", `${operaciones.errores} (${operaciones.pctErrores} %)`], ["Errores de cliente", tipo("cliente")], ["Errores de la aplicación", tipo("aplicacion")], ["Operación con más errores", conErrores?.errores ? `${conErrores.operacion} (${conErrores.errores})` : "—"]],
      grafico: ({ seleccionar }) => (
        <BarrasDobles datos={operaciones.porOperacion} ejeX="operacion" apilado
          series={[{ clave: "exitos", nombre: "Éxito", color: C.lila }, { clave: "errores", nombre: "Error", color: C.rojo }]}
          alClic={(s, d) => seleccionar({ clave: `${d.operacion}-${s.clave}`, etiqueta: `${d.operacion}: ${s.nombre.toLowerCase()}`, operacion: d.operacion, resultado: s.nombre })} />
      ),
      columnas: COLUMNAS.operaciones, filas: operaciones.registros, filtro: (f, s) => f.operacion === s.operacion && f.resultado === s.resultado,
    };
  }

  if (clave === "latencia") {
    const lenta = mayor(operaciones.porOperacion, "promedioMs");
    const rapida = menor(operaciones.porOperacion, "promedioMs");
    return {
      clave, titulo: "Tiempo de respuesta", subtitulo: `${etiquetaOp}, ${rango}`,
      resumen: [["Promedio general", `${operaciones.latenciaPromedio} ms`], ["Mediciones", operaciones.total], ["Más lenta", lenta ? `${lenta.operacion} (${lenta.promedioMs} ms)` : "—"], ["Más rápida", rapida ? `${rapida.operacion} (${rapida.promedioMs} ms)` : "—"], ["Máximo registrado", `${operaciones.registros.reduce((m, r) => Math.max(m, r.duracionMs), 0)} ms`]],
      grafico: ({ seleccion, seleccionar }) => <Barras datos={operaciones.porOperacion} clave="promedioMs" ejeX="operacion" formato={(v) => `${v} ms`} activo={seleccion?.clave} alClic={(d) => seleccionar(sel(d, "operacion"))} />,
      columnas: COLUMNAS.operaciones, filas: operaciones.registros, filtro: (f, s) => f.operacion === s.clave,
    };
  }

  if (clave === "funciones") {
    return {
      clave, titulo: "Ejecuciones de Cloud Functions", subtitulo: `descontarStockAlAprobar, ${rango}`,
      resumen: [["Ejecuciones", funciones.total], ["Con éxito", funciones.exitos], ["Con fallo", funciones.fallos], ["Duración promedio", `${promedio(funciones.registros, "duracionMs")} ms`], ["Última ejecución", funciones.registros[0] ? fechaHora(funciones.registros[0].fecha) : "—"]],
      grafico: ({ seleccion, seleccionar }) => <Dona datos={paraDona([["Éxito", funciones.exitos], ["Fallo", funciones.fallos]])} colores={COLORES} activo={seleccion?.clave} alClic={(n) => seleccionar({ clave: n, etiqueta: n })} />,
      columnas: COLUMNAS.funciones, filas: funciones.registros, filtro: (f, s) => f.grupo === s.clave,
    };
  }

  // importaciones
  const resumen = resumirImportaciones(importaciones, "todas");
  const porTabla = Object.entries(TABLAS).map(([k, t]) => ({ tabla: k, etiqueta: t.etiqueta, cantidad: importaciones.filter((i) => i.tabla === k).length }));
  const filas = importaciones.map((i) => ({ id: i.id, grupo: i.tabla, fecha: i.fecha?.toDate?.() ?? null, tabla: TABLAS[i.tabla]?.etiqueta ?? i.tabla, archivo: i.archivo, usuario: i.usuario, insertadas: i.insertadas, actualizadas: i.actualizadas ?? 0, rechazadas: i.rechazadas, omitidas: i.omitidas }));
  return {
    clave, titulo: "Importaciones desde Excel", subtitulo: "filas procesadas por cada archivo importado",
    resumen: [["Importaciones", resumen.importaciones], ["Filas insertadas", resumen.insertadas], ["Filas actualizadas", resumen.actualizadas], ["Filas rechazadas", resumen.rechazadas], ["Omitidas por duplicidad", resumen.omitidas], ["Con error", importaciones.filter((i) => i.estado === "ERROR").length]],
    grafico: ({ seleccion, seleccionar }) => <Barras datos={porTabla} clave="cantidad" ejeX="etiqueta" activo={seleccion?.clave} alClic={(d) => seleccionar({ clave: d.etiqueta, etiqueta: d.etiqueta, tabla: d.tabla })} />,
    columnas: COLUMNAS.importaciones, filas, filtro: (f, s) => f.grupo === s.tabla,
  };
}

const cuentaHoras = (porHora) => porHora.filter((h) => h.cantidad > 0).length;

// Presentación pura del tablero: recibe los indicadores ya calculados (así se puede probar sin Firebase).
export function TableroTecnico({ ind, importaciones, rango, etiquetaOp, controles }) {
  const [clave, setClave] = useState(null);
  const cerrar = useCallback(() => setClave(null), []);
  const detalle = useMemo(() => (clave ? detalleDe(clave, { ind, importaciones, rango, etiquetaOp }) : null), [clave, ind, importaciones, rango, etiquetaOp]);

  const { activos, roles, modulos, acciones, horas, fallidos, operaciones, funciones } = ind;
  const resumenImport = resumirImportaciones(importaciones, "todas");
  const ranking = (lista, nombre) => lista.map((x) => ({ nombre: x[nombre], valor: x.cantidad }));

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto xl:h-full xl:min-h-[640px] flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div>
          <h1 className="text-2xl font-black text-[#020817] tracking-tight">Dashboard técnico</h1>
          <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mt-0.5 flex items-center gap-2">
            Uso y funcionamiento del sistema · {rango}
            <span className="inline-flex items-center gap-1 text-emerald-600"><Radio size={12} /> en vivo</span>
          </p>
        </div>
        {controles}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-[repeat(4,minmax(0,1fr))] xl:grid-rows-3 gap-4 xl:flex-1 xl:min-h-0">
        <TarjetaIndicador categoria="Sesiones" icono={Users} tono="verde" valor={activos.total} etiqueta="Usuarios activos" sub={`últimos ${activos.minutos} minutos`} alClic={() => setClave("activos")}>
          <MiniLista items={activos.registros.map((r) => ({ nombre: r.nombre, detalle: r.modulo }))} />
        </TarjetaIndicador>

        <TarjetaIndicador categoria="Cuentas" icono={UserCheck} valor={roles.total} etiqueta="Cuentas habilitadas" sub={pl(roles.porRol.length, "rol", "roles")} alClic={() => setClave("roles")}>
          <MiniRanking items={ranking(roles.porRol, "rol")} max={2} />
        </TarjetaIndicador>

        <TarjetaIndicador ancho categoria="Actividad" icono={Layers} valor={modulos.total} etiqueta="Operaciones registradas" sub={`en ${pl(modulos.porModulo.length, "módulo", "módulos")}`} alClic={() => setClave("modulos")}>
          <MiniRanking columnas={2} items={ranking(modulos.porModulo, "modulo")} />
        </TarjetaIndicador>

        <TarjetaIndicador ancho categoria="Actividad" icono={Clock3} valor={horas.horaPico ?? "—"} etiqueta="Hora pico" sub="registros por hora del día" alClic={() => setClave("horas")}>
          <MiniBarras datos={horas.porHora} series={[{ clave: "cantidad", color: C.lilaClaro }]} colorDe={(d) => (horas.horaPico && d.etiqueta === horas.horaPico ? C.morado : C.lilaClaro)} />
        </TarjetaIndicador>

        <TarjetaIndicador categoria="Seguridad" icono={ShieldAlert} tono="rojo" valor={fallidos.total} etiqueta="Logins fallidos" sub="errores y accesos denegados" alClic={() => setClave("fallidos")}>
          <MiniBarras datos={fallidos.porDia} series={[{ clave: "cantidad", color: C.rojo }]} />
        </TarjetaIndicador>

        <TarjetaIndicador categoria="Actividad" icono={MousePointerClick} valor={acciones.porAccion.length} etiqueta="Tipos de acción" sub={`${acciones.total} acciones registradas`} alClic={() => setClave("acciones")}>
          <MiniRanking items={ranking(acciones.porAccion, "accion")} max={2} />
        </TarjetaIndicador>

        <TarjetaIndicador categoria="Rendimiento" icono={ServerCrash} tono="rojo" valor={`${operaciones.pctServidor} %`} etiqueta="Errores de servidor" sub={`${operaciones.erroresServidor} de ${operaciones.total} operaciones`} alClic={() => setClave("errores")}>
          <DonaConLeyenda datos={[{ name: "Éxito", value: operaciones.exitos }, { name: "Error", value: operaciones.errores }]} colores={COLORES} />
        </TarjetaIndicador>

        <TarjetaIndicador categoria="Rendimiento" icono={Timer} tono="ambar" valor={`${operaciones.latenciaPromedio} ms`} etiqueta="Tiempo de respuesta" sub={`promedio · ${etiquetaOp}`} alClic={() => setClave("latencia")}>
          <MiniBarras datos={operaciones.porOperacion} series={[{ clave: "promedioMs", color: C.lila }]} />
        </TarjetaIndicador>

        <TarjetaIndicador categoria="Servidor" icono={Cloud} valor={funciones.total} etiqueta="Cloud Functions" sub="descontarStockAlAprobar" alClic={() => setClave("funciones")}>
          <DonaConLeyenda datos={[{ name: "Éxito", value: funciones.exitos }, { name: "Fallo", value: funciones.fallos }]} colores={COLORES} />
        </TarjetaIndicador>

        <TarjetaIndicador categoria="Datos" icono={FileSpreadsheet} valor={resumenImport.importaciones} etiqueta="Importaciones Excel" sub={`${resumenImport.insertadas} filas insertadas`} alClic={() => setClave("importaciones")}>
          <DonaConLeyenda
            datos={[{ name: "Insertadas", value: resumenImport.insertadas }, { name: "Actualizadas", value: resumenImport.actualizadas }, { name: "Rechazadas", value: resumenImport.rechazadas }, { name: "Omitidas", value: resumenImport.omitidas }]}
            colores={COLORES}
          />
        </TarjetaIndicador>
      </div>

      <DrawerDetalle detalle={detalle} alCerrar={cerrar} />
    </div>
  );
}

export default function DashboardTecnico() {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState("");
  const [preset, setPreset] = useState("todo");
  const [desdeTxt, setDesdeTxt] = useState("");
  const [hastaTxt, setHastaTxt] = useState("");
  const [operacion, setOperacion] = useState("todas");
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

  if (error) return <p className="p-8 text-rose-600">{error}</p>;
  if (!ind)
    return (
      <div className="p-8 flex items-center gap-2 text-gray-500">
        <Loader2 className="animate-spin text-[#7C3AED]" size={18} /> Calculando indicadores...
      </div>
    );

  return (
    <TableroTecnico
      ind={ind}
      importaciones={datos.importaciones}
      rango={textoPeriodo(periodo)}
      etiquetaOp={operacion === "todas" ? "todas las operaciones" : operacion}
      controles={
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
            Operación
            <select value={operacion} onChange={(e) => setOperacion(e.target.value)} className="bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-medium normal-case tracking-normal text-[#020817]">
              <option value="todas">Todas</option>
              {ind.operaciones.operaciones.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </label>
          <FiltroPeriodo preset={preset} setPreset={setPreset} desdeTxt={desdeTxt} setDesdeTxt={setDesdeTxt} hastaTxt={hastaTxt} setHastaTxt={setHastaTxt} />
        </div>
      }
    />
  );
}
