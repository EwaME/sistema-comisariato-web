import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  UserSearch,
  MoreVertical,
  Loader2,
  ReceiptText,
} from "lucide-react";

import {
  obtenerCreditosPorId,
  obtenerCuotasPorCreditoId,
} from "../../../services/creditosService";

import {
  fromTimestampToSimpleDate,
  fromTimestamp,
} from "../../../helpers/timestampToDate";

import { useParams, Link } from "react-router-dom";

const DetalleCreditoMaster = () => {
  const { id } = useParams();
  const [credito, setCredito] = useState(null);
  const [cuotas, setCuotas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [progress, setProgress] = useState(0);
  const [saldoPagado, setSaldoPagado] = useState(0);
  const [saldoRestante, setSaldoRestante] = useState(0);

  const formatearLempiras = (monto) => {
    return new Intl.NumberFormat("es-HN", {
      style: "currency",
      currency: "HNL",
    }).format(monto);
  };

  useEffect(() => {
    const cargarCredito = async () => {
      try {
        const data = await obtenerCreditosPorId(id);
        if (data?.id) {
          const cuotasData = await obtenerCuotasPorCreditoId(data.id);
          setCuotas(cuotasData);

          const totalCuotas = data.plazoMeses || 0;
          const cuotasPagadas = data.cuotasPagadas || 0;
          const porcentaje =
            totalCuotas > 0 ? (cuotasPagadas / totalCuotas) * 100 : 0;
          setProgress(Math.round(porcentaje));

          let totalPagado = cuotasData.reduce(
            (acc, c) => acc + (c.monto || 0),
            0,
          );
          setSaldoPagado(totalPagado);
          setSaldoRestante((data.totalCredito || 0) - totalPagado);
        }
        setCredito(data);
      } catch (error) {
        console.error("Error al obtener expediente:", error);
      } finally {
        setCargando(false);
      }
    };
    if (id) cargarCredito();
  }, [id]);

  if (cargando) {
    return (
      <div className="min-h-screen bg-[#FDFDFF] flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-[#7C3AED] mb-4" />
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">
          Sincronizando Expediente
        </p>
      </div>
    );
  }

  const tieneEstadoValido =
    credito.estado === "Aprobado" || credito.estado === "Liquidado";

  const RenderBannerInformativo = () => {
    const config = {
      Pendiente: {
        bg: "bg-amber-50",
        border: "border-amber-100",
        text: "text-amber-900",
        sub: "text-amber-700",
        icon: <AlertCircle />,
        title: "Acción Requerida",
        desc: "Este crédito está en espera de revisión formal.",
      },
      "En revisión": {
        bg: "bg-purple-50",
        border: "border-purple-100",
        text: "text-purple-900",
        sub: "text-purple-700",
        icon: <UserSearch />,
        title: "En Revisión",
        desc: `Responsable: ${credito.revisadoPor}`,
      },
      Aprobado: {
        bg: "bg-green-50",
        border: "border-green-100",
        text: "text-green-900",
        sub: "text-green-700",
        icon: <CheckCircle2 />,
        title: "Crédito Aprobado",
        desc: credito.Respuesta,
      },
      Rechazado: {
        bg: "bg-red-50",
        border: "border-red-100",
        text: "text-red-900",
        sub: "text-red-700",
        icon: <XCircle />,
        title: "Crédito Denegado",
        desc: credito.Respuesta,
      },
    };

    const s = config[credito.estado];
    if (!s) return null;

    return (
      <div
        className={`${s.bg} border ${s.border} rounded-[1rem] p-6 flex items-center gap-4 mb-8`}
      >
        <div
          className={`border ${s.border} w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm text-current`}
        >
          {s.icon}
        </div>
        <div>
          <p
            className={`text-xs font-black uppercase tracking-tight ${s.text}`}
          >
            {s.title}
          </p>
          <p className={`text-[11px] font-bold ${s.sub}`}>{s.desc}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#FDFDFF] p-4 md:p-10 font-sans">
      <main className="max-w-[1400px] mx-auto w-full">
        {/* HEADER */}
        <div className="mb-10">
          <Link
            to="/creditos"
            className="inline-flex items-center gap-2 text-gray-400 font-black text-[10px] uppercase tracking-widest mb-6 hover:text-[#7C3AED] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Regresar al Panel
          </Link>

          <div className="flex flex-wrap items-end gap-4 mb-3 ">
            <h1 className="text-4xl md:text-4xl font-black text-[#020817] tracking-tighter">
              {credito.usuario}
            </h1>
            <span
              className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest mb-2
              ${
                credito.estado === "Aprobado"
                  ? "bg-green-100 text-green-600"
                  : credito.estado === "Rechazado"
                    ? "bg-red-100 text-red-600"
                    : "bg-purple-100 text-purple-600"
              }`}
            >
              {credito.estado}
            </span>
          </div>

          <div className="flex items-center gap-4 text-gray-400 text-[11px] font-bold uppercase tracking-wider">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-purple-500" />
              Registrado: {fromTimestampToSimpleDate(credito.fechaRegistro)}
            </div>
          </div>
        </div>

        <RenderBannerInformativo />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-8">
            <div className="bg-[#020817] rounded-[1.5rem] p-8 flex flex-col md:flex-row items-center gap-10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 blur-[100px] -z-0" />

              <div className="w-48 h-48 bg-white/5 rounded-[2rem]border border-white/10 shrink-0 relative z-10">
                <img
                  src={credito.imagenProductoURL}
                  className="w-full h-full object-cover rounded-xl"
                  alt="Producto"
                />
              </div>

              <div className="flex-grow relative z-10 w-full">
                <p className="text-[10px] font-black text-purple-400 uppercase tracking-[0.3em] mb-2">
                  Producto Financiado
                </p>
                <h2 className="text-3xl font-black text-white mb-8 leading-tight">
                  {credito.nombreProducto}
                </h2>

                <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/10">
                  <div>
                    <p className="text-[9px] font-black text-gray-500 uppercase mb-1">
                      Plazo Total
                    </p>
                    <p className="text-xl font-black text-white">
                      {credito.plazoMeses} Meses
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-gray-500 uppercase mb-1">
                      Cuota Base
                    </p>
                    <p className="text-xl font-black text-purple-400">
                      {formatearLempiras(credito.cuotaMensual)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {tieneEstadoValido && (
              <div className="bg-white rounded-[1.5rem] p-10 border border-gray-200">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-lg font-black text-[#020817] uppercase tracking-tight">
                    Progreso del Crédito
                  </h3>
                  <p className="text-4xl font-black text-[#7C3AED] tracking-tighter">
                    {progress}%
                  </p>
                </div>

                <div className="w-full h-4 bg-gray-100 rounded-full mb-10 p-1 shadow-inner">
                  <div
                    className="h-full bg-[#7C3AED] rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(124,58,237,0.3)]"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-gray-50">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase mb-2">
                      Total Pagado
                    </p>
                    <p className="text-2xl font-black text-green-600">
                      {formatearLempiras(saldoPagado)}
                    </p>
                  </div>
                  <div className="md:border-x border-gray-100 md:px-8">
                    <p className="text-[10px] font-black text-gray-400 uppercase mb-2">
                      Saldo Pendiente
                    </p>
                    <p className="text-2xl font-black text-[#020817]">
                      {formatearLempiras(saldoRestante)}
                    </p>
                  </div>
                  <div className="md:pl-8">
                    <p className="text-[10px] font-black text-gray-400 uppercase mb-2">
                      Cuotas
                    </p>
                    <p className="text-2xl font-black text-[#020817]">
                      {credito.cuotasPagadas}{" "}
                      <span className="text-gray-300 text-lg">
                        / {credito.plazoMeses}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-5">
            <div className="bg-white rounded-[1.5rem] border border-gray-200 p-8 min-h-[500px] flex flex-col">
              <div className="flex items-center gap-3 mb-8">
                <ReceiptText className="w-5 h-5 text-[#7C3AED]" />
                <h3 className="text-lg font-black text-[#020817] uppercase tracking-tight">
                  Historial de Cuotas
                </h3>
              </div>

              {!tieneEstadoValido ? (
                <div className="flex-grow flex flex-col items-center justify-center text-center p-6 bg-gray-50/50 rounded-[2rem] border-2 border-dashed border-gray-200">
                  <div className="w-16  bg-white rounded-2xl flex items-center justify-center text-gray-300 shadow-sm mb-4">
                    <Clock className="w-8 h-8" />
                  </div>
                  <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">
                    Aún no cuenta con estado de crédito válido para poseer
                    cuotas
                  </h4>
                  <p className="text-[11px] text-gray-400 font-bold max-w-[250px]">
                    El cronograma se generará una vez el crédito pase a estado
                    Aprobado o Liquidado.
                  </p>
                </div>
              ) : cuotas.length === 0 ? (
                <div className="flex-grow flex flex-col items-center justify-center text-center p-6">
                  <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-200 mb-4">
                    <ReceiptText className="w-8 h-8" />
                  </div>
                  <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">
                    No hay cuotas registradas
                  </h4>
                </div>
              ) : (
                <div className="flex-grow overflow-y-auto max-h-[500px] pr-2 space-y-4 custom-scrollbar">
                  {cuotas.map((pago) => (
                    <div
                      key={pago.id}
                      className="group p-5 rounded-2xl border border-gray-100 hover:border-purple-100 hover:bg-purple-50/30 transition-all flex justify-between items-center"
                    >
                      <div className="flex gap-4 items-center">
                        <div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                        <div>
                          <p className="text-[10px] font-semibold text-gray-400 uppercase">
                            {fromTimestamp(pago.fechaRegistro)}
                          </p>
                          <h4 className="text-sm font-black text-[#020817]">
                            Cuota Deducida
                          </h4>
                        </div>
                      </div>
                      <p className="text-lg font-black text-[#020817] group-hover:text-[#7C3AED] transition-colors">
                        {formatearLempiras(pago.monto)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DetalleCreditoMaster;
