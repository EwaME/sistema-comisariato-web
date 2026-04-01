import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  UserSearch,
  Search,
  Bell,
  HelpCircle,
  MoreVertical,
  Loader2,
} from "lucide-react";

import { obtenerCreditosPorId } from "../../../services/creditosService";
import { useParams, useNavigate, Link } from "react-router-dom";

const DetalleCreditoMaster = ({ estado = "Aprobado" }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [credito, setCredito] = useState(null);
  const [cargando, setCargando] = useState(true);

  const data = {
    cliente: "Perla Rivera",
    fechaSolicitud: "15 de Octubre, 2023",
    producto: "Essential Letter Lote",
    cantidadCuotas: "12 Meses",
    valorCuota: "42.00",
    progreso: 33.3,
    montoPagado: "126.00",
    saldoPendiente: "378.00",
    cuotasPagadas: 3,
    totalCuotas: 12,
    revisor: {
      nombre: "Josue Daniel Vasquez Ponce",
      email: "vasquezponcejosuedaniel@gmail.com",
    },
    mensajeAprobacion:
      "El crédito ha sido aprobado exitosamente tras cumplir con todos los requisitos de capacidad de pago.",
    razonRechazo:
      "La solicitud fue rechazada debido a que el monto de la cuota excede el límite de crédito disponible del empleado.",
    historial: [
      {
        id: 1,
        fecha: "30 ENE 2024 • 14:30 PM",
        titulo: "Pago Cuota #3 Recibido",
        ref: "DEP-90234 • Transferencia",
        monto: "42.00",
      },
      {
        id: 2,
        fecha: "30 DIC 2023 • 10:15 AM",
        titulo: "Pago Cuota #2 Recibido",
        ref: "DEP-88122 • Efectivo",
        monto: "42.00",
      },
      {
        id: 3,
        fecha: "30 NOV 2023 • 16:45 PM",
        titulo: "Pago Cuota #1 Recibido",
        ref: "DEP-85001 • Deducción Planilla",
        monto: "42.00",
      },
    ],
  };

  useEffect(() => {
    const cargarCredito = async () => {
      try {
        const data = await obtenerCreditosPorId(id);

        if (!data?.usuarioId) {
          console.error("El crédito no tiene un usuarioId asociado");
          return;
        }
        setCredito(data);
      } catch (error) {
        console.error("Error al obtener el expediente completo:", error);
      } finally {
        setCargando(false);
      }
    };

    if (id) cargarCredito();
  }, [id]);

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

  // Lógica de Renderizado de Banner (Conserva tus mensajes)
  const RenderBannerInformativo = () => {
    switch (credito.estado) {
      case "Pendiente":
        return (
          <div className="bg-amber-50 border border-amber-100 rounded-[1.5rem] p-6 flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-amber-600 shadow-sm">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-black text-amber-900 uppercase tracking-tight">
                Acción Requerida
              </p>
              <p className="text-xs text-amber-700 font-bold tracking-tight">
                Este crédito está en espera. Debes iniciar la revisión formal
                desde el panel principal de créditos.
              </p>
            </div>
          </div>
        );
      case "En revisión":
        return (
          <div className="bg-blue-50 border border-blue-100 rounded-[1.5rem] p-6 flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-blue-600 shadow-sm">
                <UserSearch className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-black text-blue-900 uppercase tracking-tight">
                  Actualmente en Revisión
                </p>
                <p className="text-xs text-blue-700 font-bold">
                  Responsable:{" "}
                  <span className="underline">{credito.revisadoPor}</span>
                </p>
              </div>
            </div>
            <div className="hidden md:block text-right">
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">
                {credito.revisorEmail}
              </p>
            </div>
          </div>
        );
      case "Aprobado":
        return (
          <div className="bg-green-50 border border-green-100 rounded-[1.5rem] p-6 flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-green-600 shadow-sm">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-black text-green-900 uppercase tracking-tight">
                Respuesta de aprobación
              </p>
              <p className="text-xs text-green-700 font-bold">
                {credito.Respuesta}
              </p>
            </div>
          </div>
        );
      case "Rechazado":
        return (
          <div className="bg-red-50 border border-red-100 rounded-[1.5rem] p-6 flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-red-600 shadow-sm">
              <XCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-black text-red-900 uppercase tracking-tight">
                Crédito Denegado
              </p>
              <p className="text-xs text-red-700 font-bold">
                Razón: {data.razonRechazo}
              </p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8F9FF] font-sans p-4 md:p-10">
      <main className="max-w-[1300px] mx-auto w-full">
        {/* TOP NAVIGATION */}

        {/* TITULO Y BADGE */}
        <div className="mb-8">
          <button className="flex items-center gap-2 text-gray-400 font-black text-[10px] uppercase tracking-[0.2em] mb-6 hover:text-gray-600 transition-colors">
            <ChevronLeft className="w-4 h-4" />
            <Link to="/creditos">Regresar</Link>
          </button>

          <div className="flex flex-wrap items-center gap-4 mb-2">
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter">
              {credito.usuario}
            </h1>
            <span
              className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm
              ${
                credito.estado === "Aprobado"
                  ? "bg-green-100 text-green-600"
                  : credito.estado === "Rechazado"
                    ? "bg-red-100 text-red-600"
                    : credito.estado === "En revisión"
                      ? "bg-blue-100 text-blue-600"
                      : "bg-amber-100 text-amber-600"
              }`}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></div>
              {credito.estado}
            </span>
          </div>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-[0.1em] flex items-center gap-2">
            <Calendar className="w-4 h-4 text-purple-300" /> Solicitud creada el{" "}
            {data.fechaSolicitud}
          </p>
        </div>

        <RenderBannerInformativo />

        {/* GRID DE CONTENIDO (ESTILO PERLA RIVERA) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LADO IZQUIERDO: INFO PRODUCTO Y PAGOS */}
          <div className="lg:col-span-7 space-y-8">
            {/* CARD PRODUCTO */}
            <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center gap-10">
              <div className="w-44 h-44 bg-[#F8F9FF] rounded-[2rem] flex items-center justify-center border border-gray-50 shrink-0 shadow-inner">
                <img
                  src={credito.imagenProductoURL}
                  className="mix-blend-multiply w-full h-full object-cover rounded-[1rem]"
                  alt="Producto"
                />
              </div>
              <div className="flex-grow w-full">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-[10px] font-black text-[#A78BFA] uppercase tracking-[0.3em]">
                    Detalle de Crédito
                  </p>
                  <MoreVertical className="w-5 h-5 text-gray-200 cursor-pointer" />
                </div>
                <h2 className="text-3xl font-black text-gray-900 mb-6 leading-tight">
                  {credito.nombreProducto}
                </h2>
                <div className="grid grid-cols-2 gap-8 pt-6 border-t border-gray-50">
                  <div>
                    <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mb-1">
                      Plazo
                    </p>
                    <p className="text-xl font-black text-gray-800">
                      {credito.plazoMeses} Meses
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mb-1">
                      Cuota Mensual
                    </p>
                    <p className="text-xl font-black text-gray-800 font-mono">
                      L. {credito.cuotaMensual}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* BARRA DE PROGRESO (SOLO SI ESTA APROBADO) */}
            {credito.estado === "Aprobado" && (
              <div className="bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-sm relative overflow-hidden">
                <div className="flex justify-between items-end mb-8 relative z-10">
                  <h3 className="text-xl font-black text-gray-900 tracking-tight">
                    Capacidad Pagada
                  </h3>
                  <p className="text-6xl font-black text-[#7C3AED] tracking-tighter leading-none">
                    {data.progreso}
                    <span className="text-2xl ml-1 opacity-50">%</span>
                  </p>
                </div>
                <div className="w-full h-4 bg-gray-100 rounded-full mb-10 overflow-hidden shadow-inner relative">
                  <div
                    className="h-full bg-[#7C3AED] rounded-full shadow-[0_0_25px_rgba(124,58,237,0.5)] transition-all duration-1000 ease-out"
                    style={{ width: `${data.progreso}%` }}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4 pt-8 border-t border-gray-50 relative z-10">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">
                      Pagado
                    </p>
                    <p className="text-2xl font-black text-green-500">
                      L. {data.montoPagado}
                    </p>
                  </div>
                  <div className="space-y-1 border-x border-gray-100 px-6">
                    <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">
                      Saldo
                    </p>
                    <p className="text-2xl font-black text-gray-800 font-mono">
                      L. {data.saldoPagado || "378.00"}
                    </p>
                  </div>
                  <div className="space-y-1 pl-6">
                    <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">
                      Estado Cuotas
                    </p>
                    <p className="text-2xl font-black text-gray-800">
                      {data.cuotasPagadas}{" "}
                      <span className="text-gray-300 font-bold text-sm">
                        / {data.totalCuotas}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* LADO DERECHO: HISTORIAL O PLACEHOLDER */}
          <div className="lg:col-span-5">
            {credito.estado === "Aprobado" ? (
              <>
                <h3 className="text-xl font-black text-gray-900 mb-8 px-4 tracking-tight">
                  Cronograma de Pagos
                </h3>
                <div className="relative pl-8 space-y-6">
                  <div className="absolute left-[15px] top-2 bottom-6 w-[2px] bg-gradient-to-b from-green-100 to-transparent" />
                  {data.historial.map((pago) => (
                    <div
                      key={pago.id}
                      className="relative flex items-center group"
                    >
                      <div className="absolute -left-[23px] w-3 h-3 rounded-full bg-[#16A34A] border-4 border-white shadow-md z-10 group-hover:scale-125 transition-transform" />
                      <div className="bg-white flex-1 p-6 rounded-[2rem] border border-gray-100 shadow-sm flex justify-between items-center hover:border-purple-200 transition-all cursor-default">
                        <div>
                          <p className="text-[9px] font-bold text-gray-300 uppercase mb-1">
                            {pago.fecha}
                          </p>
                          <h4 className="text-sm font-black text-gray-900 leading-tight">
                            {pago.titulo}
                          </h4>
                          <p className="text-[10px] text-gray-400 font-medium italic">
                            {pago.ref}
                          </p>
                        </div>
                        <p className="text-xl font-black text-[#16A34A] font-mono">
                          L. {pago.monto}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-full min-h-[400px] border-2 border-dashed border-gray-200 rounded-[3rem] flex flex-col items-center justify-center p-10 text-center bg-white/30 backdrop-blur-sm">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-gray-300 mb-6">
                  <Clock className="w-10 h-10" />
                </div>
                <h4 className="text-lg font-black text-gray-400 uppercase tracking-widest mb-2">
                  En espera de aprobación
                </h4>
                <p className="text-sm text-gray-400 font-medium">
                  El historial de pagos se habilitará automáticamente una vez el
                  crédito sea aprobado por el sistema.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default DetalleCreditoMaster;
