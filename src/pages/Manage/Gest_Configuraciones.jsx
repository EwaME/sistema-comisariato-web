import { useMemo, useState } from "react";
import {
    CalendarDays,
    Check,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Plus,
    Shield,
    Timer,
    Wallet,
    Warehouse,
    X,
} from "lucide-react";

const monthLabel = "Octubre 2023";
const weekDays = ["L", "M", "X", "J", "V", "S", "D"];
const daysGrid = [
    null,
    null,
    null,
    null,
    null,
    null,
    1,
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    9,
    10,
    11,
    12,
    13,
    14,
    15,
    16,
    17,
    18,
    19,
    20,
    21,
    22,
    23,
    24,
    25,
    26,
    27,
    28,
    29,
    30,
    31,
    null,
    null,
    null,
    null,
    null,
];
const availableTerms = ["3 meses", "6 meses", "12 meses", "18 meses", "24 meses"];

export default function Configuraciones() {
    const [waitingMessage, setWaitingMessage] = useState(
        "Estamos validando su historial crediticio. Esta accion puede tomar de 1 a 7 dias habiles."
    );
    const [creditLimitPercent, setCreditLimitPercent] = useState("25");
    const [interestRatePercent, setInterestRatePercent] = useState("14.5");
    const [selectedTerms, setSelectedTerms] = useState(["3 meses", "6 meses", "12 meses"]);
    const [stockWarning, setStockWarning] = useState("25");
    const [stockClosing, setStockClosing] = useState("5");
    const [notifyManagers, setNotifyManagers] = useState(true);
    const [sessionTimeout, setSessionTimeout] = useState("30 Minutos");
    const [deductionDay, setDeductionDay] = useState("Dia 15");
    const [automaticDeductions, setAutomaticDeductions] = useState(true);
    const [selectedDate, setSelectedDate] = useState(15);
    const [lastExecution, setLastExecution] = useState(null);

    const remainingTerms = useMemo(
        () => availableTerms.filter((term) => !selectedTerms.includes(term)),
        [selectedTerms]
    );

    const addNextTerm = () => {
        if (remainingTerms.length === 0) return;
        setSelectedTerms((prev) => [...prev, remainingTerms[0]]);
    };

    const removeTerm = (term) => {
        setSelectedTerms((prev) => prev.filter((item) => item !== term));
    };

    const runManualDeductions = () => {
        const now = new Date();
        const formatted = now.toLocaleString("es-HN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
        setLastExecution(formatted);
    };

    return (
        <div className="p-4 md:p-8 max-w-[1600px] mx-auto">
            <section className="rounded-[1.6rem] border border-[#E6E8F2] bg-[#F8F9FF] overflow-hidden">
                <div className="px-6 md:px-8 py-5 border-b border-[#E6E8F2] flex items-center gap-2 text-[14px] font-semibold">
                    <span className="text-[#9AA1B5]">Administracion</span>
                    <ChevronRight size={15} className="text-[#C1C7D7]" />
                    <span className="text-[#7C3AED]">Configuraciones</span>
                </div>

                <div className="px-6 md:px-8 py-7">
                    <header className="mb-6">
                        <h1 className="text-[34px] leading-none font-black text-[#101828]">Configuraciones Globales</h1>
                        <p className="text-[14px] text-[#6A7288] mt-2">
                            Configure los valores predeterminados para ambas plataformas.
                        </p>
                    </header>

                    <div className="rounded-[1.25rem] border border-[#E6E8F2] bg-white overflow-hidden">
                        <div className="px-4 md:px-6 py-5 border-b border-[#EEF0F6]">
                            <h2 className="flex items-center gap-2 text-[23px] font-black tracking-tight text-[#2D3648]">
                                <Wallet size={20} className="text-[#7C3AED]" />
                                GESTION DE CREDITOS
                            </h2>
                        </div>

                        <div className="px-4 md:px-6 py-5 space-y-5">
                            <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4 items-start">
                                <div>
                                    <p className="text-[14px] font-bold text-[#2D3648]">Mensaje de espera</p>
                                    <p className="text-[12px] text-[#8A91A6] leading-4 mt-1">
                                        Texto mostrado durante la validacion del buro de credito.
                                    </p>
                                </div>
                                <textarea
                                    value={waitingMessage}
                                    onChange={(event) => setWaitingMessage(event.target.value)}
                                    className="w-full h-[64px] resize-none rounded-[10px] border border-[#E5E8F1] bg-[#F6F7FB] px-4 py-3 text-[13px] text-[#5D6578] outline-none"
                                    rows={2}
                                />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4 items-start">
                                <div>
                                    <p className="text-[14px] font-bold text-[#2D3648]">Limites y Tasa Base</p>
                                    <p className="text-[12px] text-[#8A91A6] leading-4 mt-1">
                                        Valores por defecto para nuevos solicitantes.
                                    </p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={creditLimitPercent}
                                                onChange={(event) => setCreditLimitPercent(event.target.value)}
                                                className="w-full h-11 rounded-[10px] border border-[#E5E8F1] bg-[#F6F7FB] px-4 pr-8 text-[14px] text-[#495063] outline-none"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-bold text-[#A4ABBD]">%</span>
                                        </div>
                                        <p className="mt-1 text-[10px] font-bold text-[#B0B6C7] uppercase tracking-wide">
                                            Limite maximo de credito (% del sueldo base)
                                        </p>
                                    </div>
                                    <div>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                step="0.1"
                                                value={interestRatePercent}
                                                onChange={(event) => setInterestRatePercent(event.target.value)}
                                                className="w-full h-11 rounded-[10px] border border-[#E5E8F1] bg-[#F6F7FB] px-4 pr-8 text-[14px] text-[#495063] outline-none"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-bold text-[#A4ABBD]">%</span>
                                        </div>
                                        <p className="mt-1 text-[10px] font-bold text-[#B0B6C7] uppercase tracking-wide">Tasa de interes mensual</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4 items-start">
                                <div>
                                    <p className="text-[14px] font-bold text-[#2D3648]">Gestion de Plazos</p>
                                    <p className="text-[12px] text-[#8A91A6] leading-4 mt-1">Opciones de creditos aplicables.</p>
                                </div>

                                <div className="rounded-[10px] border border-[#E5E8F1] bg-[#F9FAFD] min-h-11 px-2 py-1.5 flex flex-wrap items-center gap-2">
                                    {selectedTerms.map((term) => (
                                        <button
                                            type="button"
                                            key={term}
                                            className="h-7 px-2.5 rounded-full bg-white border border-[#E6E9F2] text-[11px] font-semibold text-[#667086] inline-flex items-center gap-1.5"
                                            onClick={() => removeTerm(term)}
                                            aria-label={`Quitar ${term}`}
                                        >
                                            {term}
                                            <X size={11} />
                                        </button>
                                    ))}

                                    <button
                                        type="button"
                                        className="h-7 px-3 rounded-full bg-black text-white text-[11px] font-bold inline-flex items-center gap-1 disabled:opacity-40"
                                        onClick={addNextTerm}
                                        disabled={remainingTerms.length === 0}
                                    >
                                        <Plus size={11} /> AGREGAR PLAZO
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="h-px bg-[#EEF0F6]" />

                        <div className="px-4 md:px-6 py-6 space-y-5">
                            <h2 className="flex items-center gap-2 text-[23px] font-black tracking-tight text-[#2D3648]">
                                <Warehouse size={20} className="text-[#7C3AED]" />
                                CONTROL DE INVENTARIO
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[14px] font-bold text-[#2D3648]">Stock minimo de aviso</p>
                                    <p className="text-[12px] text-[#8A91A6] leading-4 mt-1">Umbral para emitir un aviso de forma automatizada.</p>
                                    <input
                                        type="number"
                                        min="0"
                                        value={stockWarning}
                                        onChange={(event) => setStockWarning(event.target.value)}
                                        className="mt-2 w-full h-11 rounded-[10px] border border-[#E5E8F1] bg-[#F6F7FB] px-4 text-[14px] text-[#495063] outline-none"
                                    />
                                </div>

                                <div>
                                    <p className="text-[14px] font-bold text-[#2D3648]">Stock minimo de cierre</p>
                                    <p className="text-[12px] text-[#8A91A6] leading-4 mt-1">
                                        Umbral para desactivar la posibilidad de compra en ComisApp.
                                    </p>
                                    <input
                                        type="number"
                                        min="0"
                                        value={stockClosing}
                                        onChange={(event) => setStockClosing(event.target.value)}
                                        className="mt-2 w-full h-11 rounded-[10px] border border-[#E5E8F1] bg-[#F6F7FB] px-4 text-[14px] text-[#495063] outline-none"
                                    />
                                </div>
                            </div>

                            <label className="inline-flex items-center gap-2 text-[12px] text-[#7A8197]">
                                <input
                                    type="checkbox"
                                    checked={notifyManagers}
                                    onChange={(event) => setNotifyManagers(event.target.checked)}
                                    className="h-3.5 w-3.5 rounded accent-[#7C3AED]"
                                />
                                Desea notificar a los gestores de inventario cuando se llegue al minimo para emitir la alerta de aviso?
                            </label>
                        </div>

                        <div className="h-px bg-[#EEF0F6]" />

                        <div className="px-4 md:px-6 py-6 space-y-5">
                            <h2 className="flex items-center gap-2 text-[23px] font-black tracking-tight text-[#2D3648]">
                                <Shield size={20} className="text-[#7C3AED]" />
                                SEGURIDAD Y ACTIVIDAD
                            </h2>

                            <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4 items-center">
                                <div>
                                    <p className="text-[14px] font-bold text-[#2D3648]">Inactividad de sesion</p>
                                    <p className="text-[12px] text-[#8A91A6] leading-4 mt-1">Tiempo antes de cerrar sesion automaticamente.</p>
                                </div>
                                <div className="relative">
                                    <select
                                        value={sessionTimeout}
                                        onChange={(event) => setSessionTimeout(event.target.value)}
                                        className="w-full h-11 appearance-none rounded-[10px] border border-[#E5E8F1] bg-[#F6F7FB] px-4 pr-9 text-[14px] text-[#495063] outline-none"
                                    >
                                        <option>15 Minutos</option>
                                        <option>30 Minutos</option>
                                        <option>45 Minutos</option>
                                        <option>60 Minutos</option>
                                    </select>
                                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A4ABBD]" />
                                </div>
                            </div>
                        </div>

                        <div className="h-px bg-[#EEF0F6]" />

                        <div className="px-4 md:px-6 py-6 space-y-5">
                            <h2 className="flex items-center gap-2 text-[23px] font-black tracking-tight text-[#2D3648]">
                                <Timer size={20} className="text-[#7C3AED]" />
                                HORARIO Y AUTOMATIZACION
                            </h2>

                            <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-5">
                                <div>
                                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-4">
                                        <div>
                                            <p className="text-[14px] font-bold text-[#2D3648]">Proxima Fecha de Deduccion</p>
                                            <p className="text-[12px] text-[#8A91A6] leading-4 mt-1">
                                                Configure el ciclo de deducciones automaticas del sistema.
                                            </p>
                                        </div>

                                        <div className="relative">
                                            <select
                                                value={deductionDay}
                                                onChange={(event) => setDeductionDay(event.target.value)}
                                                className="w-full h-11 appearance-none rounded-[10px] border border-[#E5E8F1] bg-[#F6F7FB] px-4 pr-9 text-[14px] text-[#495063] outline-none"
                                            >
                                                <option>Dia 5</option>
                                                <option>Dia 10</option>
                                                <option>Dia 15</option>
                                                <option>Dia 20</option>
                                                <option>Dia 25</option>
                                            </select>
                                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A4ABBD]" />
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => setAutomaticDeductions((prev) => !prev)}
                                        aria-pressed={automaticDeductions}
                                        className="mt-4 inline-flex items-center gap-3"
                                    >
                                        <span
                                            className={`h-5 w-9 rounded-full p-[2px] transition ${
                                                automaticDeductions ? "bg-[#2563EB]" : "bg-[#D5DBEB]"
                                            }`}
                                        >
                                            <span
                                                className={`block h-4 w-4 rounded-full bg-white transition ${
                                                    automaticDeductions ? "translate-x-4" : "translate-x-0"
                                                }`}
                                            />
                                        </span>
                                        <span className="text-left">
                                            <strong className="block text-[12px] font-bold text-[#2D3648]">
                                                Deducciones Automaticas (Recomendado)
                                            </strong>
                                            <small className="text-[11px] text-[#8A91A6]">Ejecuta tareas cada dia seleccionado.</small>
                                        </span>
                                    </button>

                                    <button
                                        type="button"
                                        className="mt-5 h-11 px-5 rounded-[10px] bg-black text-white text-[12px] font-bold inline-flex items-center gap-2"
                                        onClick={runManualDeductions}
                                    >
                                        <CalendarDays size={14} /> Ejecutar Deducciones Manuales
                                    </button>

                                    <div className="mt-3 flex items-start gap-2 text-[11px] text-[#A3A9BA]">
                                        <input type="radio" checked readOnly className="mt-[2px] h-3 w-3" />
                                        <span>Revisar esta accion unicamente si tiene autorizaciones administrativas.</span>
                                    </div>

                                    {lastExecution && (
                                        <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12px] font-semibold text-emerald-700">
                                            <Check size={14} /> Ultima ejecucion manual: {lastExecution}
                                        </div>
                                    )}
                                </div>

                                <aside className="rounded-xl border border-[#E8EBF3] bg-[#FAFBFF] p-4 h-fit">
                                    <div className="flex items-center justify-between mb-3">
                                        <strong className="text-[14px] font-extrabold text-[#3A4256]">{monthLabel}</strong>
                                        <div className="inline-flex items-center gap-1">
                                            <button
                                                type="button"
                                                aria-label="Mes anterior"
                                                className="h-6 w-6 rounded-md border border-[#E5E8F1] text-[#9AA1B5] grid place-items-center"
                                            >
                                                <ChevronLeft size={12} />
                                            </button>
                                            <button
                                                type="button"
                                                aria-label="Mes siguiente"
                                                className="h-6 w-6 rounded-md border border-[#E5E8F1] text-[#9AA1B5] grid place-items-center"
                                            >
                                                <ChevronRight size={12} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-7 text-center text-[10px] font-semibold text-[#A0A7BA] mb-1">
                                        {weekDays.map((day) => (
                                            <span key={day}>{day}</span>
                                        ))}
                                    </div>

                                    <div className="grid grid-cols-7 gap-y-1 text-center">
                                        {daysGrid.map((day, index) => (
                                            <button
                                                type="button"
                                                key={`${day || "empty"}-${index}`}
                                                className={`h-7 w-7 mx-auto rounded-full text-[11px] font-semibold ${
                                                    day === null
                                                        ? "opacity-0 cursor-default"
                                                        : day === selectedDate
                                                        ? "bg-[#7C3AED] text-white"
                                                        : "text-[#525A70] hover:bg-[#EEF1FA]"
                                                }`}
                                                onClick={() => {
                                                    if (day !== null) setSelectedDate(day);
                                                }}
                                                disabled={day === null}
                                            >
                                                {day || ""}
                                            </button>
                                        ))}
                                    </div>

                                    <p className="text-[10px] text-[#9EA5B8] mt-4">
                                        Proxima ejecucion: <strong className="text-[#495063]">15 de Octubre, 08:00 AM</strong>
                                    </p>
                                </aside>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}