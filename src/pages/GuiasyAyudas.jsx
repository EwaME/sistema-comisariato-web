import React, { useState, useEffect, useRef } from "react";
import {
  Plus,
  Search,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
} from "lucide-react";
import {
  obtenerAyudas,
  crearGuia,
  eliminarGuia,
  actualizarGuia,
} from "../services/ayudasServices";
export default function GuiasyAyudas() {
  // --- ESTADO Y LÓGICA DE PAGINACIÓN ---
  const [paginaActual, setPaginaActual] = useState(1);
  const itemsPorPagina = 8;
  const [cargando, setCargando] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [ayudas, setAyudas] = useState([]);

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
      alert("No se pudo eliminar la guía. Inténtalo de nuevo.");
    } finally {
      setProcesando(false);
    }
  };

  const manejarCambioTitulo = (e) => {
    const valor = e.target.value;
    const soloTexto = valor.replace(/[¿?]/g, "");
    setTituloGuia(soloTexto);
  };

  const toggleMenu = (idReclamo) => {
    if (menuActivo === idReclamo) setMenuActivo(null);
    else setMenuActivo(idReclamo);
  };

  useEffect(() => {
    cargarDatos();
  }, []);
  const totalPaginas = Math.ceil(ayudas.length / itemsPorPagina);
  const startIndex = (paginaActual - 1) * itemsPorPagina;
  const ayudasPaginadas = ayudas.slice(startIndex, startIndex + itemsPorPagina);

  useEffect(() => {
    if (paginaActual > totalPaginas && totalPaginas > 0) {
      setPaginaActual(1);
    }
  }, [ayudas.length, paginaActual, totalPaginas]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuActivo(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const data = await obtenerAyudas();
      setAyudas(data);
    } catch (error) {
      console.error("Error al cargar ayudas:", error);
    } finally {
      setCargando(false);
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
      alert("Error al procesar la solicitud. Intenta de nuevo.");
    } finally {
      setProcesando(false);
    }
  };

  if (cargando) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const formularioValido =
    tituloGuia.trim() !== "" && contenidoGuia.trim() !== "";

  const cerrarModalYHacerLimpieza = () => {
    setModalAbierto(false);
    setEditandoId(null);
    setTituloGuia("");
    setContenidoGuia("");
  };

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto">
      {/* --- CABECERA --- */}
      <div className="mb-8">
        <h2 className="text-3xl font-black text-[#020817] tracking-tight">
          Guías y Ayudas
        </h2>
        <p className="text-[13px] text-gray-500 mt-1 font-medium">
          Crea recursos didácticos para resolver las dudas de tus empleados
        </p>
      </div>
      {modalAbierto && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={cerrarModalYHacerLimpieza}
        />
      )}

      <aside
        className={`fixed top-0 right-0 h-full w-full sm:w-[480px] bg-white shadow-[-10px_0_40px_rgba(0,0,0,0.1)] z-50 transform transition-transform duration-300 ease-in-out flex flex-col
          ${modalAbierto ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Cabecera del Modal */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          {/* Título dinámico */}
          <h3 className="text-xl font-black text-[#020817]">
            {editandoId ? "Editar Guía" : "Nueva Guía"}
          </h3>
          <button
            onClick={() => {
              cerrarModalYHacerLimpieza();
            }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo del Modal (Formulario con Scroll) */}
        <div className="flex-1 p-8 space-y-8 overflow-y-auto">
          {/* Campo: Interrogante */}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">
              Interrogante
            </label>
            <div className="relative flex items-center">
              {/* Signo de apertura fijo */}
              <span className="absolute left-4 text-gray-400 font-bold text-lg select-none">
                ¿
              </span>

              <input
                type="text"
                value={tituloGuia}
                onChange={manejarCambioTitulo}
                placeholder="Qué podría preguntar...."
                className="w-full bg-[#F8F9FF] border border-gray-100 rounded-xl py-4 pl-8 pr-8 text-sm font-bold text-[#020817] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/10 transition-all placeholder:text-gray-300 placeholder:font-medium"
              />

              {/* Signo de cierre dinámico o fijo */}
              <span className="absolute right-4 text-gray-400 font-bold text-lg select-none">
                ?
              </span>
            </div>
            <p className="text-[10px] text-gray-400 mt-2 font-medium">
              El sistema añadirá los signos automáticamente al guardar.
            </p>
          </div>

          {/* Campo: Explicación Detallada */}
          <div className="flex-1 flex flex-col">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">
              Explicación Detallada
            </label>
            <textarea
              placeholder="Describe las características de la categoría ..."
              className="w-full flex-1 bg-[#F8F9FF] border border-gray-100 rounded-xl p-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/10 transition-all placeholder:text-gray-300 resize-none min-h-[300px]"
              value={contenidoGuia}
              onChange={(e) => setContenidoGuia(e.target.value)}
            />
          </div>
        </div>

        {/* Footer del Modal (Botones fijos) */}
        <div className="p-6 border-t border-gray-100 bg-white space-y-3">
          <button
            className={`w-full text-[11px] font-bold py-3 rounded-xl uppercase tracking-widest transition-all shadow-md active:scale-95 ${
              formularioValido
                ? "bg-[#020817] text-white hover:bg-black"
                : "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none"
            }`}
            disabled={!formularioValido || procesando}
            onClick={handleGuardar}
          >
            {procesando ? (
              <Loader2 className="animate-spin mx-auto w-4 h-4" />
            ) : editandoId ? (
              "Actualizar Cambios"
            ) : (
              "Guardar Guía"
            )}
          </button>

          <button
            onClick={() => cerrarModalYHacerLimpieza()}
            className="w-full bg-white text-[#020817] border border-gray-200 text-[11px] font-bold py-3 rounded-xl uppercase tracking-widest hover:bg-gray-50 transition-all"
          >
            Cerrar
          </button>
        </div>
      </aside>

      {modalLecturaAbierto && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setModalLecturaAbierto(false)}
        />
      )}

      <aside
        className={`fixed top-0 right-0 h-full w-full sm:w-[550px] bg-white shadow-[-10px_0_40px_rgba(0,0,0,0.1)] z-50 transform transition-transform duration-300 ease-in-out flex flex-col
    ${modalLecturaAbierto ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Cabecera del Detalle */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
          <div className="flex items-center gap-2"></div>
          <button
            onClick={() => setModalLecturaAbierto(false)}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido de la Guía */}
        <div className="flex-1 p-8 md:p-12 overflow-y-auto custom-scrollbar">
          {guiaSeleccionada && (
            <div className="space-y-8">
              {/* Título / Pregunta */}
              <h1 className="text-4xl font-black text-[#020817] leading-[1.1] tracking-tight">
                {guiaSeleccionada.titulo}
              </h1>

              <div className="h-1 w-20 bg-[#020817] rounded-full"></div>

              {/* Cuerpo de la explicación */}
              <div className="prose prose-slate max-w-none">
                <p className="text-gray-600 text-lg leading-relaxed font-medium whitespace-pre-wrap">
                  {guiaSeleccionada.explicacion}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer: Solo botón de cerrar */}
        <div className="p-6 border-t border-gray-100 bg-white">
          <button
            onClick={() => setModalLecturaAbierto(false)}
            className="w-full bg-[#020817] text-white text-[11px] font-bold py-4 rounded-xl uppercase tracking-widest hover:bg-black transition-all shadow-md active:scale-95"
          >
            Entendido, cerrar
          </button>
        </div>
      </aside>

      {/* --- CONTENEDOR PRINCIPAL --- */}
      <div className="bg-white rounded-[1.5rem] shadow-[0_2px_20px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden">
        {/* BARRA DE ACCIONES (Search & Button) */}
        <div className="p-6 pb-2 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por título..."
              className="w-full bg-white border border-gray-200 rounded-xl py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
            />
          </div>

          <button
            className="w-full md:w-auto bg-[#020817] text-white text-[11px] font-black px-8 py-3 rounded-xl uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95"
            onClick={() => setModalAbierto(true)}
          >
            Nueva Guía
          </button>
        </div>

        {/* --- GRID DE CARDS --- */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {ayudasPaginadas.map((ayuda) => (
            <div
              key={ayuda.id}
              className="group relative aspect-[16/10] bg-[#020817] rounded-2xl p-6 flex flex-col justify-center cursor-pointer hover:shadow-2xl hover:shadow-black/20 transition-all border border-transparent"
            >
              {/* Círculo decorativo de fondo (El "pattern" que se ve en la imagen) */}
              <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-all"></div>

              <button
                className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
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
                  className="absolute right-12 top-10 w-40 bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-200 z-50 text-left overflow-hidden"
                >
                  <div className="px-4 py-2 border-b border-gray-200 bg-gray-50/50">
                    <span className="text-[11px] font-bold text-[#b2b1b6] uppercase tracking-widest">
                      Opciones
                    </span>
                  </div>

                  <div className="py-2 flex flex-col">
                    <button
                      onClick={() => abrirModalEditar(ayuda)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 text-left transition-colors w-full"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => abrirConfirmacionEliminar(ayuda)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-700 text-left transition-colors w-full"
                    >
                      Eliminar
                    </button>
                    <button
                      onClick={() => abrirLectura(ayuda)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 text-left transition-colors w-full"
                    >
                      Leer Guía
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="px-6 py-5 border-t border-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            Mostrando {Math.min(itemsPorPagina, ayudasPaginadas.length)} de{" "}
            {ayudas.length} categorías
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
              disabled={paginaActual === 1}
              className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Indicadores de página simples */}
            <div className="flex items-center gap-1">
              {[...Array(totalPaginas)]
                .map((_, i) => {
                  const numeroPagina = i + 1;
                  return (
                    <button
                      key={i}
                      // IMPORTANTE: Usa la función flecha () => para que NO se ejecute al renderizar
                      onClick={() => setPaginaActual(numeroPagina)}
                      className={`w-8 h-8 rounded-lg text-[11px] font-bold transition-all ${
                        paginaActual === numeroPagina
                          ? "bg-[#020817] text-white shadow-md"
                          : "text-gray-400 hover:bg-gray-100"
                      }`}
                    >
                      {numeroPagina}
                    </button>
                  );
                })
                .slice(0, 5)}
            </div>

            <button
              onClick={() =>
                setPaginaActual((p) => Math.min(totalPaginas, p + 1))
              }
              disabled={paginaActual === totalPaginas}
              className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      {modalEliminarAbierto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Overlay propio para este modal */}
          <div
            className="absolute inset-0 bg-[#020817]/60 backdrop-blur-sm"
            onClick={() => !procesando && setModalEliminarAbierto(false)}
          />

          <div className="relative bg-white w-full max-w-md overflow-hidden rounded-2xl shadow-2xl">
            <div className="p-8 text-center">
              {/* Icono o indicador visual */}
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <X className="w-8 h-8 text-red-500" />
              </div>

              <h3 className="text-xl font-black text-[#020817] mb-2">
                ¿Eliminar esta guía?
              </h3>
              <p className="text-sm text-gray-500 font-medium leading-relaxed">
                Estás a punto de eliminar{" "}
                <span className="text-[#020817] font-bold">
                  "{guiaAEliminar?.titulo}"
                </span>
                . Esta acción no se puede deshacer y la información se perderá
                permanentemente.
              </p>
            </div>

            {/* Botones de acción */}
            <div className="flex border-t border-gray-100">
              <button
                disabled={procesando}
                onClick={() => setModalEliminarAbierto(false)}
                className="flex-1 px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest hover:bg-gray-50 transition-colors border-r border-gray-100 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                disabled={procesando}
                onClick={handleEliminar}
                className="flex-1 px-6 py-4 text-[11px] font-bold text-red-600 uppercase tracking-widest hover:bg-red-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
