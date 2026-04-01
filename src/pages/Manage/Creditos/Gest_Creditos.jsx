import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../../auth/AuthProvider";
import {
  obtenerCreditosRealTime,
  revisionState,
} from "../../../services/creditosService";
import {
  Plus,
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
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export default function Gest_Creditos() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [creditos, setCreditos] = useState([]);
  const [cargando, setCargando] = useState(true);

  const [paginaActual, setPaginaActual] = useState(1);
  const itemsPorPagina = 10;

  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const filtroRef = useRef(null);

  const [filtrosTemp, setFiltrosTemp] = useState({ estado: "" });
  // filtrosAplicados es lo que realmente filtra la tabla
  const [filtrosAplicados, setFiltrosAplicados] = useState({ estado: "" });

  const [menuActivo, setMenuActivo] = useState(null);
  const menuRef = useRef(null);

  const DotsPlaying = () => (
    <div className="flex gap-1 items-center ml-1">
      <div className="w-1 h-1 bg-[#7C3AED] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
      <div className="w-1 h-1 bg-[#7C3AED] rounded-full animate-bounce [animation-delay:-0.07s]"></div>
      <div className="w-1 h-1 bg-[#7C3AED] rounded-full animate-bounce"></div>
    </div>
  );

  useEffect(() => {
    const desuscribirse = obtenerCreditosRealTime((nuevosCreditos) => {
      setCreditos(nuevosCreditos);
      setCargando(false);
    });
    return () => {
      desuscribirse();
    };
  }, []);

  useEffect(() => {
    const handleClickFuera = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuActivo(null);
      }
      if (filtroRef.current && !filtroRef.current.contains(event.target)) {
        setMostrarFiltros(false);
      }
    };
    document.addEventListener("mousedown", handleClickFuera);
    return () => document.removeEventListener("mousedown", handleClickFuera);
  }, []);

  const handleIniciarRevision = async (idCredito) => {
    if (!user || !user.email) {
      alert("No se detectó una sesión activa.");
      return;
    }

    try {
      await revisionState(idCredito, user.email);
      navigate(`revision/${idCredito}`);
    } catch (error) {
      console.error("Error al iniciar revisión:", error);
      alert("Hubo un error al asignar el crédito.");
    }
  };

  const toggleMenu = (idCredito) => {
    if (menuActivo === idCredito) setMenuActivo(null);
    else setMenuActivo(idCredito);
  };

  const creditosFiltrados = creditos.filter((credito) => {
    const matchEstado =
      filtrosAplicados.estado === "" ||
      credito.estado === filtrosAplicados.estado;

    return matchEstado;
  });

  const totalPaginas = Math.ceil(creditosFiltrados.length / itemsPorPagina);
  const startIndex = (paginaActual - 1) * itemsPorPagina;
  const creditosPaginados = creditosFiltrados.slice(
    startIndex,
    startIndex + itemsPorPagina,
  );

  useEffect(() => {
    if (paginaActual > totalPaginas && totalPaginas > 0) {
      setPaginaActual(1);
    }
  }, [creditosFiltrados.length, paginaActual, totalPaginas]);

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

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto">
      {/* --- CABECERA DE LA PÁGINA --- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-[#020817]">
            Gestión de Créditos
          </h2>
          <p className="text-[13px] text-gray-500 mt-1 font-medium">
            Panel de control y respuesta para los clientes.
          </p>
        </div>
      </div>

      <div className="-mx-8 border-t border-[#DADEE8]-100 mt-5 mb-6"></div>

      {/* --- ÁREA DE TRABAJO (Tarjeta blanca vacía) --- */}
      <div className="bg-white p-6 rounded-[1.5rem] shadow-[0_2px_20px_rgb(0,0,0,0.02)]  border border-[#DADEE8] relative z-10">
        {/* Este texto lo vas a borrar luego para poner tu tabla, formularios, etc. */}
        <div className="flex flex-col md:flex-row justify-end items-center gap-4 mb-6">
          <div className="flex gap-3 w-full md:w-auto relative">
            {/* Botón de Filtros Dinámico */}
            <button
              onClick={handleBotonFiltroClick}
              className={`border text-[11px] font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-colors
                ${
                  isFiltroActivo
                    ? "bg-purple-50 border-purple-200 text-[#7C3AED] hover:bg-purple-100"
                    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                }
              `}
            >
              {isFiltroActivo ? (
                <XCircle className="w-4 h-4" />
              ) : (
                <Filter className="w-4 h-4" />
              )}
              {isFiltroActivo ? "QUITAR FILTROS" : "FILTRAR"}
            </button>

            {/* MENÚ DROPDOWN DE FILTROS */}
            {mostrarFiltros && (
              <div
                ref={filtroRef}
                className="absolute top-12 right-0 md:right-32 w-64 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 z-50 p-4"
              >
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-50 pb-2">
                  Opciones de Filtro
                </h4>

                <div className="mb-6">
                  <label className="block text-xs font-bold text-[#020817] mb-2">
                    Estado
                  </label>
                  <select
                    value={filtrosTemp.estado}
                    onChange={(e) =>
                      setFiltrosTemp({ ...filtrosTemp, estado: e.target.value })
                    }
                    className="w-full bg-[#F8F9FF] border border-gray-100 text-sm font-medium px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20"
                  >
                    <option value="">Todos los estados</option>
                    <option value="Pendiente">Pendientes</option>
                    <option value="Aprobado">Aprobados</option>
                    <option value="Rechazado">Rechazados</option>
                    <option value="En Revision">En Revision</option>
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
        <div className="-mx-6 border-t border-[#DADEE8]-100 my-6"></div>
        <div className="w-full overflow-visible min-h-[400px]">
          {cargando ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin mb-4 text-[#7C3AED]" />
              <p className="text-sm font-bold tracking-widest uppercase">
                Cargando base de datos...
              </p>
            </div>
          ) : creditosPaginados.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-400 font-bold tracking-widest uppercase text-sm mb-2">
                {creditos.length === 0
                  ? "No hay créditos registrados"
                  : "No se encontraron resultados"}
              </p>
              <p className="text-xs text-gray-400">
                {creditos.length === 0
                  ? "Haz clic en 'Nuevo Crédito' para comenzar."
                  : "Intenta buscar con otros términos o cambia los filtros."}
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F8F9FF] rounded-xl">
                  <th className="py-3 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest rounded-l-xl">
                    Producto Solicitado
                  </th>
                  <th className="py-3 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                    Credito Deducido
                  </th>
                  <th className="py-3 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                    Plazos
                  </th>
                  <th className="py-3 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                    Estados
                  </th>
                  <th className="py-3 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center rounded-r-xl">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="text-sm font-medium text-[#020817]">
                {/* Mapeamos creditosPaginados en lugar de creditos */}
                {creditosPaginados.map((credito) => {
                  const estadoNormalizado =
                    credito.estado?.trim().toUpperCase() || "";

                  const esPendiente = estadoNormalizado === "PENDIENTE";
                  const esRevision =
                    estadoNormalizado === "EN REVISION" ||
                    estadoNormalizado === "EN REVISIÓN";
                  const esAprobado = estadoNormalizado === "APROBADO";
                  const esRechazado = estadoNormalizado === "RECHAZADO";
                  const esRevisionStatus = [
                    "EN REVISION",
                    "EN REVISIÓN",
                  ].includes(credito.estado?.trim().toUpperCase());

                  return (
                    <tr
                      key={credito.id}
                      className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          {/* IMAGEN DESDE FIREBASE */}
                          <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-100 border border-gray-100 flex-shrink-0">
                            <img
                              src={
                                credito.imagenProductoURL ||
                                "https://via.placeholder.com/150"
                              }
                              alt={credito.nombreProducto}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.src =
                                  "https://via.placeholder.com/150";
                              }}
                            />
                          </div>

                          <div>
                            <p className="font-bold text-[#020817]">
                              {credito.nombreProducto}
                            </p>
                            <p className="text-[11px] text-gray-400 font-medium">
                              Solicitado por: {credito.usuario || "Sin correo"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <p className="text-gray-600 font-medium text-xs">
                          {credito.cuotaMensual}
                          {" lps "}
                        </p>
                      </td>
                      <td className="py-4 px-4 text-gray-500 text-xs">
                        {credito.plazoMeses + " Meses" || "No especificado"}
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex flex-col gap-2 items-start">
                          {!esRevision && (
                            <span
                              className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border ${
                                esAprobado
                                  ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                  : esPendiente
                                    ? "bg-amber-50 text-amber-600 border-amber-100"
                                    : esRechazado
                                      ? "bg-red-50 text-red-600 border-red-100"
                                      : "bg-gray-50 text-gray-500 border-gray-200"
                              }`}
                            >
                              {esAprobado && (
                                <CheckCircle2 className="w-3 h-3" />
                              )}
                              {esPendiente && <Clock className="w-3 h-3" />}
                              {esRechazado && <XCircle className="w-3 h-3" />}
                              {!esAprobado && !esPendiente && !esRechazado && (
                                <AlertCircle className="w-3 h-3" />
                              )}

                              {credito.estado || "PENDIENTE"}
                            </span>
                          )}

                          {esRevision && (
                            <div className="flex items-center gap-2 bg-white border border-purple-100 shadow-sm rounded-full pr-3 pl-1 py-1 animate-in zoom-in-95 duration-300">
                              {credito.revisorEmail === user?.email ? (
                                <div className="flex items-center gap-1.5 pl-2">
                                  <span className="text-[10px] font-bold text-purple-700">
                                    Estás revisando este crédito
                                  </span>
                                  <DotsPlaying />
                                </div>
                              ) : (
                                <>
                                  <div className="w-6 h-6 rounded-full overflow-hidden border border-purple-100 flex-shrink-0 bg-purple-50 flex items-center justify-center">
                                    <img
                                      src={
                                        credito.revisorFotoTemp ||
                                        `https://ui-avatars.com/api/?name=${encodeURIComponent(credito.revisadoPor || "R")}&background=7C3AED&color=fff`
                                      }
                                      alt="Revisor"
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        e.currentTarget.src = `https://ui-avatars.com/api/?name=R&background=7C3AED&color=fff`;
                                      }}
                                    />
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="text-[10px] font-bold text-gray-600">
                                      {credito.revisadoPor
                                        ? `${credito.revisadoPor.split(" ")[0]} ${credito.revisadoPor.split(" ")[2] || ""} está revisando`
                                        : "Asignando..."}
                                    </span>
                                    <DotsPlaying />
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center relative">
                        <button
                          onClick={() => toggleMenu(credito.id)}
                          className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors focus:outline-none"
                        >
                          <MoreHorizontal className="w-5 h-5" />
                        </button>

                        {menuActivo === credito.id && (
                          <div
                            ref={menuRef}
                            className="absolute right-12 top-10 w-40 bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 z-50 text-left overflow-hidden"
                          >
                            <div className="px-4 py-2 border-b border-gray-50 bg-gray-50/50">
                              <span className="text-[11px] font-bold text-[#b2b1b6] uppercase tracking-widest">
                                Opciones
                              </span>
                            </div>

                            <div className="py-2 flex flex-col">
                              {credito.estado?.toUpperCase() ===
                                "PENDIENTE" && (
                                <button
                                  onClick={() =>
                                    handleIniciarRevision(credito.id)
                                  }
                                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 text-left transition-colors block w-full"
                                >
                                  Iniciar revision
                                </button>
                              )}

                              {esRevisionStatus &&
                                credito.revisorEmail?.trim().toLowerCase() ===
                                  user?.email?.trim().toLowerCase() && (
                                  <Link
                                    to={`/creditos/revision/${credito.id}`}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 text-left transition-colors block"
                                  >
                                    Continuar revision
                                  </Link>
                                )}
                              <Link
                                to={`/creditos/detalle/${credito.id}`}
                                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 text-left transition-colors"
                              >
                                Ver detalles
                              </Link>
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
          <div className="-mx-6 border-t border-[#DADEE8]-100 my-2"></div>

          {!cargando && creditosFiltrados.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between mt-2 pt-4 border-t border-gray-50 gap-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Mostrando {startIndex + 1} a{" "}
                {Math.min(
                  startIndex + itemsPorPagina,
                  creditosFiltrados.length,
                )}{" "}
                de {creditosFiltrados.length} Resultados
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
                  Página {paginaActual} de {totalPaginas}
                </span>

                <button
                  onClick={() =>
                    setPaginaActual((p) => Math.min(totalPaginas, p + 1))
                  }
                  disabled={paginaActual === totalPaginas}
                  className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
