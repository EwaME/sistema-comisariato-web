import { useEffect, useRef, useState } from "react";
import { Loader2, Check, X, AlertTriangle } from "lucide-react";

const VISIBLES = 6;

const ESTILOS = {
  pendiente: { anillo: "bg-white border-gray-200 text-gray-300", texto: "text-gray-400", linea: "bg-gray-200" },
  cargando: { anillo: "bg-white border-[#7C3AED] text-[#7C3AED]", texto: "text-[#7C3AED]", linea: "bg-[#7C3AED]" },
  ok: { anillo: "bg-emerald-500 border-emerald-500 text-white", texto: "text-emerald-600", linea: "bg-emerald-500" },
  aviso: { anillo: "bg-amber-500 border-amber-500 text-white", texto: "text-amber-600", linea: "bg-amber-500" },
  error: { anillo: "bg-rose-500 border-rose-500 text-white", texto: "text-rose-600", linea: "bg-rose-500" },
};

// Animaciones propias del análisis; se apagan si la persona pidió reducir el movimiento.
const ANIMACIONES = `
@keyframes an-pop { 0% { transform: scale(0); } 70% { transform: scale(1.2); } 100% { transform: scale(1); } }
@keyframes an-shake { 0%,100% { transform: translateX(0); } 20% { transform: translateX(-3px); } 40% { transform: translateX(3px); } 60% { transform: translateX(-2px); } 80% { transform: translateX(2px); } }
@keyframes an-entra { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
@keyframes an-ping { 0% { transform: scale(1); opacity: .5; } 100% { transform: scale(1.9); opacity: 0; } }
.an-pop { animation: an-pop .35s ease-out both; }
.an-shake { animation: an-pop .35s ease-out both, an-shake .45s .3s ease-in-out; }
.an-entra { animation: an-entra .25s ease-out both; }
.an-ping { animation: an-ping 1.1s ease-out infinite; }
@media (prefers-reduced-motion: reduce) { .an-pop, .an-shake, .an-entra, .an-ping { animation: none; } }
`;

function Icono({ estado }) {
  const e = ESTILOS[estado];
  return (
    <span className="absolute left-0 top-0 w-8 h-8">
      {estado === "cargando" && <span className="an-ping absolute inset-0 rounded-full bg-[#7C3AED]/30" />}
      <span key={estado} className={`relative flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors duration-300 ${e.anillo} ${estado === "error" ? "an-shake" : estado === "ok" || estado === "aviso" ? "an-pop" : ""}`}>
        {estado === "cargando" && <Loader2 size={16} className="animate-spin" />}
        {estado === "ok" && <Check size={16} strokeWidth={3} />}
        {estado === "aviso" && <AlertTriangle size={14} strokeWidth={3} />}
        {estado === "error" && <X size={16} strokeWidth={3} />}
        {estado === "pendiente" && <span className="w-2 h-2 rounded-full bg-gray-300" />}
      </span>
    </span>
  );
}

function Hallazgo({ h, indice }) {
  const rojo = h.nivel === "error";
  return (
    <li
      style={{ animationDelay: `${Math.min(indice, 10) * 40}ms` }}
      className={`an-entra flex flex-wrap items-center gap-x-2 gap-y-1 text-xs rounded-lg px-3 py-2 ${rojo ? "bg-rose-50" : "bg-amber-50"}`}
    >
      {h.fila > 0 && (
        <span className="bg-[#020817] text-white rounded px-2 py-0.5 text-[10px] font-bold tracking-wide shrink-0">
          {h.fila === 1 ? "Encabezado · fila 1" : `Fila ${h.fila}`}
        </span>
      )}
      {h.id && <span className="font-mono text-[11px] text-gray-500 shrink-0">{h.id}</span>}
      {h.campo && <span className="bg-white/70 rounded px-1.5 py-0.5 font-mono text-[10px] text-gray-500 shrink-0">{h.campo}</span>}
      <span className={`${rojo ? "text-rose-800" : "text-amber-800"} font-medium`}>{h.mensaje}</span>
    </li>
  );
}

// Equivalente a toast.promise para un paso: pendiente → cargando (mensaje de carga) → ok / aviso / error (mensaje de resultado).
export function PasoPromesa({ paso, ultimo, refLi }) {
  const [verTodos, setVerTodos] = useState(false);
  const { estado, titulo, detalle, cargando, mensaje, hallazgos } = paso;
  const e = ESTILOS[estado];
  const terminado = estado === "ok" || estado === "aviso" || estado === "error";
  const visibles = verTodos ? hallazgos : hallazgos.slice(0, VISIBLES);

  return (
    <li ref={refLi} className="relative pl-12 pb-7 last:pb-0" aria-live="polite">
      {!ultimo && (
        <span className="absolute left-[15px] top-8 bottom-0 w-0.5 bg-gray-200 overflow-hidden" aria-hidden="true">
          <span className={`block w-full h-full origin-top transition-transform duration-700 ease-out ${terminado ? "scale-y-100" : "scale-y-0"} ${e.linea}`} />
        </span>
      )}
      <Icono estado={estado} />
      <p className={`text-sm font-black leading-8 ${estado === "pendiente" ? "text-gray-400" : "text-[#020817]"}`}>{titulo}</p>
      <p key={estado} className={`an-entra text-xs font-semibold -mt-1 ${e.texto}`}>
        {estado === "pendiente" ? detalle : estado === "cargando" ? cargando : mensaje}
      </p>

      {terminado && hallazgos.length > 0 && (
        <>
          <ul className="mt-3 space-y-1.5">
            {visibles.map((h, i) => (
              <Hallazgo key={`${h.fila}-${h.campo}-${i}`} h={h} indice={i} />
            ))}
          </ul>
          {hallazgos.length > VISIBLES && (
            <button onClick={() => setVerTodos(!verTodos)} className="mt-2 text-[11px] font-bold uppercase tracking-widest text-[#7C3AED] hover:underline">
              {verTodos ? "Ver menos" : `Mostrar los ${hallazgos.length - VISIBLES} restantes`}
            </button>
          )}
        </>
      )}
    </li>
  );
}

export default function LineaAnalisis({ pasos }) {
  const items = useRef([]);
  const huellas = pasos.map((p) => p.estado).join();

  // Sigue la animación: cada vez que un paso empieza a cargar, la lista se desplaza hasta él.
  useEffect(() => {
    const activo = pasos.findIndex((p) => p.estado === "cargando");
    if (activo < 0) return;
    const reducido = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    items.current[activo]?.scrollIntoView({ behavior: reducido ? "auto" : "smooth", block: "center" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [huellas]);

  return (
    <>
      <style>{ANIMACIONES}</style>
      <ol className="px-1" aria-label="Pasos del análisis">
        {pasos.map((p, i) => (
          <PasoPromesa key={p.id} paso={p} ultimo={i === pasos.length - 1} refLi={(el) => (items.current[i] = el)} />
        ))}
      </ol>
    </>
  );
}
