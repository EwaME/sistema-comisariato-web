import React from "react";
import {
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    MessageSquare,
    Search,
    SlidersHorizontal,
} from "lucide-react";

const sugerenciasMock = [
    {
        id: 1,
        autor: "Alonzo Figueroa",
        avatar: "AF",
        titulo: "Optimización de empaque biodegradable",
        descripcion:
            "Deberíamos considerar la transición a materiales de empaque basados en hongos o algas. No solo reduce nuestro impacto ambiental, sino que a largo plazo los costos de importación de plástico virgen están subiendo.",
        fecha: "12 Oct 2023",
        comentarios: null,
    },
    {
        id: 2,
        autor: "Lucía Ferreyra",
        avatar: "LF",
        titulo: "Viernes de 'Deep Work' sin reuniones",
        descripcion:
            "Implementar una política donde los viernes después del mediodía no se permitan reuniones internas. Esto permitiría a los equipos cerrar sus tareas semanales sin interrupciones, mejorando la salud mental y la productividad antes del fin de semana.",
        fecha: "14 Oct 2023",
        comentarios: 12,
    },
];

export default function Sugerencias() {
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
                <div className="p-4 md:p-5 flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between border-b border-gray-100">
                    <div className="w-full lg:max-w-xl relative">
                        <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Buscar por empleado..."
                            className="w-full h-12 bg-[#F8F9FF] border border-gray-100 rounded-xl pl-11 pr-4 text-sm text-gray-500 placeholder:text-gray-400 outline-none"
                            readOnly
                        />
                    </div>

                    <button className="shrink-0 h-11 px-4 rounded-xl border border-gray-100 text-[12px] font-semibold text-gray-600 bg-white flex items-center gap-2">
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                        Ordenar por: Recientes
                    </button>
                </div>

                <div className="p-4 md:p-5 space-y-4 md:space-y-5">
                    {sugerenciasMock.map((sugerencia) => (
                        <article
                            key={sugerencia.id}
                            className="border border-gray-100 rounded-2xl p-4 md:p-5 hover:bg-gray-50/50 transition-colors"
                        >
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="sm:w-20 shrink-0 flex sm:flex-col items-center sm:items-start gap-3 sm:gap-2">
                                    <div className="w-11 h-11 rounded-full bg-[#E2E8F0] text-[#334155] font-black text-[11px] flex items-center justify-center shadow-sm">
                                        {sugerencia.avatar}
                                    </div>
                                    <p className="text-[11px] leading-4 font-extrabold text-[#020817] sm:max-w-[72px]">
                                        {sugerencia.autor}
                                    </p>
                                </div>

                                <div className="flex-1">
                                    <h3 className="text-[20px] leading-6 font-extrabold text-[#020817] mb-2">
                                        {sugerencia.titulo}
                                    </h3>
                                    <p className="text-[14px] leading-7 text-gray-500 mb-4">
                                        {sugerencia.descripcion}
                                    </p>

                                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-gray-500 font-medium">
                                        <span className="inline-flex items-center gap-2">
                                            <CalendarDays className="w-3.5 h-3.5" />
                                            {sugerencia.fecha}
                                        </span>

                                        {sugerencia.comentarios !== null && (
                                            <span className="inline-flex items-center gap-2">
                                                <MessageSquare className="w-3.5 h-3.5" />
                                                {sugerencia.comentarios} comentarios
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>

                <div className="px-4 md:px-5 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <p className="text-[10px] font-bold text-[#64748B] tracking-[0.22em] uppercase">
                        Mostrando 4 de 25 sugerencias
                    </p>

                    <div className="flex items-center gap-2 text-[12px] font-semibold text-gray-500">
                        <button className="w-8 h-8 rounded-lg border border-gray-100 grid place-items-center hover:bg-gray-50 transition-colors">
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button className="w-8 h-8 rounded-lg bg-[#020817] text-white">1</button>
                        <button className="w-8 h-8 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                            2
                        </button>
                        <button className="w-8 h-8 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                            3
                        </button>
                        <span className="px-1">...</span>
                        <button className="w-8 h-8 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                            15
                        </button>
                        <button className="w-8 h-8 rounded-lg border border-gray-100 grid place-items-center hover:bg-gray-50 transition-colors">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}