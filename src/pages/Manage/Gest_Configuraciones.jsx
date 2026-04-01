import { useState, useEffect, useMemo } from "react";
import {
    CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight,
    Plus, Shield, Timer, Wallet, Warehouse, X, Loader2,
    MessageSquare, Bell, Save, Zap
} from "lucide-react";
import {
    obtenerConfiguracion, actualizarConfiguracion,
    obtenerPlazos, agregarPlazo, eliminarPlazo,
    obtenerGarantias, agregarGarantia, eliminarGarantia
} from "../../services/configuracionesService";

const weekDays = ["L", "M", "X", "J", "V", "S", "D"];

function generarGridMes(año, mes) {
    const primerDia = new Date(año, mes, 1).getDay();
    const offset = primerDia === 0 ? 6 : primerDia - 1;
    const diasEnMes = new Date(año, mes + 1, 0).getDate();
    const grid = Array(offset).fill(null);
    for (let i = 1; i <= diasEnMes; i++) grid.push(i);
    while (grid.length % 7 !== 0) grid.push(null);
    return grid;
}

const NOMBRES_MESES = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export default function Gest_Configuraciones() {
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [guardado, setGuardado] = useState(false);

    // Config principal
    const [mensajeEspera, setMensajeEspera] = useState("");
    const [mensajeAprobado, setMensajeAprobado] = useState("");
    const [mensajeRechazado, setMensajeRechazado] = useState("");
    const [porcSueldo, setPorcSueldo] = useState("30");
    const [porcentajeInteres, setPorcentajeInteres] = useState("15");
    const [stockAviso, setStockAviso] = useState("8");
    const [stockCierre, setStockCierre] = useState("2");
    const [correoNotificaciones, setCorreoNotificaciones] = useState("");
    const [tiempoInactividad, setTiempoInactividad] = useState("15");
    const [diaFechaCobro, setDiaFechaCobro] = useState("1");
    const [deduccionesAutomaticas, setDeduccionesAutomaticas] = useState(true);
    const [ultimaEjecucion, setUltimaEjecucion] = useState(null);

    // Plazos
    const [plazos, setPlazos] = useState([]);
    const [nuevoPlazoMeses, setNuevoPlazoMeses] = useState("");
    const [agregandoPlazo, setAgregandoPlazo] = useState(false);

    // Garantías
    const [garantias, setGarantias] = useState([]);
    const [nuevaGarantia, setNuevaGarantia] = useState({ tipo: "meses", valor: "", requiereRevision: false });
    const [agregandoGarantia, setAgregandoGarantia] = useState(false);

    // Calendario
    const hoy = new Date();
    const [mesCalendario, setMesCalendario] = useState(hoy.getMonth());
    const [añoCalendario, setAñoCalendario] = useState(hoy.getFullYear());

    const diasGrid = useMemo(
        () => generarGridMes(añoCalendario, mesCalendario),
        [añoCalendario, mesCalendario]
    );

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        setCargando(true);
        try {
            const [config, plazosData, garantiasData] = await Promise.all([
                obtenerConfiguracion(),
                obtenerPlazos(),
                obtenerGarantias()
            ]);

            setMensajeEspera(config.mensajeEspera || "");
            setMensajeAprobado(config.mensajeAprobado || "");
            setMensajeRechazado(config.mensajeRechazado || "");
            setPorcSueldo(String(Math.round((config.porcSueldo || 0.3) * 100)));
            setPorcentajeInteres(String(Math.round((config.porcentajeInteres || 0.15) * 100)));
            setStockAviso(String(config.StockMinimoAviso || 8));
            setStockCierre(String(config.StockMinimoCierre || 2));
            setCorreoNotificaciones(config.CorreoNotificaciones || "");
            setTiempoInactividad(String(config.tiempoInactividad || 15));
            setDiaFechaCobro(String(config.diaFechaCobro || "1"));
            setPlazos(plazosData);
            setGarantias(garantiasData);
        } catch (error) {
            console.error("Error al cargar configuración:", error);
        } finally {
            setCargando(false);
        }
    };

    const handleGuardar = async () => {
        setGuardando(true);
        try {
            await actualizarConfiguracion({
                mensajeEspera,
                mensajeAprobado,
                mensajeRechazado,
                porcSueldo: parseFloat(porcSueldo) / 100,
                porcentajeInteres: parseFloat(porcentajeInteres) / 100,
                StockMinimoAviso: parseInt(stockAviso),
                StockMinimoCierre: parseInt(stockCierre),
                CorreoNotificaciones: correoNotificaciones,
                tiempoInactividad: parseInt(tiempoInactividad),
                diaFechaCobro: String(diaFechaCobro),
            });
            setGuardado(true);
            setTimeout(() => setGuardado(false), 3000);
        } catch (error) {
            alert("Error al guardar la configuración.");
        } finally {
            setGuardando(false);
        }
    };

    const handleAgregarPlazo = async () => {
        const meses = parseInt(nuevoPlazoMeses);
        if (!meses || meses <= 0) return;
        if (plazos.some(p => p.plazoMeses === meses)) return alert("Ese plazo ya existe.");
        setAgregandoPlazo(true);
        try {
            const nuevo = await agregarPlazo(meses);
            setPlazos(prev => [...prev, nuevo].sort((a, b) => a.plazoMeses - b.plazoMeses));
            setNuevoPlazoMeses("");
        } catch (error) {
            alert("Error al agregar el plazo.");
        } finally {
            setAgregandoPlazo(false);
        }
    };

    const handleEliminarPlazo = async (plazo) => {
        try {
            await eliminarPlazo(plazo.id);
            setPlazos(prev => prev.filter(p => p.id !== plazo.id));
        } catch (error) {
            alert("No se pudo eliminar el plazo.");
        }
    };

    const handleAgregarGarantia = async () => {
        const valor = parseInt(nuevaGarantia.valor);
        if (!valor || valor <= 0) return;
        setAgregandoGarantia(true);
        try {
            const datos = {
                requiereRevision: nuevaGarantia.requiereRevision,
                ...(nuevaGarantia.tipo === "meses"
                    ? { mesesCobertura: valor }
                    : { diasCobertura: valor })
            };
            const nueva = await agregarGarantia(datos);
            setGarantias(prev => [...prev, nueva]);
            setNuevaGarantia({ tipo: "meses", valor: "", requiereRevision: false });
        } catch (error) {
            alert("Error al agregar la garantía.");
        } finally {
            setAgregandoGarantia(false);
        }
    };

    const handleEliminarGarantia = async (garantia) => {
        try {
            await eliminarGarantia(garantia.id);
            setGarantias(prev => prev.filter(g => g.id !== garantia.id));
        } catch (error) {
            alert("No se pudo eliminar la garantía.");
        }
    };

    const handleEjecutarManual = () => {
        const now = new Date();
        setUltimaEjecucion(now.toLocaleString("es-HN", {
            day: "2-digit", month: "2-digit", year: "numeric",
            hour: "2-digit", minute: "2-digit"
        }));
    };

    if (cargando) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8F9FF]">
                <Loader2 className="w-10 h-10 animate-spin text-[#7C3AED]" />
                <p className="mt-4 text-sm font-bold text-gray-400 uppercase tracking-widest">Cargando configuración...</p>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-[1600px] mx-auto">
            <section className="rounded-[1.6rem] border border-[#E6E8F2] bg-[#F8F9FF] overflow-hidden">

                {/* Breadcrumb */}
                <div className="px-6 md:px-8 py-5 border-b border-[#E6E8F2] flex items-center justify-between gap-2 text-[14px] font-semibold">
                    <div className="flex items-center gap-2">
                        <span className="text-[#9AA1B5]">Administración</span>
                        <ChevronRight size={15} className="text-[#C1C7D7]" />
                        <span className="text-[#7C3AED]">Configuraciones</span>
                    </div>

                    {/* Botón guardar flotante en el header */}
                    <button
                        onClick={handleGuardar}
                        disabled={guardando}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all shadow-sm
                            ${guardado
                                ? 'bg-green-500 text-white'
                                : guardando
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-[#020817] text-white hover:bg-black'
                            }`}
                    >
                        {guardando ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : guardado ? (
                            <Check size={14} />
                        ) : (
                            <Save size={14} />
                        )}
                        {guardando ? "Guardando..." : guardado ? "¡Guardado!" : "Guardar Cambios"}
                    </button>
                </div>

                <div className="px-6 md:px-8 py-7">
                    <header className="mb-6">
                        <h1 className="text-[34px] leading-none font-black text-[#101828]">Configuraciones Globales</h1>
                        <p className="text-[14px] text-[#6A7288] mt-2">
                            Configure los valores predeterminados para ambas plataformas.
                        </p>
                    </header>

                    <div className="rounded-[1.25rem] border border-[#E6E8F2] bg-white overflow-hidden flex flex-col divide-y divide-[#EEF0F6]">

                        {/* ==================== GESTIÓN DE CRÉDITOS ==================== */}
                        <div>
                            <div className="px-4 md:px-6 py-5 border-b border-[#EEF0F6]">
                                <h2 className="flex items-center gap-2 text-[23px] font-black tracking-tight text-[#2D3648]">
                                    <Wallet size={20} className="text-[#7C3AED]" /> GESTIÓN DE CRÉDITOS
                                </h2>
                            </div>

                            <div className="px-4 md:px-6 py-5 space-y-5">

                                {/* Mensaje de espera */}
                                <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4 items-start">
                                    <div>
                                        <p className="text-[14px] font-bold text-[#2D3648]">Mensaje de espera</p>
                                        <p className="text-[12px] text-[#8A91A6] leading-4 mt-1">Texto mostrado durante la validación del buró de crédito.</p>
                                    </div>
                                    <textarea
                                        value={mensajeEspera}
                                        onChange={(e) => setMensajeEspera(e.target.value)}
                                        rows={2}
                                        className="w-full resize-none rounded-[10px] border border-[#E5E8F1] bg-[#F6F7FB] px-4 py-3 text-[13px] text-[#5D6578] outline-none focus:ring-2 focus:ring-[#7C3AED]/20"
                                    />
                                </div>

                                {/* Mensaje aprobado */}
                                <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4 items-start">
                                    <div>
                                        <p className="text-[14px] font-bold text-[#2D3648]">Mensaje de aprobación</p>
                                        <p className="text-[12px] text-[#8A91A6] leading-4 mt-1">Notificación enviada cuando el crédito es aprobado.</p>
                                    </div>
                                    <textarea
                                        value={mensajeAprobado}
                                        onChange={(e) => setMensajeAprobado(e.target.value)}
                                        rows={2}
                                        className="w-full resize-none rounded-[10px] border border-[#E5E8F1] bg-[#F6F7FB] px-4 py-3 text-[13px] text-[#5D6578] outline-none focus:ring-2 focus:ring-[#7C3AED]/20"
                                    />
                                </div>

                                {/* Mensaje rechazado */}
                                <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4 items-start">
                                    <div>
                                        <p className="text-[14px] font-bold text-[#2D3648]">Mensaje de rechazo</p>
                                        <p className="text-[12px] text-[#8A91A6] leading-4 mt-1">Notificación enviada cuando el crédito es denegado.</p>
                                    </div>
                                    <textarea
                                        value={mensajeRechazado}
                                        onChange={(e) => setMensajeRechazado(e.target.value)}
                                        rows={2}
                                        className="w-full resize-none rounded-[10px] border border-[#E5E8F1] bg-[#F6F7FB] px-4 py-3 text-[13px] text-[#5D6578] outline-none focus:ring-2 focus:ring-[#7C3AED]/20"
                                    />
                                </div>

                                {/* Límites y tasa */}
                                <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4 items-start">
                                    <div>
                                        <p className="text-[14px] font-bold text-[#2D3648]">Límites y Tasa Base</p>
                                        <p className="text-[12px] text-[#8A91A6] leading-4 mt-1">Valores por defecto para nuevos solicitantes.</p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div>
                                            <div className="relative">
                                                <input
                                                    type="number" min="0" max="100"
                                                    value={porcSueldo}
                                                    onChange={(e) => setPorcSueldo(e.target.value)}
                                                    className="w-full h-11 rounded-[10px] border border-[#E5E8F1] bg-[#F6F7FB] px-4 pr-8 text-[14px] text-[#495063] outline-none focus:ring-2 focus:ring-[#7C3AED]/20"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-bold text-[#A4ABBD]">%</span>
                                            </div>
                                            <p className="mt-1 text-[10px] font-bold text-[#B0B6C7] uppercase tracking-wide">Límite máximo de crédito (% del sueldo base)</p>
                                        </div>
                                        <div>
                                            <div className="relative">
                                                <input
                                                    type="number" min="0" max="100" step="0.1"
                                                    value={porcentajeInteres}
                                                    onChange={(e) => setPorcentajeInteres(e.target.value)}
                                                    className="w-full h-11 rounded-[10px] border border-[#E5E8F1] bg-[#F6F7FB] px-4 pr-8 text-[14px] text-[#495063] outline-none focus:ring-2 focus:ring-[#7C3AED]/20"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-bold text-[#A4ABBD]">%</span>
                                            </div>
                                            <p className="mt-1 text-[10px] font-bold text-[#B0B6C7] uppercase tracking-wide">Tasa de interés (se aplica al precio crédito)</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Gestión de plazos */}
                                <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4 items-start">
                                    <div>
                                        <p className="text-[14px] font-bold text-[#2D3648]">Gestión de Plazos</p>
                                        <p className="text-[12px] text-[#8A91A6] leading-4 mt-1">Opciones de créditos aplicables.</p>
                                    </div>
                                    <div className="flex flex-col gap-3">
                                        <div className="rounded-[10px] border border-[#E5E8F1] bg-[#F9FAFD] min-h-11 px-2 py-1.5 flex flex-wrap items-center gap-2">
                                            {plazos.map((plazo) => (
                                                <button
                                                    key={plazo.id}
                                                    type="button"
                                                    onClick={() => handleEliminarPlazo(plazo)}
                                                    className="h-7 px-2.5 rounded-full bg-white border border-[#E6E9F2] text-[11px] font-semibold text-[#667086] inline-flex items-center gap-1.5 hover:border-red-200 hover:text-red-500 transition-colors"
                                                >
                                                    {plazo.plazoMeses} {plazo.plazoMeses === 1 ? 'mes' : 'meses'}
                                                    <X size={11} />
                                                </button>
                                            ))}
                                            {plazos.length === 0 && (
                                                <span className="text-[11px] text-[#B0B6C7] px-2">Sin plazos configurados</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number" min="1" max="60"
                                                value={nuevoPlazoMeses}
                                                onChange={(e) => setNuevoPlazoMeses(e.target.value)}
                                                placeholder="Ej: 24"
                                                className="w-28 h-9 rounded-[10px] border border-[#E5E8F1] bg-[#F6F7FB] px-3 text-[13px] text-[#495063] outline-none focus:ring-2 focus:ring-[#7C3AED]/20"
                                            />
                                            <span className="text-[12px] text-[#8A91A6]">meses</span>
                                            <button
                                                type="button"
                                                onClick={handleAgregarPlazo}
                                                disabled={!nuevoPlazoMeses || agregandoPlazo}
                                                className="h-9 px-4 rounded-full bg-[#020817] text-white text-[11px] font-bold inline-flex items-center gap-1.5 disabled:opacity-40 hover:bg-black transition-colors"
                                            >
                                                {agregandoPlazo ? <Loader2 size={11} className="animate-spin" /> : <Plus size={11} />}
                                                AGREGAR
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Gestión de garantías */}
                                <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4 items-start">
                                    <div>
                                        <p className="text-[14px] font-bold text-[#2D3648]">Plazos de Garantía</p>
                                        <p className="text-[12px] text-[#8A91A6] leading-4 mt-1">Opciones disponibles al registrar productos.</p>
                                    </div>
                                    <div className="flex flex-col gap-3">
                                        <div className="rounded-[10px] border border-[#E5E8F1] bg-[#F9FAFD] min-h-11 px-2 py-1.5 flex flex-wrap items-center gap-2">
                                            {garantias.map((g) => (
                                                <button
                                                    key={g.id}
                                                    type="button"
                                                    onClick={() => handleEliminarGarantia(g)}
                                                    className="h-7 px-2.5 rounded-full bg-white border border-[#E6E9F2] text-[11px] font-semibold text-[#667086] inline-flex items-center gap-1.5 hover:border-red-200 hover:text-red-500 transition-colors"
                                                >
                                                    {g.diasCobertura
                                                        ? `${g.diasCobertura} días`
                                                        : `${g.mesesCobertura} meses`}
                                                    {g.requiereRevision && <span className="text-amber-500">·R</span>}
                                                    <X size={11} />
                                                </button>
                                            ))}
                                            {garantias.length === 0 && (
                                                <span className="text-[11px] text-[#B0B6C7] px-2">Sin garantías configuradas</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <select
                                                value={nuevaGarantia.tipo}
                                                onChange={(e) => setNuevaGarantia(prev => ({ ...prev, tipo: e.target.value }))}
                                                className="h-9 rounded-[10px] border border-[#E5E8F1] bg-[#F6F7FB] px-3 text-[13px] text-[#495063] outline-none"
                                            >
                                                <option value="dias">Días</option>
                                                <option value="meses">Meses</option>
                                            </select>
                                            <input
                                                type="number" min="1"
                                                value={nuevaGarantia.valor}
                                                onChange={(e) => setNuevaGarantia(prev => ({ ...prev, valor: e.target.value }))}
                                                placeholder="Ej: 12"
                                                className="w-24 h-9 rounded-[10px] border border-[#E5E8F1] bg-[#F6F7FB] px-3 text-[13px] text-[#495063] outline-none focus:ring-2 focus:ring-[#7C3AED]/20"
                                            />
                                            <label className="inline-flex items-center gap-1.5 text-[12px] text-[#7A8197] cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={nuevaGarantia.requiereRevision}
                                                    onChange={(e) => setNuevaGarantia(prev => ({ ...prev, requiereRevision: e.target.checked }))}
                                                    className="h-3.5 w-3.5 rounded accent-[#7C3AED]"
                                                />
                                                Requiere revisión
                                            </label>
                                            <button
                                                type="button"
                                                onClick={handleAgregarGarantia}
                                                disabled={!nuevaGarantia.valor || agregandoGarantia}
                                                className="h-9 px-4 rounded-full bg-[#020817] text-white text-[11px] font-bold inline-flex items-center gap-1.5 disabled:opacity-40 hover:bg-black transition-colors"
                                            >
                                                {agregandoGarantia ? <Loader2 size={11} className="animate-spin" /> : <Plus size={11} />}
                                                AGREGAR
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ==================== CONTROL DE INVENTARIO ==================== */}
                        <div className="px-4 md:px-6 py-6 space-y-5">
                            <h2 className="flex items-center gap-2 text-[23px] font-black tracking-tight text-[#2D3648]">
                                <Warehouse size={20} className="text-[#7C3AED]" /> CONTROL DE INVENTARIO
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[14px] font-bold text-[#2D3648]">Stock mínimo de aviso</p>
                                    <p className="text-[12px] text-[#8A91A6] leading-4 mt-1">Umbral para emitir un aviso de forma automatizada.</p>
                                    <input
                                        type="number" min="0"
                                        value={stockAviso}
                                        onChange={(e) => setStockAviso(e.target.value)}
                                        className="mt-2 w-full h-11 rounded-[10px] border border-[#E5E8F1] bg-[#F6F7FB] px-4 text-[14px] text-[#495063] outline-none focus:ring-2 focus:ring-[#7C3AED]/20"
                                    />
                                </div>
                                <div>
                                    <p className="text-[14px] font-bold text-[#2D3648]">Stock mínimo de cierre</p>
                                    <p className="text-[12px] text-[#8A91A6] leading-4 mt-1">Umbral para desactivar la posibilidad de compra en ComisApp.</p>
                                    <input
                                        type="number" min="0"
                                        value={stockCierre}
                                        onChange={(e) => setStockCierre(e.target.value)}
                                        className="mt-2 w-full h-11 rounded-[10px] border border-[#E5E8F1] bg-[#F6F7FB] px-4 text-[14px] text-[#495063] outline-none focus:ring-2 focus:ring-[#7C3AED]/20"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* ==================== NOTIFICACIONES ==================== */}
                        <div className="px-4 md:px-6 py-6 space-y-5">
                            <h2 className="flex items-center gap-2 text-[23px] font-black tracking-tight text-[#2D3648]">
                                <Bell size={20} className="text-[#7C3AED]" /> NOTIFICACIONES
                            </h2>

                            <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4 items-center">
                                <div>
                                    <p className="text-[14px] font-bold text-[#2D3648]">Correo de notificaciones</p>
                                    <p className="text-[12px] text-[#8A91A6] leading-4 mt-1">Destino de alertas automáticas del sistema.</p>
                                </div>
                                <input
                                    type="email"
                                    value={correoNotificaciones}
                                    onChange={(e) => setCorreoNotificaciones(e.target.value)}
                                    placeholder="admin@empresa.com"
                                    className="w-full h-11 rounded-[10px] border border-[#E5E8F1] bg-[#F6F7FB] px-4 text-[14px] text-[#495063] outline-none focus:ring-2 focus:ring-[#7C3AED]/20"
                                />
                            </div>
                        </div>

                        {/* ==================== SEGURIDAD Y ACTIVIDAD ==================== */}
                        <div className="px-4 md:px-6 py-6 space-y-5">
                            <h2 className="flex items-center gap-2 text-[23px] font-black tracking-tight text-[#2D3648]">
                                <Shield size={20} className="text-[#7C3AED]" /> SEGURIDAD Y ACTIVIDAD
                            </h2>

                            <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4 items-center">
                                <div>
                                    <p className="text-[14px] font-bold text-[#2D3648]">Inactividad de sesión</p>
                                    <p className="text-[12px] text-[#8A91A6] leading-4 mt-1">Tiempo antes de cerrar sesión automáticamente.</p>
                                </div>
                                <div className="relative">
                                    <select
                                        value={tiempoInactividad}
                                        onChange={(e) => setTiempoInactividad(e.target.value)}
                                        className="w-full h-11 appearance-none rounded-[10px] border border-[#E5E8F1] bg-[#F6F7FB] px-4 pr-9 text-[14px] text-[#495063] outline-none"
                                    >
                                        <option value="15">15 Minutos</option>
                                        <option value="30">30 Minutos</option>
                                        <option value="45">45 Minutos</option>
                                        <option value="60">60 Minutos</option>
                                    </select>
                                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A4ABBD] pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        {/* ==================== HORARIO Y AUTOMATIZACIÓN ==================== */}
                        <div className="px-4 md:px-6 py-6 space-y-5">
                            <h2 className="flex items-center gap-2 text-[23px] font-black tracking-tight text-[#2D3648]">
                                <Timer size={20} className="text-[#7C3AED]" /> HORARIO Y AUTOMATIZACIÓN
                            </h2>

                            <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-5">
                                <div>
                                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-4">
                                        <div>
                                            <p className="text-[14px] font-bold text-[#2D3648]">Próxima Fecha de Deducción</p>
                                            <p className="text-[12px] text-[#8A91A6] leading-4 mt-1">Configure el ciclo de deducciones automáticas del sistema.</p>
                                        </div>
                                        <div className="relative">
                                            <select
                                                value={diaFechaCobro}
                                                onChange={(e) => setDiaFechaCobro(e.target.value)}
                                                className="w-full h-11 appearance-none rounded-[10px] border border-[#E5E8F1] bg-[#F6F7FB] px-4 pr-9 text-[14px] text-[#495063] outline-none"
                                            >
                                                {[1, 5, 10, 15, 20, 25].map(d => (
                                                    <option key={d} value={String(d)}>Día {d}</option>
                                                ))}
                                            </select>
                                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A4ABBD] pointer-events-none" />
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => setDeduccionesAutomaticas(prev => !prev)}
                                        className="mt-4 inline-flex items-center gap-3"
                                    >
                                        <span className={`h-5 w-9 rounded-full p-[2px] transition ${deduccionesAutomaticas ? "bg-[#2563EB]" : "bg-[#D5DBEB]"}`}>
                                            <span className={`block h-4 w-4 rounded-full bg-white transition ${deduccionesAutomaticas ? "translate-x-4" : "translate-x-0"}`} />
                                        </span>
                                        <span className="text-left">
                                            <strong className="block text-[12px] font-bold text-[#2D3648]">Deducciones Automáticas (Recomendado)</strong>
                                            <small className="text-[11px] text-[#8A91A6]">Ejecuta tareas cada día seleccionado.</small>
                                        </span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleEjecutarManual}
                                        className="mt-5 h-11 px-3 ml-40 rounded-[10px] bg-black text-white text-[12px] font-bold inline-flex items-center gap-2 hover:bg-gray-900 transition-colors"
                                    >
                                        <Zap size={14} /> Ejecutar Deducciones Manuales
                                    </button>

                                    <div className="mt-3 flex items-start gap-2 text-[11px] text-[#A3A9BA]">
                                        <input type="radio" readOnly checked className="mt-[2px] h-3 w-3 accent-[#7C3AED]" />
                                        <span>Revisar esta acción únicamente si tiene autorizaciones administrativas.</span>
                                    </div>

                                    {ultimaEjecucion && (
                                        <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12px] font-semibold text-emerald-700">
                                            <Check size={14} /> Última ejecución manual: {ultimaEjecucion}
                                        </div>
                                    )}
                                </div>

                                {/* Calendario */}
                                <aside className="rounded-xl border border-[#E8EBF3] bg-[#FAFBFF] p-4 h-fit">
                                    <div className="flex items-center justify-between mb-3">
                                        <strong className="text-[14px] font-extrabold text-[#3A4256]">
                                            {NOMBRES_MESES[mesCalendario]} {añoCalendario}
                                        </strong>
                                        <div className="inline-flex items-center gap-1">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (mesCalendario === 0) { setMesCalendario(11); setAñoCalendario(a => a - 1); }
                                                    else setMesCalendario(m => m - 1);
                                                }}
                                                className="h-6 w-6 rounded-md border border-[#E5E8F1] text-[#9AA1B5] grid place-items-center hover:bg-gray-50"
                                            >
                                                <ChevronLeft size={12} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (mesCalendario === 11) { setMesCalendario(0); setAñoCalendario(a => a + 1); }
                                                    else setMesCalendario(m => m + 1);
                                                }}
                                                className="h-6 w-6 rounded-md border border-[#E5E8F1] text-[#9AA1B5] grid place-items-center hover:bg-gray-50"
                                            >
                                                <ChevronRight size={12} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-7 text-center text-[10px] font-semibold text-[#A0A7BA] mb-1">
                                        {weekDays.map(d => <span key={d}>{d}</span>)}
                                    </div>

                                    <div className="grid grid-cols-7 gap-y-1 text-center">
                                        {diasGrid.map((day, index) => (
                                            <button
                                                type="button"
                                                key={`${day || "e"}-${index}`}
                                                disabled={day === null}
                                                onClick={() => { if (day !== null) setDiaFechaCobro(String(day)); }}
                                                className={`h-7 w-7 mx-auto rounded-full text-[11px] font-semibold transition-colors ${
                                                    day === null ? "opacity-0 cursor-default"
                                                    : String(day) === String(diaFechaCobro) ? "bg-[#7C3AED] text-white"
                                                    : "text-[#525A70] hover:bg-[#EEF1FA]"
                                                }`}
                                            >
                                                {day || ""}
                                            </button>
                                        ))}
                                    </div>

                                    <p className="text-[10px] text-[#9EA5B8] mt-4">
                                        Próxima deducción: <strong className="text-[#495063]">Día {diaFechaCobro} de {NOMBRES_MESES[mesCalendario]}</strong>
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