import React, { useState, useEffect } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Loader2,
} from "lucide-react";

import { obtenerSugerencias } from "../../services/sugerenciasService";

import { fromTimestamp } from "../../helpers/timestampToDate";

export default function Sugerencias() {
  const [sugerencias, setSugerencias] = useState([]);
  const [cargando, setCargando] = useState(true);

  // --- LÓGICA DE PAGINACIÓN (Basada en Gest_Creditos) ---
  const [paginaActual, setPaginaActual] = useState(1);
  const itemsPorPagina = 4;

  useEffect(() => {
    const desuscribirse = obtenerSugerencias((nuevasSugerencias) => {
      setSugerencias(nuevasSugerencias);
      setCargando(false);
    });
    return () => desuscribirse();
  }, []);

  // Cálculos de índices
  const totalPaginas = Math.ceil(sugerencias.length / itemsPorPagina);
  const startIndex = (paginaActual - 1) * itemsPorPagina;
  const sugerenciasPaginadas = sugerencias.slice(
    startIndex,
    startIndex + itemsPorPagina,
  );

  // Reset de página si los datos cambian drásticamente
  useEffect(() => {
    if (paginaActual > totalPaginas && totalPaginas > 0) {
      setPaginaActual(1);
    }
  }, [sugerencias.length, paginaActual, totalPaginas]);

  if (cargando) {
    return (
      <div className="min-h-screen bg-[#F8F9FF] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#7C3AED] mb-4" />
        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
          Cargando sugerencias...
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto">
      <div className="mb-8">
        <h2 className="text-4xl md:text-5xl font-black text-[#020817] tracking-tight">
          Sugerencias
        </h2>
        <p className="text-[13px] text-gray-500 mt-2 font-medium">
          Sección de visualización y feedback
        </p>
      </div>

      <section className="bg-white rounded-[1.25rem] border border-gray-100 shadow-[0_2px_18px_rgb(0,0,0,0.03)] overflow-hidden">
        {/* Lista de Sugerencias */}
        <div className="p-4 md:p-5 space-y-4 md:space-y-5">
          {sugerenciasPaginadas.length > 0 ? (
            sugerenciasPaginadas.map((sugerencia) => (
              <article
                key={sugerencia.id}
                className="border border-gray-100 rounded-2xl p-4 md:p-5 hover:bg-gray-50/50 transition-colors"
              >
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="sm:w-20 shrink-0 flex sm:flex-col items-center sm:items-start gap-3 sm:gap-2">
                    <div className="w-11 h-11 rounded-full bg-[#E2E8F0] text-[#334155] font-black text-[11px] flex items-center justify-center shadow-sm overflow-hidden">
                      <img
                        src={sugerencia.fotoUsuario}
                        alt="Foto del usuario"
                      />
                    </div>
                    <p className="text-[11px] leading-4 font-extrabold text-[#020817] sm:max-w-[72px]">
                      {sugerencia.nombreUsuario.split(" ")[0]}{" "}
                      {sugerencia.nombreUsuario.split(" ")[2]}
                    </p>
                  </div>

                  <div className="flex-1">
                    <h3 className="text-[20px] leading-6 font-extrabold text-[#020817] mb-2">
                      {sugerencia.asunto}
                    </h3>
                    <p className="text-[14px] leading-7 text-gray-500 mb-4">
                      {sugerencia.descripcion}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-gray-500 font-medium">
                      <span className="inline-flex items-center gap-2">
                        <CalendarDays className="w-3.5 h-3.5" />
                        {fromTimestamp(sugerencia.fechaRegistro)}
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className="py-20 text-center text-gray-400 font-medium">
              No hay sugerencias disponibles.
            </div>
          )}
        </div>

        {/* Footer / Paginado (Misma lógica que Gest_Creditos) */}
        <div className="px-4 md:px-5 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Mostrando {startIndex + 1} a{" "}
            {Math.min(startIndex + itemsPorPagina, sugerencias.length)} de{" "}
            {sugerencias.length} sugerencias
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
              disabled={paginaActual === 1}
              className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-xs font-bold text-[#020817] px-3">
              Página {paginaActual} de {totalPaginas || 1}
            </span>

            <button
              onClick={() =>
                setPaginaActual((p) => Math.min(totalPaginas, p + 1))
              }
              disabled={paginaActual === totalPaginas || totalPaginas === 0}
              className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
