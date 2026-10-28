// Resolución de conflictos dentro del drawer: por cada registro que ya existe con datos distintos se ve el dato actual
// junto al del Excel y se decide, con un selector visible, si se conserva o se actualiza.
const Opcion = ({ activa, color, alClic, children }) => (
  <button
    type="button"
    onClick={alClic}
    aria-pressed={activa}
    className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors ${activa ? color : "bg-white text-gray-400 hover:bg-gray-100"}`}
  >
    {children}
  </button>
);

export default function ResolucionConflictos({ conflictos, seleccion, setSeleccion }) {
  const total = conflictos.length;
  const aActualizar = conflictos.filter((c) => seleccion.has(c.id)).length;
  const todosActualizar = aActualizar === total;
  const todosConservar = aActualizar === 0;

  const fijar = (id, actualizar) => {
    const siguiente = new Set(seleccion);
    if (actualizar) siguiente.add(id);
    else siguiente.delete(id);
    setSeleccion(siguiente);
  };

  return (
    <section>
      <div className="mb-4">
        <h4 className="text-sm font-black text-[#020817]">
          {total} {total === 1 ? "registro ya existe" : "registros ya existen"} con datos distintos
        </h4>
        <p className="text-xs text-gray-500 mt-0.5">Elija qué hacer con cada uno: conservar el dato actual o actualizarlo con el del Excel.</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <p className="text-xs font-bold text-gray-500">
          <span className="text-violet-600">{aActualizar} por actualizar</span> · <span className="text-gray-700">{total - aActualizar} se conservan</span>
        </p>
        <div className="inline-flex rounded-lg overflow-hidden bg-gray-100">
          <Opcion activa={todosConservar} color="bg-[#020817] text-white" alClic={() => setSeleccion(new Set())}>
            Conservar todos
          </Opcion>
          <Opcion activa={todosActualizar} color="bg-[#7C3AED] text-white" alClic={() => setSeleccion(new Set(conflictos.map((c) => c.id)))}>
            Actualizar todos
          </Opcion>
        </div>
      </div>

      <ul className="space-y-3">
        {conflictos.map((c) => {
          const actualizar = seleccion.has(c.id);
          return (
            <li key={c.id} className={`rounded-xl p-4 transition-colors ${actualizar ? "bg-purple-50" : "bg-gray-50"}`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-sm font-black text-[#020817]">
                  {c.id} <span className="font-medium text-gray-400">· fila {c.fila} del Excel</span>
                </span>
                <div className="inline-flex rounded-lg overflow-hidden bg-gray-100" role="group" aria-label={`Decisión para ${c.id}`}>
                  <Opcion activa={!actualizar} color="bg-[#020817] text-white" alClic={() => fijar(c.id, false)}>Conservar</Opcion>
                  <Opcion activa={actualizar} color="bg-[#7C3AED] text-white" alClic={() => fijar(c.id, true)}>Actualizar</Opcion>
                </div>
              </div>
              <table className="w-full text-sm mt-3">
                <thead className="text-[10px] uppercase tracking-widest text-gray-400">
                  <tr>
                    <th className="text-left font-bold pb-1 w-1/3">Campo</th>
                    <th className="text-left font-bold pb-1">Dato actual</th>
                    <th className="text-left font-bold pb-1">Dato del Excel</th>
                  </tr>
                </thead>
                <tbody>
                  {c.campos.map((f) => (
                    <tr key={f.campo}>
                      <td className="py-1 font-mono text-xs text-gray-500">{f.campo}</td>
                      <td className="py-1 pr-2"><span className={`rounded px-2 py-0.5 ${actualizar ? "bg-gray-100 text-gray-400 line-through" : "bg-emerald-100 text-emerald-800"}`}>{f.actual}</span></td>
                      <td className="py-1"><span className={`rounded px-2 py-0.5 ${actualizar ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-400"}`}>{f.nuevo}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
