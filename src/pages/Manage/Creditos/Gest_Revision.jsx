import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  CheckCircle2,
  Package,
  Inbox,
  Loader2,
  AlertCircle,
  XCircle,
} from "lucide-react";
import {
  obtenerCreditosPorId,
  obtenerTotalCuotasAprobadas,
  actualizarRevisionCredito,
  obtenerProductoPorId,
} from "../../../services/creditosService";
import { obtenerEmpleadoPorId } from "../../../services/empleadosService";

const RevisionCredito = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [credito, setCredito] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [empleado, setEmpleado] = useState(null);
  const [producto, setProducto] = useState(null);
  const [creditoUsado, setCreditoUsado] = useState(0);
  const [creditoFuturo, setCreditoFuturo] = useState(0);
  const [porcUsado, setPorcUsado] = useState(0);
  const [porcFuturo, setPorcFuturo] = useState(0);
  const [respuestaRevisor, setRespuestaRevisor] = useState("");

  const [mostrarModal, setMostrarModal] = useState(false);
  const [tipoAccion, setTipoAccion] = useState(null);
  const [procesando, setProcesando] = useState(false);

  // --- VALIDACIONES DINÁMICAS ---
  const tieneStockSuficiente = producto?.stock >= (credito?.cantidad || 0);
  const limiteValido = porcFuturo <= 100;
  const puedeAprobar = tieneStockSuficiente && limiteValido;

  const formatearLempiras = (monto) => {
    return new Intl.NumberFormat("es-HN", {
      style: "currency",
      currency: "HNL",
    }).format(monto);
  };

  const abrirConfirmacion = (tipo) => {
    setTipoAccion(tipo);
    setMostrarModal(true);
  };

  const ejecutarAccion = async () => {
    setProcesando(true);
    try {
      await actualizarRevisionCredito(id, tipoAccion, respuestaRevisor);
      navigate("/creditos");
    } catch (error) {
      console.error("Error al actualizar:", error);
      alert("Ocurrió un error al procesar la solicitud.");
    } finally {
      setProcesando(false);
      setMostrarModal(false);
    }
  };

  useEffect(() => {
    const cargarCredito = async () => {
      try {
        const data = await obtenerCreditosPorId(id);
        if (!data?.usuarioId) return;

        const [creditoUsadoData] = await Promise.all([
          obtenerTotalCuotasAprobadas(data.usuarioId),
        ]);

        const empleadoData = await obtenerEmpleadoPorId(data.empleadoId);
        const productData = await obtenerProductoPorId(data.productoId);

        const cuota = data.cuotaMensual || 0;
        const totalFuturo = (creditoUsadoData || 0) + cuota;
        const limite = empleadoData?.limiteCredito || 0;

        setCredito(data);
        setEmpleado(empleadoData);
        setProducto(productData);
        setCreditoUsado(creditoUsadoData || 0);
        setCreditoFuturo(totalFuturo);

        setPorcUsado(limite > 0 ? (creditoUsadoData / limite) * 100 : 0);
        setPorcFuturo(limite > 0 ? (totalFuturo / limite) * 100 : 0);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setCargando(false);
      }
    };
    if (id) cargarCredito();
  }, [id]);

  const recomendacionAprobar = () => {
    setRespuestaRevisor(
      "Después de revisar el expediente, se aprueba el crédito ya que el cliente cumple con los requisitos establecidos.",
    );
  };

  const recomendacionRechazar = () => {
    setRespuestaRevisor(
      "Después de revisar el expediente, se rechaza el crédito ya que no cumple con las políticas de riesgo o disponibilidad.",
    );
  };

  if (cargando) {
    return (
      <div className="min-h-screen bg-[#F8F9FF] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#7C3AED] mb-4" />
        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest text-center px-4">
          Analizando Riesgos del Expediente...
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-[1200px] mx-auto bg-[#F8F9FF] min-h-screen text-[#020817]">
      <div className="mb-6">
        <button
          onClick={() => navigate("/creditos")}
          className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-[#020817] transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Regresar
        </button>
      </div>

      <h1 className="text-3xl font-black mb-8 tracking-tighter">
        Revisión de Crédito
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* PANEL DE EMPLEADO Y LÍMITES */}
          <div className="bg-white p-6 md:p-8 rounded-[1.5rem] border border-[#DADEE8] shadow-sm space-y-8">
            <div className="flex flex-col md:flex-row md:items-center gap-6 p-5 bg-gray-50 rounded-2xl border border-gray-200">
              <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-2xl overflow-hidden bg-purple-100 flex-shrink-0 border-2 border-white shadow-md">
                {empleado.fotoUrl ? (
                  <img
                    src={empleado.fotoUrl}
                    alt="Foto"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#7C3AED] font-bold text-2xl uppercase">
                    {empleado.nombres?.substring(0, 2)}
                  </div>
                )}
              </div>

              <div className="flex-grow space-y-3">
                <div>
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                    Perfil del Cliente
                  </h3>
                  <p className="text-2xl font-black text-gray-950 tracking-tighter uppercase leading-none">
                    {empleado.nombres} {empleado.apellidos}
                  </p>
                </div>
                <div className="flex gap-4 items-center">
                  <span className="bg-white px-3 py-1 rounded-full border border-gray-200 text-[10px] font-black text-gray-400 uppercase">
                    ID: {empleado.empleadoId}
                  </span>
                  <span className="bg-[#020817] px-3 py-1 rounded-full text-[10px] font-black text-white uppercase tracking-wider">
                    Límite: {formatearLempiras(empleado.limiteCredito)}
                  </span>
                </div>
              </div>
            </div>

            {/* METRICAS DE CRÉDITO */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-2">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                  Límite Disponible
                </p>
                <p
                  className={`text-base font-black ${limiteValido ? "text-emerald-600" : "text-red-600"}`}
                >
                  {formatearLempiras(empleado.limiteCredito - creditoUsado)}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                  Uso Actual
                </p>
                <p className="text-base font-black text-gray-900">
                  {formatearLempiras(creditoUsado)}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                  Proximo valor
                </p>
                <p className="text-base font-black text-[#7C3AED]">
                  {formatearLempiras(creditoFuturo)}
                </p>
              </div>
            </div>

            {/* BARRA DE PROGRESO DINÁMICA */}
            <div className="space-y-4 pt-4 border-t border-gray-50">
              <div className="flex justify-between items-end gap-4">
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                    Nivel de Endeudamiento
                  </p>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 bg-[#7C3AED] rounded-full"></div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase">
                        Actual ({porcUsado.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 bg-gray-200 rounded-full"></div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase">
                        Proyección ({porcFuturo.toFixed(0)}%)
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-gray-400 uppercase mb-1">
                    Estado Proyectado
                  </p>
                  {porcFuturo > 100 ? (
                    <p className="text-xl font-black text-red-600 animate-pulse uppercase italic">
                      EXCEDIDO
                    </p>
                  ) : (
                    <p className="text-2xl font-black text-gray-950">
                      {porcFuturo.toFixed(0)}
                      <span className="text-xs ml-0.5">%</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="relative w-full bg-gray-100 h-5 rounded-full overflow-hidden border border-gray-50">
                <div
                  className={`absolute top-0 left-0 h-full transition-all duration-700 ease-out ${porcFuturo > 100 ? "bg-red-500" : "bg-gray-900/10"}`}
                  style={{ width: `${Math.min(porcFuturo, 100)}%` }}
                ></div>
                <div
                  className="absolute top-0 left-0 bg-[#7C3AED] h-full rounded-full transition-all duration-500 ease-out shadow-lg"
                  style={{ width: `${Math.min(porcUsado, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-[1.5rem] border border-[#DADEE8] shadow-sm">
              <h3 className="text-xs font-black uppercase text-gray-400 mb-4 tracking-widest">
                Información del Producto
              </h3>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-50 rounded-xl overflow-hidden border border-gray-100 flex-shrink-0">
                  <img
                    src={producto.imagenFrontalUrl}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="font-black text-sm text-gray-800">
                    {credito.nombreProducto}
                  </p>
                  <p
                    className={`text-[11px] font-black flex items-center gap-1 mt-1 uppercase ${
                      tieneStockSuficiente ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    {tieneStockSuficiente ? (
                      <CheckCircle2 className="w-3 h-3" />
                    ) : (
                      <AlertCircle className="w-3 h-3" />
                    )}
                    {tieneStockSuficiente
                      ? `Stock disponible: ${producto?.stock} unidades`
                      : `Stock insuficiente: ${producto?.stock} disponibles vs ${credito?.cantidad} solicitadas`}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-[1.5rem] border border-[#DADEE8] shadow-sm">
              <h3 className="text-xs font-black uppercase text-gray-400 mb-4 tracking-widest">
                Plan de Crédito
              </h3>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">
                    Cant.
                  </p>
                  <p className="text-xl font-black">{credito.cantidad}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">
                    Meses
                  </p>
                  <p className="text-xl font-black">{credito.plazoMeses}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">
                    Cuota HNL
                  </p>
                  <p className="text-xl font-black text-gray-900">
                    {formatearLempiras(credito.cuotaMensual)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* COMENTARIOS */}
          <div className="bg-white p-6 rounded-[1.5rem] border border-[#DADEE8] shadow-sm">
            <h3 className="text-xs font-black uppercase text-gray-400 mb-4 tracking-widest">
              Resolución del Revisor
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <button
                disabled={!puedeAprobar}
                className="text-[10px] font-black p-3 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100 transition-all disabled:opacity-30"
                onClick={recomendacionAprobar}
              >
                AUTO-COMPLETAR: APROBAR
              </button>
              <button
                className="text-[10px] font-black p-3 rounded-xl bg-red-50 text-red-500 border border-red-100 hover:bg-red-100 transition-all"
                onClick={recomendacionRechazar}
              >
                AUTO-COMPLETAR: RECHAZAR
              </button>
            </div>
            <textarea
              placeholder="Escriba aquí sus observaciones técnicas..."
              className="w-full h-32 p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-100 resize-none text-sm font-bold text-gray-700"
              value={respuestaRevisor}
              onChange={(e) => setRespuestaRevisor(e.target.value)}
            />
          </div>
        </div>

        {/* COLUMNA DERECHA: ESTADO DE VALIDACIÓN (DINÁMICO) */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-[1.5rem] border border-[#DADEE8] h-fit shadow-sm sticky top-8">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">
              Estado de Validación
            </h3>

            <div className="space-y-3">
              {/* Validación Límite */}
              <div
                className={`flex gap-3 p-4 rounded-2xl border transition-all ${limiteValido ? "bg-emerald-50 border-emerald-100" : "bg-red-50 border-red-100 animate-pulse"}`}
              >
                {limiteValido ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600 shrink-0" />
                )}
                <p
                  className={`text-[11px] font-black uppercase tracking-tight ${limiteValido ? "text-emerald-800" : "text-red-800"}`}
                >
                  {limiteValido
                    ? "Capacidad de pago confirmada"
                    : "Límite de crédito superado"}
                </p>
              </div>

              {/* Validación Stock */}
              <div
                className={`flex gap-3 p-4 rounded-2xl border transition-all ${
                  tieneStockSuficiente
                    ? "bg-emerald-50 border-emerald-100"
                    : "bg-red-50 border-red-100 animate-pulse"
                }`}
              >
                {tieneStockSuficiente ? (
                  <Inbox className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <Package className="w-5 h-5 text-red-600 shrink-0" />
                )}
                <p
                  className={`text-[11px] font-black uppercase tracking-tight ${
                    tieneStockSuficiente ? "text-emerald-800" : "text-red-800"
                  }`}
                >
                  {tieneStockSuficiente
                    ? "Stock verificado en almacén"
                    : "No hay stock para cubrir el pedido"}
                </p>
              </div>
            </div>

            {!puedeAprobar && (
              <div className="mt-6 p-4 bg-gray-900 rounded-2xl text-center">
                <p className="text-[10px] font-black text-white uppercase leading-tight">
                  Acción de aprobación bloqueada por seguridad
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* BOTONES FINALES */}
      <div className="flex justify-center gap-4 mt-12 mb-20">
        <button
          className="px-12 py-4 border border-gray-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-100 transition-all active:scale-95"
          onClick={() => abrirConfirmacion("Rechazado")}
        >
          Rechazar Solicitud
        </button>
        <button
          disabled={!puedeAprobar}
          className={`px-12 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 ${
            puedeAprobar
              ? "bg-[#020817] text-white hover:bg-black shadow-lg"
              : "bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-300"
          }`}
          onClick={() => abrirConfirmacion("Aprobado")}
        >
          Aprobar Solicitud
        </button>
      </div>

      {/* MODAL CONFIRMACIÓN */}
      {mostrarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#020817]/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl border border-gray-100">
            <div
              className={`w-16 h-16 rounded-3xl flex items-center justify-center mb-6 shadow-sm ${tipoAccion === "Aprobado" ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"}`}
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
              Esta operación quedará registrada permanentemente en el historial
              del empleado.
            </p>
            <div className="flex flex-col gap-3">
              <button
                disabled={procesando}
                onClick={ejecutarAccion}
                className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-md ${tipoAccion === "Aprobado" ? "bg-[#020817] text-white" : "bg-red-600 text-white"} flex items-center justify-center gap-2`}
              >
                {procesando && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirmar {tipoAccion}
              </button>
              <button
                disabled={procesando}
                onClick={() => setMostrarModal(false)}
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
};

export default RevisionCredito;
