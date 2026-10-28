import { PRESETS } from "../helpers/periodo";

export default function FiltroPeriodo({ preset, setPreset, desdeTxt, setDesdeTxt, hastaTxt, setHastaTxt }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {PRESETS.map(([clave, etiqueta]) => (
        <button
          key={clave}
          onClick={() => setPreset(clave)}
          className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-colors ${preset === clave ? "bg-[#020817] text-white border-[#020817]" : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"}`}
        >
          {etiqueta}
        </button>
      ))}
      {preset === "personalizado" && (
        <>
          <input type="date" aria-label="Desde" value={desdeTxt} onChange={(e) => setDesdeTxt(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-1.5 text-xs" />
          <input type="date" aria-label="Hasta" value={hastaTxt} onChange={(e) => setHastaTxt(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-1.5 text-xs" />
        </>
      )}
    </div>
  );
}
