import { useEffect } from "react";
import { X, AlertTriangle } from "lucide-react";

// Muestra, por cada fila cuyo ID ya existe con datos distintos, el dato actual junto al dato nuevo del Excel
// y deja elegir cuáles se actualizan. Lo que no se marca conserva el dato actual.
export default function ModalConflictos({ abierto, conflictos, seleccion, setSeleccion, alCerrar }) {
  useEffect(() => {
    if (!abierto) return undefined;
    const alTeclear = (e) => e.key === "Escape" && alCerrar();
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [abierto, alCerrar]);

  if (!abierto) return null;

  const alternar = (id) => {
    const siguiente = new Set(seleccion);
    if (siguiente.has(id)) siguiente.delete(id);
    else siguiente.add(id);
    setSeleccion(siguiente);
  };

  return (
    <div role="dialog" aria-modal="true" aria-label="Conflictos de importación" className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center p-4" onClick={alCerrar}>
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl max-h-[88vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-black text-[#020817]">
              {conflictos.length} {conflictos.length === 1 ? "registro ya existe" : "registros ya existen"} con datos distintos
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Marcá los que querés actualizar con el dato del Excel. Los que no marqués conservan el dato actual.
            </p>
          </div>
          <button onClick={alCerrar} aria-label="Cerrar" className="p-2 rounded-xl hover:bg-gray-100"><X size={18} /></button>
        </div>

        <div className="flex flex-wrap items-center gap-2 px-6 pt-4">
          <button onClick={() => setSeleccion(new Set(conflictos.map((c) => c.id)))} className="px-4 py-2 rounded-xl border border-gray-200 text-[11px] font-bold uppercase tracking-widest hover:bg-gray-50">
            Actualizar todos
          </button>
          <button onClick={() => setSeleccion(new Set())} className="px-4 py-2 rounded-xl border border-gray-200 text-[11px] font-bold uppercase tracking-widest hover:bg-gray-50">
            Conservar todos
          </button>
        </div>

        <div className="overflow-auto p-6 space-y-4">
          {conflictos.map((c) => {
            const marcado = seleccion.has(c.id);
            return (
              <div key={c.id} className={`border rounded-2xl overflow-hidden ${marcado ? "border-[#7C3AED]" : "border-gray-100"}`}>
                <label className="flex items-center justify-between gap-3 px-4 py-3 bg-gray-50 cursor-pointer">
                  <span className="text-sm font-black text-[#020817]">
                    {c.id} <span className="font-medium text-gray-400">· fila {c.fila} del Excel</span>
                  </span>
                  <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-gray-500">
                    <input type="checkbox" checked={marcado} onChange={() => alternar(c.id)} aria-label={`Actualizar ${c.id}`} className="w-4 h-4 accent-[#7C3AED]" />
                    Actualizar este registro
                  </span>
                </label>

                {c.advertencias.map((a) => (
                  <p key={a} className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 px-4 py-2">
                    <AlertTriangle size={14} className="shrink-0 mt-0.5" /> {a}
                  </p>
                ))}

                <table className="w-full text-sm">
                  <thead className="text-[10px] uppercase tracking-widest text-gray-400">
                    <tr>
                      <th className="text-left px-4 py-2 w-1/4">Campo</th>
                      <th className="text-left px-4 py-2 w-3/8">Dato actual</th>
                      <th className="text-left px-4 py-2">Dato nuevo (Excel)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {c.campos.map((f) => (
                      <tr key={f.campo} className="border-t border-gray-50">
                        <td className="px-4 py-2 font-mono text-xs text-gray-500">{f.campo}</td>
                        <td className="px-4 py-2"><span className="bg-rose-50 text-rose-700 rounded-md px-2 py-0.5">{f.actual}</span></td>
                        <td className="px-4 py-2"><span className="bg-emerald-50 text-emerald-700 rounded-md px-2 py-0.5">{f.nuevo}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-4 px-6 py-4 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            <span className="font-black text-[#020817]">{seleccion.size}</span> de {conflictos.length} marcados para actualizar
          </p>
          <button onClick={alCerrar} className="px-6 py-3 bg-[#7C3AED] text-white rounded-xl text-[11px] font-bold uppercase tracking-widest">
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}
