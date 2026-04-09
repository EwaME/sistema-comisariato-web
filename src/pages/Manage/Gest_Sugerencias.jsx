import React, { useState, useEffect } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

import { obtenerSugerencias } from "../../services/sugerenciasService";
import { fromTimestamp } from "../../helpers/timestampToDate";

export default function Sugerencias() {
  const [sugerencias, setSugerencias] = useState([]);
  const [cargando, setCargando] = useState(true);

  // --- LÓGICA DE PAGINACIÓN ---
  const [paginaActual, setPaginaActual] = useState(1);
  const itemsPorPagina = 4;

  useEffect(() => {
    // Definimos la recarga ficticia con una promesa
    const fakeLoading = (data) => {
      return new Promise((resolve) => {
        setTimeout(() => resolve(data), 800); // 800ms de carga ficticia
      });
    };

    const desuscribirse = obtenerSugerencias(async (nuevasSugerencias) => {
      // Cada vez que hay cambios, activamos el esqueleto brevemente
      setCargando(true);

      const data = await fakeLoading(nuevasSugerencias);

      setSugerencias(data);
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

  useEffect(() => {
    if (paginaActual > totalPaginas && totalPaginas > 0) {
      setPaginaActual(1);
    }
  }, [sugerencias.length, paginaActual, totalPaginas]);

  // Función para manejar el cambio de página con efecto de carga
  const manejarCambioPagina = (nuevaPagina) => {
    setCargando(true);
    setPaginaActual(nuevaPagina);
    // Simulamos carga al cambiar de página
    setTimeout(() => setCargando(false), 500);
  };

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
          {cargando ? (
            Array(4)
              .fill(0)
              .map((_, i) => <SkeletonItem key={i} />)
          ) : sugerenciasPaginadas.length > 0 ? (
            sugerenciasPaginadas.map((sugerencia) => (
              <article
                key={sugerencia.id}
                className="border border-gray-100 rounded-2xl p-4 md:p-5 hover:bg-gray-50/50 transition-colors"
              >
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="sm:w-20 shrink-0 flex sm:flex-col items-center sm:items-start gap-3 sm:gap-2">
                    <div className="w-11 h-11 rounded-full bg-[#E2E8F0] shadow-sm overflow-hidden">
                      <img
                        className="w-full h-full object-cover"
                        src={sugerencia.fotoUsuario}
                        alt="Foto del usuario"
                      />
                    </div>
                    <p className="text-[11px] leading-4 font-extrabold text-[#020817] sm:max-w-[72px]">
                      {sugerencia.nombreUsuario.split(" ")[0]}{" "}
                      {sugerencia.nombreUsuario.split(" ")[2] || ""}
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

        {/* Footer / Paginado */}
        <div className="px-4 md:px-5 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className={`${cargando ? "animate-pulse" : ""}`}>
            {cargando ? (
              <div className="w-48 h-3 bg-gray-100 rounded"></div>
            ) : (
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Mostrando {startIndex + 1} a{" "}
                {Math.min(startIndex + itemsPorPagina, sugerencias.length)} de{" "}
                {sugerencias.length} sugerencias
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => manejarCambioPagina(Math.max(1, paginaActual - 1))}
              disabled={cargando || paginaActual === 1}
              className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-xs font-bold text-[#020817] px-3">
              {cargando
                ? "---"
                : `Página ${paginaActual} de ${totalPaginas || 1}`}
            </span>

            <button
              onClick={() =>
                manejarCambioPagina(Math.min(totalPaginas, paginaActual + 1))
              }
              disabled={
                cargando || paginaActual === totalPaginas || totalPaginas === 0
              }
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

function SkeletonItem() {
  return (
    <div className="border border-gray-50 rounded-2xl p-4 md:p-5 animate-pulse">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="sm:w-20 shrink-0 flex sm:flex-col items-center sm:items-start gap-3 sm:gap-2">
          <div className="w-11 h-11 rounded-full bg-gray-100" />
          <div className="w-14 h-3 bg-gray-100 rounded" />
        </div>
        <div className="flex-1">
          <div className="w-1/3 h-6 bg-gray-100 rounded mb-3" />
          <div className="space-y-2 mb-4">
            <div className="w-full h-3 bg-gray-50 rounded" />
            <div className="w-5/6 h-3 bg-gray-50 rounded" />
          </div>
          <div className="w-24 h-3 bg-gray-100 rounded" />
        </div>
      </div>
    </div>
  );
}
