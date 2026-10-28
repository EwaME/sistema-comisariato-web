import { useEffect } from "react";
import { X } from "lucide-react";
import { formatearDinero } from "../helpers/formatoDinero";

const fechaCorta = new Intl.DateTimeFormat("es-HN", { day: "2-digit", month: "2-digit", year: "numeric" });


function celda(valor, tipo) {
  if (valor === null || valor === undefined || valor === "") return "—";
  if (tipo === "dinero") return formatearDinero(valor);
  if (tipo === "porcentaje") return `${valor} %`;
  if (tipo === "fecha") return valor instanceof Date ? fechaCorta.format(valor) : String(valor);
  if (tipo === "fechahora") return valor instanceof Date ? valor.toLocaleString("es-HN") : String(valor);
  return String(valor);
}

// Tabla con los registros que explican una cifra del dashboard. columnas: [{ clave, etiqueta, tipo? }]
export default function ModalDetalle({ detalle, alCerrar }) {
  useEffect(() => {
    if (!detalle) return undefined;
    const alTeclear = (e) => e.key === "Escape" && alCerrar();
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [detalle, alCerrar]);

  if (!detalle) return null;
  const { titulo, subtitulo, columnas, filas } = detalle;
  const sumas = columnas.filter((c) => c.tipo === "dinero").map((c) => [c.etiqueta, filas.reduce((s, f) => s + (Number(f[c.clave]) || 0), 0)]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={titulo}
      className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center p-4"
      onClick={alCerrar}
    >
      <div
        className="bg-white rounded-[2rem] shadow-2xl w-full max-w-5xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-black text-[#020817]">{titulo}</h2>
            <p className="text-sm text-gray-400">
              {subtitulo} · {filas.length} {filas.length === 1 ? "registro" : "registros"}
            </p>
          </div>
          <button onClick={alCerrar} aria-label="Cerrar" className="p-2 rounded-xl hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-auto p-6">
          {filas.length === 0 ? (
            <p className="text-sm text-gray-400">No hay registros para esta selección.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-[10px] uppercase tracking-widest text-gray-400">
                <tr>
                  {columnas.map((c) => (
                    <th key={c.clave} className="text-left px-3 py-2 whitespace-nowrap">{c.etiqueta}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filas.map((f) => (
                  <tr key={f.id} className="border-t border-gray-50">
                    {columnas.map((c) => (
                      <td key={c.clave} className="px-3 py-2 whitespace-nowrap">{celda(f[c.clave], c.tipo)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {sumas.length > 0 && filas.length > 0 && (
          <div className="flex flex-wrap gap-6 px-6 py-4 border-t border-gray-100 text-sm">
            {sumas.map(([etiqueta, valor]) => (
              <p key={etiqueta}>
                <span className="text-gray-400">{etiqueta.toLowerCase() === "total" ? "Total" : `Total ${etiqueta.toLowerCase()}`}: </span>
                <span className="font-black">{formatearDinero(valor)}</span>
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
