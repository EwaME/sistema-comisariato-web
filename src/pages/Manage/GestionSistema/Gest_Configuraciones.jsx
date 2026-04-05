import { useState, useEffect, useMemo } from "react";
import {
    CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight,
    Plus, Shield, Timer, Wallet, Warehouse, X, Loader2,
    MessageSquare, Bell, Save, Zap, KeyRound
} from "lucide-react";
import {
    obtenerConfiguracion, actualizarConfiguracion,
    obtenerPlazos, agregarPlazo, eliminarPlazo,
    obtenerGarantias, agregarGarantia, eliminarGarantia
} from "../../../services/configuracionesService";

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

    // Modal Deducciones
    const [modalDeducciones, setModalDeducciones] = useState(false);
    const [inputPassword, setInputPassword] = useState("");
    const [ejecutandoManual, setEjecutandoManual] = useState(false);

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

    // Confirmación del Modal de Deducciones
    const confirmarEjecucionManual = () => {
        setEjecutandoManual(true);
        // Simulando la verificación y ejecución... 
        // Aquí iría tu lógica real o Firebase Function
        setTimeout(() => {
            const now = new Date();
            setUltimaEjecucion(now.toLocaleString("es-HN", {
                day: "2-digit", month: "2-digit", year: "numeric",
                hour: "2-digit", minute: "2-digit"
            }));
            setEjecutandoManual(false);
            setModalDeducciones(false);
            setInputPassword("");
        }, 1500);
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
        <div className="p-4 md:p-8 max-w-[1600px] mx-auto relative">
            <section className="rounded-[1.6rem] border border-[#E6E8F2] bg-[#F8F9FF] overflow-hidden">

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
                                            <label className="inline-flex items-center gap-1.5 text-[12px] text-[#7A8197] cursor-pointer ml-2">
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
                                                className="ml-2 h-9 px-4 rounded-full bg-[#020817] text-white text-[11px] font-bold inline-flex items-center gap-1.5 disabled:opacity-40 hover:bg-black transition-colors"
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
                                        className="w-full h-11 appearance-none rounded-[10px] border border-[#E5E8F1] bg-[#F6F7FB] px-4 pr-9 text-[14px] text-[#495063] outline-none focus:ring-2 focus:ring-[#7C3AED]/20"
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

                            <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-8 items-start">
                                
                                {/* Columna Izquierda: Controles y Ejecución Manual */}
                                <div className="flex flex-col gap-6">
                                    <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-4">
                                        <div>
                                            <p className="text-[14px] font-bold text-[#2D3648]">Próxima Fecha de Deducción</p>
                                            <p className="text-[12px] text-[#8A91A6] leading-4 mt-1">Configure el día del mes para el cobro automático.</p>
                                        </div>
                                        <div className="relative max-w-[200px]">
                                            <select
                                                value={diaFechaCobro}
                                                onChange={(e) => setDiaFechaCobro(e.target.value)}
                                                className="w-full h-11 appearance-none rounded-[10px] border border-[#E5E8F1] bg-[#F6F7FB] px-4 pr-9 text-[14px] text-[#495063] outline-none focus:ring-2 focus:ring-[#7C3AED]/20"
                                            >
                                                {[1, 5, 10, 15, 20, 25].map(d => (
                                                    <option key={d} value={String(d)}>Día {d}</option>
                                                ))}
                                            </select>
                                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A4ABBD] pointer-events-none" />
                                        </div>
                                    </div>

                                    <div className="bg-[#F8F9FF] p-5 rounded-2xl border border-[#EEF0F6]">
                                        <div className="flex items-center justify-between mb-2">
                                            <div>
                                                <strong className="block text-[14px] font-extrabold text-[#2D3648]">Deducciones Automáticas</strong>
                                                <small className="text-[12px] text-[#8A91A6]">Ejecuta tareas cada día seleccionado (Recomendado).</small>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setDeduccionesAutomaticas(prev => !prev)}
                                                className={`relative h-6 w-11 rounded-full transition-colors ${deduccionesAutomaticas ? "bg-[#7C3AED]" : "bg-[#D5DBEB]"}`}
                                            >
                                                <span className={`absolute left-1 top-1 block h-4 w-4 rounded-full bg-white transition-transform ${deduccionesAutomaticas ? "translate-x-5" : "translate-x-0"}`} />
                                            </button>
                                        </div>
                                        
                                        <hr className="my-4 border-[#E6E8F2]"/>
                                        
                                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                            <div className="flex items-start gap-2 text-[11px] text-[#585a5f] max-w-[240px]">
                                                <Zap size={14} className="text-orange-500 shrink-0 mt-0.5" />
                                                <span>Si deshabilitas la automatización u ocurre un error, deberás forzar los cobros manualmente.</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setModalDeducciones(true)}
                                                className="h-10 px-4 rounded-xl bg-black border text-white text-[12px] font-bold inline-flex items-center gap-2 hover:bg-gray-500 transition-colors whitespace-nowrap"
                                            >
                                                <Timer size={14} /> Ejecutar Deducción Manual
                                            </button>
                                        </div>
                                        
                                        {ultimaEjecucion && (
                                            <div className="mt-4 w-full flex items-center justify-center gap-2 rounded-lg bg-white border border-gray-100 px-3 py-2 text-[11px] font-semibold text-gray-500 shadow-sm">
                                                <Check size={12} className="text-emerald-500" /> Última ejecución manual: {ultimaEjecucion}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Columna Derecha: Calendario (Widget Style) */}
                                <aside className="rounded-[1.25rem] border border-[#E8EBF3] bg-white p-5 shadow-[0_4px_20px_rgb(0,0,0,0.03)] h-fit mx-auto lg:mx-0 w-full max-w-[320px]">
                                    <div className="flex items-center justify-between mb-4">
                                        <strong className="text-[15px] font-extrabold text-[#020817] uppercase tracking-wide">
                                            {NOMBRES_MESES[mesCalendario]} {añoCalendario}
                                        </strong>
                                        <div className="inline-flex items-center gap-1">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (mesCalendario === 0) { setMesCalendario(11); setAñoCalendario(a => a - 1); }
                                                    else setMesCalendario(m => m - 1);
                                                }}
                                                className="h-7 w-7 rounded-lg border border-[#E5E8F1] text-[#9AA1B5] flex items-center justify-center hover:bg-gray-50 transition-colors"
                                            >
                                                <ChevronLeft size={14} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (mesCalendario === 11) { setMesCalendario(0); setAñoCalendario(a => a + 1); }
                                                    else setMesCalendario(m => m + 1);
                                                }}
                                                className="h-7 w-7 rounded-lg border border-[#E5E8F1] text-[#9AA1B5] flex items-center justify-center hover:bg-gray-50 transition-colors"
                                            >
                                                <ChevronRight size={14} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-7 text-center text-[10px] font-black text-[#A0A7BA] mb-2">
                                        {weekDays.map(d => <span key={d} className="py-1">{d}</span>)}
                                    </div>

                                    <div className="grid grid-cols-7 gap-y-1 gap-x-1 text-center">
                                        {diasGrid.map((day, index) => (
                                            <button
                                                type="button"
                                                key={`${day || "e"}-${index}`}
                                                disabled={day === null}
                                                onClick={() => { if (day !== null) setDiaFechaCobro(String(day)); }}
                                                className={`h-8 w-full rounded-lg text-[12px] font-bold transition-all ${
                                                    day === null ? "opacity-0 cursor-default"
                                                    : String(day) === String(diaFechaCobro) ? "bg-[#7C3AED] text-white shadow-md shadow-[#7C3AED]/30 scale-105"
                                                    : "text-[#525A70] hover:bg-[#F3F4F6]"
                                                }`}
                                            >
                                                {day || ""}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="mt-5 pt-4 border-t border-[#F0F2F8] text-center">
                                        <p className="text-[11px] text-[#9EA5B8]">
                                            Día de cobro: <strong className="text-[#020817] bg-gray-100 px-2 py-0.5 rounded">Día {diaFechaCobro}</strong>
                                        </p>
                                    </div>
                                </aside>

                            </div>
                        </div>

                    </div>
                    <div className="px-6 md:px-8 py-5 border-t border-[#E6E8F2] flex justify-end">
                    <button
                        onClick={handleGuardar}
                        disabled={guardando}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[15px] font-bold uppercase tracking-widest transition-all shadow-sm
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
                </div>
            </section>

            {/* MODAL EJECUTAR DEDUCCIONES MANUALES */}
            {modalDeducciones && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#020817]/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[1.5rem] shadow-2xl w-full max-w-md overflow-hidden transform transition-all border border-gray-100">
                        <div className="bg-orange-50/80 p-6 flex flex-col items-center border-b border-orange-100 relative">
                            <button onClick={() => {setModalDeducciones(false); setInputPassword("");}} className="absolute top-4 right-4 text-orange-400 hover:text-orange-600 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md mb-4 border border-orange-100">
                                <Zap className="w-8 h-8 text-orange-500 fill-orange-100" />
                            </div>
                            <h3 className="text-lg font-extrabold text-[#020817] text-center">¿Ejecutar Deducciones?</h3>
                            <p className="text-[12px] font-medium text-orange-600 mt-2 text-center px-4 leading-relaxed">
                                Esta acción procesará todos los cobros programados de forma inmediata. Solo usa esto si el proceso automático falló.
                            </p>
                        </div>
                        <div className="p-6">
                            <div className="mb-5">
                                <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-widest mb-2 text-center">
                                    Autenticación Requerida
                                </label>
                                <div className="relative">
                                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input 
                                        type="password"
                                        value={inputPassword}
                                        onChange={(e) => setInputPassword(e.target.value)}
                                        placeholder="Contraseña de administrador..."
                                        className="w-full text-center bg-[#F8F9FF] border border-gray-200 text-sm font-bold pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button onClick={() => {setModalDeducciones(false); setInputPassword("");}} className="flex-1 bg-white border border-gray-200 text-gray-600 text-[11px] font-bold py-3 rounded-xl hover:bg-gray-50 transition-colors tracking-widest uppercase">
                                    Cancelar
                                </button>
                                <button 
                                    onClick={confirmarEjecucionManual}
                                    disabled={!inputPassword || ejecutandoManual}
                                    className={`flex-1 text-white text-[11px] font-bold py-3 rounded-xl shadow-md transition-all tracking-widest uppercase flex items-center justify-center gap-2
                                        ${(!inputPassword || ejecutandoManual) 
                                            ? 'bg-orange-300 cursor-not-allowed opacity-70 shadow-none' 
                                            : 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/20'
                                        }`}
                                >
                                    {ejecutandoManual ? <Loader2 className="w-4 h-4 animate-spin" /> : <Timer className="w-4 h-4" />}
                                    {ejecutandoManual ? 'Procesando...' : 'Sí, Ejecutar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}