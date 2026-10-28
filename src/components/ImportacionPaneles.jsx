import React from "react";

// Paneles de resultado compartidos por la pantalla central de importación y los modales de cada módulo.
const MAX_FILAS_VISIBLES = 50;

function Cifra({ etiqueta, valor, color }) {
  return (
    <div className="bg-[#F8F9FF] border border-gray-100 rounded-xl p-4">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{etiqueta}</p>
      <p className={`text-3xl font-black mt-1 ${color}`}>{valor}</p>
    </div>
  );
}

export function Cifras({ r }) {
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

export function TablaMotivos({ titulo, filas }) {
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
                <td className="px-4 py-2 text-gray-600">
                  {f.motivos?.length > 1 ? (
                    <ul className="list-disc pl-4 space-y-0.5">
                      {f.motivos.map((m) => <li key={m}>{m}</li>)}
                    </ul>
                  ) : (
                    f.motivo
                  )}
                </td>
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
