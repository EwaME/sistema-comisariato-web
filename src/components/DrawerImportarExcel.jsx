import { useEffect, useRef, useState } from "react";
import { getAuth, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { toast } from "sonner";
import { X, FileSpreadsheet, Download, Upload, Loader2, CheckCircle2, AlertTriangle, KeyRound, ShieldCheck, ArrowLeft, ScanSearch } from "lucide-react";
import ResolucionConflictos from "./ResolucionConflictos";
import LineaAnalisis from "./LineaAnalisis";
import { TABLAS, verificarEncabezados } from "../helpers/importacionExcel";
import { PASOS_ANALISIS, evaluarPaso } from "../helpers/analisisImportacion";
import { useAuth } from "../auth/AuthProvider";
import { leerExcel, simularImportacion, ejecutarImportacion, descargarPlantilla } from "../services/importacionesService";

const PASOS = ["Archivo", "Análisis", "Autorizar"];
const PAUSA_MS = 650; // tiempo mínimo por paso para que el avance se vea paso a paso

const pausa = (ms) => new Promise((r) => setTimeout(r, ms));
const pasosIniciales = () => PASOS_ANALISIS.map((p) => ({ ...p, estado: "pendiente", mensaje: "", hallazgos: [] }));

const textoErrorAuth = (e) => {
  if (e?.code === "auth/too-many-requests") return "Demasiados intentos. Espere unos minutos e inténtelo de nuevo.";
  if (e?.code === "auth/network-request-failed") return "Sin conexión. Verifique su red e inténtelo de nuevo.";
  return "Contraseña incorrecta. Inténtelo de nuevo.";
};

function Pasos({ actual }) {
  return (
    <ol className="flex items-center gap-2 px-6 py-4 border-b border-gray-100 bg-[#F8F9FF]">
      {PASOS.map((p, i) => {
        const hecho = i < actual;
        const activo = i === actual;
        return (
          <li key={p} className="flex items-center gap-2 flex-1 last:flex-none">
            <span
              className={`w-6 h-6 rounded-full text-[11px] font-black flex items-center justify-center shrink-0 ${
                hecho ? "bg-emerald-500 text-white" : activo ? "bg-[#7C3AED] text-white" : "bg-gray-200 text-gray-400"
              }`}
            >
              {hecho ? "✓" : i + 1}
            </span>
            <span className={`text-[10px] font-bold uppercase tracking-widest ${activo ? "text-[#020817]" : "text-gray-400"}`}>{p}</span>
            {i < PASOS.length - 1 && <span className="flex-1 h-px bg-gray-200" />}
          </li>
        );
      })}
    </ol>
  );
}

// Importación desde Excel dentro de un módulo: misma validación y misma bitácora que la pantalla central,
// pero registrada bajo `modulo` y con reautenticación obligatoria antes de escribir en la base de datos.
export default function DrawerImportarExcel({ abierto, alCerrar, tablas, modulo }) {
  const { user } = useAuth();
  const inputRef = useRef(null);
  const ejecucion = useRef(0); // identifica el análisis en curso; al cambiarlo, el anterior se abandona
  const [entrado, setEntrado] = useState(false);
  const [tabla, setTabla] = useState(tablas[0]);
  const [fase, setFase] = useState("carga"); // carga | analisis | password
  const [archivo, setArchivo] = useState(null);
  const [filas, setFilas] = useState([]);
  const [encabezados, setEncabezados] = useState(null);
  const [pasos, setPasos] = useState([]);
  const [vista, setVista] = useState(null);
  const [seleccion, setSeleccion] = useState(new Set());
  const resumenRef = useRef(null);
  const [password, setPassword] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!abierto) {
      setEntrado(false);
      return undefined;
    }
    const cuadro = requestAnimationFrame(() => setEntrado(true));
    return () => cancelAnimationFrame(cuadro);
  }, [abierto]);

  const reiniciarAnalisis = () => {
    ejecucion.current += 1;
    setPasos([]);
    setVista(null);
    setSeleccion(new Set());
  };

  const reiniciarArchivo = () => {
    reiniciarAnalisis();
    setArchivo(null);
    setFilas([]);
    setEncabezados(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  // Al terminar el análisis, la vista baja hasta el resumen (y los conflictos, si los hay).
  useEffect(() => {
    if (!vista) return undefined;
    const t = setTimeout(() => {
      const reducido = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      resumenRef.current?.scrollIntoView({ behavior: reducido ? "auto" : "smooth", block: "start" });
    }, 350);
    return () => clearTimeout(t);
  }, [vista]);

  const restablecer = () => {
    reiniciarArchivo();
    setError("");
    setPassword("");
    setFase("carga");
    setTabla(tablas[0]);
  };

  const cerrar = () => {
    if (cargando) return;
    restablecer();
    alCerrar();
  };

  useEffect(() => {
    if (!abierto) return undefined;
    const alTeclear = (e) => e.key === "Escape" && cerrar();
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  });

  if (!abierto) return null;

  const cambiarTabla = (nueva) => {
    setTabla(nueva);
    setError("");
    reiniciarArchivo();
  };

  // Solo lee el archivo y compara encabezados: no consulta la base de datos hasta pulsar "Analizar".
  const alElegirArchivo = async (e) => {
    const elegido = e.target.files?.[0];
    if (!elegido) return;
    setCargando(true);
    setError("");
    reiniciarAnalisis();
    try {
      const datos = await leerExcel(elegido);
      if (!datos.length) throw new Error("El archivo no tiene filas de datos.");
      setArchivo(elegido);
      setFilas(datos);
      setEncabezados(verificarEncabezados(tabla, datos));
    } catch (err) {
      reiniciarArchivo();
      setError(err.message || "No se pudo leer el archivo.");
    } finally {
      setCargando(false);
    }
  };

  // Recorre los pasos uno por uno, como una promesa por paso: cargando → ok / aviso / error.
  // La simulación real (que consulta el sistema) arranca de inmediato y el paso que la necesita la espera.
  const iniciarAnalisis = async () => {
    const id = ++ejecucion.current;
    const vigente = () => id === ejecucion.current;
    const actualizar = (i, cambios) => setPasos((prev) => prev.map((p, k) => (k === i ? { ...p, ...cambios } : p)));

    setError("");
    setVista(null);
    setSeleccion(new Set());
    setPasos(pasosIniciales());
    setFase("analisis");

    const simulacion = simularImportacion(tabla, filas);
    simulacion.catch(() => {}); // el error se muestra en el paso que la espera
    let simulado = null;

    for (let i = 0; i < PASOS_ANALISIS.length; i++) {
      const paso = PASOS_ANALISIS[i];
      actualizar(i, { estado: "cargando" });
      try {
        const [datos] = await Promise.all([paso.consultaSistema ? simulacion : null, pausa(PAUSA_MS)]);
        if (!vigente()) return;
        if (paso.consultaSistema) simulado = datos;
        actualizar(i, evaluarPaso(paso.id, { nombreArchivo: archivo.name, totalFilas: filas.length, encabezados, resultado: simulado }));
      } catch (err) {
        if (!vigente()) return;
        actualizar(i, { estado: "error", mensaje: "No se pudo completar el análisis", hallazgos: [{ fila: 0, id: "", campo: "", mensaje: err.message || "Error al consultar el sistema", nivel: "error" }] });
        return;
      }
    }
    if (vigente()) setVista(simulado);
  };

  const volverAlArchivo = () => {
    reiniciarAnalisis();
    setError("");
    setFase("carga");
  };

  const irAConfirmar = () => {
    setPassword("");
    setError("");
    setFase("password");
  };

  // La reautenticación va primero: si falla no se toca la base de datos y el error se muestra aquí mismo.
  // Al terminar, el drawer se cierra y el resultado se avisa con un toast.
  const confirmarEImportar = async () => {
    setCargando(true);
    setError("");
    let actual;
    try {
      actual = getAuth().currentUser;
      if (!actual?.email) throw new Error("No hay usuario en sesión.");
      await reauthenticateWithCredential(actual, EmailAuthProvider.credential(actual.email, password));
    } catch (errAuth) {
      setError(textoErrorAuth(errAuth));
      setPassword("");
      setCargando(false);
      return;
    }

    const etiqueta = TABLAS[tabla].etiqueta;
    try {
      const r = await ejecutarImportacion({
        tabla,
        filas,
        archivo: archivo.name,
        correo: user?.email || actual.email,
        actualizar: [...seleccion],
        modulo,
      });
      if (r.estado === "ERROR") {
        toast.error(`Importación de ${etiqueta.toLowerCase()} con error`, {
          description: `${r.error} — ${r.insertadas} insertadas, ${r.noProcesadas} sin procesar. Puede repetir el archivo sin duplicar.`,
        });
      } else {
        const partes = [`${r.insertadas} ${r.insertadas === 1 ? "insertada" : "insertadas"}`];
        if (r.actualizadas) partes.push(`${r.actualizadas} ${r.actualizadas === 1 ? "actualizada" : "actualizadas"}`);
        if (r.rechazadas) partes.push(`${r.rechazadas} ${r.rechazadas === 1 ? "rechazada" : "rechazadas"}`);
        toast.success(`Importación de ${etiqueta.toLowerCase()} completada`, { description: partes.join(", ") });
      }
    } catch (err) {
      toast.error(`No se pudo importar ${etiqueta.toLowerCase()}`, { description: err.message });
    } finally {
      setCargando(false);
      restablecer();
      alCerrar();
    }
  };

  const def = TABLAS[tabla];
  const incompatible = encabezados ? !encabezados.compatible : false;
  const analizando = fase === "analisis" && !vista && pasos.some((p) => p.estado === "pendiente" || p.estado === "cargando");
  const aImportar = vista ? vista.insertadas + seleccion.size : 0;
  const pasoActual = fase === "password" ? 2 : fase === "analisis" ? 1 : 0;

  return (
    <div className="fixed inset-0 z-[90]" role="dialog" aria-modal="true" aria-label="Importar desde Excel">
      <div
        className={`absolute inset-0 bg-[#020817]/50 backdrop-blur-sm transition-opacity duration-300 ${entrado ? "opacity-100" : "opacity-0"}`}
        onClick={cerrar}
      />
      <aside
        className={`absolute right-0 top-0 h-full w-full sm:max-w-xl lg:max-w-2xl bg-white shadow-2xl flex flex-col border-l border-gray-200 border-t-4 border-t-[#7C3AED] overflow-hidden transition-transform duration-300 ease-out ${
          entrado ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="flex items-start justify-between gap-4 p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-black text-[#020817] flex items-center gap-3">
              <FileSpreadsheet className="text-[#7C3AED]" size={22} /> Importar desde Excel
            </h2>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mt-1">{modulo}</p>
          </div>
          <button onClick={cerrar} aria-label="Cerrar" className="p-2 rounded-xl hover:bg-gray-100 text-gray-400">
            <X size={18} />
          </button>
        </header>

        <Pasos actual={pasoActual} />

        <div className="flex-1 overflow-y-auto p-6">
          {fase === "carga" && (
            <>
              {tablas.length > 1 && (
                <section className="mb-6">
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Tabla a importar</p>
                  <div className="flex flex-wrap gap-2">
                    {tablas.map((clave) => (
                      <button
                        key={clave}
                        onClick={() => cambiarTabla(clave)}
                        disabled={cargando}
                        className={`px-5 py-3 rounded-xl text-[11px] font-bold uppercase tracking-widest border transition-colors ${
                          tabla === clave ? "bg-[#020817] text-white border-[#020817]" : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        {TABLAS[clave].etiqueta}
                      </button>
                    ))}
                  </div>
                </section>
              )}

              <section className="bg-[#F8F9FF] border border-gray-100 rounded-2xl p-4 mb-6">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Plantilla</p>
                <p className="text-sm text-gray-500 mb-3">
                  Columnas:{" "}
                  {def.columnas.map((c) => (
                    <code key={c.clave} className="mr-1.5 text-xs bg-white border border-gray-100 px-1.5 py-0.5 rounded inline-block mb-1">
                      {c.clave}
                      {c.requerido ? "*" : ""}
                    </code>
                  ))}
                  <span className="block text-xs text-gray-400">(* obligatoria; fechas en dd/mm/aaaa o aaaa-mm-dd)</span>
                </p>
                <button
                  onClick={() => descargarPlantilla(tabla)}
                  className="flex items-center gap-2 px-5 py-3 bg-white border border-gray-200 text-[#020817] rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-gray-50 transition-colors shadow-sm"
                >
                  <Download size={14} /> Descargar plantilla de {def.etiqueta.toLowerCase()}
                </button>
              </section>

              <section className="mb-4">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Archivo</p>
                <label className="flex items-center gap-3 border-2 border-dashed border-gray-200 hover:border-[#7C3AED] rounded-2xl p-5 cursor-pointer transition-colors">
                  <Upload size={18} className="text-[#7C3AED]" />
                  <span className="text-sm font-medium text-gray-500 truncate">{archivo ? archivo.name : "Seleccione un archivo .xlsx o .xls"}</span>
                  <input ref={inputRef} type="file" accept=".xlsx,.xls" onChange={alElegirArchivo} disabled={cargando} className="hidden" />
                </label>
                {archivo && !incompatible && (
                  <p className="flex items-center gap-2 text-xs text-emerald-600 font-semibold mt-2">
                    <CheckCircle2 size={14} /> {filas.length} {filas.length === 1 ? "fila leída" : "filas leídas"}. Aún no se guardó nada.
                  </p>
                )}
              </section>

              {cargando && (
                <p className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                  <Loader2 className="animate-spin" size={16} /> Leyendo archivo...
                </p>
              )}
              {error && (
                <p className="flex items-center gap-2 text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-xl p-3 mb-4">
                  <AlertTriangle size={16} /> {error}
                </p>
              )}

              {incompatible && (
                <div role="alert" className="flex flex-col items-center text-center bg-rose-50 rounded-2xl py-8 px-4">
                  <span className="w-12 h-12 rounded-full bg-rose-500 text-white flex items-center justify-center mb-3">
                    <X size={26} strokeWidth={3} />
                  </span>
                  <p className="text-base font-black text-rose-700">El archivo no es compatible</p>
                  <p className="text-xs text-rose-600 mt-1">Use las columnas de la plantilla de {def.etiqueta.toLowerCase()}.</p>
                </div>
              )}
            </>
          )}

          {fase === "analisis" && (
            <>
              <div className="mb-6">
                <h3 className="text-lg font-extrabold text-[#020817] flex items-center gap-2">
                  <ScanSearch size={18} className="text-[#7C3AED]" /> Análisis de {archivo?.name}
                </h3>
                <p className="text-xs text-gray-400 mt-1">Se revisa fila por fila; cada hallazgo indica la fila del Excel y el campo. Aún no se guarda nada.</p>
              </div>

              <LineaAnalisis pasos={pasos} />

              {vista && (
                <div ref={resumenRef} className="mt-8 pt-6 scroll-mt-4">
                  <p className={`text-sm font-bold rounded-lg px-3 py-2.5 mb-6 ${vista.rechazadas.length === 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                    {vista.rechazadas.length === 0
                      ? `Sin errores: ${vista.insertadas} ${vista.insertadas === 1 ? "fila lista" : "filas listas"} para importar.`
                      : `${vista.rechazadas.length} ${vista.rechazadas.length === 1 ? "fila con errores no se importará" : "filas con errores no se importarán"}${vista.insertadas > 0 ? `; ${vista.insertadas} sí.` : "."}`}
                  </p>
                  {vista.conflictos.length > 0 && <ResolucionConflictos conflictos={vista.conflictos} seleccion={seleccion} setSeleccion={setSeleccion} />}
                </div>
              )}
            </>
          )}

          {fase === "password" && (
            <div className="max-w-md mx-auto text-center pt-6">
              <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center shadow-md mx-auto mb-4 border border-purple-100">
                <ShieldCheck className="w-8 h-8 text-[#7C3AED]" />
              </div>
              <h3 className="text-lg font-extrabold text-[#020817]">Confirmar importación</h3>
              <p className="text-[12px] font-medium text-purple-600 mt-2 mb-5 leading-relaxed">
                Se insertarán {vista?.insertadas ?? 0} {def.etiqueta.toLowerCase()}
                {seleccion.size > 0 && ` y se actualizarán ${seleccion.size}`}. Ingrese su contraseña para autorizar la operación.
              </p>
              <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-widest mb-2">Autenticación requerida</label>
              <div className="relative mb-2">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  autoFocus
                  autoComplete="current-password"
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && password && !cargando && confirmarEImportar()}
                  placeholder="Su contraseña..."
                  className="w-full text-center bg-[#F8F9FF] border border-gray-200 text-sm font-bold pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] transition-all"
                />
              </div>
              {error && <p className="text-[11px] font-semibold text-red-500">{error}</p>}
            </div>
          )}
        </div>

        <footer className="flex items-center gap-3 p-4 border-t border-gray-100 bg-white">
          {fase === "carga" && (
            <>
              <button onClick={cerrar} disabled={cargando} className="flex-1 bg-white border border-gray-200 text-gray-600 text-[11px] font-bold py-3 rounded-xl hover:bg-gray-50 transition-colors tracking-widest uppercase disabled:opacity-50">
                Cancelar
              </button>
              <button
                onClick={iniciarAnalisis}
                disabled={cargando || !archivo || incompatible}
                className="flex-[2] bg-[#7C3AED] text-white text-[11px] font-bold py-3 rounded-xl hover:bg-purple-700 transition-colors tracking-widest uppercase disabled:opacity-40 flex items-center justify-center gap-2"
              >
                <ScanSearch size={14} />
                {!archivo ? "Suba un archivo para analizar" : incompatible ? "Archivo no compatible" : "Analizar archivo"}
              </button>
            </>
          )}
          {fase === "analisis" && (
            <>
              <button onClick={volverAlArchivo} className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-600 text-[11px] font-bold py-3 rounded-xl hover:bg-gray-50 transition-colors tracking-widest uppercase">
                <ArrowLeft size={14} /> Volver
              </button>
              <button
                onClick={irAConfirmar}
                disabled={analizando || !vista || aImportar === 0}
                className="flex-[2] bg-[#7C3AED] text-white text-[11px] font-bold py-3 rounded-xl hover:bg-purple-700 transition-colors tracking-widest uppercase disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {analizando && <Loader2 size={14} className="animate-spin" />}
                {analizando
                  ? "Analizando..."
                  : vista
                    ? `Continuar: importar ${vista.insertadas} ${vista.insertadas === 1 ? "fila" : "filas"}${seleccion.size > 0 ? ` y actualizar ${seleccion.size}` : ""}`
                    : "Análisis interrumpido"}
              </button>
            </>
          )}
          {fase === "password" && (
            <>
              <button onClick={() => setFase("analisis")} disabled={cargando} className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-600 text-[11px] font-bold py-3 rounded-xl hover:bg-gray-50 transition-colors tracking-widest uppercase disabled:opacity-50">
                <ArrowLeft size={14} /> Volver
              </button>
              <button
                onClick={confirmarEImportar}
                disabled={!password || cargando}
                className={`flex-[2] text-white text-[11px] font-bold py-3 rounded-xl shadow-md transition-all tracking-widest uppercase flex items-center justify-center gap-2 ${
                  !password || cargando ? "bg-purple-300 cursor-not-allowed opacity-70 shadow-none" : "bg-[#7C3AED] hover:bg-purple-700 shadow-[#7C3AED]/20"
                }`}
              >
                {cargando && <Loader2 className="w-4 h-4 animate-spin" />}
                {cargando ? "Importando..." : "Confirmar e importar"}
              </button>
            </>
          )}
        </footer>
      </aside>
    </div>
  );
}
