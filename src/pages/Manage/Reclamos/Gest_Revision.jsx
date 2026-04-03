import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

import {
  ChevronLeft,
  Calendar,
  Search,
  Bell,
  HelpCircle,
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  CheckCircle2,
  Loader2,
  Send,
} from "lucide-react";

import {
  obtenerReclamoPorId,
  verificarVigencia,
  actualizarRevisionCredito,
} from "../../../services/reclamosService";
import { obtenerCreditosPorId } from "../../../services/creditosService";
import {
  fromTimestamp,
  calcularVencimiento,
  fromTimestampToSimpleDate,
} from "../../../helpers/timestampToDate";

const RevisionReclamo = () => {
  const { id } = useParams();
  const { navigate } = useNavigate();
  const [reclamo, setReclamo] = useState(null);
  const [credito, setCredito] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [respuesta, setRespuesta] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const vigente = verificarVigencia(
    calcularVencimiento(credito?.fechaRevision, credito?.plazoGarantia),
  );
  const [fechaVencimiento, setFechaVencimiento] = useState(null);
  const [zoom, setZoom] = useState(1);

  const [mostrarModal, setMostrarModal] = useState(false);
  const [procesando, setProcesando] = useState(false);

  const abrirConfirmacion = () => {
    setMostrarModal(true);
  };

  useEffect(() => {
    const cargarReclamo = async () => {
      try {
        const data = await obtenerReclamoPorId(id);
        if (data.creditId) {
          const creditoData = await obtenerCreditosPorId(data.creditId);
          setCredito(creditoData);
          setFechaVencimiento(
            calcularVencimiento(
              creditoData.fechaRevision,
              creditoData.plazoGarantia,
            ),
          );
        }
        setReclamo(data);
      } catch (error) {
        console.error("Error al obtener el reclamo:", error);
      } finally {
        setCargando(false);
      }
    };

    if (id) cargarReclamo();
  }, [id]);

  //   const reclamo = {
  //     titulo: "Producto Dañado",
  //     fecha: "14 de octubre, 2023",
  //     descripcion:
  //       "La cartera presenta algunas descosturas y podría romperse fácilmente.",
  //     evidenciaUrl:
  //       "https://via.placeholder.com/600x400/1a1a1a/ffffff?text=EVIDENCIA+DANIO+1",
  //   };

  const insertarSugerencia = (texto) => setRespuesta(texto);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.5, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.5, 1));
  const resetZoom = () => setZoom(1);

  if (cargando) {
    return (
      <div className="min-h-screen bg-[#F8F9FF] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#7C3AED] mb-4" />
        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
          Cargando expediente...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FF] font-sans text-[#020817] antialiased">
      <main className="p-4 md:p-8 max-w-[1400px] mx-auto">
        {/* BOTÓN REGRESAR */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 text-sm font-bold mb-6 hover:text-black transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Regresar
        </button>

        <h1 className="text-2xl md:text-3xl font-bold mb-8">
          Revisión de Reclamo
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* COLUMNA IZQUIERDA */}
          <div className="lg:col-span-8 space-y-6">
            {/* CARD: DETALLES DEL RECLAMO */}
            <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-200">
              <h2 className="text-xl font-bold mb-4">
                {reclamo?.asunto || "Sin Asunto"}
              </h2>
              <div className="flex items-center gap-2 text-gray-400 text-sm mb-6">
                <Calendar className="w-4 h-4" />
                <span>
                  Fecha de Emisión:{" "}
                  {reclamo?.fechaEmision
                    ? fromTimestamp(reclamo.fechaEmision)
                    : "N/A"}
                </span>
              </div>

              <div className="mb-8">
                <p className="text-gray-600 text-sm leading-relaxed">
                  {reclamo?.descripcion || "No hay descripción disponible."}
                </p>
              </div>

              <div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">
                  Evidencia Adjunta
                </h3>
                <div
                  className="relative group cursor-zoom-in rounded-xl overflow-hidden border-2 border-gray-200 w-full max-w-md aspect-video bg-gray-50"
                  onClick={() => setIsModalOpen(true)}
                >
                  <img
                    src={reclamo?.evidenciaUrl}
                    alt="Evidencia"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="bg-white px-4 py-2 rounded-lg text-xs font-bold">
                      Click para ampliar
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* CARD: GESTIÓN DE RESPUESTA */}
            <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-200">
              <h2 className="text-xl font-bold mb-6">Gestión de Respuesta</h2>

              <div className="mb-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">
                  Respuestas Rápidas
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Procesar Cambio",
                    "Aplicar Garantía",
                    "Solicitar más Evidencia",
                  ].map((tag) => (
                    <button
                      key={tag}
                      onClick={() =>
                        insertarSugerencia(
                          `Tras revisar su caso, hemos decidido ${tag.toLowerCase()}.`,
                        )
                      }
                      className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-600 hover:border-gray-900 transition-all"
                    >
                      {tag}
                    </button>
                  ))}
                  <button
                    onClick={() =>
                      insertarSugerencia(
                        "Rechazado: El producto presenta signos de mal uso externo.",
                      )
                    }
                    className="px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-xs font-bold text-red-600 hover:bg-red-100"
                  >
                    Rechazo por Mal Uso
                  </button>
                </div>
              </div>

              <textarea
                className="w-full h-40 p-5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-purple-400 transition-all resize-none text-sm"
                placeholder="Escriba su respuesta formal aquí..."
                value={respuesta}
                onChange={(e) => setRespuesta(e.target.value)}
              ></textarea>

              <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
                <button className="px-8 py-3 rounded-xl font-bold text-sm text-gray-500 border border-gray-200 hover:bg-gray-50">
                  Cancelar
                </button>
                <button
                  className={`px-8 py-3 rounded-xl font-bold text-sm text-white transition-all flex items-center justify-center gap-2 ${
                    !respuesta.trim()
                      ? "bg-gray-300 cursor-not-allowed opacity-50" // Estado Inactivo
                      : "bg-black hover:bg-zinc-800" // Estado Activo
                  }`}
                  onClick={abrirConfirmacion}
                  disabled={!respuesta.trim()} // Desactiva el click
                >
                  Enviar Respuesta <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA */}
          <div className="lg:col-span-4 space-y-6">
            {/* INFO SOLICITANTE */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6">
                Información del Solicitante
              </p>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-xl border border-gray-200 overflow-hidden bg-gray-50">
                  <img
                    src={
                      reclamo?.fotoUrl ||
                      "https://ui-avatars.com/api/?name=User"
                    }
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="overflow-hidden">
                  <h4 className="font-bold text-gray-900 truncate">
                    {reclamo?.solicitante || "Cargando..."}
                  </h4>
                  <p className="text-xs text-gray-400 truncate">
                    {reclamo?.usuarioId}
                  </p>
                </div>
              </div>
            </div>

            {/* CRÉDITO ENLAZADO */}
            <div className="bg-[#020817] p-6 rounded-2xl border border-zinc-800">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-6">
                Estado del Crédito
              </p>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <p className="text-[10px] uppercase text-zinc-500 font-bold mb-1">
                    Fecha de Aprobación
                  </p>
                  <p className="text-sm font-bold text-zinc-200">
                    {credito?.fechaRevision
                      ? fromTimestampToSimpleDate(credito.fechaRevision)
                      : "N/A"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase text-zinc-500 font-bold mb-1">
                    Vence
                  </p>
                  <p className="text-sm font-bold text-zinc-200">
                    {fechaVencimiento
                      ? fechaVencimiento.toLocaleDateString("es-HN", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })
                      : "N/A"}
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 flex items-center justify-between border border-zinc-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center border border-purple-100">
                    <CheckCircle2 className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-gray-400 uppercase">
                      Garantía
                    </p>
                    <p className="text-lg font-black text-black">
                      {credito?.plazoGarantia} Meses
                    </p>
                  </div>
                </div>

                <div
                  className={`px-2 py-1 rounded-md text-[8px] font-black uppercase border ${
                    vigente
                      ? "bg-green-50 border-green-200 text-green-700"
                      : "bg-red-50 border-red-200 text-red-700"
                  }`}
                >
                  {vigente ? "Aplicable" : "Expirada"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* MODAL DE EVIDENCIA */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4">
          <div className="absolute top-6 right-6 flex gap-3">
            <div className="flex bg-zinc-800 rounded-lg p-1 border border-zinc-700">
              <button
                onClick={handleZoomIn}
                className="p-2 text-white hover:bg-zinc-700 rounded-md"
              >
                <ZoomIn className="w-5 h-5" />
              </button>
              <button
                onClick={handleZoomOut}
                className="p-2 text-white hover:bg-zinc-700 rounded-md"
              >
                <ZoomOut className="w-5 h-5" />
              </button>
              <button
                onClick={resetZoom}
                className="p-2 text-white hover:bg-zinc-700 rounded-md"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>
            <button
              onClick={() => {
                setIsModalOpen(false);
                resetZoom();
              }}
              className="bg-red-600 p-3 rounded-lg text-white hover:bg-red-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="w-full h-full flex items-center justify-center overflow-hidden">
            <img
              src={reclamo?.evidenciaUrl}
              alt="Preview"
              className="transition-transform duration-200 ease-out max-w-[90%] max-h-[90%] object-contain rounded-sm"
              style={{ transform: `scale(${zoom})` }}
            />
          </div>
        </div>
      )}

      {mostrarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl border border-gray-100 animate-in fade-in zoom-in duration-200">
            <div className="max-w-sm flex items-center justify-center flex-col">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 bg-green-100">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">¿Estás seguro?</h3>
            </div>
            <p className="text-sm text-gray-500 mb-8">
              Esta acción marcará el reclamo como "Revisado" y no podrás hacer
              más cambios.
            </p>

            <div className="flex flex-col gap-3">
              <button
                disabled={procesando}
                // onClick={
                //     // ejecutarAccion
                // }
                className={`w-full py-4 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all bg-gray-900 text-white hover:bg-black flex items-center justify-center gap-2`}
              >
                {procesando && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirmar
              </button>
              <button
                disabled={procesando}
                onClick={() => setMostrarModal(false)}
                className="w-full py-4 text-xs font-bold text-gray-400 uppercase tracking-widest hover:text-gray-900 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RevisionReclamo;
