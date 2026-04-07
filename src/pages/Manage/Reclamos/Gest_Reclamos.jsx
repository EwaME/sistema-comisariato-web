import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../../auth/AuthProvider";

import {
  obtenerReclamosRealTime,
  obtenerListaEsperaReclamosRealTime,
  revisionState,
  cancelarRevision,
} from "../../../services/reclamosService";
import { fromTimestamp } from "../../../helpers/timestampToDate";
import {
  Search,
  Filter,
  MoreHorizontal,
  Loader2,
  AlertCircle,
  X,
  ChevronLeft,
  ChevronRight,
  XCircle,
  CheckCircle2,
  Clock,
  PlayCircle,
  ArrowRight,
  Inbox,
  Lock,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export default function Gest_Reclamos() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // ── Estado principal ──────────────────────────────────────────
  const [reclamos, setReclamos] = useState([]);
  const [listaEspera, setListaEspera] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);

  // ── Paginación lista de espera ────────────────────────────────
  const [pagEspera, setPagEspera] = useState(1);
  const itemsPorPagEspera = 4;

  // ── Paginación historial ──────────────────────────────────────
  const [paginaActual, setPaginaActual] = useState(1);
  const itemsPorPagina = 10;

  // ── Filtros ───────────────────────────────────────────────────
  const [terminoBusqueda, setTerminoBusqueda] = useState("");
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [filtrosTemp, setFiltrosTemp] = useState({ estado: "" });
  const [filtrosAplicados, setFiltrosAplicados] = useState({ estado: "" });
  const filtroRef = useRef(null);

  // ── Menú contextual ───────────────────────────────────────────
  const [menuActivo, setMenuActivo] = useState(null);
  const menuRef = useRef(null);

  // ── Modal detalle ─────────────────────────────────────────────
  const [modalDetalleAbierto, setModalDetalleAbierto] = useState(false);
  const [reclamoSeleccionado, setReclamoSeleccionado] = useState(null);

  // ── Revisores activos para el Tooltip ────────────────────────
  const revisoresActivos = listaEspera
    .filter((s) => s.revisorEmail && s.revisorFotoTemp)
    .reduce((acc, current) => {
      const x = acc.find((item) => item.email === current.revisorEmail);
      if (!x)
        return acc.concat([
          { email: current.revisorEmail, foto: current.revisorFotoTemp },
        ]);
      return acc;
    }, []);

  // ── Helpers ───────────────────────────────────────────────────
  const DotsPlaying = () => (
    <div className="flex gap-1 items-center ml-1">
      <div className="w-1 h-1 bg-purple-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
      <div className="w-1 h-1 bg-purple-600 rounded-full animate-bounce [animation-delay:-0.07s]" />
      <div className="w-1 h-1 bg-purple-600 rounded-full animate-bounce" />
    </div>
  );

  // ── Suscripciones RealTime ────────────────────────────────────
  useEffect(() => {
    const desubEspera = obtenerListaEsperaReclamosRealTime((data) => {
      setListaEspera(data);
      setCargando(false);
    });
    const desubHistorial = obtenerReclamosRealTime((data) => {
      setReclamos(data);
    });
    return () => {
      desubEspera();
      desubHistorial();
    };
  }, []);

  // ── Cierre de menús al click externo ─────────────────────────
  useEffect(() => {
    const handleClickFuera = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target))
        setMenuActivo(null);
      if (filtroRef.current && !filtroRef.current.contains(event.target))
        setMostrarFiltros(false);
    };
    document.addEventListener("mousedown", handleClickFuera);
    return () => document.removeEventListener("mousedown", handleClickFuera);
  }, []);

  // ── Acciones ──────────────────────────────────────────────────
  const handleIniciarRevision = async (idReclamo, revisorActualEmail) => {
    if (!user?.email) return;
    if (revisorActualEmail && revisorActualEmail !== user.email) {
      alert(
        `Esta solicitud ya está siendo revisada por: ${revisorActualEmail}`,
      );
      return;
    }
    try {
      await revisionState(idReclamo, user.email);
      navigate(`revision/${idReclamo}`);
    } catch (error) {
      console.error("Error al iniciar revisión:", error);
    }
  };

  const cancelarAccion = async (id) => {
    setProcesando(true);
    try {
      await cancelarRevision(id);
      navigate("/reclamos");
    } catch (error) {
      console.error("Error al cancelar:", error);
      alert("Ocurrió un error al procesar la solicitud en el servidor.");
    } finally {
      setProcesando(false);
    }
  };

  const abrirDetalle = (reclamo) => {
    setReclamoSeleccionado(reclamo);
    setModalDetalleAbierto(true);
    setMenuActivo(null);
  };

  const toggleMenu = (id) => setMenuActivo((prev) => (prev === id ? null : id));

  // ── Filtrado ──────────────────────────────────────────────────
  const reclamosFiltrados = reclamos.filter((r) => {
    const matchBusqueda =
      r.asunto?.toLowerCase().includes(terminoBusqueda.toLowerCase()) ||
      r.solicitante?.toLowerCase().includes(terminoBusqueda.toLowerCase());
    const matchEstado =
      filtrosAplicados.estado === "" || r.estado === filtrosAplicados.estado;
    return matchBusqueda && matchEstado;
  });

  // ── Paginación lista de espera ────────────────────────────────
  const totalPagEspera = Math.ceil(listaEspera.length / itemsPorPagEspera);
  const esperaPaginada = listaEspera.slice(
    (pagEspera - 1) * itemsPorPagEspera,
    pagEspera * itemsPorPagEspera,
  );

  // ── Paginación historial ──────────────────────────────────────
  const totalPaginas = Math.ceil(reclamosFiltrados.length / itemsPorPagina);
  const startIndex = (paginaActual - 1) * itemsPorPagina;
  const reclamosPaginados = reclamosFiltrados.slice(
    startIndex,
    startIndex + itemsPorPagina,
  );

  useEffect(() => {
    if (paginaActual > totalPaginas && totalPaginas > 0) setPaginaActual(1);
  }, [reclamosFiltrados.length, paginaActual, totalPaginas]);

  // ── Filtros helpers ───────────────────────────────────────────
  const isFiltroActivo = filtrosAplicados.estado !== "";

  const handleBotonFiltroClick = () => {
    if (isFiltroActivo) {
      setFiltrosAplicados({ estado: "" });
      setFiltrosTemp({ estado: "" });
      setPaginaActual(1);
    } else {
      setMostrarFiltros(!mostrarFiltros);
    }
  };

  const aplicarFiltros = () => {
    setFiltrosAplicados(filtrosTemp);
    setMostrarFiltros(false);
    setPaginaActual(1);
  };

  // ── Loading ───────────────────────────────────────────────────
  if (cargando) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#FDFDFF]">
        <Loader2 className="animate-spin text-[#7C3AED] w-10 h-10 mb-4" />
        <p className="text-sm font-bold text-gray-400 tracking-widest uppercase">
          Cargando Gestión...
        </p>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto bg-[#FDFDFF] min-h-screen">
      {/* ── HEADER ── */}
      <div className="mb-12 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-[#020817] tracking-tight">
            Gestión de Reclamos
          </h2>
          <p className="text-[12px] text-gray-400 mt-1 font-bold uppercase tracking-wider">
            Panel de control y respuesta para los clientes
          </p>
        </div>

        {/* Card de pendientes + Tooltip revisores */}
        <div className="group relative flex items-center gap-5 bg-white p-5 rounded-[1.5rem] border border-gray-100 shadow-sm transition-all hover:shadow-2xl hover:shadow-purple-100 cursor-pointer">
          <div className="w-14 h-14 rounded-[1rem] bg-[#020817] flex items-center justify-center text-white font-black text-xl shadow-lg">
            {listaEspera.length}
          </div>
          <div className="pr-4">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              En Cola
            </p>
            <p className="text-sm font-black text-gray-800">Pendientes</p>
          </div>

          {/* Tooltip revisores activos */}
          {revisoresActivos.length > 0 && (
            <div className="absolute top-full mt-4 right-0 w-60 bg-[#020817] rounded-[1rem] p-5 shadow-2xl opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all z-50 pointer-events-none border border-white/10">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                <p className="text-[10px] font-black text-white uppercase tracking-widest">
                  Revisores Activos
                </p>
              </div>
              <div className="space-y-4">
                {revisoresActivos.map((revisor, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <img
                      src={revisor.foto}
                      className="w-8 h-8 rounded-full object-cover border-2 border-purple-900"
                      alt="rev"
                    />
                    <p className="text-[11px] text-gray-300 font-bold truncate">
                      {revisor.email.split("@")[0]}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── GRID PRINCIPAL ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ── LISTA DE ESPERA ── */}
        <aside className="lg:col-span-4 xl:col-span-3 space-y-4">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">
              Lista de Espera
            </h3>
            {totalPagEspera > 1 && (
              <div className="flex items-center gap-1 bg-white border border-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setPagEspera((p) => Math.max(1, p - 1))}
                  disabled={pagEspera === 1}
                  className="p-1 disabled:opacity-20"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-600" />
                </button>
                <span className="text-[10px] font-bold text-gray-400 px-1">
                  {pagEspera}/{totalPagEspera}
                </span>
                <button
                  onClick={() =>
                    setPagEspera((p) => Math.min(totalPagEspera, p + 1))
                  }
                  disabled={pagEspera >= totalPagEspera}
                  className="p-1 disabled:opacity-20"
                >
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4">
            {listaEspera.length === 0 ? (
              <div className="bg-white border border-gray-100 rounded-[1.5rem] py-12 flex flex-col items-center justify-center shadow-sm">
                <Inbox className="w-8 h-8 text-gray-200 mb-2" />
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                  Sin reclamos pendientes
                </p>
              </div>
            ) : (
              esperaPaginada.map((reclamo) => {
                const estaSiendoRevisado = reclamo.estado
                  ?.toLowerCase()
                  .includes("revisión");
                const soyElRevisor = reclamo.revisorEmail === user?.email;
                const otroRevisor = estaSiendoRevisado && !soyElRevisor;

                return (
                  <div
                    key={reclamo.id}
                    className="bg-white border border-gray-100 rounded-[1.5rem] p-4 shadow-sm hover:shadow-md transition-all relative overflow-hidden"
                  >
                    {otroRevisor && (
                      <div className="absolute top-0 right-0 bg-purple-600 text-white text-[8px] font-black px-3 py-1 rounded-bl-xl flex items-center gap-1 z-10">
                        <Lock className="w-2.5 h-2.5" /> EN REVISIÓN
                      </div>
                    )}

                    {/* Evidencia + datos */}
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className={`w-14 h-14 rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 shadow-sm flex-shrink-0 ${otroRevisor ? "opacity-50 grayscale" : ""}`}
                      >
                        <img
                          src={
                            reclamo.evidenciaUrl ||
                            "https://via.placeholder.com/56"
                          }
                          alt="evidencia"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = "https://via.placeholder.com/56";
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-black text-gray-800 truncate leading-tight">
                          {reclamo.asunto || "Sin asunto"}
                        </h4>
                        <p className="text-[11px] text-gray-400 font-bold truncate uppercase">
                          {reclamo.solicitante}
                        </p>
                      </div>
                    </div>

                    {/* Indicador de revisión en curso */}
                    {estaSiendoRevisado && (
                      <div className="mb-3 flex items-center gap-2 bg-purple-50/50 p-2 rounded-xl border border-purple-100">
                        <div className="w-5 h-5 rounded-full bg-purple-600 overflow-hidden">
                          <img
                            src={reclamo.revisorFotoTemp}
                            className="w-full h-full object-cover"
                            alt="rev"
                          />
                        </div>
                        <p className="text-[9px] font-bold text-purple-700 flex items-center">
                          {soyElRevisor
                            ? "Estás revisando esto"
                            : `${reclamo.revisorEmail?.split("@")[0]} revisando`}
                          <DotsPlaying />
                        </p>
                      </div>
                    )}

                    {/* Fecha emisión */}
                    <div className="grid grid-cols-1 gap-2 mb-4 bg-gray-50/50 p-2 rounded-xl">
                      <div>
                        <p className="text-[8px] font-black text-gray-400 uppercase">
                          Emitido
                        </p>
                        <p className="text-[11px] font-black text-gray-700">
                          {fromTimestamp(reclamo.fechaEmision)}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        handleIniciarRevision(reclamo.id, reclamo.revisorEmail)
                      }
                      disabled={otroRevisor}
                      className={`w-full py-3 text-[10px] font-black rounded-xl transition-all flex items-center justify-center gap-2 active:scale-[0.98]
                        ${
                          otroRevisor
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "bg-[#020817] hover:bg-gray-800 text-white shadow-lg shadow-gray-200"
                        }`}
                    >
                      {soyElRevisor
                        ? "CONTINUAR REVISIÓN"
                        : otroRevisor
                          ? "BLOQUEADO"
                          : "INICIAR REVISIÓN"}
                      {!otroRevisor && <ArrowRight className="w-3 h-3" />}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* ── TABLA HISTORIAL ── */}
        <main className="lg:col-span-8 xl:col-span-9 bg-white border border-gray-100 rounded-[1rem] p-8 shadow-sm overflow-hidden">
          {/* Controles búsqueda + filtro */}
          <div className="flex flex-col lg:flex-row justify-between items-center gap-6 mb-8">
            <div className="w-full text-center lg:text-left">
              <h3 className="text-xl font-black text-gray-800 tracking-tight">
                Historial de Reclamos
              </h3>
              <p className="text-xs text-gray-400 font-medium">
                Registro histórico de todos los reclamos del sistema.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              {/* Buscador */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar asunto o solicitante..."
                  value={terminoBusqueda}
                  onChange={(e) => {
                    setTerminoBusqueda(e.target.value);
                    setPaginaActual(1);
                  }}
                  className="w-full sm:w-64 bg-gray-50 border-none text-[11px] font-bold pl-10 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-purple-100 outline-none"
                />
              </div>

              {/* Filtro por estado */}
              <div className="relative" ref={filtroRef}>
                <button
                  onClick={handleBotonFiltroClick}
                  className={`border text-[10px] font-black uppercase px-4 py-3 rounded-xl flex items-center gap-2 transition-colors
                    ${
                      isFiltroActivo
                        ? "bg-purple-50 border-purple-200 text-[#7C3AED] hover:bg-purple-100"
                        : "bg-gray-50 border-none text-gray-600 hover:bg-gray-100"
                    }`}
                >
                  {isFiltroActivo ? (
                    <XCircle className="w-4 h-4" />
                  ) : (
                    <Filter className="w-4 h-4" />
                  )}
                  {isFiltroActivo ? "QUITAR FILTROS" : "FILTRAR"}
                </button>

                {mostrarFiltros && (
                  <div className="absolute top-14 right-0 w-56 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 z-50 p-4">
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-50 pb-2">
                      Opciones de Filtro
                    </h4>
                    <div className="mb-4">
                      <label className="block text-xs font-bold text-[#020817] mb-2">
                        Estado
                      </label>
                      <select
                        value={filtrosTemp.estado}
                        onChange={(e) =>
                          setFiltrosTemp({
                            ...filtrosTemp,
                            estado: e.target.value,
                          })
                        }
                        className="w-full bg-[#F8F9FF] border border-gray-100 text-sm font-medium px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20"
                      >
                        <option value="">Todos los estados</option>
                        <option value="Pendiente">Pendiente</option>
                        <option value="En revisión">En Revisión</option>
                        <option value="Revisado">Revisado</option>
                      </select>
                    </div>
                    <button
                      onClick={aplicarFiltros}
                      className="w-full bg-[#020817] text-white text-[11px] font-bold py-2.5 rounded-xl hover:bg-black transition-colors uppercase tracking-widest"
                    >
                      Aplicar Filtros
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tabla */}
          <div className="overflow-x-auto">
            {cargando ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <Loader2 className="w-8 h-8 animate-spin mb-4 text-[#7C3AED]" />
                <p className="text-sm font-bold tracking-widest uppercase">
                  Cargando base de datos...
                </p>
              </div>
            ) : reclamosPaginados.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-gray-400 font-bold tracking-widest uppercase text-sm mb-2">
                  {reclamos.length === 0
                    ? "No hay reclamos registrados"
                    : "No se encontraron resultados"}
                </p>
                <p className="text-xs text-gray-400">
                  {reclamos.length === 0
                    ? "Aún no existen reclamos en el sistema."
                    : "Intenta buscar con otros términos o cambia los filtros."}
                </p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="text-[10px] font-black text-gray-300 uppercase tracking-widest border-b border-gray-50">
                    <th className="pb-4 text-left">Reclamo</th>
                    <th className="pb-4 text-left">Solicitante</th>
                    <th className="pb-4 text-center">Estado</th>
                    <th className="pb-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {reclamosPaginados.map((reclamo) => {
                    const estadoUp = reclamo.estado?.trim().toUpperCase() || "";
                    const esRevisionStatus = [
                      "EN REVISION",
                      "EN REVISIÓN",
                    ].includes(estadoUp);
                    const esRevisado = estadoUp === "REVISADO";
                    const esPendiente = estadoUp === "PENDIENTE";

                    return (
                      <tr
                        key={reclamo.id}
                        className="group hover:bg-gray-50/50 transition-colors"
                      >
                        {/* Reclamo */}
                        <td className="py-5 border-b border-gray-50/50">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 shadow-sm grayscale group-hover:grayscale-0 transition-all flex-shrink-0">
                              <img
                                src={
                                  reclamo.evidenciaUrl ||
                                  "https://via.placeholder.com/48"
                                }
                                alt="evidencia"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.src =
                                    "https://via.placeholder.com/48";
                                }}
                              />
                            </div>
                            <div>
                              <p className="font-black text-gray-700 leading-tight">
                                {reclamo.asunto || "Sin asunto"}
                              </p>
                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                                {fromTimestamp(reclamo.fechaEmision)}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Solicitante */}
                        <td className="py-5 border-b border-gray-50/50">
                          <p className="font-black text-gray-700">
                            {reclamo.solicitante}
                          </p>
                        </td>

                        {/* Estado */}
                        <td className="py-5 border-b border-gray-50/50 text-center">
                          <span
                            className={`text-[9px] font-black px-4 py-1.5 rounded-full border shadow-sm ${
                              esRevisado
                                ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                : esRevisionStatus
                                  ? "bg-purple-50 text-purple-600 border-purple-100"
                                  : "bg-amber-50 text-amber-600 border-amber-100"
                            }`}
                          >
                            {reclamo.estado?.toUpperCase()}
                          </span>
                        </td>

                        {/* Acciones */}
                        <td className="py-5 border-b border-gray-50/50 text-right relative">
                          <button
                            onClick={() => toggleMenu(reclamo.id)}
                            className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-gray-50 text-gray-400 hover:bg-[#020817] hover:text-white transition-all shadow-sm"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>

                          {menuActivo === reclamo.id && (
                            <div
                              ref={menuRef}
                              className="absolute right-12 top-10 w-44 bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 z-50 text-left overflow-hidden"
                            >
                              <div className="px-4 py-2 border-b border-gray-50 bg-gray-50/50">
                                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                                  Opciones
                                </span>
                              </div>
                              <div className="py-2 flex flex-col">
                                {esPendiente && (
                                  <button
                                    onClick={() =>
                                      handleIniciarRevision(
                                        reclamo.id,
                                        reclamo.revisorEmail,
                                      )
                                    }
                                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 text-left transition-colors w-full"
                                  >
                                    Iniciar revisión
                                  </button>
                                )}
                                {esRevisionStatus &&
                                  reclamo.revisorEmail?.trim().toLowerCase() ===
                                    user?.email?.trim().toLowerCase() && (
                                    <>
                                      <Link
                                        to={`/reclamos/revision/${reclamo.id}`}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 text-left transition-colors block"
                                      >
                                        Continuar revisión
                                      </Link>
                                      <button
                                        onClick={() =>
                                          cancelarAccion(reclamo.id)
                                        }
                                        disabled={procesando}
                                        className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-gray-50 text-left transition-colors w-full flex items-center justify-between disabled:opacity-50"
                                      >
                                        <span>Cancelar revisión</span>
                                        {procesando && (
                                          <Loader2 className="w-4 h-4 animate-spin ml-2" />
                                        )}
                                      </button>
                                    </>
                                  )}
                                <button
                                  onClick={() => abrirDetalle(reclamo)}
                                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 text-left transition-colors w-full"
                                >
                                  Ver detalles
                                </button>
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Footer paginación historial */}
          <div className="flex justify-between items-center mt-8">
            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
              Total: {reclamosFiltrados.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={paginaActual === 1}
                onClick={() => setPaginaActual((p) => p - 1)}
                className="p-2 bg-gray-50 rounded-lg disabled:opacity-20 hover:bg-gray-100 transition-colors shadow-sm"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>
              <span className="text-[11px] font-black text-gray-700 w-16 text-center">
                Pág. {paginaActual}
              </span>
              <button
                disabled={paginaActual >= totalPaginas}
                onClick={() => setPaginaActual((p) => p + 1)}
                className="p-2 bg-gray-50 rounded-lg disabled:opacity-20 hover:bg-gray-100 transition-colors shadow-sm"
              >
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* ── MODAL DETALLE (sin cambios) ── */}
      {modalDetalleAbierto && reclamoSeleccionado && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 pb-4 relative">
              <button
                onClick={() => setModalDetalleAbierto(false)}
                className="absolute right-8 top-8 p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border mb-3
                  ${
                    reclamoSeleccionado.estado?.toUpperCase() === "PENDIENTE"
                      ? "bg-amber-50 text-amber-600 border-amber-100"
                      : "bg-emerald-50 text-emerald-600 border-emerald-100"
                  }`}
              >
                {reclamoSeleccionado.estado}
              </span>
              <h3 className="text-2xl font-extrabold text-[#020817]">
                {reclamoSeleccionado.asunto || "Sin Asunto"}
              </h3>
            </div>

            <div className="p-8 pt-0 space-y-8">
              <div>
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                  Descripción del caso
                </h4>
                <div className="bg-[#F8F9FF] p-5 rounded-xl border border-gray-100">
                  <p className="text-sm text-gray-600 leading-relaxed font-medium">
                    {reclamoSeleccionado.descripcion ||
                      "No se proporcionó una descripción detallada."}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                    Evidencia Fotográfica
                  </h4>
                  <div className="aspect-video rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
                    <img
                      src={
                        reclamoSeleccionado.evidenciaUrl ||
                        "https://via.placeholder.com/600x400"
                      }
                      alt="Evidencia"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {reclamoSeleccionado.estado?.toUpperCase() === "PENDIENTE" ? (
                  <div className="bg-[#FCFAFF] rounded-xl p-6 border border-dashed border-purple-200 flex flex-col justify-center items-center text-center">
                    <Clock className="w-8 h-8 text-[#7C3AED] mb-3" />
                    <p className="text-xs font-bold text-[#3A1280] tracking-tight mb-1">
                      Aún no se ha revisado este caso
                    </p>
                    <p className="text-[11px] text-[#7C3AED] mb-4 font-medium">
                      Debes iniciar el proceso para dar una respuesta.
                    </p>
                    <button
                      onClick={() =>
                        handleIniciarRevision(reclamoSeleccionado.id)
                      }
                      className="flex items-center gap-2 bg-[#7C3AED] hover:bg-[#5B21B6] text-white px-4 py-2 rounded-lg text-[11px] font-bold transition-all active:scale-95 shadow-sm"
                    >
                      <PlayCircle className="w-4 h-4" />
                      Iniciar Revisión
                    </button>
                  </div>
                ) : reclamoSeleccionado.respuesta ? (
                  <div className="bg-blue-50/50 rounded-xl p-6 border border-blue-100 relative">
                    <div className="flex items-center gap-2 mb-4 text-blue-600">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">
                        Respuesta del Acreditador
                      </span>
                    </div>
                    <p className="text-[13px] text-gray-600 leading-relaxed mb-6 font-medium">
                      {reclamoSeleccionado.respuesta}
                    </p>
                    <div className="flex items-center gap-3 mt-auto pt-4 border-t border-blue-100/50">
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center overflow-hidden border border-blue-200">
                        <img
                          src={
                            reclamoSeleccionado.revisorFotoTemp ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(reclamoSeleccionado.revisadoPor || "A")}&background=2563eb&color=fff`
                          }
                          alt="Revisor"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-xs font-bold text-gray-700">
                        {reclamoSeleccionado.revisadoPor ||
                          "Acreditador Desconocido"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-purple-50/50 rounded-xl p-6 border border-purple-100 flex flex-col justify-center items-center text-center">
                    <Loader2 className="w-6 h-6 text-purple-400 animate-spin mb-2" />
                    <p className="text-[11px] font-bold text-purple-700 uppercase">
                      En proceso de revisión...
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={() => setModalDetalleAbierto(false)}
                  className="bg-[#020817] text-white px-8 py-3 rounded-xl text-xs font-bold hover:bg-black transition-all shadow-lg shadow-black/10 active:scale-95"
                >
                  Cerrar Detalle
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
