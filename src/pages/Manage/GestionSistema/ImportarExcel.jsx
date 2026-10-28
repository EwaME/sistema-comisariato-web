import { useEffect, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { FileSpreadsheet, Download, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { useAuth } from "../../../auth/AuthProvider";
import ModalConflictos from "../../../components/ModalConflictos";
import { TABLAS } from "../../../helpers/importacionExcel";
import { EJEMPLOS } from "../../../helpers/ejemplosImportacion";
import {
  leerExcel,
  simularImportacion,
  ejecutarImportacion,
  obtenerImportaciones,
} from "../../../services/importacionesService";

const MAX_FILAS_VISIBLES = 50;

function Cifra({ etiqueta, valor, color }) {
  return (
    <div className="bg-[#F8F9FF] border border-gray-100 rounded-xl p-4">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{etiqueta}</p>
      <p className={`text-3xl font-black mt-1 ${color}`}>{valor}</p>
    </div>
  );
}

function Cifras({ r }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
      <Cifra etiqueta="Filas leídas" valor={r.totalFilas} color="text-[#020817]" />
      <Cifra etiqueta="Insertadas" valor={r.insertadas} color="text-emerald-600" />
      {Array.isArray(r.conflictos) ? (
        <Cifra etiqueta="Conflictos" valor={r.conflictos.length} color="text-orange-500" />
      ) : (
        <Cifra etiqueta="Actualizadas" valor={r.actualizadas ?? 0} color="text-violet-600" />
      )}
      <Cifra etiqueta="Rechazadas" valor={r.rechazadas.length ?? r.rechazadas} color="text-rose-600" />
      <Cifra etiqueta="Omitidas (duplicadas)" valor={r.omitidas.length ?? r.omitidas} color="text-amber-600" />
    </div>
  );
}

function TablaMotivos({ titulo, filas }) {
  if (!filas?.length) return null;
  return (
    <div className="mb-4">
      <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">
        {titulo} ({filas.length})
      </p>
      <div className="overflow-x-auto border border-gray-100 rounded-xl">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-[10px] uppercase tracking-widest text-gray-400">
            <tr>
              <th className="text-left px-4 py-2">Fila Excel</th>
              <th className="text-left px-4 py-2">ID</th>
              <th className="text-left px-4 py-2">Motivo</th>
            </tr>
          </thead>
          <tbody>
            {filas.slice(0, MAX_FILAS_VISIBLES).map((f) => (
              <tr key={`${f.fila}-${f.id}`} className="border-t border-gray-50">
                <td className="px-4 py-2">{f.fila}</td>
                <td className="px-4 py-2 font-mono text-xs">{f.id || "—"}</td>
                <td className="px-4 py-2 text-gray-600">{f.motivo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filas.length > MAX_FILAS_VISIBLES && (
        <p className="text-xs text-gray-400 mt-1">Se muestran las primeras {MAX_FILAS_VISIBLES} filas.</p>
      )}
    </div>
  );
}

export default function ImportarExcel() {
  const { user } = useAuth();
  const inputRef = useRef(null);
  const [tabla, setTabla] = useState("productos");
  const [archivo, setArchivo] = useState(null);
  const [filas, setFilas] = useState([]);
  const [vista, setVista] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [historial, setHistorial] = useState([]);
  const [recarga, setRecarga] = useState(0);
  const [seleccion, setSeleccion] = useState(new Set());
  const [verConflictos, setVerConflictos] = useState(false);

  useEffect(() => {
    let activo = true;
    obtenerImportaciones(10)
      .then((lista) => activo && setHistorial(lista))
      .catch((e) => console.error("Error al cargar importaciones:", e));
    return () => {
      activo = false;
    };
  }, [recarga]);

  const reiniciar = () => {
    setArchivo(null);
    setFilas([]);
    setVista(null);
    setSeleccion(new Set());
    if (inputRef.current) inputRef.current.value = "";
  };

  const cambiarTabla = (nueva) => {
    setTabla(nueva);
    setResultado(null);
    setError("");
    reiniciar();
  };

  const descargarPlantilla = () => {
    const cabeceras = TABLAS[tabla].columnas.map((c) => c.clave);
    const hoja = XLSX.utils.json_to_sheet([EJEMPLOS[tabla][0]], { header: cabeceras, cellDates: true });
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, tabla);
    XLSX.writeFile(libro, `plantilla_${tabla}.xlsx`, { cellDates: true });
  };

  const alElegirArchivo = async (e) => {
    const elegido = e.target.files?.[0];
    if (!elegido) return;
    setCargando(true);
    setError("");
    setResultado(null);
    try {
      const datos = await leerExcel(elegido);
      if (!datos.length) throw new Error("El archivo no tiene filas de datos.");
      setVista(await simularImportacion(tabla, datos));
      setArchivo(elegido);
      setFilas(datos);
    } catch (err) {
      reiniciar();
      setError(err.message || "No se pudo leer el archivo.");
    } finally {
      setCargando(false);
    }
  };

  const confirmar = async () => {
    setCargando(true);
    setError("");
    try {
      const r = await ejecutarImportacion({ tabla, filas, archivo: archivo.name, correo: user?.email || "", actualizar: [...seleccion] });
      setResultado(r);
      reiniciar();
      setRecarga((n) => n + 1);
    } catch (err) {
      setError(err.message || "No se pudo completar la importación.");
    } finally {
      setCargando(false);
    }
  };

  const def = TABLAS[tabla];

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto min-h-screen">
      <div className="bg-white rounded-[2rem] shadow-[0_2px_20px_rgb(0,0,0,0.04)] border border-gray-50 p-6 md:p-10">
        <div className="mb-8">
          <h1 className="text-[28px] font-black text-[#020817] leading-tight flex items-center gap-3">
            <FileSpreadsheet className="text-[#7C3AED]" /> Importar desde Excel
          </h1>
          <p className="text-sm font-medium text-gray-400 mt-1">
            Carga masiva de productos, créditos históricos y pagos. Cada archivo se valida antes de guardarse.
          </p>
        </div>

        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">1. Elija la tabla</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {Object.entries(TABLAS).map(([clave, t]) => (
            <button
              key={clave}
              onClick={() => cambiarTabla(clave)}
              className={`px-5 py-3 rounded-xl text-[11px] font-bold uppercase tracking-widest border transition-colors ${
                tabla === clave ? "bg-[#020817] text-white border-[#020817]" : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
              }`}
            >
              {t.etiqueta}
            </button>
          ))}
        </div>
        <p className="text-sm text-gray-500 mb-3">
          Columnas:{" "}
          {def.columnas.map((c) => (
            <code key={c.clave} className="mr-2 text-xs bg-gray-50 px-1.5 py-0.5 rounded">
              {c.clave}
              {c.requerido ? "*" : ""}
            </code>
          ))}
          <span className="text-xs text-gray-400">(* obligatoria; fechas en dd/mm/aaaa o aaaa-mm-dd)</span>
        </p>
        <button
          onClick={descargarPlantilla}
          className="flex items-center gap-2 px-5 py-3 bg-white border border-gray-200 text-[#020817] rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-gray-50 transition-colors shadow-sm mb-8"
        >
          <Download size={14} /> Descargar plantilla
        </button>

        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">2. Suba el archivo</p>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={alElegirArchivo}
          disabled={cargando}
          className="block text-sm text-gray-500 mb-8 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-[11px] file:font-bold file:uppercase file:bg-[#7C3AED] file:text-white"
        />

        {cargando && (
          <p className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <Loader2 className="animate-spin" size={16} /> Procesando...
          </p>
        )}
        {error && (
          <p className="flex items-center gap-2 text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-xl p-3 mb-4">
            <AlertTriangle size={16} /> {error}
          </p>
        )}

        {vista && (
          <div className="mb-10">
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">
              3. Vista previa de {archivo?.name} (aún no se guardó nada)
            </p>
            <Cifras r={vista} />
            <TablaMotivos titulo="Filas rechazadas" filas={vista.rechazadas} />
            <TablaMotivos titulo="Filas omitidas" filas={vista.omitidas} />
            {vista.conflictos.length > 0 && (
              <div className="flex flex-wrap items-center gap-3 bg-orange-50 border border-orange-100 rounded-xl p-4 mb-4">
                <AlertTriangle size={18} className="text-orange-500" />
                <p className="text-sm text-orange-800 flex-1">
                  {vista.conflictos.length} {vista.conflictos.length === 1 ? "registro ya existe" : "registros ya existen"} con datos distintos.
                  Por defecto se conserva el dato actual; {seleccion.size} marcados para actualizar.
                </p>
                <button onClick={() => setVerConflictos(true)} className="px-5 py-2.5 bg-white border border-orange-200 text-orange-700 rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-orange-100">
                  Revisar conflictos
                </button>
              </div>
            )}
            <button
              onClick={confirmar}
              disabled={cargando || vista.insertadas + seleccion.size === 0}
              className="px-6 py-3 bg-[#7C3AED] text-white rounded-xl text-[11px] font-bold uppercase tracking-widest disabled:opacity-40"
            >
              Confirmar e importar {vista.insertadas} {vista.insertadas === 1 ? "fila" : "filas"}
              {seleccion.size > 0 && ` y actualizar ${seleccion.size}`}
            </button>
            <ModalConflictos abierto={verConflictos} conflictos={vista.conflictos} seleccion={seleccion} setSeleccion={setSeleccion} alCerrar={() => setVerConflictos(false)} />
          </div>
        )}

        {resultado && (
          <div className="mb-10">
            <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest mb-2 text-emerald-600">
              <CheckCircle2 size={14} /> Importación {resultado.estado === "ERROR" ? "con error" : "completada"} (ID {resultado.importacionId})
            </p>
            <Cifras r={resultado} />
            {resultado.error && <p className="text-sm text-rose-600 mb-2">{resultado.error} — filas sin procesar: {resultado.noProcesadas}. Puede repetir el archivo sin duplicar.</p>}
            <TablaMotivos titulo="Filas rechazadas" filas={resultado.rechazadasDetalle} />
          </div>
        )}

        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Últimas importaciones</p>
        <div className="overflow-x-auto border border-gray-100 rounded-xl">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-[10px] uppercase tracking-widest text-gray-400">
              <tr>
                {["Fecha", "Tabla", "Archivo", "Usuario", "Filas", "Insertadas", "Actualizadas", "Rechazadas", "Omitidas"].map((h) => (
                  <th key={h} className="text-left px-4 py-2">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {historial.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-4 text-gray-400">Aún no hay importaciones.</td></tr>
              )}
              {historial.map((i) => (
                <tr key={i.id} className="border-t border-gray-50">
                  <td className="px-4 py-2">{i.fecha?.toDate?.().toLocaleString("es-HN") ?? "—"}</td>
                  <td className="px-4 py-2">{TABLAS[i.tabla]?.etiqueta ?? i.tabla}</td>
                  <td className="px-4 py-2">{i.archivo}</td>
                  <td className="px-4 py-2">{i.usuario}</td>
                  <td className="px-4 py-2">{i.totalFilas}</td>
                  <td className="px-4 py-2 text-emerald-600 font-bold">{i.insertadas}</td>
                  <td className="px-4 py-2 text-violet-600 font-bold">{i.actualizadas ?? 0}</td>
                  <td className="px-4 py-2 text-rose-600 font-bold">{i.rechazadas}</td>
                  <td className="px-4 py-2 text-amber-600 font-bold">{i.omitidas}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
