import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  Loader2,
  Package,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import {
  obtenerCompraPorId,
  resolverCompra,
} from "../../../services/comprasService";

const formatFecha = (fecha) => {
  if (!fecha) return "—";
  const d = fecha?.toDate ? fecha.toDate() : new Date(fecha);
  return d.toLocaleDateString("es-HN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

export default function RevisionSolicitud() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [compra, setCompra] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [motivoRechazo, setMotivoRechazo] = useState("");

  const [modalVisible, setModalVisible] = useState(false);
  const [tipoAccion, setTipoAccion] = useState(null);
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    const cargar = async () => {
      try {
        const data = await obtenerCompraPorId(id);
        setCompra(data);
      } catch (error) {
        console.error(error);
      } finally {
        setCargando(false);
      }
    };
    if (id) cargar();
  }, [id]);

  const abrirConfirmacion = (tipo) => {
    if (tipo === "Rechazado" && !motivoRechazo.trim()) {
      alert("Debes ingresar un motivo de rechazo.");
      return;
    }
    setTipoAccion(tipo);
    setModalVisible(true);
  };

  const ejecutarAccion = async () => {
    setProcesando(true);
    try {
      await resolverCompra(id, tipoAccion, motivoRechazo.trim());
      navigate("/solicitudes-compra");
    } catch (error) {
      console.error(error);
      alert("Error al procesar la solicitud.");
    } finally {
      setProcesando(false);
      setModalVisible(false);
    }
  };

  if (cargando) {
    return (
      <div className="min-h-screen bg-[#F8F9FF] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#7C3AED] mb-4" />
        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
          Cargando Solicitud...
        </p>
      </div>
    );
  }

  if (!compra) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400 font-bold">Solicitud no encontrada.</p>
      </div>
    );
  }

  const totalUnidades = (compra.productos || []).reduce(
    (a, b) => a + Number(b.cantidad),
    0
  );

  return (
    <div className="p-4 md:p-8 max-w-[1200px] mx-auto bg-[#F8F9FF] min-h-screen text-[#020817]">
      <div className="mb-6">
        <button
          onClick={() => navigate("/solicitudes-compra")}
          className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-[#020817] transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Regresar
        </button>
      </div>

      <h1 className="text-3xl font-black mb-2 tracking-tighter">
        Revisión de Solicitud
      </h1>
      <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mb-8">
        {compra.compraId} · {formatFecha(compra.fechaCreacion)}
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* COLUMNA PRINCIPAL */}
        <div className="lg:col-span-2 space-y-6">
          {/* INFO DEL PEDIDO */}
          <div className="bg-white p-6 md:p-8 rounded-[1.5rem] border border-[#DADEE8] shadow-sm space-y-6">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-gray-400">
              Información del Pedido
            </h2>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">
                  Solicitado Por
                </p>
                <p className="font-black text-sm text-gray-800">
                  {compra.solicitadoPor}
                </p>
              </div>
              <div>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">
                  Fecha de Solicitud
                </p>
                <p className="font-bold text-sm text-gray-700">
                  {formatFecha(compra.fechaCreacion)}
                </p>
              </div>
              <div>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">
                  Estado Actual
                </p>
                <span className="text-[10px] font-black px-3 py-1.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100">
                  {compra.estado?.toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">
                  Total Unidades
                </p>
                <p className="font-black text-sm text-gray-800">
                  {totalUnidades} uds.
                </p>
              </div>
            </div>
          </div>

          {/* TABLA DE PRODUCTOS */}
          <div className="bg-white rounded-[1.5rem] border border-[#DADEE8] shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-50 flex items-center gap-3">
              <Package className="w-4 h-4 text-[#7C3AED]" />
              <h2 className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                Productos Solicitados ({(compra.productos || []).length} líneas)
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-[10px] font-black text-gray-300 uppercase tracking-widest border-b border-gray-50">
                    <th className="px-6 py-4 text-left">#</th>
                    <th className="px-6 py-4 text-left">Producto</th>
                    <th className="px-6 py-4 text-right">Cantidad</th>
                  </tr>
                </thead>
                <tbody>
                  {(compra.productos || []).map((prod, i) => (
                    <tr
                      key={prod.id}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-6 py-4 border-b border-gray-50/50 text-[11px] font-black text-gray-400">
                        {i + 1}
                      </td>
                      <td className="px-6 py-4 border-b border-gray-50/50">
                        <p className="font-black text-sm text-gray-800">
                          {prod.nombreProducto}
                        </p>
                        <p className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-lg inline-block mt-0.5">
                          {prod.id}
                        </p>
                      </td>
                      <td className="px-6 py-4 border-b border-gray-50/50 text-right">
                        <p className="text-lg font-black text-[#020817]">
                          {prod.cantidad}
                          <span className="text-[10px] text-gray-400 font-bold ml-1">
                            uds
                          </span>
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50">
                    <td colSpan={2} className="px-6 py-4 text-right">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        Total Unidades
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-xl font-black text-[#020817]">
                        {totalUnidades}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* MOTIVO DE RECHAZO */}
          <div className="bg-white p-6 rounded-[1.5rem] border border-[#DADEE8] shadow-sm">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">
              Resolución
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <button
                type="button"
                className="text-[10px] font-black p-3 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100 transition-all"
                onClick={() => setMotivoRechazo("")}
              >
                AUTO-COMPLETAR: APROBAR
              </button>
              <button
                type="button"
                className="text-[10px] font-black p-3 rounded-xl bg-red-50 text-red-500 border border-red-100 hover:bg-red-100 transition-all"
                onClick={() =>
                  setMotivoRechazo(
                    "Después de revisar la solicitud, se rechaza el pedido ya que los productos o cantidades no están disponibles en este momento."
                  )
                }
              >
                AUTO-COMPLETAR: RECHAZAR
              </button>
            </div>
            <textarea
              placeholder="Si va a rechazar, escriba aquí el motivo detallado (obligatorio)..."
              value={motivoRechazo}
              onChange={(e) => setMotivoRechazo(e.target.value)}
              className="w-full h-32 p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-100 resize-none text-sm font-bold text-gray-700"
            />
            <p className="text-[10px] text-gray-400 font-bold mt-2">
              El motivo de rechazo será visible para quien realizó el pedido.
            </p>
          </div>
        </div>

        {/* COLUMNA DERECHA */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-[1.5rem] border border-[#DADEE8] shadow-sm sticky top-8 space-y-4">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
              Validación
            </h3>

            <div className="flex gap-3 p-4 rounded-2xl border bg-emerald-50 border-emerald-100">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <p className="text-[11px] font-black uppercase tracking-tight text-emerald-800">
                Solicitud recibida correctamente
              </p>
            </div>

            <div
              className={`flex gap-3 p-4 rounded-2xl border transition-all ${
                motivoRechazo.trim()
                  ? "bg-amber-50 border-amber-100"
                  : "bg-gray-50 border-gray-100"
              }`}
            >
              <AlertTriangle
                className={`w-5 h-5 shrink-0 ${
                  motivoRechazo.trim() ? "text-amber-600" : "text-gray-400"
                }`}
              />
              <p
                className={`text-[11px] font-black uppercase tracking-tight ${
                  motivoRechazo.trim() ? "text-amber-800" : "text-gray-500"
                }`}
              >
                {motivoRechazo.trim()
                  ? "Motivo de rechazo registrado"
                  : "Sin motivo de rechazo (solo si aprueba)"}
              </p>
            </div>

            <div className="pt-2 space-y-3">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                Resumen del pedido
              </p>
              <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                <div className="flex justify-between">
                  <p className="text-[10px] font-black text-gray-500 uppercase">
                    Líneas
                  </p>
                  <p className="text-[10px] font-black text-gray-800">
                    {(compra.productos || []).length}
                  </p>
                </div>
                <div className="flex justify-between">
                  <p className="text-[10px] font-black text-gray-500 uppercase">
                    Unidades
                  </p>
                  <p className="text-[10px] font-black text-gray-800">
                    {totalUnidades}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BOTONES */}
      <div className="flex justify-center gap-4 mt-12 mb-20">
        <button
          onClick={() => abrirConfirmacion("Rechazado")}
          className="px-12 py-4 border border-gray-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-100 transition-all active:scale-95"
        >
          Rechazar Solicitud
        </button>
        <button
          onClick={() => abrirConfirmacion("Aprobado")}
          className="px-12 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest bg-[#020817] text-white hover:bg-black shadow-lg transition-all active:scale-95"
        >
          Aprobar Solicitud
        </button>
      </div>

      {/* MODAL CONFIRMACIÓN */}
      {modalVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#020817]/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl border border-gray-100">
            <div
              className={`w-16 h-16 rounded-3xl flex items-center justify-center mb-6 shadow-sm ${
                tipoAccion === "Aprobado"
                  ? "bg-emerald-100 text-emerald-600"
                  : "bg-red-100 text-red-600"
              }`}
            >
              {tipoAccion === "Aprobado" ? (
                <CheckCircle2 className="w-8 h-8" />
              ) : (
                <XCircle className="w-8 h-8" />
              )}
            </div>
            <h3 className="text-2xl font-black tracking-tighter mb-2 italic">
              ¿Proceder con {tipoAccion}?
            </h3>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-tight mb-8">
              Esta operación quedará registrada en el historial del sistema.
            </p>

            {tipoAccion === "Rechazado" && motivoRechazo && (
              <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-6">
                <p className="text-[10px] font-black text-red-700 uppercase tracking-widest mb-1">
                  Motivo
                </p>
                <p className="text-[11px] text-red-600 font-bold">
                  {motivoRechazo}
                </p>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button
                disabled={procesando}
                onClick={ejecutarAccion}
                className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-md ${
                  tipoAccion === "Aprobado"
                    ? "bg-[#020817] text-white"
                    : "bg-red-600 text-white"
                }`}
              >
                {procesando && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirmar {tipoAccion}
              </button>
              <button
                disabled={procesando}
                onClick={() => setModalVisible(false)}
                className="w-full py-4 text-[10px] font-black text-gray-400 uppercase hover:text-[#020817] transition-colors"
              >
                Cancelar Operación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
