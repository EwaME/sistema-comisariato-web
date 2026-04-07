import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

import {
  ChevronLeft,
  Calendar,
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  CheckCircle2,
  Loader2,
  Send,
  ShieldCheck,
  ShieldOff,
  Clock,
} from "lucide-react";

import {
  obtenerReclamoPorId,
  actualizarRevisionReclamo,
  cancelarRevision,
} from "../../../services/reclamosService";
import { obtenerCreditosPorId } from "../../../services/creditosService";
import {
  fromTimestamp,
  calcularVencimiento,
  calcularVencimientoDias, // ← nueva función
  fromTimestampToSimpleDate,
} from "../../../helpers/timestampToDate";

const RevisionReclamo = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [reclamo, setReclamo] = useState(null);
  const [credito, setCredito] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [respuesta, setRespuesta] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [zoom, setZoom] = useState(1);

  const usaMeses = credito?.plazoGarantia != null && credito?.plazoGarantia > 0;
  const usaDias = !usaMeses && credito?.plazoGarantiaDia != null;

  const fechaVencimiento = usaMeses
    ? calcularVencimiento(credito?.fechaRevision, credito?.plazoGarantia)
    : usaDias
      ? calcularVencimientoDias(
          credito?.fechaRevision,
          credito?.plazoGarantiaDia,
        )
      : null;

  const vigente = fechaVencimiento ? new Date() <= fechaVencimiento : false;

  useEffect(() => {
    const cargarReclamo = async () => {
      try {
        const data = await obtenerReclamoPorId(id);
        if (data.creditId) {
          const creditoData = await obtenerCreditosPorId(data.creditId);
          setCredito(creditoData);
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

  const ejecutarAccion = async () => {
    setProcesando(true);
    try {
      await actualizarRevisionReclamo(id, respuesta);
      navigate("/reclamos");
    } catch (error) {
      console.error("Error al actualizar:", error);
      alert("Ocurrió un error al procesar la solicitud en el servidor.");
    } finally {
      setProcesando(false);
      setMostrarModal(false);
    }
  };

  const cancelarAccion = async () => {
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

  const insertarSugerencia = (texto) => setRespuesta(texto);
  const handleZoomIn = () => setZoom((p) => Math.min(p + 0.5, 3));
  const handleZoomOut = () => setZoom((p) => Math.max(p - 0.5, 1));
  const resetZoom = () => setZoom(1);

  if (cargando) {
    return (
      <div className="min-h-screen bg-[#FDFDFF] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#7C3AED] mb-4" />
        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
          Cargando expediente...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFDFF] font-sans text-[#020817] antialiased">
      <main className="p-4 md:p-8 max-w-[1400px] mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 text-sm font-bold mb-6 hover:text-black transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Regresar
        </button>

        <div className="mb-10">
          <h1 className="text-3xl font-black text-[#020817] tracking-tight">
            Revisión de Reclamo
          </h1>
          <p className="text-[12px] text-gray-400 mt-1 font-bold uppercase tracking-wider">
            Expediente de gestión y respuesta
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white p-6 md:p-8 rounded-[1.5rem] border border-gray-100 shadow-sm">
              <h2 className="text-xl font-black text-gray-800 mb-2 tracking-tight">
                {reclamo?.asunto || "Sin Asunto"}
              </h2>
              <div className="flex items-center gap-2 text-gray-400 text-xs font-bold mb-6 uppercase tracking-wider">
                <Calendar className="w-3.5 h-3.5" />
                <span>
                  Fecha de Emisión:{" "}
                  {reclamo?.fechaEmision
                    ? fromTimestamp(reclamo.fechaEmision)
                    : "N/A"}
                </span>
              </div>

              <div className="bg-gray-50/50 p-5 rounded-xl border border-gray-100 mb-8">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                  Descripción
                </p>
                <p className="text-sm text-gray-600 leading-relaxed font-medium">
                  {reclamo?.descripcion || "No hay descripción disponible."}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">
                  Evidencia Adjunta
                </p>
                <div
                  className="relative group cursor-zoom-in rounded-2xl overflow-hidden border border-gray-100 w-full max-w-md aspect-video bg-gray-50 shadow-sm"
                  onClick={() => setIsModalOpen(true)}
                >
                  <img
                    src={reclamo?.evidenciaUrl}
                    alt="Evidencia"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="bg-white px-4 py-2 rounded-xl text-xs font-black shadow-lg">
                      Click para ampliar
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 md:p-8 rounded-[1.5rem] border border-gray-100 shadow-sm">
              <h2 className="text-xl font-black text-gray-800 mb-6 tracking-tight">
                Gestión de Respuesta
              </h2>

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
                      className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:border-gray-900 hover:bg-gray-50 transition-all"
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
                    className="px-4 py-2 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-600 hover:bg-red-100 transition-all"
                  >
                    Rechazo por Mal Uso
                  </button>
                </div>
              </div>

              <textarea
                className="w-full h-40 p-5 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-100 transition-all resize-none text-sm font-medium"
                placeholder="Escriba su respuesta formal aquí..."
                value={respuesta}
                onChange={(e) => setRespuesta(e.target.value)}
              />

              <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
                <button
                  className="px-8 py-3 rounded-xl font-bold text-sm text-gray-500 border border-gray-200 hover:bg-gray-50 transition-all"
                  onClick={cancelarAccion}
                >
                  Cancelar
                </button>
                <button
                  className={`px-8 py-3 rounded-xl font-black text-sm text-white transition-all flex items-center justify-center gap-2 shadow-lg
                    ${
                      !respuesta.trim()
                        ? "bg-gray-200 cursor-not-allowed text-gray-400 shadow-none"
                        : "bg-[#020817] hover:bg-gray-800 shadow-gray-200"
                    }`}
                  onClick={() => setMostrarModal(true)}
                  disabled={!respuesta.trim()}
                >
                  Enviar Respuesta <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-6 rounded-[1.5rem] border border-gray-100 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-5">
                Información del Solicitante
              </p>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl border border-gray-100 overflow-hidden bg-gray-50 flex-shrink-0 shadow-sm">
                  <img
                    src={
                      credito?.fotoUrl ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(reclamo?.solicitante || "U")}&background=F3F4F6&color=6B7280`
                    }
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="overflow-hidden">
                  <h4 className="font-black text-gray-900 truncate">
                    {reclamo?.solicitante || "Cargando..."}
                  </h4>
                  <p className="text-[11px] text-gray-400 font-bold truncate uppercase tracking-tight">
                    {reclamo?.usuarioId}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-[#020817] p-6 rounded-[1.5rem] border border-white/5 shadow-xl">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-6">
                Estado del Crédito
              </p>

              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-[9px] uppercase text-zinc-500 font-black mb-1 tracking-widest">
                    Fecha de Aprobación
                  </p>
                  <p className="text-sm font-black text-zinc-100">
                    {credito?.fechaRevision
                      ? fromTimestampToSimpleDate(credito.fechaRevision)
                      : "N/A"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] uppercase text-zinc-500 font-black mb-1 tracking-widest">
                    Vence
                  </p>
                  <p className="text-sm font-black text-zinc-100">
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

              <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center border
                      ${
                        vigente
                          ? "bg-purple-500/20 border-purple-500/30"
                          : "bg-red-500/20 border-red-500/30"
                      }`}
                    >
                      {vigente ? (
                        <ShieldCheck className="w-5 h-5 text-purple-400" />
                      ) : (
                        <ShieldOff className="w-5 h-5 text-red-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-0.5">
                        Garantía
                      </p>
                      <div className="flex items-center gap-1.5">
                        <p className="text-lg font-black text-white leading-none">
                          {usaMeses
                            ? credito.plazoGarantia
                            : usaDias
                              ? credito.plazoGarantiaDia
                              : "—"}
                        </p>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-zinc-500" />
                          <span className="text-[10px] font-black text-zinc-400 uppercase">
                            {usaMeses ? "meses" : usaDias ? "días" : ""}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border
                    ${
                      vigente
                        ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
                        : "bg-red-500/20 border-red-500/30 text-red-400"
                    }`}
                  >
                    {vigente ? "Aplicable" : "Expirada"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4">
          <div className="absolute top-6 right-6 flex gap-3">
            <div className="flex bg-zinc-800 rounded-xl p-1 border border-zinc-700 z-50">
              <button
                onClick={handleZoomIn}
                className="p-2 text-white hover:bg-zinc-700 rounded-lg transition-colors"
              >
                <ZoomIn className="w-5 h-5" />
              </button>
              <button
                onClick={handleZoomOut}
                className="p-2 text-white hover:bg-zinc-700 rounded-lg transition-colors"
              >
                <ZoomOut className="w-5 h-5" />
              </button>
              <button
                onClick={resetZoom}
                className="p-2 text-white hover:bg-zinc-700 rounded-lg transition-colors"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>
            <button
              onClick={() => {
                setIsModalOpen(false);
                resetZoom();
              }}
              className="bg-red-600 p-3 rounded-xl text-white hover:bg-red-700 transition-colors"
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
            <div className="flex flex-col items-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mb-5 border border-emerald-100">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-black text-[#020817] mb-2">
                ¿Estás seguro?
              </h3>
              <p className="text-sm text-gray-400 text-center font-medium leading-relaxed">
                Esta acción marcará el reclamo como{" "}
                <span className="font-black text-gray-700">"Revisado"</span> y
                no podrás hacer más cambios.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <button
                disabled={procesando}
                onClick={ejecutarAccion}
                className="w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest bg-[#020817] text-white hover:bg-black transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {procesando && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirmar envío
              </button>
              <button
                disabled={procesando}
                onClick={() => setMostrarModal(false)}
                className="w-full py-4 text-xs font-bold text-gray-400 uppercase tracking-widest hover:text-gray-900 transition-colors disabled:opacity-50"
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
