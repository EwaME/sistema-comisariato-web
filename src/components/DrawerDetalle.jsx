import { useEffect, useMemo, useState } from "react";
import { X, Search } from "lucide-react";
import { formatearDinero } from "../helpers/formatoDinero";

const fechaCorta = new Intl.DateTimeFormat("es-HN", { day: "2-digit", month: "2-digit", year: "numeric" });
const POR_PAGINA = 50;

function celda(valor, tipo) {
  if (valor === null || valor === undefined || valor === "") return "—";
  if (tipo === "dinero") return formatearDinero(valor);
  if (tipo === "porcentaje") return `${valor} %`;
  if (tipo === "fecha") return valor instanceof Date ? fechaCorta.format(valor) : String(valor);
  if (tipo === "fechahora") return valor instanceof Date ? valor.toLocaleString("es-HN") : String(valor);
  return String(valor);
}

// detalle = {
//   clave, titulo, subtitulo,
//   resumen?: [[etiqueta, valor], ...]            cifras que complementan la tarjeta
//   grafico?: ({ seleccion, seleccionar }) => nodo gráfico completo; al pulsar un elemento llama a seleccionar({ clave, etiqueta })
//   columnas, filas, filtro?: (fila, seleccion) => boolean
// }
function Contenido({ detalle, alCerrar }) {
  const { titulo, subtitulo, resumen = [], grafico, columnas, filas, filtro, nota } = detalle;
  const [seleccion, setSeleccion] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [limite, setLimite] = useState(POR_PAGINA);

  const seleccionar = (s) => {
    setSeleccion((actual) => (!s || actual?.clave === s.clave ? null : s));
    setLimite(POR_PAGINA);
  };

  const visibles = useMemo(() => {
    const base = seleccion && filtro ? filas.filter((f) => filtro(f, seleccion)) : filas;
    const t = busqueda.trim().toLowerCase();
    if (!t) return base;
    return base.filter((f) => columnas.some((c) => celda(f[c.clave], c.tipo).toLowerCase().includes(t)));
  }, [filas, columnas, filtro, seleccion, busqueda]);

  const sumas = columnas.filter((c) => c.tipo === "dinero").map((c) => [c.etiqueta, visibles.reduce((s, f) => s + (Number(f[c.clave]) || 0), 0)]);

  return (
    <>
      <header className="flex items-start justify-between gap-4 p-6 border-b border-gray-100">
        <div className="min-w-0">
          <h2 className="text-xl font-black text-[#020817] truncate">{titulo}</h2>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mt-1">{subtitulo}</p>
        </div>
        <button onClick={alCerrar} aria-label="Cerrar" className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 shrink-0">
          <X size={18} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto">
        {resumen.length > 0 && (
          <section className="px-6 pt-6">
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3">Resumen</p>
            <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
              {resumen.map(([etiqueta, valor]) => (
                <div key={etiqueta} className="min-w-0">
                  <dt className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">{etiqueta}</dt>
                  <dd className="text-base font-extrabold text-[#020817] truncate" title={String(valor)}>{valor}</dd>
                </div>
              ))}
            </dl>
            {nota && <p className="text-xs text-gray-400 mt-4">{nota}</p>}
          </section>
        )}

        {grafico && (
          <section className="px-6 pt-6">
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1">Gráfico</p>
            {filtro && <p className="text-xs text-gray-400 mb-3">Seleccione un elemento para filtrar el listado de abajo.</p>}
            <div className="h-64">{grafico({ seleccion, seleccionar })}</div>
          </section>
        )}

        <section className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
              Registros ({visibles.length})
            </p>
            <label className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={busqueda}
                onChange={(e) => { setBusqueda(e.target.value); setLimite(POR_PAGINA); }}
                placeholder="Buscar..."
                aria-label="Buscar en los registros"
                className="bg-[#F8F9FF] border border-gray-200 text-xs font-medium pl-8 pr-3 py-2 rounded-xl w-48 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
              />
            </label>
          </div>

          {seleccion && (
            <button onClick={() => seleccionar(null)} className="mb-3 inline-flex items-center gap-1.5 bg-purple-100 text-purple-700 text-[11px] font-bold rounded-full pl-3 pr-2 py-1">
              Filtrado por: {seleccion.etiqueta} <X size={12} />
            </button>
          )}

          {visibles.length === 0 ? (
            <p className="text-sm text-gray-400 py-6">No hay registros para esta selección.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-[10px] uppercase tracking-widest text-gray-400">
                  <tr>
                    {columnas.map((c) => (
                      <th key={c.clave} className="text-left px-3 py-2 whitespace-nowrap font-bold">{c.etiqueta}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibles.slice(0, limite).map((f, i) => (
                    <tr key={`${f.id}-${i}`} className="border-t border-gray-50 hover:bg-gray-50/60">
                      {columnas.map((c) => (
                        <td key={c.clave} className="px-3 py-2 whitespace-nowrap text-gray-700">{celda(f[c.clave], c.tipo)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {visibles.length > limite && (
                <button onClick={() => setLimite(limite + POR_PAGINA)} className="mt-3 text-[11px] font-bold uppercase tracking-widest text-[#7C3AED] hover:underline">
                  Mostrar {Math.min(POR_PAGINA, visibles.length - limite)} más
                </button>
              )}
            </div>
          )}
        </section>
      </div>

      <footer className="flex flex-wrap items-center gap-x-6 gap-y-2 p-4 border-t border-gray-100 bg-white">
        <div className="flex flex-wrap gap-x-6 text-sm flex-1">
          {sumas.map(([etiqueta, valor]) => (
            <p key={etiqueta}>
              <span className="text-gray-400">{etiqueta.toLowerCase() === "total" ? "Total" : `Total ${etiqueta.toLowerCase()}`}: </span>
              <span className="font-black text-[#020817]">{formatearDinero(valor)}</span>
            </p>
          ))}
        </div>
        <button onClick={alCerrar} className="bg-[#020817] text-white text-[11px] font-bold px-8 py-3 rounded-xl hover:bg-black transition-colors tracking-widest uppercase">
          Cerrar
        </button>
      </footer>
    </>
  );
}

// Estructura del drawer; se monta al abrir (así la animación de entrada se repite en cada apertura).
function Estructura({ detalle, alCerrar }) {
  const [entrado, setEntrado] = useState(false);

  useEffect(() => {
    const cuadro = requestAnimationFrame(() => setEntrado(true));
    const alTeclear = (e) => e.key === "Escape" && alCerrar();
    window.addEventListener("keydown", alTeclear);
    return () => {
      cancelAnimationFrame(cuadro);
      window.removeEventListener("keydown", alTeclear);
    };
  }, [alCerrar]);

  return (
    <div className="fixed inset-0 z-[90]" role="dialog" aria-modal="true" aria-label={detalle.titulo}>
      <div className={`absolute inset-0 bg-[#020817]/50 backdrop-blur-sm transition-opacity duration-300 ${entrado ? "opacity-100" : "opacity-0"}`} onClick={alCerrar} />
      <aside
        className={`absolute right-0 top-0 h-full w-full sm:max-w-xl lg:max-w-3xl bg-white shadow-2xl flex flex-col border-l border-gray-200 border-t-4 border-t-[#7C3AED] overflow-hidden transition-transform duration-300 ease-out ${
          entrado ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <Contenido key={detalle.clave} detalle={detalle} alCerrar={alCerrar} />
      </aside>
    </div>
  );
}

// Drawer lateral con el detalle de una tarjeta del dashboard; mismo lenguaje visual que el drawer de importaciones.
export default function DrawerDetalle({ detalle, alCerrar }) {
  return detalle ? <Estructura detalle={detalle} alCerrar={alCerrar} /> : null;
}
