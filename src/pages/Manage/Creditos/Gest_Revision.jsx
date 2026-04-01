import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  CheckCircle2,
  Package,
  Inbox,
  Loader2,
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

  // Estados para el modal
  const [mostrarModal, setMostrarModal] = useState(false);
  const [tipoAccion, setTipoAccion] = useState(null); // 'Aprobado' o 'Rechazado'
  const [procesando, setProcesando] = useState(false);

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
      alert("Ocurrió un error al procesar la solicitud en el servidor.");
    } finally {
      setProcesando(false);
      setMostrarModal(false);
    }
  };

  useEffect(() => {
    const cargarCredito = async () => {
      try {
        const data = await obtenerCreditosPorId(id);

        if (!data?.usuarioId) {
          console.error("El crédito no tiene un usuarioId asociado");
          return;
        }

        const [creditoUsadoData] = await Promise.all([
          obtenerTotalCuotasAprobadas(data.usuarioId),
        ]);

        const empleadoData = await obtenerEmpleadoPorId(data.empleadoId);
        const productData = await obtenerProductoPorId(data.productoId);

        setCreditoFuturo(creditoUsadoData + data.cuotaMensual);
        setCredito(data);
        setEmpleado(empleadoData);
        setProducto(productData);
        setCreditoUsado(creditoUsadoData || 0);

        const valorFuturoLocal = creditoUsadoData + (data.cuotaMensual || 0);

        const limite = empleadoData?.limiteCredito || 0;
        const porcentaje = limite > 0 ? (creditoUsadoData / limite) * 100 : 0;
        const porcentajeFuturo =
          limite > 0 ? (valorFuturoLocal / limite) * 100 : 0;
        setPorcUsado(porcentaje);
        setPorcFuturo(porcentajeFuturo);
      } catch (error) {
        console.error("Error al obtener el expediente completo:", error);
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
      "Después de revisar el expediente, se rechaza el crédito ya que el cliente no cumple con los requisitos establecidos.",
    );
  };

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
    <div className="p-4 md:p-8 max-w-[1200px] mx-auto bg-[#F8F9FF] min-h-screen text-[#020817]">
      {/* --- BOTÓN REGRESAR --- */}
      <div className="mb-6">
        <button
          onClick={() => navigate("/creditos")}
          className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-[#020817] transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Regresar
        </button>
      </div>
      <h1 className="text-3xl font-bold mb-8">Revisión de Crédito</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 md:p-8 rounded-[1.5rem] border border-[#DADEE8] space-y-8">
            <div className="flex flex-col md:flex-row md:items-center gap-6 p-5 bg-gray-50 rounded-2xl border border-gray-200">
              <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-2xl overflow-hidden bg-purple-100 flex-shrink-0 border-2 border-white shadow-inner">
                {empleado.fotoUrl ? (
                  <img
                    src={empleado.fotoUrl}
                    alt="Foto del Empleado"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#7C3AED] font-bold text-2xl bg-purple-50">
                    {empleado.nombres?.substring(0, 2).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Datos del Perfil */}
              <div className="flex-grow space-y-3">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-1">
                    Información del Cliente
                  </h3>
                  <p className="text-2xl font-bold text-gray-950 tracking-tighter">
                    {empleado.nombres + " " + empleado.apellidos ||
                      "Nombre no disponible"}
                  </p>
                </div>
                <div className="flex gap-4 items-center">
                  <span className="bg-white px-3 py-1 rounded-full border border-gray-100 text-[10px] font-semibold text-gray-500 uppercase">
                    ID: {empleado.empleadoId || "S/N"}
                  </span>
                  <span className="bg-purple-50 px-3 py-1 rounded-full border border-purple-100 text-[10px] font-bold text-[#7C3AED] uppercase">
                    Límite: L.{" "}
                    {empleado.limiteCredito?.toLocaleString("es-HN", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3  gap-6 border-gray-100 pt-2">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                  Límite Disponible
                </p>
                <p className="text-base font-bold text-gray-900">
                  L.{" "}
                  {(empleado.limiteCredito - creditoUsado).toLocaleString(
                    "es-HN",
                    { minimumFractionDigits: 2 },
                  )}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                  Uso Actual
                </p>
                <p className="text-base font-bold text-gray-900">
                  L.{" "}
                  {creditoUsado.toLocaleString("es-HN", {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                  Proyección Solicitud
                </p>
                <p className="text-base font-bold text-gray-900">
                  L.{" "}
                  {creditoFuturo.toLocaleString("es-HN", {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <div className="flex justify-between items-center gap-4">
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2.5">
                    Estado de Utilización de Crédito
                  </p>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 bg-[#7C3AED] rounded-full"></div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase">
                        Actual ({porcUsado.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 bg-gray-900/20 rounded-full border border-gray-300"></div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase">
                        Proyección Total ({porcFuturo.toFixed(0)}%)
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">
                    Total Comprometido
                  </p>
                  <p className="text-2xl font-black text-gray-950">
                    {porcFuturo.toFixed(0)}
                    <span className="text-xs ml-0.5">%</span>
                  </p>
                </div>
              </div>

              <div className="relative w-full bg-gray-100 h-4 rounded-full overflow-hidden border border-gray-100 shadow-inner">
                <div
                  className="absolute top-0 left-0 bg-gray-900/15 h-full rounded-full transition-all duration-700 ease-out"
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
            {/* Información del Producto */}
            <div className="bg-white p-6 rounded-[1.5rem] border border-[#DADEE8]">
              <h3 className="text-sm font-bold mb-4">
                Información del Producto
              </h3>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center border border-gray-100">
                  <img
                    src={producto.imagenFrontalUrl}
                    alt="Foto del Empleado"
                    className="w-full h-full object-cover rounded-md"
                  />{" "}
                </div>
                <div>
                  <p className="font-bold text-sm">{credito.nombreProducto}</p>
                  <p className="text-xs text-green-600 font-bold flex items-center gap-1 mt-1">
                    <CheckCircle2 className="w-3 h-3" /> Stock:{" "}
                    {producto?.stock || "N/A"} unidades
                  </p>
                </div>
              </div>
            </div>

            {/* Gestión del Crédito */}
            <div className="bg-white p-6 rounded-[1.5rem] border border-[#DADEE8]">
              <h3 className="text-sm font-bold mb-4">Gestión del Crédito</h3>
              <div className="flex justify-between">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                    Cantidad
                  </p>
                  <p className="text-xl font-bold">{credito.cantidad}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                    Cuotas
                  </p>
                  <p className="text-xl font-bold">{credito.plazoMeses}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                    Valor Cuota
                  </p>
                  <p className="text-xl font-bold">
                    L. {credito.cuotaMensual.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Comentarios del Revisor */}
          <div className="bg-white p-6 rounded-[1.5rem] border border-[#DADEE8]">
            <h3 className="text-sm font-bold mb-4">Comentarios del Revisor</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <button
                className="text-[10px] font-bold p-3 rounded-xl bg-green-50 text-green-600 border border-green-100 hover:bg-green-100 transition-colors"
                onClick={recomendacionAprobar}
              >
                RESPUESTAS RÁPIDA: APROBAR
                <span className="block font-medium mt-1 normal-case text-xs">
                  Tu solicitud de crédito ha sido aprobada.
                </span>
              </button>
              <button
                className="text-[10px] font-bold p-3 rounded-xl bg-red-50 text-red-500 border border-red-100 hover:bg-red-100 transition-colors"
                onClick={recomendacionRechazar}
              >
                RESPUESTAS RÁPIDA: RECHAZAR
                <span className="block font-medium mt-1 normal-case text-xs">
                  No cumples con los requisitos mínimos para obtener el crédito
                </span>
              </button>
            </div>

            <textarea
              placeholder="Escriba aquí sus observaciones técnicas..."
              className="w-full h-32 p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-50 resize-none text-sm font-medium"
              value={respuestaRevisor}
              onChange={(e) => setRespuestaRevisor(e.target.value)}
            />
          </div>
        </div>

        {/* COLUMNA DERECHA (ESTADO DE VALIDACIÓN) */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-[1.5rem] border border-[#DADEE8] h-fit">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6">
              Estado de Validación
            </h3>

            <div className="space-y-4">
              <div className="flex gap-3 p-4 bg-green-50 rounded-2xl border border-green-50">
                <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                <p className="text-xs font-medium text-green-800">
                  El cliente cumple con los requisitos para obtener el crédito.
                </p>
              </div>

              <div className="flex gap-3 p-4 bg-green-50 rounded-2xl border border-green-50">
                <Inbox className="w-5 h-5 text-green-600 shrink-0" />
                <p className="text-xs font-medium text-green-800">
                  El producto cuenta con stock suficiente.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- BOTONES DE ACCIÓN INFERIORES --- */}
      <div className="flex justify-center gap-4 mt-12 mb-20">
        <button
          className="px-12 py-3 border border-gray-900 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-gray-50 transition-colors"
          onClick={() => abrirConfirmacion("Rechazado")}
        >
          Rechazar
        </button>
        <button
          className="px-12 py-3 bg-gray-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-black transition-colors"
          onClick={() => abrirConfirmacion("Aprobado")}
        >
          Aprobar
        </button>
      </div>
      {mostrarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl border border-gray-100 animate-in fade-in zoom-in duration-200">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${tipoAccion === "Aprobado" ? "bg-green-100" : "bg-red-100"}`}
            >
              {tipoAccion === "Aprobado" ? (
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              ) : (
                <Package className="w-8 h-8 text-red-600" />
              )}
            </div>

            <h3 className="text-xl font-bold mb-2">¿Estás seguro?</h3>
            <p className="text-sm text-gray-500 mb-8">
              Estás a punto de{" "}
              {tipoAccion === "Aprobado" ? (
                <span className="font-bold text-gray-900">aprobar</span>
              ) : (
                <span className="font-bold text-gray-900">rechazar</span>
              )}{" "}
              este crédito. Por favor, confirma que deseas{" "}
              {tipoAccion === "Aprobado" ? (
                <span className="font-bold text-gray-900">aprobar</span>
              ) : (
                <span className="font-bold text-gray-900">rechazar</span>
              )}{" "}
              este crédito. Esta acción no se puede deshacer.
            </p>

            <div className="flex flex-col gap-3">
              <button
                disabled={procesando}
                onClick={ejecutarAccion}
                className={`w-full py-4 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all ${
                  tipoAccion === "Aprobado"
                    ? "bg-gray-900 text-white hover:bg-black"
                    : "bg-red-600 text-white hover:bg-red-700"
                } flex items-center justify-center gap-2`}
              >
                {procesando && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirmar {tipoAccion}
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

export default RevisionCredito;
