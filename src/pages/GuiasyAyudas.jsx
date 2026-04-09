import React, { useState, useEffect, useRef } from "react";
import {
  Plus,
  Search,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  XCircle,
} from "lucide-react";
import {
  obtenerAyudas,
  crearGuia,
  eliminarGuia,
  actualizarGuia,
} from "../services/ayudasServices";

export default function GuiasyAyudas() {
  const [paginaActual, setPaginaActual] = useState(1);
  const itemsPorPagina = 8;
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [ayudas, setAyudas] = useState([]);
  const [busqueda, setBusqueda] = useState("");

  const [menuActivo, setMenuActivo] = useState(null);
  const menuRef = useRef(null);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [tituloGuia, setTituloGuia] = useState("");
  const [contenidoGuia, setContenidoGuia] = useState("");

  const [guiaSeleccionada, setGuiaSeleccionada] = useState(null);
  const [modalLecturaAbierto, setModalLecturaAbierto] = useState(false);

  const [modalEliminarAbierto, setModalEliminarAbierto] = useState(false);
  const [guiaAEliminar, setGuiaAEliminar] = useState(null);

  const [editandoId, setEditandoId] = useState(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      // Delay artificial para suavizar la transición visual
      const delay = new Promise((resolve) => setTimeout(resolve, 800));
      const [data] = await Promise.all([obtenerAyudas(), delay]);
      setAyudas(data);
    } catch (error) {
      console.error("Error al cargar ayudas:", error);
    } finally {
      setCargando(false);
    }
  };

  const abrirModalCrear = () => {
    setEditandoId(null);
    setTituloGuia("");
    setContenidoGuia("");
    setModalAbierto(true);
  };

  const abrirModalEditar = (guia) => {
    setEditandoId(guia.id);
    const textoLimpio = guia.titulo.replace(/[¿?]/g, "");
    setTituloGuia(textoLimpio);
    setContenidoGuia(guia.explicacion);
    setModalAbierto(true);
    setMenuActivo(null);
  };

  const abrirConfirmacionEliminar = (guia) => {
    setGuiaAEliminar(guia);
    setModalEliminarAbierto(true);
    setMenuActivo(null);
  };

  const abrirLectura = (guia) => {
    setGuiaSeleccionada(guia);
    setModalLecturaAbierto(true);
    setMenuActivo(null);
  };

  const handleEliminar = async () => {
    if (!guiaAEliminar) return;
    try {
      setProcesando(true);
      await eliminarGuia(guiaAEliminar.id);
      setModalEliminarAbierto(false);
      setGuiaAEliminar(null);
      await cargarDatos();
    } catch (error) {
      alert("No se pudo eliminar la guía.");
      console.log(error);
    } finally {
      setProcesando(false);
    }
  };

  const handleGuardar = async () => {
    try {
      setProcesando(true);
      const dataGuia = {
        titulo: `¿${tituloGuia.trim()}?`,
        explicacion: contenidoGuia.trim(),
      };

      if (editandoId) {
        await actualizarGuia(editandoId, dataGuia);
      } else {
        await crearGuia(dataGuia);
      }

      cerrarModalYHacerLimpieza();
      await cargarDatos();
    } catch (error) {
      console.log(error);
      alert("Error al procesar la solicitud.");
    } finally {
      setProcesando(false);
    }
  };

  const manejarCambioTitulo = (e) => {
    const valor = e.target.value;
    setTituloGuia(valor.replace(/[¿?]/g, ""));
  };

  const toggleMenu = (id) => {
    setMenuActivo(menuActivo === id ? null : id);
  };

  const cerrarModalYHacerLimpieza = () => {
    setModalAbierto(false);
    setEditandoId(null);
    setTituloGuia("");
    setContenidoGuia("");
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target))
        setMenuActivo(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- FILTRADO Y PAGINACIÓN ---
  const ayudasFiltradas = ayudas.filter((a) =>
    a.titulo.toLowerCase().includes(busqueda.toLowerCase()),
  );

  const totalPaginas = Math.ceil(ayudasFiltradas.length / itemsPorPagina) || 1;
  const startIndex = (paginaActual - 1) * itemsPorPagina;
  const ayudasPaginadas = ayudasFiltradas.slice(
    startIndex,
    startIndex + itemsPorPagina,
  );

  const formularioValido =
    tituloGuia.trim() !== "" && contenidoGuia.trim() !== "";

  // COMPONENTE SKELETON PARA CARDS
  const CardsSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="aspect-[16/10] bg-gray-100 rounded-2xl p-6 flex flex-col justify-center"
        >
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
        </div>
      ))}
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-[#020817] tracking-tight">
          Guías y Ayudas
        </h2>
        <p className="text-[13px] text-gray-500 mt-1 font-medium">
          Crea recursos didácticos para resolver las dudas de tus empleados
        </p>
      </div>

      <div className="bg-white rounded-[1.5rem] shadow-[0_2px_20px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden relative z-10">
        <div className="p-6 pb-2 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value);
                setPaginaActual(1);
              }}
              placeholder="Buscar por título..."
              className="w-full bg-white border border-gray-200 rounded-xl py-2.5 pl-11 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/10 transition-all"
            />
            {busqueda && (
              <button
                onClick={() => {
                  setBusqueda("");
                  setPaginaActual(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            onClick={abrirModalCrear}
            className="w-full md:w-auto bg-[#020817] text-white text-[11px] font-black px-8 py-3 rounded-xl uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> Nueva Guía
          </button>
        </div>

        <div className="p-6 min-h-[400px]">
          {cargando ? (
            <CardsSkeleton />
          ) : ayudasPaginadas.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-400 font-bold uppercase text-sm mb-2">
                No se encontraron guías
              </p>
              <p className="text-xs text-gray-400 font-medium">
                Intenta con otro término o crea una nueva guía.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {ayudasPaginadas.map((ayuda) => (
                <div
                  key={ayuda.id}
                  onClick={() => abrirLectura(ayuda)}
                  className="group relative aspect-[16/10] bg-[#020817] rounded-2xl p-6 flex flex-col justify-center cursor-pointer hover:shadow-2xl hover:shadow-black/20 transition-all border border-transparent"
                >
                  <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-all"></div>

                  <button
                    className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors z-20"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleMenu(ayuda.id);
                    }}
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>

                  <h3 className="text-white text-lg font-bold leading-tight relative z-10 pr-4">
                    {ayuda.titulo}
                  </h3>

                  {menuActivo === ayuda.id && (
                    <div
                      ref={menuRef}
                      onClick={(e) => e.stopPropagation()}
                      className="absolute right-12 top-10 w-40 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                    >
                      <div className="px-4 py-2 border-b border-gray-50 bg-gray-50/50">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                          Opciones
                        </span>
                      </div>
                      <div className="py-1">
                        <button
                          onClick={() => abrirModalEditar(ayuda)}
                          className="w-full px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 text-left transition-colors"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => abrirLectura(ayuda)}
                          className="w-full px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 text-left transition-colors"
                        >
                          Leer Guía
                        </button>
                        <button
                          onClick={() => abrirConfirmacionEliminar(ayuda)}
                          className="w-full px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 text-left transition-colors"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {!cargando && ayudasFiltradas.length > 0 && (
          <div className="px-6 py-5 border-t border-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Mostrando {ayudasPaginadas.length} de {ayudasFiltradas.length}{" "}
              Guías
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
                disabled={paginaActual === 1}
                className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-30 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex gap-1">
                {[...Array(totalPaginas)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPaginaActual(i + 1)}
                    className={`w-8 h-8 rounded-lg text-[11px] font-bold transition-all ${paginaActual === i + 1 ? "bg-[#020817] text-white shadow-md" : "text-gray-400 hover:bg-gray-100"}`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button
                onClick={() =>
                  setPaginaActual((p) => Math.min(totalPaginas, p + 1))
                }
                disabled={paginaActual === totalPaginas}
                className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-30 transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ASIDE DE CREACIÓN/EDICIÓN */}
      {modalAbierto && (
        <div
          className="fixed inset-0 bg-[#020817]/40 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={cerrarModalYHacerLimpieza}
        />
      )}
      <aside
        className={`fixed top-0 right-0 h-full w-full sm:w-[480px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${modalAbierto ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-xl font-black text-[#020817] tracking-tight">
            {editandoId ? "Editar Guía" : "Nueva Guía"}
          </h3>
          <button
            onClick={cerrarModalYHacerLimpieza}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        <div className="flex-1 p-8 space-y-8 overflow-y-auto">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
              Interrogante Principal
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-4 text-gray-300 font-bold text-lg">
                ¿
              </span>
              <input
                type="text"
                value={tituloGuia}
                onChange={manejarCambioTitulo}
                placeholder="Cómo puedo solicitar..."
                className="w-full bg-[#F8F9FF] border border-gray-100 rounded-xl py-4 pl-8 pr-8 text-sm font-bold text-[#020817] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/10 transition-all"
              />
              <span className="absolute right-4 text-gray-300 font-bold text-lg">
                ?
              </span>
            </div>
          </div>
          <div className="flex-1 flex flex-col">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
              Explicación Detallada
            </label>
            <textarea
              value={contenidoGuia}
              onChange={(e) => setContenidoGuia(e.target.value)}
              placeholder="Escribe aquí los pasos o la información detallada..."
              className="w-full flex-1 bg-[#F8F9FF] border border-gray-100 rounded-xl p-5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/10 transition-all resize-none min-h-[350px]"
            />
          </div>
        </div>
        <div className="p-6 border-t border-gray-100 bg-white space-y-3">
          <button
            onClick={handleGuardar}
            disabled={!formularioValido || procesando}
            className={`w-full text-[11px] font-black py-4 rounded-xl uppercase tracking-widest transition-all shadow-md ${formularioValido ? "bg-[#020817] text-white hover:bg-black" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}
          >
            {procesando ? (
              <Loader2 className="animate-spin mx-auto w-4 h-4" />
            ) : editandoId ? (
              "Actualizar Guía"
            ) : (
              "Guardar Recurso"
            )}
          </button>
        </div>
      </aside>

      {/* ASIDE DE LECTURA */}
      {modalLecturaAbierto && (
        <div
          className="fixed inset-0 bg-[#020817]/40 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setModalLecturaAbierto(false)}
        />
      )}
      <aside
        className={`fixed top-0 right-0 h-full w-full sm:w-[550px] bg-white z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${modalLecturaAbierto ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="p-6 border-b border-gray-50 flex justify-end">
          <button
            onClick={() => setModalLecturaAbierto(false)}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>
        <div className="flex-1 p-8 md:p-12 overflow-y-auto">
          {guiaSeleccionada && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <h1 className="text-4xl font-black text-[#020817] leading-tight tracking-tight">
                {guiaSeleccionada.titulo}
              </h1>
              <div className="h-1.5 w-16 bg-[#020817] rounded-full"></div>
              <p className="text-gray-600 text-lg leading-relaxed font-medium whitespace-pre-wrap">
                {guiaSeleccionada.explicacion}
              </p>
            </div>
          )}
        </div>
        <div className="p-8 border-t border-gray-100">
          <button
            onClick={() => setModalLecturaAbierto(false)}
            className="w-full bg-[#020817] text-white text-[11px] font-black py-4 rounded-xl uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95"
          >
            Entendido
          </button>
        </div>
      </aside>

      {/* MODAL ELIMINAR */}
      {modalEliminarAbierto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-[#020817]/60 backdrop-blur-sm"
            onClick={() => !procesando && setModalEliminarAbierto(false)}
          />
          <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <X className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-black text-[#020817] mb-2">
                ¿Eliminar esta guía?
              </h3>
              <p className="text-sm text-gray-500 font-medium leading-relaxed">
                Estás a punto de borrar permanentemente: <br />
                <span className="text-[#020817] font-bold">
                  "{guiaAEliminar?.titulo}"
                </span>
              </p>
            </div>
            <div className="flex border-t border-gray-100">
              <button
                disabled={procesando}
                onClick={() => setModalEliminarAbierto(false)}
                className="flex-1 px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest hover:bg-gray-50 transition-colors border-r"
              >
                Cancelar
              </button>
              <button
                disabled={procesando}
                onClick={handleEliminar}
                className="flex-1 px-6 py-4 text-[11px] font-bold text-red-600 uppercase tracking-widest hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
              >
                {procesando ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Sí, Eliminar"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
